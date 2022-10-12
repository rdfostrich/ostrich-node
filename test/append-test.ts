import 'jest-rdf';
import type { OstrichStore } from '../lib/ostrich';
import { fromPath } from '../lib/ostrich';
const _ = require('lodash');

describe('append', () => {
  describe('An ostrich store for an example ostrich path', () => {
    describe('being appended', () => {
      describe('with 3 triples for version 0', () => {
        let document: OstrichStore;
        let count: number;
        const triplesActual = [
          { subject: 'a', predicate: 'a', object: 'a', addition: true },
          { subject: 'a', predicate: 'a', object: 'b', addition: true },
          { subject: 'a', predicate: 'a', object: 'c', addition: true },
        ];

        beforeEach(async() => {
          document = await fromPath('./test/test-temp.ostrich', false);
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

      describe('with 4 triples for version 0, including deletions', () => {
        let document: OstrichStore;
        const triplesActual = [
          { subject: 'a', predicate: 'a', object: 'a', addition: false },
          { subject: 'a', predicate: 'a', object: 'b', addition: false },
          { subject: 'a', predicate: 'a', object: 'd', addition: true },
          { subject: 'a', predicate: 'a', object: 'e', addition: true },
        ];

        beforeEach(async() => {
          document = await fromPath('./test/test-temp.ostrich', false);
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
          { subject: 'a', predicate: 'a', object: 'a', addition: true },
          { subject: 'a', predicate: 'a', object: 'b', addition: true },
          { subject: 'a', predicate: 'a', object: 'c', addition: true },
        ];
        const triples1 = [
          { subject: 'a', predicate: 'a', object: 'a', addition: false },
          { subject: 'a', predicate: 'a', object: 'b', addition: false },
          { subject: 'a', predicate: 'a', object: 'd', addition: true },
          { subject: 'a', predicate: 'a', object: 'e', addition: true },
        ];

        beforeEach(async() => {
          document = await fromPath('./test/test-temp.ostrich', false);
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

      describe('with 3 non-sorted triples for version 0 and 4 triples for version 1', () => {
        let document: OstrichStore;
        let count = 0;
        const triples0 = [
          { subject: 'a', predicate: 'a', object: 'c', addition: true },
          { subject: 'a', predicate: 'a', object: 'a', addition: true },
          { subject: 'a', predicate: 'a', object: 'b', addition: true },
        ];
        const triples1 = [
          { subject: 'a', predicate: 'a', object: 'e', addition: true },
          { subject: 'a', predicate: 'a', object: 'a', addition: false },
          { subject: 'a', predicate: 'a', object: 'd', addition: true },
          { subject: 'a', predicate: 'a', object: 'b', addition: false },
        ];

        beforeEach(async() => {
          document = await fromPath('./test/test-temp.ostrich', false);
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
          document = await fromPath('./test/test-temp.ostrich', false);
        });

        afterEach(async() => {
          // We completely remove the store
          await document.close(true);
        });

        it('should have inserted 33 triples', async() => {
          for (let v = 0; v < 10; v++) {
            const triples = [
              { subject: 'a', predicate: 'a', object: `a${v}`, addition: true },
              { subject: 'a', predicate: 'a', object: `b${v}`, addition: true },
              { subject: 'a', predicate: 'a', object: `c${v}`, addition: true },
            ];
            count += await document.append(triples, v);
          }
          expect(count).toEqual(30);
        });
      });
    });
  });
});
