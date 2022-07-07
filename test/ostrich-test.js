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
        var self = {};
        ostrich.fromPath(null, function (error) {
          this.should.equal(self);
          error.should.be.an.Error;
          error.message.should.equal('Invalid path: null');
          done();
        }, self);
      });
    });

    describe('with a non-ostrich file as argument', function () {
      it('should throw an error', function (done) {
        var self = {};
        ostrich.fromPath('./test/ostrich-test.js', function (error) {
          this.should.equal(self);
          error.should.be.an.Error;
          error.message.should.equal('The provided path \'./test/ostrich-test.js/\' is not a valid directory.');
          done();
        }, self);
      });
    });

    describe('with a self value', function () {
      it('should invoke the callback with that value as `this`', function (done) {
        var self = {};
        ostrich.fromPath('./test/test.ostrich', function (error, ostrichStore) {
          this.should.equal(self);
          ostrichStore.close();
          done(error);
        }, self);
      });
    });

    describe('with a self value', function () {
      before(function (done) {
        prepare.cleanUp();
        prepare.initializeThreeVersions().then((ostrichStore) => {
          ostrichStore.close();
          done();
        });
      });
      after(function (done) {
        prepare.cleanUp();
        done();
      });
      it('should invoke the callback with that value as `this`', function (done) {
        var self = {};
        ostrich.fromPath('./test/test.ostrich', function (error, ostrichStore) {
          var maxVersion = ostrichStore.maxVersion;
          maxVersion.should.equal(2);
          ostrichStore.close();
          done(error);
        }, self);
      });
    });
  });
});
