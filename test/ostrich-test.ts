import 'jest-rdf';
import type { OstrichStore } from '../lib/ostrich';
import { fromPath } from '../lib/ostrich';
import { cleanUp, initializeThreeVersions } from './prepare-ostrich';

const ostrichNative = require('../build/Release/ostrich.node');

describe('ostrich', () => {
  describe('creating a new ostrich document with fromPath', () => {
    describe('with a non-string argument', () => {
      it('should throw an error', async() => {
        await expect(fromPath(<any>null))
          .rejects.toThrow('Invalid path: null');
      });
    });

    describe('with a non-ostrich file as argument', () => {
      it('should throw an error', async() => {
        await expect(fromPath('./test/ostrich-test.ts'))
          .rejects.toThrow('Unable to create new OSTRICH store at \'./test/ostrich-test.ts/\'');
      });
    });

    describe('with an internal error', () => {
      it('should throw an error', async() => {
        const mock = jest
          .spyOn(ostrichNative, 'createOstrichStore')
          .mockImplementation((
            path,
            readOnly,
            strategyName,
            strategyParameter,
            cb: any,
          ) => cb(new Error('Internal error')));

        await expect(fromPath('./test/test-main.ostrich'))
          .rejects.toThrow('Internal error');

        mock.mockRestore();
      });

      it('should throw an error when closing', async() => {
        const document = await fromPath('./test/test-main.ostrich');

        const mock = jest
          .spyOn((<any> document), '_closeInternal')
          .mockImplementation((
            remove,
            cb: any,
          ) => cb(new Error('Internal error')));

        await expect(document.close())
          .rejects.toThrow('Internal error');

        mock.mockRestore();
      });
    });

    describe('with a valid file', () => {
      it('should be closeable', async() => {
        const ostrichStore = await fromPath('./test/test-main.ostrich');
        await ostrichStore.close();
      });
    });

    describe('with 3 versions', () => {
      beforeEach(async() => {
        cleanUp('main');
        const ostrichStore = await initializeThreeVersions('main');
        await ostrichStore.close();
      });
      afterEach(() => {
        cleanUp('main');
      });
      it('should invoke the callback with that value as `this`', async() => {
        const ostrichStore = await fromPath('./test/test-main.ostrich');
        expect(ostrichStore.maxVersion).toEqual(2);
        await ostrichStore.close();
      });
    });

    describe('with parallel operations', () => {
      let document: OstrichStore;
      let lastCb: any;
      beforeAll(async() => {
        cleanUp('main');
        document = await initializeThreeVersions('main');

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
          ) => lastCb = cb);
      });
      afterAll(() => {
        cleanUp('main');
      });

      let vmQueryPromise: Promise<any>;
      it('starts a long-running VM query', async() => {
        vmQueryPromise = document.searchTriplesVersionMaterialized(null, null, null);

        await new Promise(setImmediate);

        expect(document._operations).toEqual(1);
        expect(document._isClosingCallbacks).toBeUndefined();
      });

      let closePromise1: Promise<any>;
      it('does not close the store immediately', async() => {
        closePromise1 = document.close();

        await new Promise(setImmediate);

        expect(document._operations).toEqual(1);
        expect(document._isClosingCallbacks).toHaveLength(1);
      });

      let closePromise2: Promise<any>;
      it('does not close the store immediately on a second call', async() => {
        closePromise2 = document.close();

        await new Promise(setImmediate);

        expect(document._operations).toEqual(1);
        expect(document._isClosingCallbacks).toHaveLength(2);
      });

      it('finish closing when the query ends', async() => {
        lastCb();

        await expect(vmQueryPromise).resolves.toBeTruthy();
        await expect(closePromise1).resolves.toBeUndefined();
        await expect(closePromise2).resolves.toBeUndefined();

        expect(document._operations).toEqual(0);
        expect(document._isClosingCallbacks).toBeUndefined();
      });
    });
  });
});
