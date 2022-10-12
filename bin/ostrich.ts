import { Writer } from 'n3';
import type { OstrichStore } from '../lib/ostrich';

/* eslint-disable max-len,unicorn/no-process-exit */
// Parse command-line arguments
const args = require('minimist')(process.argv.slice(2), { alias:
      { queryversionmaterialized: 'qvm',
        querydeltamaterialized: 'qdm',
        queryversion: 'qv',
        offset: 'o',
        limit: 'l',
        format: 'f',
        version: 'v',
        versionStart: 'vs',
        versionEnd: 've' }});
const ostrichPath = args._[0];
const queryvm = typeof args.queryversionmaterialized === 'string' ? args.queryversionmaterialized : '';
const querydm = typeof args.querydeltamaterialized === 'string' ? args.querydeltamaterialized : '';
const queryv = typeof args.queryversion === 'string' ? args.queryversion : '';
const query = queryvm || querydm || queryv;
const format = typeof args.format === 'string' ? args.format : 'text/turtle';
const offset = /^\d+$/u.test(args.offset) ? args.offset : 0;
const limit = /^\d+$/u.test(args.limit) ? args.limit : 0;
const version = /^\d+$/u.test(args.version) ? args.version : null;
const versionStart = /^\d+$/u.test(args.versionStart) ? args.versionStart : null;
const versionEnd = /^\d+$/u.test(args.versionEnd) ? args.versionEnd : null;

// Verify the arguments
if (args._.length !== 1 || args.h || args.help || !query) {
  console.error('usage: ostrich dataset.ostrich --queryversionmaterialized \'?s ?p ?o\' --offset 200 --limit 100 --version 1 --format turtle');
  console.error('usage: ostrich dataset.ostrich --querydeltamaterialized \'?s ?p ?o\' --offset 200 --limit 100 --versionStart 0 --versionEnd 2 --format turtle');
  console.error('usage: ostrich dataset.ostrich --queryversion \'?s ?p ?o\' --offset 200 --limit 100 --format turtle');
  process.exit(1);
}

const ostrich = require('../lib/ostrich');

// Prepare the query and the result writer
const parts = /^\s*<?([^\s>]*)>?\s*<?([^\s>]*)>?\s*<?([^]*?)>?\s*$/u.exec(query);
const subject = parts && !parts[1].startsWith('?') && parts[1] || null;
const predicate = parts && !parts[2].startsWith('?') && parts[2] || null;
const object = parts && !parts[3].startsWith('?') && parts[3] || null;
const writer = new Writer(process.stdout, { format, end: false });

// Load Ostrich
ostrich.fromPath(ostrichPath)
  .then(async(ostrichStore: OstrichStore) => {
    // Search the Ostrich store for the given pattern and query type
    if (queryvm) {
      const { triples, totalCount, hasExactCount } = await ostrichStore.searchTriplesVersionMaterialized(subject, predicate, object, { offset, limit, version });
      process.stdout.write(`# Total matches: ${totalCount}${hasExactCount ? '' : ' (estimated)'}\n`);
      writer.addQuads(<any>triples);
      writer.end();
    } else if (querydm) {
      const { triples, totalCount, hasExactCount } = await ostrichStore.searchTriplesDeltaMaterialized(subject, predicate, object, { offset, limit, versionStart, versionEnd });
      process.stdout.write(`# Total matches: ${totalCount}${hasExactCount ? '' : ' (estimated)'}\n`);
      triples.forEach(triple => {
        (<any> writer)._write(triple.addition ? '+ ' : '- ');
        (<any> writer)._writeTripleLine(triple.subject, triple.predicate, triple.object);
      });
      writer.end();
    } else if (queryv) {
      const { triples, totalCount, hasExactCount } = await ostrichStore.searchTriplesVersion(subject, predicate, object, { offset, limit });
      process.stdout.write(`# Total matches: ${totalCount}${hasExactCount ? '' : ' (estimated)'}\n`);
      triples.forEach(triple => {
        (<any> writer)._writeTripleLine(triple.subject, triple.predicate, triple.object);
        (<any> writer)._write(`    >> ${JSON.stringify(triple.versions)}\n`);
      });
      writer.end();
    }
    await ostrichStore.close();
  })
  .catch((error: Error) => {
    console.error(error.message);
    process.exit(1);
  });

/* eslint-enable max-len,unicorn/no-process-exit */
