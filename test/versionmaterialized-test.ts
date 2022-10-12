import 'jest-rdf';
import type { ITripleRaw, OstrichStore } from '../lib/ostrich';
import { cleanUp, closeAndCleanUp, initializeThreeVersions } from './prepare-ostrich';

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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesVersionMaterialized('1', null, null));
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesVersionMaterialized('1', null, null, { version: 0 }));
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesVersionMaterialized('1', null, null, { version: 1 }));
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(10);
          expect(triples[0]).toEqual({ subject: 'a',
            predicate: 'a',
            object: '"a"^^http://example.org/literal' });
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 0 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(8);
          expect(triples[0]).toEqual({ subject: 'a',
            predicate: 'a',
            object: '"a"^^http://example.org/literal' });
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(9);
          expect(triples[0]).toEqual({ subject: 'a',
            predicate: 'a',
            object: '"a"^^http://example.org/literal' });
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { offset: 0, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(5);
          expect(triples[0]).toEqual({ subject: 'a',
            predicate: 'a',
            object: '"a"^^http://example.org/literal' });
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 0, offset: 0, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(5);
          expect(triples[0]).toEqual({ subject: 'a',
            predicate: 'a',
            object: '"a"^^http://example.org/literal' });
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 1, offset: 0, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(5);
          expect(triples[0]).toEqual({ subject: 'a',
            predicate: 'a',
            object: '"a"^^http://example.org/literal' });
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { offset: 2, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(5);
          expect(triples[0]).toEqual({ subject: 'a',
            predicate: 'b',
            object: 'd' });
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 0, offset: 2, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(5);
          expect(triples[0]).toEqual({ subject: 'a',
            predicate: 'b',
            object: 'a' });
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 1, offset: 2, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(5);
          expect(triples[0]).toEqual({ subject: 'a',
            predicate: 'b',
            object: 'd' });
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
        let triples: ITripleRaw[];
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
        let triples: ITripleRaw[];
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
        let triples: ITripleRaw[];
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized('f', null, null));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(1);
          expect(triples[0]).toEqual({ subject: 'f',
            predicate: 'r',
            object: 's' });
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized('f', null, null, { version: 0 }));
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized('f', null, null, { version: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(1);
          expect(triples[0]).toEqual({ subject: 'f',
            predicate: 'f',
            object: 'f' });
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized('c', null, null, { offset: 0, limit: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(1);
          expect(triples[0]).toEqual({ subject: 'c',
            predicate: 'c',
            object: 'c' });
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized('c', null, null, { version: 0, offset: 0, limit: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(1);
          expect(triples[0]).toEqual({ subject: 'c',
            predicate: 'c',
            object: 'c' });
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized('c', null, null, { version: 1, offset: 0, limit: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(1);
          expect(triples[0]).toEqual({ subject: 'c',
            predicate: 'c',
            object: 'c' });
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized('c', null, null, { offset: 10, limit: 1 }));
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized('c', null, null, { version: 0, offset: 10, limit: 1 }));
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized('c', null, null, { version: 1, offset: 10, limit: 1 }));
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized('a', '?p', '?o'));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"a"^^http://example.org/literal' },
            { subject: 'a',
              predicate: 'b',
              object: 'c' },
            { subject: 'a',
              predicate: 'b',
              object: 'd' },
            { subject: 'a',
              predicate: 'b',
              object: 'f' },
            { subject: 'a',
              predicate: 'b',
              object: 'g' },
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized('a', '?p', '?o', { version: 0 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"a"^^http://example.org/literal' },
            { subject: 'a',
              predicate: 'a',
              object: '"b"^^http://example.org/literal' },
            { subject: 'a',
              predicate: 'b',
              object: 'a' },
            { subject: 'a',
              predicate: 'b',
              object: 'c' },
            { subject: 'a',
              predicate: 'b',
              object: 'd' },
            { subject: 'a',
              predicate: 'b',
              object: 'f' },
            { subject: 'a',
              predicate: 'b',
              object: 'z' },
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized('a', '?p', '?o', { version: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"a"^^http://example.org/literal' },
            { subject: 'a',
              predicate: 'b',
              object: 'c' },
            { subject: 'a',
              predicate: 'b',
              object: 'd' },
            { subject: 'a',
              predicate: 'b',
              object: 'f' },
            { subject: 'a',
              predicate: 'a',
              object: '"z"^^http://example.org/literal' },
            { subject: 'a',
              predicate: 'b',
              object: 'g' },
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, 'b', null));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'b',
              object: 'c' },
            { subject: 'a',
              predicate: 'b',
              object: 'd' },
            { subject: 'a',
              predicate: 'b',
              object: 'f' },
            { subject: 'a',
              predicate: 'b',
              object: 'g' },
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, 'b', null, { version: 0 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'b',
              object: 'a' },
            { subject: 'a',
              predicate: 'b',
              object: 'c' },
            { subject: 'a',
              predicate: 'b',
              object: 'd' },
            { subject: 'a',
              predicate: 'b',
              object: 'f' },
            { subject: 'a',
              predicate: 'b',
              object: 'z' },
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, 'b', null, { version: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'b',
              object: 'c' },
            { subject: 'a',
              predicate: 'b',
              object: 'd' },
            { subject: 'a',
              predicate: 'b',
              object: 'f' },
            { subject: 'a',
              predicate: 'b',
              object: 'g' },
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, 'http://example.org/p3', null));
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, 'http://example.org/p3', null, { version: 0 }));
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, 'http://example.org/p3', null, { version: 1 }));
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, '"a"^^http://example.org/literal'));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"a"^^http://example.org/literal' },
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, '"a"^^http://example.org/literal', { version: 0 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"a"^^http://example.org/literal' },
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, '"a"^^http://example.org/literal', { version: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"a"^^http://example.org/literal' },
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
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount, hasExactCount } = await document
            .searchTriplesVersionMaterialized(null, null, 'f'));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'b',
              object: 'f' },
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
      let triples: ITripleRaw[];
      beforeAll(async() => {
        ({ triples, totalCount, hasExactCount } = await document
          .searchTriplesVersionMaterialized(null, null, 'f', { version: 0 }));
      });

      it('should return an array with matches', () => {
        expect(triples).toEqual([
          { subject: 'a',
            predicate: 'b',
            object: 'f' },
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
      let triples: ITripleRaw[];
      beforeAll(async() => {
        ({ triples, totalCount, hasExactCount } = await document
          .searchTriplesVersionMaterialized(null, null, 'f', { version: 1 }));
      });

      it('should return an array with matches', () => {
        expect(triples).toEqual([
          { subject: 'a',
            predicate: 'b',
            object: 'f' },
          { subject: 'f',
            predicate: 'f',
            object: 'f' },
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
            .countTriplesVersionMaterialized('1', null, null));
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
            .countTriplesVersionMaterialized('q', null, null, 0));
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
            .countTriplesVersionMaterialized('q', null, null, 1));
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
            .countTriplesVersionMaterialized('a', null, null));
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
            .countTriplesVersionMaterialized('a', null, null, 0));
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
            .countTriplesVersionMaterialized('a', null, null, 1));
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
            .countTriplesVersionMaterialized(null, 'b', null));
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
            .countTriplesVersionMaterialized(null, 'b', null, 0));
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
            .countTriplesVersionMaterialized(null, 'b', null, 1));
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
            .countTriplesVersionMaterialized(null, 'http://example.org/p3', null));
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
            .countTriplesVersionMaterialized(null, 'http://example.org/p3', null, 0));
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
            .countTriplesVersionMaterialized(null, 'http://example.org/p3', null, 1));
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
            .countTriplesVersionMaterialized(null, null, 'f'));
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
            .countTriplesVersionMaterialized(null, null, 'f', 0));
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
            .countTriplesVersionMaterialized(null, null, 'f', 1));
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
            .countTriplesVersionMaterialized(null, null, '"a"^^http://example.org/literal'));
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
