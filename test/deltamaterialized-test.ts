import 'jest-rdf';
import type { ITripleRaw, OstrichStore } from '../lib/ostrich';
import { fromPath } from '../lib/ostrich';
import { cleanUp, closeAndCleanUp, initializeThreeVersions } from './prepare-ostrich';

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
      document = await fromPath(`./test/test-dm.ostrich`, false);

      await expect(document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1 }))
        .rejects.toThrow('Attempted to query an OSTRICH store without versions');

      await closeAndCleanUp(document, 'dm');
    });

    it('should throw when an internal error is thrown', async() => {
      cleanUp('dm');
      document = await initializeThreeVersions('dm');

      jest
        .spyOn((<any> document), '_searchTriplesDeltaMaterialized')
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
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('1', null, null, { versionStart: 0, versionEnd: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with a non-existing pattern between version 1 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('1', null, null, { versionStart: 1, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with a non-existing pattern between version 0 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('1', null, null, { versionStart: 0, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with pattern null null null between version 0 and 1', () => {
        let totalCount: number;
        let triples: ITripleRaw[]; // , hasExactCount;
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"b"^^http://example.org/literal',
              addition: false },
            { subject: 'a',
              predicate: 'a',
              object: '"z"^^http://example.org/literal',
              addition: true },
            { subject: 'a',
              predicate: 'b',
              object: 'a',
              addition: false },
            { subject: 'a',
              predicate: 'b',
              object: 'g',
              addition: true },
            { subject: 'a',
              predicate: 'b',
              object: 'z',
              addition: false },
            { subject: 'f',
              predicate: 'f',
              object: 'f',
              addition: true },
            { subject: 'z',
              predicate: 'z',
              object: 'z',
              addition: true },
          ]);
        });

        it('should estimate the total count as 7', () => {
          expect(totalCount).toEqual(7);
        });
      });

      describe('with pattern null null null between version 1 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 1, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"z"^^http://example.org/literal',
              addition: false },
            { subject: 'f',
              predicate: 'f',
              object: 'f',
              addition: false },
            { subject: 'f',
              predicate: 'r',
              object: 's',
              addition: true },
            { subject: 'q',
              predicate: 'q',
              object: 'q',
              addition: true },
            { subject: 'r',
              predicate: 'r',
              object: 'r',
              addition: true },
          ]);
        });

        it('should estimate the total count as 15', () => {
          expect(totalCount).toEqual(15);
        });
      });

      describe('with pattern null null null between version 0 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"b"^^http://example.org/literal',
              addition: false },
            { subject: 'a',
              predicate: 'b',
              object: 'a',
              addition: false },
            { subject: 'a',
              predicate: 'b',
              object: 'g',
              addition: true },
            { subject: 'a',
              predicate: 'b',
              object: 'z',
              addition: false },
            { subject: 'f',
              predicate: 'r',
              object: 's',
              addition: true },
            { subject: 'q',
              predicate: 'q',
              object: 'q',
              addition: true },
            { subject: 'r',
              predicate: 'r',
              object: 'r',
              addition: true },
            { subject: 'z',
              predicate: 'z',
              object: 'z',
              addition: true },
          ]);
        });

        it('should estimate the total count as 8', () => {
          expect(totalCount).toEqual(8);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5 between version 0 and 1', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1, offset: 0, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"b"^^http://example.org/literal',
              addition: false },
            { subject: 'a',
              predicate: 'a',
              object: '"z"^^http://example.org/literal',
              addition: true },
            { subject: 'a',
              predicate: 'b',
              object: 'a',
              addition: false },
            { subject: 'a',
              predicate: 'b',
              object: 'g',
              addition: true },
            { subject: 'a',
              predicate: 'b',
              object: 'z',
              addition: false },
          ]);
        });

        it('should estimate the total count as 7', () => {
          expect(totalCount).toEqual(7);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5 between version 1 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 1, versionEnd: 2, offset: 0, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"z"^^http://example.org/literal',
              addition: false },
            { subject: 'f',
              predicate: 'f',
              object: 'f',
              addition: false },
            { subject: 'f',
              predicate: 'r',
              object: 's',
              addition: true },
            { subject: 'q',
              predicate: 'q',
              object: 'q',
              addition: true },
            { subject: 'r',
              predicate: 'r',
              object: 'r',
              addition: true },
          ]);
        });

        it('should estimate the total count as 15', () => {
          expect(totalCount).toEqual(15);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5 between version 0 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 2, offset: 0, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"b"^^http://example.org/literal',
              addition: false },
            { subject: 'a',
              predicate: 'b',
              object: 'a',
              addition: false },
            { subject: 'a',
              predicate: 'b',
              object: 'g',
              addition: true },
            { subject: 'a',
              predicate: 'b',
              object: 'z',
              addition: false },
            { subject: 'f',
              predicate: 'r',
              object: 's',
              addition: true },
          ]);
        });

        it('should estimate the total count as 8', () => {
          expect(totalCount).toEqual(8);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5 between version 0 and 1', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1, offset: 2, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'b',
              object: 'a',
              addition: false },
            { subject: 'a',
              predicate: 'b',
              object: 'g',
              addition: true },
            { subject: 'a',
              predicate: 'b',
              object: 'z',
              addition: false },
            { subject: 'f',
              predicate: 'f',
              object: 'f',
              addition: true },
            { subject: 'z',
              predicate: 'z',
              object: 'z',
              addition: true },
          ]);
        });

        it('should estimate the total count as 7', () => {
          expect(totalCount).toEqual(7);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5 between version 1 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 1, versionEnd: 2, offset: 2, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'f',
              predicate: 'r',
              object: 's',
              addition: true },
            { subject: 'q',
              predicate: 'q',
              object: 'q',
              addition: true },
            { subject: 'r',
              predicate: 'r',
              object: 'r',
              addition: true },
          ]);
        });

        it('should estimate the total count as 15', () => {
          expect(totalCount).toEqual(15);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5 between version 0 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 2, offset: 2, limit: 5 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'b',
              object: 'g',
              addition: true },
            { subject: 'a',
              predicate: 'b',
              object: 'z',
              addition: false },
            { subject: 'f',
              predicate: 'r',
              object: 's',
              addition: true },
            { subject: 'q',
              predicate: 'q',
              object: 'q',
              addition: true },
            { subject: 'r',
              predicate: 'r',
              object: 'r',
              addition: true },
          ]);
        });

        it('should estimate the total count as 8', () => {
          expect(totalCount).toEqual(8);
        });
      });

      describe('with pattern null null null, offset 10 and limit 5 between version 0 and 1', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(
              null, null, null, { versionStart: 0, versionEnd: 1, offset: 10, limit: 5 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 7', () => {
          expect(totalCount).toEqual(7);
        });
      });

      describe('with pattern null null null, offset 10 and limit 5 between version 1 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(
              null, null, null, { versionStart: 1, versionEnd: 2, offset: 10, limit: 5 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 15', () => {
          expect(totalCount).toEqual(15);
        });
      });

      describe('with pattern null null null, offset 10 and limit 5 between version 0 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(
              null, null, null, { versionStart: 0, versionEnd: 2, offset: 10, limit: 5 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 8', () => {
          expect(totalCount).toEqual(8);
        });
      });

      describe('with pattern f null null between version 0 and 1', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(
              'f', null, null, { versionStart: 0, versionEnd: 1 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'f',
              predicate: 'f',
              object: 'f',
              addition: true },
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });
      });

      describe('with pattern f null null between version 1 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('f', null, null, { versionStart: 1, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'f',
              predicate: 'f',
              object: 'f',
              addition: false },
            { subject: 'f',
              predicate: 'r',
              object: 's',
              addition: true },
          ]);
        });

        it('should estimate the total count as 2', () => {
          expect(totalCount).toEqual(2);
        });
      });

      describe('with pattern f null null between version 0 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('f', null, null, { versionStart: 0, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'f',
              predicate: 'r',
              object: 's',
              addition: true },
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });
      });

      describe('with pattern z null null, offset 0 and limit 1 between version 0 and 1', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('z', null, null, { versionStart: 0, versionEnd: 1, offset: 0, limit: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'z',
              predicate: 'z',
              object: 'z',
              addition: true },
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });
      });

      describe('with pattern z null null, offset 0 and limit 1 between version 1 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('z', null, null, { versionStart: 1, versionEnd: 2, offset: 0, limit: 1 }));
        });

        it('should return an array with no matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 2', () => {
          expect(totalCount).toEqual(2);
        });
      });

      describe('with pattern z null null, offset 0 and limit 1 between version 0 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('z', null, null, { versionStart: 0, versionEnd: 2, offset: 0, limit: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'z',
              predicate: 'z',
              object: 'z',
              addition: true },
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });
      });

      describe('with pattern z null null, offset 10 and limit 1 between version 0 and 1', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('z', null, null, { versionStart: 0, versionEnd: 1, offset: 10, limit: 1 }));
        });

        it('should return an array with no matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });
      });

      describe('with pattern z null null, offset 10 and limit 1 between version 1 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('z', null, null, { versionStart: 1, versionEnd: 2, offset: 10, limit: 1 }));
        });

        it('should return an array with no matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 2', () => {
          expect(totalCount).toEqual(2);
        });
      });

      describe('with pattern z null null, offset 10 and limit 1 between version 0 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('z', null, null, { versionStart: 0, versionEnd: 2, offset: 10, limit: 1 }));
        });

        it('should return an array with no matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });
      });

      describe('with pattern a ?p ?o between version 0 and 1', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('a', '?p', '?o', { versionStart: 0, versionEnd: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"b"^^http://example.org/literal',
              addition: false },
            { subject: 'a',
              predicate: 'a',
              object: '"z"^^http://example.org/literal',
              addition: true },
            { subject: 'a',
              predicate: 'b',
              object: 'a',
              addition: false },
            { subject: 'a',
              predicate: 'b',
              object: 'g',
              addition: true },
            { subject: 'a',
              predicate: 'b',
              object: 'z',
              addition: false },
          ]);
        });

        it('should estimate the total count as 5', () => {
          expect(totalCount).toEqual(5);
        });
      });

      describe('with pattern a ?p ?o between version 1 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('a', '?p', '?o', { versionStart: 1, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"z"^^http://example.org/literal',
              addition: false },
          ]);
        });

        it('should estimate the total count as 9', () => {
          expect(totalCount).toEqual(9);
        });
      });

      describe('with pattern a ?p ?o between version 0 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized('a', '?p', '?o', { versionStart: 0, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"b"^^http://example.org/literal',
              addition: false },
            { subject: 'a',
              predicate: 'b',
              object: 'a',
              addition: false },
            { subject: 'a',
              predicate: 'b',
              object: 'g',
              addition: true },
            { subject: 'a',
              predicate: 'b',
              object: 'z',
              addition: false },
          ]);
        });

        it('should estimate the total count as 4', () => {
          expect(totalCount).toEqual(4);
        });
      });

      describe('with pattern null b null between version 0 and 1', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, 'b', null, { versionStart: 0, versionEnd: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'b',
              object: 'a',
              addition: false },
            { subject: 'a',
              predicate: 'b',
              object: 'g',
              addition: true },
            { subject: 'a',
              predicate: 'b',
              object: 'z',
              addition: false },
          ]);
        });

        it('should estimate the total count as 3', () => {
          expect(totalCount).toEqual(3);
        });
      });

      describe('with pattern null b null between version 1 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, 'b', null, { versionStart: 1, versionEnd: 2 }));
        });

        it('should return an array with no matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 6', () => {
          expect(totalCount).toEqual(6);
        });
      });

      describe('with pattern null b null between version 0 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, 'b', null, { versionStart: 0, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'b',
              object: 'a',
              addition: false },
            { subject: 'a',
              predicate: 'b',
              object: 'g',
              addition: true },
            { subject: 'a',
              predicate: 'b',
              object: 'z',
              addition: false },
          ]);
        });

        it('should estimate the total count as 3', () => {
          expect(totalCount).toEqual(3);
        });
      });

      describe('with pattern null ex:p3 null between version 0 and 1', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, 'http://example.org/p3', null, { versionStart: 0, versionEnd: 1 }));
        });

        it('should return an array with no matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with pattern null ex:p3 null between version 1 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, 'http://example.org/p3', null, { versionStart: 1, versionEnd: 2 }));
        });

        it('should return an array with no matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with pattern null ex:p3 null between version 0 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, 'http://example.org/p3', null, { versionStart: 0, versionEnd: 2 }));
        });

        it('should return an array with no matches', () => {
          expect(triples).toEqual([]);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 0 and 1', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(
              null, null, '"b"^^http://example.org/literal', { versionStart: 0, versionEnd: 1 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"b"^^http://example.org/literal',
              addition: false },
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 1 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(
              null, null, '"b"^^http://example.org/literal', { versionStart: 1, versionEnd: 2 },
            ));
        });

        it('should return an array with no matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 2', () => {
          expect(totalCount).toEqual(2);
        });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 0 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(
              null, null, '"b"^^http://example.org/literal', { versionStart: 0, versionEnd: 2 },
            ));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'a',
              predicate: 'a',
              object: '"b"^^http://example.org/literal',
              addition: false },
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });
      });

      describe('with pattern null null f between version 0 and 1', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, null, 'f', { versionStart: 0, versionEnd: 1 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'f',
              predicate: 'f',
              object: 'f',
              addition: true },
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });
      });

      describe('with pattern null null f between version 1 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, null, 'f', { versionStart: 1, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toEqual([
            { subject: 'f',
              predicate: 'f',
              object: 'f',
              addition: false },
          ]);
        });

        it('should estimate the total count as 1', () => {
          expect(totalCount).toEqual(1);
        });
      });

      describe('with pattern null null f between version 0 and 2', () => {
        let totalCount: number;
        let triples: ITripleRaw[];
        beforeAll(async() => {
          ({ triples, totalCount } = await document
            .searchTriplesDeltaMaterialized(null, null, 'f', { versionStart: 0, versionEnd: 2 }));
        });

        it('should return an array with matches', () => {
          expect(triples).toHaveLength(0);
        });

        it('should estimate the total count as 0', () => {
          expect(totalCount).toEqual(0);
        });
      });
    });

    describe('being counted', () => {
      describe('with a non-existing pattern between version 0 and 1', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized('1', null, null, 0, 1));
        });

        it('should return 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with a non-existing pattern between version 1 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized('1', null, null, 1, 2));
        });

        it('should return 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with a non-existing pattern between version 0 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized('1', null, null, 0, 2));
        });

        it('should return 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with pattern null null null between version 0 and 1', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, null, null, 0, 1));
        });

        it('should return 7', () => {
          expect(totalCount).toEqual(7);
        });
      });

      describe('with pattern null null null between version 1 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, null, null, 1, 2));
        });

        it('should return 15', () => {
          expect(totalCount).toEqual(15);
        });
      });

      describe('with pattern null null null between version 0 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, null, null, 0, 2));
        });

        it('should return 8', () => {
          expect(totalCount).toEqual(8);
        });
      });

      describe('with pattern a null null between version 0 and 1', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized('a', null, null, 0, 1));
        });

        it('should return 5', () => {
          expect(totalCount).toEqual(5);
        });
      });

      describe('with pattern a null null between version 1 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized('a', null, null, 1, 2));
        });

        it('should return 9', () => {
          expect(totalCount).toEqual(9);
        });
      });

      describe('with pattern a null null between version 0 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized('a', null, null, 0, 2));
        });

        it('should return 4', () => {
          expect(totalCount).toEqual(4);
        });
      });

      describe('with pattern null b null between version 0 and 1', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, 'b', null, 0, 1));
        });

        it('should return 3', () => {
          expect(totalCount).toEqual(3);
        });
      });

      describe('with pattern null b null between version 1 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, 'b', null, 1, 2));
        });

        it('should return 6', () => {
          expect(totalCount).toEqual(6);
        });
      });

      describe('with pattern null b null between version 0 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, 'b', null, 0, 2));
        });

        it('should return 3', () => {
          expect(totalCount).toEqual(3);
        });
      });

      describe('with pattern null ex:p3 null between version 0 and 1', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, 'http://example.org/p3', null, 0, 1));
        });

        it('should return 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with pattern null ex:p3 null between version 1 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, 'http://example.org/p3', null, 1, 2));
        });

        it('should return 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with pattern null ex:p3 null between version 0 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, 'http://example.org/p3', null, 0, 2));
        });

        it('should return 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with pattern null null f between version 0 and 1', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, null, 'f', 0, 1));
        });

        it('should return 1', () => {
          expect(totalCount).toEqual(1);
        });
      });

      describe('with pattern null null f between version 1 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, null, 'f', 1, 2));
        });

        it('should return 1', () => {
          expect(totalCount).toEqual(1);
        });
      });

      describe('with pattern null null f between version 0 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, null, 'f', 0, 2));
        });

        it('should return 0', () => {
          expect(totalCount).toEqual(0);
        });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 0 and 1', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, null, '"b"^^http://example.org/literal', 0, 1));
        });

        it('should return 1', () => {
          expect(totalCount).toEqual(1);
        });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 1 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, null, '"b"^^http://example.org/literal', 1, 2));
        });

        it('should return 2', () => {
          expect(totalCount).toEqual(2);
        });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 0 and 2', () => {
        let totalCount: number;
        beforeAll(async() => {
          ({ totalCount } = await document
            .countTriplesDeltaMaterialized(null, null, '"b"^^http://example.org/literal', 0, 2));
        });

        it('should return 1', () => {
          expect(totalCount).toEqual(1);
        });
      });
    });
  });
});
