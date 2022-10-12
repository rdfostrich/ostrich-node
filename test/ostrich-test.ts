import 'jest-rdf';
import { fromPath } from '../lib/ostrich';
import { cleanUp, initializeThreeVersions } from './prepare-ostrich';

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
          .rejects.toThrow('ENOTDIR: not a directory, mkdir \'./test/ostrich-test.ts/\'');
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
  });
});
