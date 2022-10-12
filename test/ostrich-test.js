require('should');

var ostrich = require('../lib/ostrich');
const prepare = require('./prepare-ostrich');


describe('ostrich', function () {
  describe('The ostrich module', function () {
    it('should be an object', function () {
      ostrich.should.be.an.Object;
    });
  });

  describe('creating a new ostrich document with fromPath', function () {
    describe('with a non-string argument', function () {
      it('should throw an error', function (done) {
        ostrich.fromPath(null)
          .then(() => done(new Error('An error should be thrown')))
          .catch(error => {
            error.should.be.an.Error;
            error.message.should.equal('Invalid path: null');
            done();
          });
      });
    });

    describe('with a non-ostrich file as argument', function () {
      it('should throw an error', function (done) {
        ostrich.fromPath('./test/ostrich-test.js')
          .then(() => done(new Error('An error should be thrown')))
          .catch(error => {
            error.should.be.an.Error;
            error.message.should.equal('ENOTDIR: not a directory, mkdir \'./test/ostrich-test.js/\'');
            done();
          })
          .catch(done);
      });
    });

    describe('with a valid file', function () {
      it('should be closeable', function (done) {
        ostrich.fromPath('./test/test.ostrich')
          .then((ostrichStore) => {
            return ostrichStore.close()
              .then(done)
              .catch(done);
          })
          .catch(done);
      });
    });

    describe('with 3 versions', function () {
      before(function (done) {
        prepare.cleanUp();
        prepare.initializeThreeVersions()
          .then(ostrichStore => ostrichStore.close())
          .then(done)
          .catch(done);
      });
      after(function (done) {
        prepare.cleanUp();
        done();
      });
      it('should invoke the callback with that value as `this`', function (done) {
        ostrich.fromPath('./test/test.ostrich')
          .then(ostrichStore => {
            var maxVersion = ostrichStore.maxVersion;
            maxVersion.should.equal(2);
            ostrichStore.close();
            done();
          })
          .catch(done);
      });
    });
  });
});
