import 'jest-rdf';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { quadVersion } from '../lib';
import type { OstrichStore } from '../lib/OstrichStore';
import { fromPath } from '../lib/OstrichStore';
import { cleanUp, closeAndCleanUp, initializeThreeVersions } from './prepare-ostrich';
const quad = require('rdf-quad');

const DF = new DataFactory();

// eslint-disable-next-line multiline-comment-style
/*
 <a> <a> "a"^^<http://example.org/literal> . [0, 1, 2]
 <a> <a> "b"^^<http://example.org/literal> . [0]
 <a> <b> <a> .                               [0]
 <a> <b> <c> .                               [0, 1, 2]
 <a> <b> <d> .                               [0, 1, 2]
 <a> <b> <f> .                               [0, 1, 2]
 <a> <b> <z> .                               [0]
 <c> <c> <c> .                               [0, 1, 2]
 <a> <a> "z"^^<http://example.org/literal> . [1]
 <a> <b> <g> .                               [1, 2]
 <f> <f> <f> .                               [1]
 <f> <r> <s> .                               [2]
 <q> <q> <q> .                               [2]
 <r> <r> <r> .                               [2]
 <z> <z> <z> .                               [1, 2]
 */

describe('version', () => {
  describe('An ostrich store for an example ostrich path that will cause errors', () => {
    let document: OstrichStore;

    it('should throw when the store is closed', async() => {
      cleanUp('vq');
      document = await initializeThreeVersions('vq');
      await document.close();

      await expect(document.searchTriplesVersion(null, null, null))
        .rejects.toThrow('Attempted to query a closed OSTRICH store');

      await closeAndCleanUp(document, 'vq');
    });

    it('should throw when the store has no versions', async() => {
      cleanUp('vq');
      document = await fromPath(`./test/test-vq.ostrich`, { readOnly: false });

      await expect(document.searchTriplesVersion(null, null, null))
        .rejects.toThrow('Attempted to query an OSTRICH store without versions');

      await closeAndCleanUp(document, 'vq');
    });

    it('should throw when an internal error is thrown', async() => {
      cleanUp('vq');
      document = await initializeThreeVersions('vq');

      jest
        .spyOn(document.native, '_searchTriplesVersion')
        .mockImplementation((
          subject,
          predicate,
          object,
          offset,
          limit,
          cb: any,
        ) => cb(new Error('Internal error')));

      await expect(document.searchTriplesVersion(null, null, null))
        .rejects.toThrow('Internal error');

      await closeAndCleanUp(document, 'vq');
    });
  });

  describe('An ostrich store for an example ostrich path', () => {
    let document: OstrichStore;
    beforeAll(async() => {
      cleanUp('vq');
      document = await initializeThreeVersions('vq');
    });
    afterAll(async() => {
      await closeAndCleanUp(document, 'vq');
    });

    describe('asked for supported features', () => {
      it('should return an object', () => {
        expect(document.features).toBeInstanceOf(Object);
      });

      it('should support searchTriplesDeltaMaterialized', () => {
        expect(document.features.searchTriplesVersion).toBe(true);
      });

      it('should support countTriplesDeltaMaterialized', () => {
        expect(document.features.countTriplesVersion).toBe(true);
      });
    });

    describe('being searched', () => {
      describe('with a non-existing pattern', () => {
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality } = await document
            .searchTriplesVersion(DF.namedNode('1'), null, null));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(cardinality).toEqual(0);
        });
      });

      describe('with pattern null null null', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality, exactCardinality } = await document
            .searchTriplesVersion(null, null, null));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadVersion(quad('a', 'a', '"a"^^http://example.org/literal'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'a', '"b"^^http://example.org/literal'), [ 0 ]),
            quadVersion(quad('a', 'a', '"z"^^http://example.org/literal'), [ 1 ]),
            quadVersion(quad('a', 'b', 'a'), [ 0 ]),
            quadVersion(quad('a', 'b', 'c'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'b', 'd'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'b', 'f'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'b', 'g'), [ 1, 2 ]),
            quadVersion(quad('a', 'b', 'z'), [ 0 ]),
            quadVersion(quad('c', 'c', 'c'), [ 0, 1, 2 ]),
            quadVersion(quad('f', 'f', 'f'), [ 1 ]),
            quadVersion(quad('f', 'r', 's'), [ 2 ]),
            quadVersion(quad('q', 'q', 'q'), [ 2 ]),
            quadVersion(quad('r', 'r', 'r'), [ 2 ]),
            quadVersion(quad('z', 'z', 'z'), [ 1, 2 ]),
          ]);
        });

        it('should estimate the total count as 15', () => {
          expect(cardinality).toEqual(15);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality, exactCardinality } = await document
            .searchTriplesVersion(null, null, null, { offset: 0, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadVersion(quad('a', 'a', '"a"^^http://example.org/literal'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'a', '"b"^^http://example.org/literal'), [ 0 ]),
            quadVersion(quad('a', 'a', '"z"^^http://example.org/literal'), [ 1 ]),
            quadVersion(quad('a', 'b', 'a'), [ 0 ]),
            quadVersion(quad('a', 'b', 'c'), [ 0, 1, 2 ]),
          ]);
        });

        it('should estimate the total count as 15', () => {
          expect(cardinality).toEqual(15);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality, exactCardinality } = await document
            .searchTriplesVersion(null, null, null, { offset: 2, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadVersion(quad('a', 'a', '"z"^^http://example.org/literal'), [ 1 ]),
            quadVersion(quad('a', 'b', 'a'), [ 0 ]),
            quadVersion(quad('a', 'b', 'c'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'b', 'd'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'b', 'f'), [ 0, 1, 2 ]),
          ]);
        });

        it('should estimate the total count as 15', () => {
          expect(cardinality).toEqual(15);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      // eslint-disable-next-line mocha/no-skipped-tests
      describe.skip('with pattern null null null, offset 20 and limit 5', () => { // TODO: fix me
        let exactCardinality: boolean;
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality, exactCardinality } = await document
            .searchTriplesVersion(null, null, null, { offset: 20, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 15', () => {
          expect(cardinality).toEqual(15);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      describe('with pattern f null null', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality, exactCardinality } = await document
            .searchTriplesVersion(DF.namedNode('f'), null, null));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadVersion(quad('f', 'f', 'f'), [ 1 ]),
            quadVersion(quad('f', 'r', 's'), [ 2 ]),
          ]);
        });

        it('should estimate the total count as 2', () => {
          expect(cardinality).toEqual(2);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      describe('with pattern c null null, offset 0 and limit 1', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality, exactCardinality } = await document
            .searchTriplesVersion(DF.namedNode('c'), null, null, { offset: 0, limit: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadVersion(quad('c', 'c', 'c'), [ 0, 1, 2 ]),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(cardinality).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      // eslint-disable-next-line mocha/no-skipped-tests
      describe.skip('with pattern c null null, offset 10 and limit 1', () => { // TODO: fix me
        let exactCardinality: boolean;
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality, exactCardinality } = await document
            .searchTriplesVersion(DF.namedNode('c'), null, null, { offset: 10, limit: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 1', () => {
          expect(cardinality).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      describe('with pattern a ?p ?o', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality, exactCardinality } = await document
            .searchTriplesVersion(DF.namedNode('a'), DF.variable('p'), DF.variable('o')));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadVersion(quad('a', 'a', '"a"^^http://example.org/literal'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'a', '"b"^^http://example.org/literal'), [ 0 ]),
            quadVersion(quad('a', 'a', '"z"^^http://example.org/literal'), [ 1 ]),
            quadVersion(quad('a', 'b', 'a'), [ 0 ]),
            quadVersion(quad('a', 'b', 'c'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'b', 'd'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'b', 'f'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'b', 'g'), [ 1, 2 ]),
            quadVersion(quad('a', 'b', 'z'), [ 0 ]),
          ]);
        });

        it('should estimate the total count as 9', () => {
          expect(cardinality).toEqual(9);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      describe('with pattern null b null', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality, exactCardinality } = await document
            .searchTriplesVersion(null, DF.namedNode('b'), null));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadVersion(quad('a', 'b', 'a'), [ 0 ]),
            quadVersion(quad('a', 'b', 'c'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'b', 'd'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'b', 'f'), [ 0, 1, 2 ]),
            quadVersion(quad('a', 'b', 'g'), [ 1, 2 ]),
            quadVersion(quad('a', 'b', 'z'), [ 0 ]),
          ]);
        });

        it('should estimate the total count as 6', () => {
          expect(cardinality).toEqual(6);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      describe('with pattern null ex:p3 null', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality, exactCardinality } = await document
            .searchTriplesVersion(null, DF.namedNode('http://example.org/p3'), null));
        });

        it('should return an array with no matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(cardinality).toEqual(0);
        });

        it('should not be an exact count', () => {
          expect(exactCardinality).toBe(false);
        });
      });

      describe('with pattern null null "a"^^http://example.org/literal', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality, exactCardinality } = await document
            .searchTriplesVersion(null, null, DF.literal('a', DF.namedNode('http://example.org/literal'))));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadVersion(quad('a', 'a', '"a"^^http://example.org/literal'), [ 0, 1, 2 ]),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(cardinality).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      describe('with pattern null null f', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, cardinality, exactCardinality } = await document
            .searchTriplesVersion(null, null, DF.namedNode('f')));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            quadVersion(quad('a', 'b', 'f'), [ 0, 1, 2 ]),
            quadVersion(quad('f', 'f', 'f'), [ 1 ]),
          ]);
        });

        it('should estimate the total count as 2', () => {
          expect(cardinality).toEqual(2);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });
    });

    describe('being counted', () => {
      describe('with a non-existing pattern', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality, exactCardinality } = await document
            .countTriplesVersion(DF.namedNode('1'), null, null));
        });

        it('should return 0', () => {
          expect(cardinality).toEqual(0);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      describe('with pattern null null null', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality, exactCardinality } = await document
            .countTriplesVersion(null, null, null));
        });

        it('should return 15', () => {
          expect(cardinality).toEqual(15);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      describe('with pattern a null null', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality, exactCardinality } = await document
            .countTriplesVersion(DF.namedNode('a'), null, null));
        });

        it('should return 9', () => {
          expect(cardinality).toEqual(9);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      describe('with pattern null b null', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality, exactCardinality } = await document
            .countTriplesVersion(null, DF.namedNode('b'), null));
        });

        it('should return 6', () => {
          expect(cardinality).toEqual(6);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      describe('with pattern null ex:p3 null', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality, exactCardinality } = await document
            .countTriplesVersion(null, DF.namedNode('http://example.org/p3'), null));
        });

        it('should return 0', () => {
          expect(cardinality).toEqual(0);
        });

        it('should not be an exact count', () => {
          expect(exactCardinality).toBe(false);
        });
      });

      describe('with pattern null null f', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality, exactCardinality } = await document
            .countTriplesVersion(null, null, DF.namedNode('f')));
        });

        it('should return 2', () => {
          expect(cardinality).toEqual(2);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });

      describe('with pattern null null "a"^^http://example.org/literal', () => {
        let exactCardinality: boolean;
        let cardinality: number;
        beforeAll(async() => {
          ({ cardinality, exactCardinality } = await document
            .countTriplesVersion(null, null, DF.literal('a', DF.namedNode('http://example.org/literal'))));
        });

        it('should return 1', () => {
          expect(cardinality).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(exactCardinality).toBe(true);
        });
      });
    });
  });
});
