import 'jest-rdf';
import type { OstrichStore } from '../lib/ostrich';
import { fromPath, quadDelta } from '../lib/ostrich';
const _ = require('lodash');
const quad = require('rdf-quad');

describe('append', () => {
  describe('An ostrich store for an example ostrich path', () => {
    describe('being appended', () => {
      describe('for a store that will cause errors', () => {
        let document: OstrichStore;

        it('should throw if the store is closed', async() => {
          document = await fromPath('./test/test-temp.ostrich', { readOnly: false });
          await document.close();

          await expect(document.append([], 0))
            .rejects.toThrow('Attempted to append to a closed OSTRICH store');

          // We completely remove the store
          await document.close(true);
        });

        it('should throw if the store is read-only', async() => {
          document = await fromPath('./test/test-temp.ostrich', { readOnly: true });

          await expect(document.append([], 0))
            .rejects.toThrow('Attempted to append to an OSTRICH store in read-only mode');

          // We completely remove the store
          await document.close(true);
        });
      });

      describe('with 3 triples for version 0', () => {
        let document: OstrichStore;
        let count: number;
        const triplesActual = [
          quadDelta(quad('a', 'a', 'a'), true),
          quadDelta(quad('a', 'a', 'b'), true),
          quadDelta(quad('a', 'a', 'c'), true),
        ];

        beforeEach(async() => {
          document = await fromPath('./test/test-temp.ostrich', { readOnly: false });
          count = await document.append(triplesActual, 0);
        });

        afterEach(async() => {
          // We completely remove the store
          await document.close(true);
        });

        it('should have inserted 3 triples', () => {
          expect(count).toEqual(3);
        });

        it('should have 3 triples for version 0', async() => {
          const { triples, totalCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 0 });

          expect(triples).toHaveLength(3);
          expect(triples[0]).toEqual(_.omit(triplesActual[0], [ 'addition' ]));
          expect(triples[1]).toEqual(_.omit(triplesActual[1], [ 'addition' ]));
          expect(triples[2]).toEqual(_.omit(triplesActual[2], [ 'addition' ]));
          expect(totalCount).toEqual(3);
        });
      });

      describe('with 3 triples for the last version', () => {
        let document: OstrichStore;
        let count: number;
        const triplesActual = [
          quadDelta(quad('a', 'a', 'a'), true),
          quadDelta(quad('a', 'a', 'b'), true),
          quadDelta(quad('a', 'a', 'c'), true),
        ];

        beforeEach(async() => {
          document = await fromPath('./test/test-temp.ostrich', { readOnly: false });
          count = await document.append(triplesActual);
        });

        afterEach(async() => {
          // We completely remove the store
          await document.close(true);
        });

        it('should have inserted 3 triples', () => {
          expect(count).toEqual(3);
        });

        it('should have 3 triples for version 0', async() => {
          const { triples, totalCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 0 });

          expect(triples).toHaveLength(3);
          expect(triples[0]).toEqual(_.omit(triplesActual[0], [ 'addition' ]));
          expect(triples[1]).toEqual(_.omit(triplesActual[1], [ 'addition' ]));
          expect(triples[2]).toEqual(_.omit(triplesActual[2], [ 'addition' ]));
          expect(totalCount).toEqual(3);
        });
      });

      describe('with 3 triples for the last version (sorted)', () => {
        let document: OstrichStore;
        let count: number;
        const triplesActual = [
          quadDelta(quad('a', 'a', 'a'), true),
          quadDelta(quad('a', 'a', 'b'), true),
          quadDelta(quad('a', 'a', 'c'), true),
        ];

        beforeEach(async() => {
          document = await fromPath('./test/test-temp.ostrich', { readOnly: false });
          count = await document.appendSorted(triplesActual);
        });

        afterEach(async() => {
          // We completely remove the store
          await document.close(true);
        });

        it('should have inserted 3 triples', () => {
          expect(count).toEqual(3);
        });

        it('should have 3 triples for version 0', async() => {
          const { triples, totalCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 0 });

          expect(triples).toHaveLength(3);
          expect(triples[0]).toEqual(_.omit(triplesActual[0], [ 'addition' ]));
          expect(triples[1]).toEqual(_.omit(triplesActual[1], [ 'addition' ]));
          expect(triples[2]).toEqual(_.omit(triplesActual[2], [ 'addition' ]));
          expect(totalCount).toEqual(3);
        });
      });

      describe('with 4 triples for version 0, including deletions', () => {
        let document: OstrichStore;
        const triplesActual = [
          quadDelta(quad('a', 'a', 'a'), false),
          quadDelta(quad('a', 'a', 'b'), false),
          quadDelta(quad('a', 'a', 'd'), true),
          quadDelta(quad('a', 'a', 'e'), true),
        ];

        beforeEach(async() => {
          document = await fromPath('./test/test-temp.ostrich');
        });

        afterEach(async() => {
          // We completely remove the store
          await document.close(true);
        });

        it('should throw an error', async() => {
          await expect(document.append(triplesActual, 0))
            .rejects.toThrow('All triples of the initial snapshot MUST be additions, but a deletion was found.');
        });
      });

      describe('with 3 triples for version 0 and 4 triples for version 1', () => {
        let document: OstrichStore;
        let count = 0;
        const triples0 = [
          quadDelta(quad('a', 'a', 'a'), true),
          quadDelta(quad('a', 'a', 'b'), true),
          quadDelta(quad('a', 'a', 'c'), true),
        ];
        const triples1 = [
          quadDelta(quad('a', 'a', 'a'), false),
          quadDelta(quad('a', 'a', 'b'), false),
          quadDelta(quad('a', 'a', 'd'), true),
          quadDelta(quad('a', 'a', 'e'), true),
        ];

        beforeEach(async() => {
          document = await fromPath('./test/test-temp.ostrich', { readOnly: false });
          count += await document.append(triples0, 0);
          count += await document.append(triples1, 1);
        });

        afterEach(async() => {
          // We completely remove the store
          await document.close(true);
        });

        it('should have inserted 7 triples', () => {
          expect(count).toEqual(7);
        });

        it('should have 3 triples for version 0', async() => {
          const { triples, totalCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 0 });

          expect(triples).toHaveLength(3);
          expect(triples[0]).toEqual(_.omit(triples0[0], [ 'addition' ]));
          expect(triples[1]).toEqual(_.omit(triples0[1], [ 'addition' ]));
          expect(triples[2]).toEqual(_.omit(triples0[2], [ 'addition' ]));
          expect(totalCount).toEqual(3);
        });

        it('should have 3 triples for version 1', async() => {
          const { triples, totalCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 1 });

          expect(triples).toHaveLength(3);
          expect(triples[0]).toEqual(_.omit(triples0[2], [ 'addition' ]));
          expect(triples[1]).toEqual(_.omit(triples1[2], [ 'addition' ]));
          expect(triples[2]).toEqual(_.omit(triples1[3], [ 'addition' ]));
          expect(totalCount).toEqual(3);
        });
      });

      describe('with 3 triples for a version and 4 triples for a next version', () => {
        let document: OstrichStore;
        let count = 0;
        const triples0 = [
          quadDelta(quad('a', 'a', 'a'), true),
          quadDelta(quad('a', 'a', 'b'), true),
          quadDelta(quad('a', 'a', 'c'), true),
        ];
        const triples1 = [
          quadDelta(quad('a', 'a', 'a'), false),
          quadDelta(quad('a', 'a', 'b'), false),
          quadDelta(quad('a', 'a', 'd'), true),
          quadDelta(quad('a', 'a', 'e'), true),
        ];

        beforeEach(async() => {
          document = await fromPath('./test/test-temp.ostrich', { readOnly: false });
          count += await document.append(triples0);
          count += await document.append(triples1);
        });

        afterEach(async() => {
          // We completely remove the store
          await document.close(true);
        });

        it('should have inserted 7 triples', () => {
          expect(count).toEqual(7);
        });

        it('should have 3 triples for version 0', async() => {
          const { triples, totalCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 0 });

          expect(triples).toHaveLength(3);
          expect(triples[0]).toEqual(_.omit(triples0[0], [ 'addition' ]));
          expect(triples[1]).toEqual(_.omit(triples0[1], [ 'addition' ]));
          expect(triples[2]).toEqual(_.omit(triples0[2], [ 'addition' ]));
          expect(totalCount).toEqual(3);
        });

        it('should have 3 triples for version 1', async() => {
          const { triples, totalCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 1 });

          expect(triples).toHaveLength(3);
          expect(triples[0]).toEqual(_.omit(triples0[2], [ 'addition' ]));
          expect(triples[1]).toEqual(_.omit(triples1[2], [ 'addition' ]));
          expect(triples[2]).toEqual(_.omit(triples1[3], [ 'addition' ]));
          expect(totalCount).toEqual(3);
        });
      });

      describe('with 3 non-sorted triples for version 0 and 4 triples for version 1', () => {
        let document: OstrichStore;
        let count = 0;
        const triples0 = [
          quadDelta(quad('a', 'a', 'c'), true),
          quadDelta(quad('a', 'a', 'a'), true),
          quadDelta(quad('a', 'a', 'b'), true),
        ];
        const triples1 = [
          quadDelta(quad('a', 'a', 'e'), true),
          quadDelta(quad('a', 'a', 'a'), false),
          quadDelta(quad('a', 'a', 'd'), true),
          quadDelta(quad('a', 'a', 'b'), false),
        ];

        beforeEach(async() => {
          document = await fromPath('./test/test-temp.ostrich', { readOnly: false });
          count += await document.append(triples0, 0);
          count += await document.append(triples1, 1);
        });

        afterEach(async() => {
          // We completely remove the store
          await document.close(true);
        });

        it('should have inserted 7 triples', () => {
          expect(count).toEqual(7);
        });

        it('should have 3 triples for version 0', async() => {
          const { triples, totalCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 0 });

          expect(triples).toHaveLength(3);
          expect(triples[0]).toEqual(_.omit(triples0[0], [ 'addition' ]));
          expect(triples[1]).toEqual(_.omit(triples0[1], [ 'addition' ]));
          expect(triples[2]).toEqual(_.omit(triples0[2], [ 'addition' ]));
          expect(totalCount).toEqual(3);
        });

        it('should have 3 triples for version 1', async() => {
          const { triples, totalCount } = await document
            .searchTriplesVersionMaterialized(null, null, null, { version: 1 });

          expect(triples).toHaveLength(3);
          expect(triples[0]).toEqual(_.omit(triples0[2], [ 'addition' ]));
          expect(triples[1]).toEqual(_.omit(triples1[2], [ 'addition' ]));
          expect(triples[2]).toEqual(_.omit(triples1[3], [ 'addition' ]));
          expect(totalCount).toEqual(3);
        });
      });

      describe('with 3 triples for 10 versions', () => {
        let document: OstrichStore;
        let count = 0;

        beforeEach(async() => {
          document = await fromPath('./test/test-temp.ostrich', { readOnly: false });
        });

        afterEach(async() => {
          // We completely remove the store
          await document.close(true);
        });

        it('should have inserted 33 triples', async() => {
          for (let v = 0; v < 10; v++) {
            const triples = [
              quadDelta(quad('a', 'a', `a${v}`), true),
              quadDelta(quad('a', 'a', `b${v}`), true),
              quadDelta(quad('a', 'a', `c${v}`), true),
            ];
            count += await document.append(triples, v);
          }
          expect(count).toEqual(30);
        });
      });
    });
  });
});
