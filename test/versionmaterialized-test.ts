import 'jest-rdf';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { OstrichStore } from '../lib/ostrich';
import { fromPath } from '../lib/ostrich';
import { cleanUp, closeAndCleanUp, initializeThreeVersions } from './prepare-ostrich';
const quad = require('rdf-quad');

const DF = new DataFactory();

// eslint-disable-next-line multiline-comment-style
/*
0:
 <a> <a> "a"^^<http://example.org/literal> .
 <a> <a> "b"^^<http://example.org/literal> .
 <a> <b> <a> .
 <a> <b> <c> .
 <a> <b> <d> .
 <a> <b> <f> .
 <a> <b> <z> .
 <c> <c> <c> .

1:
 <a> <a> "a"^^<http://example.org/literal> .
 <a> <b> <c> .
 <a> <b> <d> .
 <a> <b> <f> .
 <c> <c> <c> .
 <a> <a> "z"^^<http://example.org/literal> .
 <a> <b> <g> .
 <f> <f> <f> .
 <z> <z> <z> .

2:
 <a> <a> "a"^^<http://example.org/literal> .
 <a> <b> <c> .
 <a> <b> <d> .
 <a> <b> <f> .
 <c> <c> <c> .
 <a> <b> <g> .
 <f> <r> <s> .
 <q> <q> <q> .
 <r> <r> <r> .
 <z> <z> <z> .
 */

describe('version materialization', () => {
  describe('An ostrich store for an example ostrich path that will cause errors', () => {
    let document: OstrichStore;

    it('should throw when the store is closed', async() => {
      cleanUp('vm');
      document = await initializeThreeVersions('vm');
      await document.close();

      await expect(document.searchTriplesVersionMaterialized(null, null, null))
        .rejects.toThrow('Attempted to query a closed OSTRICH store');

      await closeAndCleanUp(document, 'vm');
    });

    it('should throw when the store has no versions', async() => {
      cleanUp('vm');
      document = await fromPath(`./test/test-vm.ostrich`, { readOnly: false });

      await expect(document.searchTriplesVersionMaterialized(null, null, null))
        .rejects.toThrow('Attempted to query an OSTRICH store without versions');

      await closeAndCleanUp(document, 'vm');
    });

    it('should throw when an internal error is thrown', async() => {
      cleanUp('vm');
      document = await initializeThreeVersions('vm');

      jest
        .spyOn((<any> document), '_searchTriplesVersionMaterialized')
        .mockImplementation((
          subject,
          predicate,
          object,
          offset,
          limit,
          version,
          cb: any,
        ) => cb(new Error('Internal error')));

      await expect(document.searchTriplesVersionMaterialized(null, null, null))
        .rejects.toThrow('Internal error');

      await closeAndCleanUp(document, 'vm');
    });
  });

  describe('An ostrich store for an example ostrich path', () => {
    let document: OstrichStore;
    beforeAll(async() => {
      cleanUp('vm');
      document = await initializeThreeVersions('vm');
    });
    afterAll(async() => {
      await closeAndCleanUp(document, 'vm');
    });

    describe('asked for supported features', () => {
      it('should return an object', () => {
        expect(document.features).toBeInstanceOf(Object);
      });

      it('should support searchTriplesDeltaMaterialized', () => {
        expect(document.features.searchTriplesVersionMaterialized).toBe(true);
      });

      it('should support countTriplesDeltaMaterialized', () => {
        expect(document.features.countTriplesVersionMaterialized).toBe(true);
      });
    });

    describe('being searched', () => {
      describe('with a non-existing pattern at the latest version', () => {
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('1'), null, null));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with a non-existing pattern at version 0', () => {
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('1'), null, null, { version: 0 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with a non-existing pattern at version 1', () => {
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('1'), null, null, { version: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with pattern null null null at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(10);
          expect(triples[0]).toEqualRdfQuad(quad('a', 'a', '"a"^^http://example.org/literal'));
        });

        it('should estimate the total count as 10', () => {
          expect(totalCount).toEqual(10);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 0 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(8);
          expect(triples[0]).toEqualRdfQuad(quad('a', 'a', '"a"^^http://example.org/literal'));
        });

        it('should estimate the total count as 8', () => {
          expect(totalCount).toEqual(8);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(9);
          expect(triples[0]).toEqualRdfQuad(quad('a', 'a', '"a"^^http://example.org/literal'));
        });

        it('should estimate the total count as 9', () => {
          expect(totalCount).toEqual(9);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5 at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { offset: 0, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(5);
          expect(triples[0]).toEqualRdfQuad(quad('a', 'a', '"a"^^http://example.org/literal'));
        });

        it('should estimate the total count as 10', () => {
          expect(totalCount).toEqual(10);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5 at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 0, offset: 0, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(5);
          expect(triples[0]).toEqualRdfQuad(quad('a', 'a', '"a"^^http://example.org/literal'));
        });

        it('should estimate the total count as 8', () => {
          expect(totalCount).toEqual(8);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5 at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 1, offset: 0, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(5);
          expect(triples[0]).toEqualRdfQuad(quad('a', 'a', '"a"^^http://example.org/literal'));
        });

        it('should estimate the total count as 9', () => {
          expect(totalCount).toEqual(9);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5 at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { offset: 2, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(5);
          expect(triples[0]).toEqualRdfQuad(quad('a', 'b', 'd'));
        });

        it('should estimate the total count as 10', () => {
          expect(totalCount).toEqual(10);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5 at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 0, offset: 2, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(5);
          expect(triples[0]).toEqualRdfQuad(quad('a', 'b', 'a'));
        });

        it('should estimate the total count as 8', () => {
          expect(totalCount).toEqual(8);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5 at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 1, offset: 2, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(5);
          expect(triples[0]).toEqualRdfQuad(quad('a', 'b', 'd'));
        });

        it('should estimate the total count as 9', () => {
          expect(totalCount).toEqual(9);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null, offset 10 and limit 5 at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { offset: 10, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 10', () => {
          expect(totalCount).toEqual(10);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null, offset 10 and limit 5 at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 0, offset: 10, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 8', () => {
          expect(totalCount).toEqual(8);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null, offset 10 and limit 5 at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 1, offset: 10, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 9', () => {
          expect(totalCount).toEqual(9);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern f null null at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('f'), null, null));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(1);
          expect(triples[0]).toEqualRdfQuad(quad('f', 'r', 's'));
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern f null null at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('f'), null, null, { version: 0 }));
        });

        it('should return an array with no matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern f null null at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('f'), null, null, { version: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(1);
          expect(triples[0]).toEqualRdfQuad(quad('f', 'f', 'f'));
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern c null null, offset 0 and limit 1 at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('c'), null, null, { offset: 0, limit: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(1);
          expect(triples[0]).toEqualRdfQuad(quad('c', 'c', 'c'));
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern c null null, offset 0 and limit 1 at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('c'), null, null, { version: 0, offset: 0, limit: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(1);
          expect(triples[0]).toEqualRdfQuad(quad('c', 'c', 'c'));
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern c null null, offset 0 and limit 1 at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('c'), null, null, { version: 1, offset: 0, limit: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(1);
          expect(triples[0]).toEqualRdfQuad(quad('c', 'c', 'c'));
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern c null null, offset 10 and limit 1 at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('c'), null, null, { offset: 10, limit: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern c null null, offset 10 and limit 1 at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('c'), null, null, { version: 0, offset: 10, limit: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern c null null, offset 10 and limit 1 at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('c'), null, null, { version: 1, offset: 10, limit: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern a ?p ?o at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('a'), DF.variable('p'), DF.variable('o')));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqualRdfQuadArray([
            quad('a', 'a', '"a"^^http://example.org/literal'),
            quad('a', 'b', 'c'),
            quad('a', 'b', 'd'),
            quad('a', 'b', 'f'),
            quad('a', 'b', 'g'),
          ]);
        });

        it('should estimate the total count as 5', () => {
          expect(totalCount).toEqual(5);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern a ?p ?o at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('a'), DF.variable('p'), DF.variable('o'), { version: 0 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqualRdfQuadArray([
            quad('a', 'a', '"a"^^http://example.org/literal'),
            quad('a', 'a', '"b"^^http://example.org/literal'),
            quad('a', 'b', 'a'),
            quad('a', 'b', 'c'),
            quad('a', 'b', 'd'),
            quad('a', 'b', 'f'),
            quad('a', 'b', 'z'),
          ]);
        });

        it('should estimate the total count as 7', () => {
          expect(totalCount).toEqual(7);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern a ?p ?o at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(DF.namedNode('a'), DF.variable('p'), DF.variable('o'), { version: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqualRdfQuadArray([
            quad('a', 'a', '"a"^^http://example.org/literal'),
            quad('a', 'b', 'c'),
            quad('a', 'b', 'd'),
            quad('a', 'b', 'f'),
            quad('a', 'a', '"z"^^http://example.org/literal'),
            quad('a', 'b', 'g'),
          ]);
        });

        it('should estimate the total count as 6', () => {
          expect(totalCount).toEqual(6);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null b null at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, DF.namedNode('b'), null));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqualRdfQuadArray([
            quad('a', 'b', 'c'),
            quad('a', 'b', 'd'),
            quad('a', 'b', 'f'),
            quad('a', 'b', 'g'),
          ]);
        });

        it('should estimate the total count as 4', () => {
          expect(totalCount).toEqual(4);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null b null at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, DF.namedNode('b'), null, { version: 0 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqualRdfQuadArray([
            quad('a', 'b', 'a'),
            quad('a', 'b', 'c'),
            quad('a', 'b', 'd'),
            quad('a', 'b', 'f'),
            quad('a', 'b', 'z'),
          ]);
        });

        it('should estimate the total count as 5', () => {
          expect(totalCount).toEqual(5);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null b null at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, DF.namedNode('b'), null, { version: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqualRdfQuadArray([
            quad('a', 'b', 'c'),
            quad('a', 'b', 'd'),
            quad('a', 'b', 'f'),
            quad('a', 'b', 'g'),
          ]);
        });

        it('should estimate the total count as 4', () => {
          expect(totalCount).toEqual(4);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null ex:p3 null at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, DF.namedNode('http://example.org/p3'), null));
        });

        it('should return an array with no matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });

        it('should be not an exact count', () => {
          expect(hasExactCount).toBe(false);
        });
      });

      describe('with pattern null ex:p3 null at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, DF.namedNode('http://example.org/p3'), null, { version: 0 }));
        });

        it('should return an array with no matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });

        it('should be not an exact count', () => {
          expect(hasExactCount).toBe(false);
        });
      });

      describe('with pattern null ex:p3 null at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, DF.namedNode('http://example.org/p3'), null, { version: 1 }));
        });

        it('should return an array with no matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });

        it('should be not an exact count', () => {
          expect(hasExactCount).toBe(false);
        });
      });

      describe('with pattern null null "a"^^http://example.org/literal at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, DF.literal('a', DF.namedNode('http://example.org/literal'))));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqualRdfQuadArray([
            quad('a', 'a', '"a"^^http://example.org/literal'),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null "a"^^http://example.org/literal at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(
              null, null, DF.literal('a', DF.namedNode('http://example.org/literal')), { version: 0 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqualRdfQuadArray([
            quad('a', 'a', '"a"^^http://example.org/literal'),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null "a"^^http://example.org/literal at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(
              null, null, DF.literal('a', DF.namedNode('http://example.org/literal')), { version: 1 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqualRdfQuadArray([
            quad('a', 'a', '"a"^^http://example.org/literal'),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null f at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        let triples: RDF.Quad[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, DF.namedNode('f')));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqualRdfQuadArray([
            quad('a', 'b', 'f'),
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });
    });

    describe('with pattern null null f at version 0', () => {
      let hasExactCount: boolean;
      let totalCount: number;
      let triples: RDF.Quad[];
      beforeAll(async() => {
        ({ triples, totalCount, hasExactCount } = await document
          .searchTriplesVersionMaterialized(null, null, DF.namedNode('f'), { version: 0 }));
      });

      it('should return an array with matches', () => {
        expect(triples).toEqualRdfQuadArray([
          quad('a', 'b', 'f'),
        ]);
      });

      it('should estimate the total count as 1', () => {
        expect(totalCount).toEqual(1);
      });

      it('should be an exact count', () => {
        expect(hasExactCount).toBe(true);
      });
    });

    describe('with pattern null null f at version 1', () => {
      let hasExactCount: boolean;
      let totalCount: number;
      let triples: RDF.Quad[];
      beforeAll(async() => {
        ({ triples, totalCount, hasExactCount } = await document
          .searchTriplesVersionMaterialized(null, null, DF.namedNode('f'), { version: 1 }));
      });

      it('should return an array with matches', () => {
        expect(triples).toEqualRdfQuadArray([
          quad('a', 'b', 'f'),
          quad('f', 'f', 'f'),
        ]);
      });

      it('should estimate the total count as 2', () => {
        expect(totalCount).toEqual(2);
      });

      it('should be an exact count', () => {
        expect(hasExactCount).toBe(true);
      });
    });

    describe('being counted', () => {
      describe('with a non-existing pattern at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(DF.namedNode('1'), null, null));
        });

        it('should return 0', () => {
          expect(totalCount).toEqual(0);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with a non-existing pattern at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(DF.namedNode('q'), null, null, 0));
        });

        it('should return 0', () => {
          expect(totalCount).toEqual(0);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with a non-existing pattern at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(DF.namedNode('q'), null, null, 1));
        });

        it('should return 0', () => {
          expect(totalCount).toEqual(0);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(null, null, null));
        });

        it('should return 10', () => {
          expect(totalCount).toEqual(10);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(null, null, null, 0));
        });

        it('should return 8', () => {
          expect(totalCount).toEqual(8);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null null at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(null, null, null, 1));
        });

        it('should return 9', () => {
          expect(totalCount).toEqual(9);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern a null null at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(DF.namedNode('a'), null, null));
        });

        it('should return 5', () => {
          expect(totalCount).toEqual(5);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern a null null at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(DF.namedNode('a'), null, null, 0));
        });

        it('should return 7', () => {
          expect(totalCount).toEqual(7);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern a null null at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(DF.namedNode('a'), null, null, 1));
        });

        it('should return 6', () => {
          expect(totalCount).toEqual(6);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null b null at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(null, DF.namedNode('b'), null));
        });

        it('should return 4', () => {
          expect(totalCount).toEqual(4);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null b null at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(null, DF.namedNode('b'), null, 0));
        });

        it('should return 5', () => {
          expect(totalCount).toEqual(5);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null b null at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(null, DF.namedNode('b'), null, 1));
        });

        it('should return 4', () => {
          expect(totalCount).toEqual(4);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null ex:p3 null at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(null, DF.namedNode('http://example.org/p3'), null));
        });

        it('should return 0', () => {
          expect(totalCount).toEqual(0);
        });

        it('should not be an exact count', () => {
          expect(hasExactCount).toBe(false);
        });
      });

      describe('with pattern null ex:p3 null at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(null, DF.namedNode('http://example.org/p3'), null, 0));
        });

        it('should return 0', () => {
          expect(totalCount).toEqual(0);
        });

        it('should not be an exact count', () => {
          expect(hasExactCount).toBe(false);
        });
      });

      describe('with pattern null ex:p3 null at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(null, DF.namedNode('http://example.org/p3'), null, 1));
        });

        it('should return 0', () => {
          expect(totalCount).toEqual(0);
        });

        it('should not be an exact count', () => {
          expect(hasExactCount).toBe(false);
        });
      });

      describe('with pattern null null f at the latest version', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(null, null, DF.namedNode('f')));
        });

        it('should return 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null f at version 0', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(null, null, DF.namedNode('f'), 0));
        });

        it('should return 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null f at version 1', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(null, null, DF.namedNode('f'), 1));
        });

        it('should return 2', () => {
          expect(totalCount).toEqual(2);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });

      describe('with pattern null null "a"^^http://example.org/literal', () => {
        let hasExactCount: boolean;
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount, hasExactCount } = await document
            .countTriplesVersionMaterialized(null, null, DF.literal('a', DF.namedNode('http://example.org/literal'))));
        });

        it('should return 1', () => {
          expect(totalCount).toEqual(1);
        });

        it('should be an exact count', () => {
          expect(hasExactCount).toBe(true);
        });
      });
    });
  });
});
