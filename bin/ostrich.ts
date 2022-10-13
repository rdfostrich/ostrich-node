import type * as RDF from '@rdfjs/types';
import rdfSerializer from 'rdf-serialize';
import { stringToTerm } from 'rdf-string';
import { quadToStringQuad as quadToStringQuadTtl } from 'rdf-string-ttl';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import type { OstrichStore } from '../lib/ostrich';
import { fromPath } from '../lib/ostrich';
const streamifyArray = require('streamify-array');

(async function() {
  const contentTypes = await rdfSerializer.getContentTypes();
  await yargs(hideBin(process.argv))
    .positional('archive', {
      describe: 'Path to an OSTRICH archive',
      type: 'string',
      demandOption: true,
    })
    .positional('query', {
      describe: 'A triple pattern query.',
      type: 'string',
      demandOption: true,
    })
    .options({
      offset: {
        alias: 'o',
        type: 'number',
        describe: 'Number of results to skip',
      },
      limit: {
        alias: 'l',
        type: 'number',
        describe: 'Number of results to show',
      },
    })
    .command('vm <archive> <query>', 'Query version materialized', yrgs => yrgs
      .options({
        version: {
          alias: 'v',
          type: 'number',
          describe: 'The version to query',
          default: -1,
        },
        format: {
          alias: 'f',
          type: 'string',
          describe: 'The RDF format to serialize results in',
          choices: contentTypes,
          default: 'text/turtle',
        },
      }), async args => {
      await queryContext(args.archive, args.query, args.format, async(store, subject, predicate, object) => {
        const { triples, totalCount, hasExactCount } = await store.searchTriplesVersionMaterialized(
          subject,
          predicate,
          object,
          { offset: args.offset, limit: args.limit, version: args.version },
        );
        process.stdout.write(`# Total matches: ${totalCount}${hasExactCount ? '' : ' (estimated)'}\n`);
        await new Promise<void>((resolve, reject) => rdfSerializer
          .serialize(streamifyArray(triples), { contentType: args.format })
          .pipe(process.stdout)
          .on('error', reject)
          .on('end', resolve));
      });
    })
    .command('dm [archive] [query]', 'Query delta materialized', yrgs => yrgs
      .options({
        versionStart: {
          alias: 's',
          type: 'number',
          describe: 'The starting version to query',
        },
        versionEnd: {
          alias: 'e',
          type: 'number',
          describe: 'The ending version to query',
        },
      }), async args => {
      await queryContext(args.archive, args.query, args.format, async(store, subject, predicate, object) => {
        const { triples, totalCount, hasExactCount } = await store.searchTriplesDeltaMaterialized(
          subject,
          predicate,
          object,
          { offset: args.offset, limit: args.limit, versionStart: args.versionStart, versionEnd: args.versionEnd },
        );
        process.stdout.write(`# Total matches: ${totalCount}${hasExactCount ? '' : ' (estimated)'}\n`);
        for (const triple of triples) {
          const stringTriple = quadToStringQuadTtl(triple);
          console.log(`${triple.addition ? '+ ' : '- '} ${stringTriple.subject} ${stringTriple.predicate} ${stringTriple.object}`);
        }
      });
    })
    .command('v [archive] [query]', 'Query version', yrgs => yrgs, async args => {
      await queryContext(args.archive, args.query, args.format, async(store, subject, predicate, object) => {
        const { triples, totalCount, hasExactCount } = await store.searchTriplesVersion(
          subject,
          predicate,
          object,
          { offset: args.offset, limit: args.limit },
        );
        process.stdout.write(`# Total matches: ${totalCount}${hasExactCount ? '' : ' (estimated)'}\n`);
        for (const triple of triples) {
          const stringTriple = quadToStringQuadTtl(triple);
          console.log(`${stringTriple.subject} ${stringTriple.predicate} ${stringTriple.object}`);
          console.log(`    >> ${JSON.stringify(triple.versions)}`);
        }
      });
    })
    .command('metadata [archive]', 'Show the metadata of a given archive', yrgs => yrgs, async args => {
      await queryContext(args.archive, args.query, args.format, async(store, subject, predicate, object) => {
        console.log(`OSTRICH store: ${args.archive}
  Versions: ${store.maxVersion}
  Unique triples: ${(await store.countTriplesVersion(null, null, null)).totalCount}
  Triples in last version: ${(await store.countTriplesVersionMaterialized(null, null, null)).totalCount}`);
      });
    })
    .strict()
    .demandCommand()
    .version(false)
    .example(`$0 vm archive.ostrich '?s <ex:p> ?o'`, '')
    .example(`$0 vm archive.ostrich '?s ?p ?o' -v 10 -o 5 -l 10 -f turtle`, '')
    .example(`$0 vm archive.ostrich '?s ?p ?o' --version 10 -offset 5 --limit 10`, '')
    .help()
    .parse();
})()
  .then(() => {
    // Do nothing
  })
  .catch(error => {
    process.stderr.write(`${error.message}\n`);
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  });

async function queryContext(
  archive: string,
  query: string,
  format: string | undefined,
  queryCb: (
    store: OstrichStore,
    subject: RDF.Term | null,
    predicate: RDF.Term | null,
    object: RDF.Term | null,
  ) => Promise<void>,
): Promise<void> {
  // Parse query
  const parts = /^\s*<?([^\s>]*)>?\s*<?([^\s>]*)>?\s*<?([^]*?)>?\s*$/u.exec(query);
  const subject = parts && !parts[1].startsWith('?') && stringToTerm(parts[1]) || null;
  const predicate = parts && !parts[2].startsWith('?') && stringToTerm(parts[2]) || null;
  const object = parts && !parts[3].startsWith('?') && stringToTerm(parts[3]) || null;

  // Load Ostrich
  const store = await fromPath(archive);
  await queryCb(store, subject, predicate, object);
  await store.close();
}
