import 'jest-rdf';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { quadDelta } from '../lib';
import type { OstrichStore } from '../lib/OstrichStore';
import { fromPath } from '../lib/OstrichStore';
import { cleanUp, closeAndCleanUp, initializeThreeVersions } from './prepare-ostrich';
const quad = require('rdf-quad');

const DF = new DataFactory();

// eslint-disable-next-line multiline-comment-style
/*
0 -> 1:
 - <a> <a> "b"^^<http://example.org/literal> .
 + <a> <a> "z"^^<http://example.org/literal> .
 - <a> <b> <a> .
 + <a> <b> <g> .
 - <a> <b> <z> .
 + <f> <f> <f> .
 + <z> <z> <z> .

1 -> 2:
 - <a> <a> "z"^^<http://example.org/literal> .
 - <f> <f> <f> .
 + <f> <r> <s> .
 + <q> <q> <q> .
 + <r> <r> <r> .

0 -> 2:
 - <a> <a> "b"^^<http://example.org/literal> .
 - <a> <b> <a> .
 + <a> <b> <g> .
 - <a> <b> <z> .
 + <f> <r> <s> .
 + <q> <q> <q> .
 + <r> <r> <r> .
 + <z> <z> <z> .

*/

describe('delta materialization', () => {
  describe('An ostrich store for an example ostrich path that will cause errors', () => {
    let document: OstrichStore;

    it('should throw when the store is closed', async() => {
      cleanUp('dm');
      document = await initializeThreeVersions('dm');
      await document.close();

      await expect(document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1 }))
        .rejects.toThrow('Attempted to query a closed OSTRICH store');

      await closeAndCleanUp(document, 'dm');
    });

    it('should throw when the store has no versions', async() => {
      cleanUp('dm');
      document = await fromPath(`./test/test-dm.ostrich`, { readOnly: false });

      await expect(document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1 }))
        .rejects.toThrow('Attempted to query an OSTRICH store without versions');

      await closeAndCleanUp(document, 'dm');
    });

    it('should throw when an internal error is thrown', async() => {
      cleanUp('dm');
      document = await initializeThreeVersions('dm');

      jest
        .spyOn(document.native, '_searchTriplesDeltaMaterialized')
        .mockImplementation((
          subject,
          predicate,
          object,
          offset,
          limit,
          versionStart,
          versionEnd,
          cb: any,
        ) => cb(new Error('Internal error')));

      await expect(document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1 }))
        .rejects.toThrow('Internal error');

      await closeAndCleanUp(document, 'dm');
    });

    it('should throw when start is after end', async() => {
      cleanUp('dm');
      document = await initializeThreeVersions('dm');

      await expect(document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 2, versionEnd: 1 }))
        .rejects.toThrow(`'versionStart' must be strictly smaller than 'versionEnd'`);

      await closeAndCleanUp(document, 'dm');
    });

    it('should throw when end is after max', async() => {
      cleanUp('vm');
      document = await initializeThreeVersions('vm');

      await expect(document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 100 }))
        .rejects.toThrow(`'versionEnd' can not be larger than the maximum version (2)`);

      await closeAndCleanUp(document, 'vm');
    });
  });

  describe('An ostrich store for an example ostrich path', () => {
    let document: OstrichStore;
    beforeAll(async() => {
      cleanUp('dm');
      document = await initializeThreeVersions('dm');
    });
    afterAll(async() => {
      await closeAndCleanUp(document, 'dm');
    });

    describe('asked for supported features', () => {
      it('should return an object', () => {
        expect(document.features).toBeInstanceOf(Object);
      });

      it('should support searchTriplesDeltaMaterialized', () => {
        expect(document.features.searchTriplesDeltaMaterialized).toBe(true);
      });

      it('should support countTriplesDeltaMaterialized', () => {
        expect(document.features.countTriplesDeltaMaterialized).toBe(true);
      });
    });

    describe('being searched', () => {
      describe('with a non-existing pattern between version 0 and 1', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(DF.namedNode('1'), null, null, { versionStart: 0, versionEnd: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with a non-existing pattern between version 1 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(DF.namedNode('1'), null, null, { versionStart: 1, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with a non-existing pattern between version 0 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(DF.namedNode('1'), null, null, { versionStart: 0, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with pattern null null null between version 0 and 1', () => {
        let cardinality: number;
        let triples: RDF.Quad[]; // , hasExactCount;
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'a', '"b"^^http://example.org/literal'), false),
            quadDelta(quad('a', 'a', '"z"^^http://example.org/literal'), true),
            quadDelta(quad('a', 'b', 'a'), false),
            quadDelta(quad('a', 'b', 'g'), true),
            quadDelta(quad('a', 'b', 'z'), false),
            quadDelta(quad('f', 'f', 'f'), true),
            quadDelta(quad('z', 'z', 'z'), true),
          ]);
        });

        it('should estimate the total count as 7', () => {
          expect(cardinality).toEqual(7);
        });
      });

      describe('with pattern null null null between version 1 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 1, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'a', '"z"^^http://example.org/literal'), false),
            quadDelta(quad('f', 'f', 'f'), false),
            quadDelta(quad('f', 'r', 's'), true),
            quadDelta(quad('q', 'q', 'q'), true),
            quadDelta(quad('r', 'r', 'r'), true),
          ]);
        });

        it('should estimate the total count as 15', () => {
          expect(cardinality).toEqual(15);
        });
      });

      describe('with pattern null null null between version 0 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'a', '"b"^^http://example.org/literal'), false),
            quadDelta(quad('a', 'b', 'a'), false),
            quadDelta(quad('a', 'b', 'g'), true),
            quadDelta(quad('a', 'b', 'z'), false),
            quadDelta(quad('f', 'r', 's'), true),
            quadDelta(quad('q', 'q', 'q'), true),
            quadDelta(quad('r', 'r', 'r'), true),
            quadDelta(quad('z', 'z', 'z'), true),
          ]);
        });

        it('should estimate the total count as 8', () => {
          expect(cardinality).toEqual(8);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5 between version 0 and 1', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1, offset: 0, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'a', '"b"^^http://example.org/literal'), false),
            quadDelta(quad('a', 'a', '"z"^^http://example.org/literal'), true),
            quadDelta(quad('a', 'b', 'a'), false),
            quadDelta(quad('a', 'b', 'g'), true),
            quadDelta(quad('a', 'b', 'z'), false),
          ]);
        });

        it('should estimate the total count as 7', () => {
          expect(cardinality).toEqual(7);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5 between version 1 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 1, versionEnd: 2, offset: 0, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'a', '"z"^^http://example.org/literal'), false),
            quadDelta(quad('f', 'f', 'f'), false),
            quadDelta(quad('f', 'r', 's'), true),
            quadDelta(quad('q', 'q', 'q'), true),
            quadDelta(quad('r', 'r', 'r'), true),
          ]);
        });

        it('should estimate the total count as 15', () => {
          expect(cardinality).toEqual(15);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5 between version 0 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 2, offset: 0, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'a', '"b"^^http://example.org/literal'), false),
            quadDelta(quad('a', 'b', 'a'), false),
            quadDelta(quad('a', 'b', 'g'), true),
            quadDelta(quad('a', 'b', 'z'), false),
            quadDelta(quad('f', 'r', 's'), true),
          ]);
        });

        it('should estimate the total count as 8', () => {
          expect(cardinality).toEqual(8);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5 between version 0 and 1', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1, offset: 2, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'b', 'a'), false),
            quadDelta(quad('a', 'b', 'g'), true),
            quadDelta(quad('a', 'b', 'z'), false),
            quadDelta(quad('f', 'f', 'f'), true),
            quadDelta(quad('z', 'z', 'z'), true),
          ]);
        });

        it('should estimate the total count as 7', () => {
          expect(cardinality).toEqual(7);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5 between version 1 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 1, versionEnd: 2, offset: 2, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('f', 'r', 's'), true),
            quadDelta(quad('q', 'q', 'q'), true),
            quadDelta(quad('r', 'r', 'r'), true),
          ]);
        });

        it('should estimate the total count as 15', () => {
          expect(cardinality).toEqual(15);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5 between version 0 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 2, offset: 2, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'b', 'g'), true),
            quadDelta(quad('a', 'b', 'z'), false),
            quadDelta(quad('f', 'r', 's'), true),
            quadDelta(quad('q', 'q', 'q'), true),
            quadDelta(quad('r', 'r', 'r'), true),
          ]);
        });

        it('should estimate the total count as 8', () => {
          expect(cardinality).toEqual(8);
        });
      });

      describe('with pattern null null null, offset 10 and limit 5 between version 0 and 1', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              null, null, null, { versionStart: 0, versionEnd: 1, offset: 10, limit: 5 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 7', () => {
          expect(cardinality).toEqual(7);
        });
      });

      describe('with pattern null null null, offset 10 and limit 5 between version 1 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              null, null, null, { versionStart: 1, versionEnd: 2, offset: 10, limit: 5 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 15', () => {
          expect(cardinality).toEqual(15);
        });
      });

      describe('with pattern null null null, offset 10 and limit 5 between version 0 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              null, null, null, { versionStart: 0, versionEnd: 2, offset: 10, limit: 5 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 8', () => {
          expect(cardinality).toEqual(8);
        });
      });

      describe('with pattern f null null between version 0 and 1', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              DF.namedNode('f'), null, null, { versionStart: 0, versionEnd: 1 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('f', 'f', 'f'), true),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(cardinality).toEqual(1);
        });
      });

      describe('with pattern f null null between version 1 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(DF.namedNode('f'), null, null, { versionStart: 1, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('f', 'f', 'f'), false),
            quadDelta(quad('f', 'r', 's'), true),
          ]);
        });

        it('should estimate the total count as 2', () => {
          expect(cardinality).toEqual(2);
        });
      });

      describe('with pattern f null null between version 0 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(DF.namedNode('f'), null, null, { versionStart: 0, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('f', 'r', 's'), true),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(cardinality).toEqual(1);
        });
      });

      describe('with pattern z null null, offset 0 and limit 1 between version 0 and 1', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              DF.namedNode('z'), null, null, { versionStart: 0, versionEnd: 1, offset: 0, limit: 1 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('z', 'z', 'z'), true),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(cardinality).toEqual(1);
        });
      });

      describe('with pattern z null null, offset 0 and limit 1 between version 1 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              DF.namedNode('z'), null, null, { versionStart: 1, versionEnd: 2, offset: 0, limit: 1 },
            ));
        });

        it('should return an array with no matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 2', () => {
          expect(cardinality).toEqual(2);
        });
      });

      describe('with pattern z null null, offset 0 and limit 1 between version 0 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              DF.namedNode('z'), null, null, { versionStart: 0, versionEnd: 2, offset: 0, limit: 1 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('z', 'z', 'z'), true),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(cardinality).toEqual(1);
        });
      });

      describe('with pattern z null null, offset 10 and limit 1 between version 0 and 1', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              DF.namedNode('z'), null, null, { versionStart: 0, versionEnd: 1, offset: 10, limit: 1 },
            ));
        });

        it('should return an array with no matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 1', () => {
          expect(cardinality).toEqual(1);
        });
      });

      describe('with pattern z null null, offset 10 and limit 1 between version 1 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              DF.namedNode('z'), null, null, { versionStart: 1, versionEnd: 2, offset: 10, limit: 1 },
            ));
        });

        it('should return an array with no matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 2', () => {
          expect(cardinality).toEqual(2);
        });
      });

      describe('with pattern z null null, offset 10 and limit 1 between version 0 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              DF.namedNode('z'), null, null, { versionStart: 0, versionEnd: 2, offset: 10, limit: 1 },
            ));
        });

        it('should return an array with no matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 1', () => {
          expect(cardinality).toEqual(1);
        });
      });

      describe('with pattern a ?p ?o between version 0 and 1', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              DF.namedNode('a'), DF.variable('p'), DF.variable('o'), { versionStart: 0, versionEnd: 1 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'a', '"b"^^http://example.org/literal'), false),
            quadDelta(quad('a', 'a', '"z"^^http://example.org/literal'), true),
            quadDelta(quad('a', 'b', 'a'), false),
            quadDelta(quad('a', 'b', 'g'), true),
            quadDelta(quad('a', 'b', 'z'), false),
          ]);
        });

        it('should estimate the total count as 5', () => {
          expect(cardinality).toEqual(5);
        });
      });

      describe('with pattern a ?p ?o between version 1 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              DF.namedNode('a'), DF.variable('p'), DF.variable('o'), { versionStart: 1, versionEnd: 2 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'a', '"z"^^http://example.org/literal'), false),
          ]);
        });

        it('should estimate the total count as 9', () => {
          expect(cardinality).toEqual(9);
        });
      });

      describe('with pattern a ?p ?o between version 0 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              DF.namedNode('a'), DF.variable('p'), DF.variable('o'), { versionStart: 0, versionEnd: 2 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'a', '"b"^^http://example.org/literal'), false),
            quadDelta(quad('a', 'b', 'a'), false),
            quadDelta(quad('a', 'b', 'g'), true),
            quadDelta(quad('a', 'b', 'z'), false),
          ]);
        });

        it('should estimate the total count as 4', () => {
          expect(cardinality).toEqual(4);
        });
      });

      describe('with pattern null b null between version 0 and 1', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, DF.namedNode('b'), null, { versionStart: 0, versionEnd: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'b', 'a'), false),
            quadDelta(quad('a', 'b', 'g'), true),
            quadDelta(quad('a', 'b', 'z'), false),
          ]);
        });

        it('should estimate the total count as 3', () => {
          expect(cardinality).toEqual(3);
        });
      });

      describe('with pattern null b null between version 1 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, DF.namedNode('b'), null, { versionStart: 1, versionEnd: 2 }));
        });

        it('should return an array with no matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 6', () => {
          expect(cardinality).toEqual(6);
        });
      });

      describe('with pattern null b null between version 0 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, DF.namedNode('b'), null, { versionStart: 0, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'b', 'a'), false),
            quadDelta(quad('a', 'b', 'g'), true),
            quadDelta(quad('a', 'b', 'z'), false),
          ]);
        });

        it('should estimate the total count as 3', () => {
          expect(cardinality).toEqual(3);
        });
      });

      describe('with pattern null ex:p3 null between version 0 and 1', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              null, DF.namedNode('http://example.org/p3'), null, { versionStart: 0, versionEnd: 1 },
            ));
        });

        it('should return an array with no matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with pattern null ex:p3 null between version 1 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              null, DF.namedNode('http://example.org/p3'), null, { versionStart: 1, versionEnd: 2 },
            ));
        });

        it('should return an array with no matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with pattern null ex:p3 null between version 0 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              null, DF.namedNode('http://example.org/p3'), null, { versionStart: 0, versionEnd: 2 },
            ));
        });

        it('should return an array with no matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 0 and 1', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              null,
              null,
              DF.literal('b', DF.namedNode('http://example.org/literal')),
              { versionStart: 0, versionEnd: 1 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'a', '"b"^^http://example.org/literal'), false),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(cardinality).toEqual(1);
        });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 1 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              null,
              null,
              DF.literal('b', DF.namedNode('http://example.org/literal')),
              { versionStart: 1, versionEnd: 2 },
            ));
        });

        it('should return an array with no matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 2', () => {
          expect(cardinality).toEqual(2);
        });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 0 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(
              null,
              null,
              DF.literal('b', DF.namedNode('http://example.org/literal')),
              { versionStart: 0, versionEnd: 2 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('a', 'a', '"b"^^http://example.org/literal'), false),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(cardinality).toEqual(1);
        });
      });

      describe('with pattern null null f between version 0 and 1', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, null, DF.namedNode('f'), { versionStart: 0, versionEnd: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('f', 'f', 'f'), true),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(cardinality).toEqual(1);
        });
      });

      describe('with pattern null null f between version 1 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, null, DF.namedNode('f'), { versionStart: 1, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadDelta(quad('f', 'f', 'f'), false),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(cardinality).toEqual(1);
        });
      });

      describe('with pattern null null f between version 0 and 2', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesDeltaMaterialized(null, null, DF.namedNode('f'), { versionStart: 0, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 0', () => {
          expect(cardinality).toEqual(0);
        });
      });
    });

    describe('being counted', () => {
      describe('with a non-existing pattern between version 0 and 1', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(DF.namedNode('1'), null, null, 0, 1));
        });

        it('should return 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with a non-existing pattern between version 1 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(DF.namedNode('1'), null, null, 1, 2));
        });

        it('should return 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with a non-existing pattern between version 0 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(DF.namedNode('1'), null, null, 0, 2));
        });

        it('should return 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with pattern null null null between version 0 and 1', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(null, null, null, 0, 1));
        });

        it('should return 7', () => {
          expect(cardinality).toEqual(7);
        });
      });

      describe('with pattern null null null between version 1 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(null, null, null, 1, 2));
        });

        it('should return 15', () => {
          expect(cardinality).toEqual(15);
        });
      });

      describe('with pattern null null null between version 0 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(null, null, null, 0, 2));
        });

        it('should return 8', () => {
          expect(cardinality).toEqual(8);
        });
      });

      describe('with pattern a null null between version 0 and 1', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(DF.namedNode('a'), null, null, 0, 1));
        });

        it('should return 5', () => {
          expect(cardinality).toEqual(5);
        });
      });

      describe('with pattern a null null between version 1 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(DF.namedNode('a'), null, null, 1, 2));
        });

        it('should return 9', () => {
          expect(cardinality).toEqual(9);
        });
      });

      describe('with pattern a null null between version 0 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(DF.namedNode('a'), null, null, 0, 2));
        });

        it('should return 4', () => {
          expect(cardinality).toEqual(4);
        });
      });

      describe('with pattern null b null between version 0 and 1', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(null, DF.namedNode('b'), null, 0, 1));
        });

        it('should return 3', () => {
          expect(cardinality).toEqual(3);
        });
      });

      describe('with pattern null b null between version 1 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(null, DF.namedNode('b'), null, 1, 2));
        });

        it('should return 6', () => {
          expect(cardinality).toEqual(6);
        });
      });

      describe('with pattern null b null between version 0 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(null, DF.namedNode('b'), null, 0, 2));
        });

        it('should return 3', () => {
          expect(cardinality).toEqual(3);
        });
      });

      describe('with pattern null ex:p3 null between version 0 and 1', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(null, DF.namedNode('http://example.org/p3'), null, 0, 1));
        });

        it('should return 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with pattern null ex:p3 null between version 1 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(null, DF.namedNode('http://example.org/p3'), null, 1, 2));
        });

        it('should return 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with pattern null ex:p3 null between version 0 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(null, DF.namedNode('http://example.org/p3'), null, 0, 2));
        });

        it('should return 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with pattern null null f between version 0 and 1', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(null, null, DF.namedNode('f'), 0, 1));
        });

        it('should return 1', () => {
          expect(cardinality).toEqual(1);
        });
      });

      describe('with pattern null null f between version 1 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(null, null, DF.namedNode('f'), 1, 2));
        });

        it('should return 1', () => {
          expect(cardinality).toEqual(1);
        });
      });

      describe('with pattern null null f between version 0 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(null, null, DF.namedNode('f'), 0, 2));
        });

        it('should return 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 0 and 1', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(
              null, null, DF.literal('b', DF.namedNode('http://example.org/literal')), 0, 1,
            ));
        });

        it('should return 1', () => {
          expect(cardinality).toEqual(1);
        });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 1 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(
              null, null, DF.literal('b', DF.namedNode('http://example.org/literal')), 1, 2,
            ));
        });

        it('should return 2', () => {
          expect(cardinality).toEqual(2);
        });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 0 and 2', () => {
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality } = await document
            .countTriplesDeltaMaterialized(
              null, null, DF.literal('b', DF.namedNode('http://example.org/literal')), 0, 2,
            ));
        });

        it('should return 1', () => {
          expect(cardinality).toEqual(1);
        });
      });
    });
  });
});
