require('should');

// var ostrich = require('../lib/ostrich');
const prepare = require('./prepare-ostrich');

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

describe('version materialization', function () {
  describe('An ostrich store for an example ostrich path', function () {
    var document;
    before(function (done) {
      prepare.cleanUp();
      prepare.initializeThreeVersions().then((ostrichStore) => {
        document = ostrichStore;
        done();
      }, done);
    });
    after(function (done) {
      prepare.closeAndCleanUp(document).then(done);
    });

    describe('asked for supported features', function () {
      it('should return an object', function () {
        document.features.should.be.an.instanceof(Object);
      });

      it('should support searchTriplesVersionMaterialized', function () {
        document.features.searchTriplesVersionMaterialized.should.be.true;
      });

      it('should support countTriplesVersionMaterialized', function () {
        document.features.countTriplesVersionMaterialized.should.be.true;
      });

      /* it('should not support searchLiterals', function () {
       document.features.searchLiterals.should.be.false;
       });*/
    });

    describe('being searched', function () {
      // describe('without self value', function () {
      //   it('should invoke the callback with the ostrich document as `this`', function (done) {
      //     document.searchTriplesVersionMaterialized('a', 'b', 'c', function (error) {
      //       this.should.equal(document);
      //       done(error);
      //     });
      //   });
      // });

      // describe('with a self value', function () {
      //   var self = {};
      //   it('should invoke the callback with that value as `this`', function (done) {
      //     document.searchTriplesVersionMaterialized('a', 'b', 'c', function (error) {
      //       this.should.equal(self);
      //       done(error);
      //     }, self);
      //   });
      // });

      describe('with a non-existing pattern at the latest version', function () {
        var triples, totalCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('1', null, null)
            .then(([t, tc]) => {
              triples = t;
              totalCount = tc;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 0', function () {
          totalCount.should.equal(0);
        });
      });

      describe('with a non-existing pattern at version 0', function () {
        var triples, totalCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('1', null, null, { version: 0 })
            .then(([t, tc]) => {
              triples = t;
              totalCount = tc;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 0', function () {
          totalCount.should.equal(0);
        });
      });

      describe('with a non-existing pattern at version 1', function () {
        var triples, totalCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('1', null, null, { version: 1 })
            .then(([t, tc]) => {
              triples = t;
              totalCount = tc;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 0', function () {
          totalCount.should.equal(0);
        });
      });

      describe('with pattern null null null at the latest version', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null)
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(10);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal' });
        });

        it('should estimate the total count as 10', function () {
          totalCount.should.equal(10);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null at version 0', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { version: 0 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(8);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal' });
        });

        it('should estimate the total count as 8', function () {
          totalCount.should.equal(8);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null at version 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { version: 1 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(9);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal' });
        });

        it('should estimate the total count as 9', function () {
          totalCount.should.equal(9);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5 at the latest version', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { offset: 0, limit: 5 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal' });
        });

        it('should estimate the total count as 10', function () {
          totalCount.should.equal(10);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5 at version 0', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { version:0, offset: 0, limit: 5 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal' });
        });

        it('should estimate the total count as 8', function () {
          totalCount.should.equal(8);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5 at version 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { version: 1, offset: 0, limit: 5 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal' });
        });

        it('should estimate the total count as 9', function () {
          totalCount.should.equal(9);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5 at the latest version', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { offset: 2, limit: 5 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'd' });
        });

        it('should estimate the total count as 10', function () {
          totalCount.should.equal(10);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5 at version 0', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { version: 0, offset: 2, limit: 5 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a' });
        });

        it('should estimate the total count as 8', function () {
          totalCount.should.equal(8);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5 at version 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { version: 1, offset: 2, limit: 5 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'd' });
        });

        it('should estimate the total count as 9', function () {
          totalCount.should.equal(9);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null, offset 10 and limit 5 at the latest version', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { offset: 10, limit: 5 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 10', function () {
          totalCount.should.equal(10);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null, offset 10 and limit 5 at version 0', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { version: 0, offset: 10, limit: 5 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 8', function () {
          totalCount.should.equal(8);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null, offset 10 and limit 5 at version 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { version: 1, offset: 10, limit: 5 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 9', function () {
          totalCount.should.equal(9);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern f null null at the latest version', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('f', null, null)
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'f',
            predicate: 'r',
            object:    's' });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern f null null at version 0', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('f', null, null, { version: 0 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with no matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(0);
        });

        it('should estimate the total count as 0', function () {
          totalCount.should.equal(0);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern f null null at version 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('f', null, null, { version: 1 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'f',
            predicate: 'f',
            object:    'f' });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern c null null, offset 0 and limit 1 at the latest version', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('c', null, null, { offset: 0, limit: 1 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'c',
            predicate: 'c',
            object:    'c' });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern c null null, offset 0 and limit 1 at version 0', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('c', null, null, { version: 0, offset: 0, limit: 1 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'c',
            predicate: 'c',
            object:    'c' });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern c null null, offset 0 and limit 1 at version 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('c', null, null, { version: 1, offset: 0, limit: 1 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'c',
            predicate: 'c',
            object:    'c' });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern c null null, offset 10 and limit 1 at the latest version', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('c', null, null, { offset: 10, limit: 1 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern c null null, offset 10 and limit 1 at version 0', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('c', null, null, { version: 0, offset: 10, limit: 1 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern c null null, offset 10 and limit 1 at version 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('c', null, null, { version: 1, offset: 10, limit: 1 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern a ?p ?o at the latest version', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('a', '?p', '?o')
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal' });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'c' });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'd' });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'f' });
          triples[4].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g' });
        });

        it('should estimate the total count as 5', function () {
          totalCount.should.equal(5);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern a ?p ?o at version 0', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('a', '?p', '?o', { version: 0 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(7);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal' });
          triples[1].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"b"^^http://example.org/literal' });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a' });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'c' });
          triples[4].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'd' });
          triples[5].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'f' });
          triples[6].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z' });
        });

        it('should estimate the total count as 7', function () {
          totalCount.should.equal(7);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern a ?p ?o at version 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('a', '?p', '?o', { version: 1 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(6);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal' });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'c' });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'd' });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'f' });
          triples[4].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"z"^^http://example.org/literal' });
          triples[5].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g' });
        });

        it('should estimate the total count as 6', function () {
          totalCount.should.equal(6);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null b null at the latest version', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, 'b', null)
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(4);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'c' });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'd' });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'f' });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g' });
        });

        it('should estimate the total count as 4', function () {
          totalCount.should.equal(4);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null b null at version 0', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, 'b', null, { version: 0 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a' });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'c' });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'd' });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'f' });
          triples[4].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z' });
        });

        it('should estimate the total count as 5', function () {
          totalCount.should.equal(5);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null b null at version 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, 'b', null, { version: 1 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(4);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'c' });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'd' });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'f' });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g' });
        });

        it('should estimate the total count as 4', function () {
          totalCount.should.equal(4);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null ex:p3 null at the latest version', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, 'http://example.org/p3', null)
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with no matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(0);
        });

        it('should estimate the total count as 0', function () {
          totalCount.should.equal(0);
        });

        it('should be not an exact count', function () {
          hasExactCount.should.equal(false);
        });
      });

      describe('with pattern null ex:p3 null at version 0', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, 'http://example.org/p3', null, { version: 0 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with no matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(0);
        });

        it('should estimate the total count as 0', function () {
          totalCount.should.equal(0);
        });

        it('should be not an exact count', function () {
          hasExactCount.should.equal(false);
        });
      });

      describe('with pattern null ex:p3 null at version 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, 'http://example.org/p3', null, { version: 1 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with no matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(0);
        });

        it('should estimate the total count as 0', function () {
          totalCount.should.equal(0);
        });

        it('should be not an exact count', function () {
          hasExactCount.should.equal(false);
        });
      });

      describe('with pattern null null "a"^^http://example.org/literal at the latest version', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, '"a"^^http://example.org/literal')
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal' });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null "a"^^http://example.org/literal at version 0', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, '"a"^^http://example.org/literal', { version: 0 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal' });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null "a"^^http://example.org/literal at version 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, '"a"^^http://example.org/literal', { version: 1 })
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal' });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null f at the latest version', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, 'f')
            .then(([t, tc, e]) => {
              triples = t;
              totalCount = tc;
              hasExactCount = e;
              done();
            }).catch((error) => {
              done(error);
            });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'f' });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });
    });

    describe('with pattern null null f at version 0', function () {
      var triples, totalCount, hasExactCount;
      before(function (done) {
        document.searchTriplesVersionMaterialized(null, null, 'f', { version: 0 })
          .then(([t, tc, e]) => {
            triples = t;
            totalCount = tc;
            hasExactCount = e;
            done();
          }).catch((error) => {
            done(error);
          });
      });

      it('should return an array with matches', function () {
        triples.should.be.an.Array;
        triples.should.have.lengthOf(1);
        triples[0].should.eql({ subject:   'a',
          predicate: 'b',
          object:    'f' });
      });

      it('should estimate the total count as 1', function () {
        totalCount.should.equal(1);
      });

      it('should be an exact count', function () {
        hasExactCount.should.equal(true);
      });
    });

    describe('with pattern null null f at version 1', function () {
      var triples, totalCount, hasExactCount;
      before(function (done) {
        document.searchTriplesVersionMaterialized(null, null, 'f', { version: 1 })
          .then(([t, tc, e]) => {
            triples = t;
            totalCount = tc;
            hasExactCount = e;
            done();
          }).catch((error) => {
            done(error);
          });
      });

      it('should return an array with matches', function () {
        triples.should.be.an.Array;
        triples.should.have.lengthOf(2);
        triples[0].should.eql({ subject:   'a',
          predicate: 'b',
          object:    'f' });
        triples[1].should.eql({ subject:   'f',
          predicate: 'f',
          object:    'f' });
      });

      it('should estimate the total count as 2', function () {
        totalCount.should.equal(2);
      });

      it('should be an exact count', function () {
        hasExactCount.should.equal(true);
      });
    });

    describe('being counted', function () {
      describe('without self value', function () {
        it('should invoke the callback with the ostrich document as `this`', function (done) {
          document.countTriplesVersionMaterialized('a', 'b', 'c', function (error) {
            this.should.equal(document);
            done(error);
          });
        });
      });

      describe('with a self value', function () {
        var self = {};
        it('should invoke the callback with that value as `this`', function (done) {
          document.countTriplesVersionMaterialized('a', 'b', 'c', function (error) {
            this.should.equal(self);
            done(error);
          }, self);
        });
      });

      describe('with a non-existing pattern at the latest version', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized('1', null, null,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with a non-existing pattern at version 0', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized('q', null, null, 0,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with a non-existing pattern at version 1', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized('q', null, null, 1,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null at the latest version', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized(null, null, null,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 10', function () {
          totalCount.should.equal(10);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null at version 0', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized(null, null, null, 0,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 8', function () {
          totalCount.should.equal(8);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null at version 1', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized(null, null, null, 1,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 9', function () {
          totalCount.should.equal(9);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern a null null at the latest version', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized('a', null, null,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 5', function () {
          totalCount.should.equal(5);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern a null null at version 0', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized('a', null, null, 0,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 7', function () {
          totalCount.should.equal(7);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern a null null at version 1', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized('a', null, null, 1,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 6', function () {
          totalCount.should.equal(6);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null b null at the latest version', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized(null, 'b', null,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 4', function () {
          totalCount.should.equal(4);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null b null at version 0', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized(null, 'b', null, 0,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 5', function () {
          totalCount.should.equal(5);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null b null at version 1', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized(null, 'b', null, 1,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 4', function () {
          totalCount.should.equal(4);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null ex:p3 null at the latest version', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized(null, 'http://example.org/p3', null,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        it('should not be an exact count', function () {
          hasExactCount.should.equal(false);
        });
      });

      describe('with pattern null ex:p3 null at version 0', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized(null, 'http://example.org/p3', null, 0,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        it('should not be an exact count', function () {
          hasExactCount.should.equal(false);
        });
      });

      describe('with pattern null ex:p3 null at version 1', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized(null, 'http://example.org/p3', null, 1,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        it('should not be an exact count', function () {
          hasExactCount.should.equal(false);
        });
      });

      describe('with pattern null null f at the latest version', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized(null, null, 'f',
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null f at version 0', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized(null, null, 'f', 0,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null f at version 1', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized(null, null, 'f', 1,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 2', function () {
          totalCount.should.equal(2);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null "a"^^http://example.org/literal', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersionMaterialized(null, null, '"a"^^http://example.org/literal',
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });
    });

    describe('being closed', function () {
      var self = {}, callbackThis, callbackArgs;
      before(function (done) {
        document.close(function (error) {
          callbackThis = this, callbackArgs = arguments;
          done(error);
        }, self);
      });

      it('should not pass an error through the callback', function () {
        callbackArgs.should.have.length(1);
        callbackArgs.should.have.property(0, null);
      });

      it('should invoke the callback with the second argument as `this`', function () {
        callbackThis.should.equal(self);
      });
    });
  });
});
