require('should');

var ostrich = require('../lib/ostrich');

/*
 <a> <a> "a"^^<http://example.org/literal> . [0, 1, 2]
 <a> <a> "b"^^<http://example.org/literal> . [0]
 <a> <b> <a> .                               [0]
 <a> <b> <c> .                               [0, 1, 2]
 <a> <b> <d> .                               [0, 1, 2]
 <a> <b> <f> .                               [0, 1, 2]
 <a> <b> <z> .                               [0]
 <c> <c> <c> .                               [0, 1, 2]
 <a> <a> "z"^^<http://example.org/literal> . [1]
 <a> <b> <g> .                               [1, 2]
 <f> <f> <f> .                               [1]
 <f> <r> <s> .                               [2]
 <q> <q> <q> .                               [2]
 <r> <r> <r> .                               [2]
 <z> <z> <z> .                               [1, 2]
 */

describe('version', function () {
  describe('An ostrich store for an example ostrich path', function () {
    var document;
    before(function (done) {
      ostrich.fromPath('./test/test.ostrich', function (error, ostrichStore) {
        document = ostrichStore;
        done(error);
      });
    });
    after(function (done) {
      document.close(done);
    });

    describe('asked for supported features', function () {
      it('should return an object', function () {
        document.features.should.be.an.instanceof(Object);
      });

      it('should support searchTriplesVersion', function () {
        document.features.searchTriplesVersion.should.be.true;
      });

      it('should support countTriplesVersion', function () {
        document.features.countTriplesVersion.should.be.true;
      });

      /* it('should not support searchLiterals', function () {
       document.features.searchLiterals.should.be.false;
       });*/
    });

    describe('being searched', function () {
      describe('without self value', function () {
        it('should invoke the callback with the ostrich document as `this`', function (done) {
          document.searchTriplesVersion('a', 'b', 'c', function (error) {
            this.should.equal(document);
            done(error);
          });
        });
      });

      describe('with a self value', function () {
        var self = {};
        it('should invoke the callback with that value as `this`', function (done) {
          document.searchTriplesVersion('a', 'b', 'c', function (error) {
            this.should.equal(self);
            done(error);
          }, self);
        });
      });

      describe('with a non-existing pattern', function () {
        var triples, totalCount;
        before(function (done) {
          document.searchTriplesVersion('1', null, null,
            function (error, t, c) { triples = t; totalCount = c; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 0', function () {
          totalCount.should.equal(0);
        });
      });

      describe('with pattern null null null', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersion(null, null, null,
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(15);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal',
            versions: [0, 1, 2] });
          triples[1].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"b"^^http://example.org/literal',
            versions: [0] });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            versions: [0] });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'c',
            versions: [0, 1, 2] });
          triples[4].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'd',
            versions: [0, 1, 2] });
          triples[5].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'f',
            versions: [0, 1, 2] });
          triples[6].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            versions: [0] });
          triples[7].should.eql({ subject:   'c',
            predicate: 'c',
            object:    'c',
            versions: [0, 1, 2] });
          triples[8].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"z"^^http://example.org/literal',
            versions: [1] });
          triples[9].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g',
            versions: [1, 2] });
          triples[10].should.eql({ subject:   'f',
            predicate: 'f',
            object:    'f',
            versions: [1] });
          triples[11].should.eql({ subject:   'f',
            predicate: 'r',
            object:    's',
            versions: [2] });
          triples[12].should.eql({ subject:   'q',
            predicate: 'q',
            object:    'q',
            versions: [2] });
          triples[13].should.eql({ subject:   'r',
            predicate: 'r',
            object:    'r',
            versions: [2] });
          triples[14].should.eql({ subject:   'z',
            predicate: 'z',
            object:    'z',
            versions: [1, 2] });
        });

        it('should estimate the total count as 15', function () {
          totalCount.should.equal(15);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null, offset 0 and limit 5', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersion(null, null, null, { offset: 0, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal',
            versions: [0, 1, 2] });
          triples[1].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"b"^^http://example.org/literal',
            versions: [0] });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            versions: [0] });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'c',
            versions: [0, 1, 2] });
          triples[4].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'd',
            versions: [0, 1, 2] });
        });

        it('should estimate the total count as 15', function () {
          totalCount.should.equal(15);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null, offset 2 and limit 5', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersion(null, null, null, { offset: 2, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            versions: [0] });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'c',
            versions: [0, 1, 2] });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'd',
            versions: [0, 1, 2] });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'f',
            versions: [0, 1, 2] });
          triples[4].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            versions: [0] });
        });

        it('should estimate the total count as 15', function () {
          totalCount.should.equal(15);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null, offset 20 and limit 5', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersion(null, null, null, { offset: 20, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 15', function () {
          totalCount.should.equal(15);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern f null null', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersion('f', null, null,
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(2);
          triples[0].should.eql({ subject:   'f',
            predicate: 'f',
            object:    'f',
            versions: [1] });
          triples[1].should.eql({ subject:   'f',
            predicate: 'r',
            object:    's',
            versions:  [2] });
        });

        it('should estimate the total count as 2', function () {
          totalCount.should.equal(2);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern c null null, offset 0 and limit 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersion('c', null, null, { offset: 0, limit: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'c',
            predicate: 'c',
            object:    'c',
            versions:  [0, 1, 2] });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern c null null, offset 10 and limit 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersion('c', null, null, { offset: 10, limit: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
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

      describe('with pattern a ?p ?o', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersion('a', '?p', '?o',
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(9);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal',
            versions: [0, 1, 2] });
          triples[1].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"b"^^http://example.org/literal',
            versions: [0] });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            versions: [0] });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'c',
            versions: [0, 1, 2] });
          triples[4].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'd',
            versions: [0, 1, 2] });
          triples[5].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'f',
            versions: [0, 1, 2] });
          triples[6].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            versions: [0] });
          triples[7].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"z"^^http://example.org/literal',
            versions: [1] });
          triples[8].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g',
            versions: [1, 2] });
        });

        it('should estimate the total count as 9', function () {
          totalCount.should.equal(9);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null b null', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersion(null, 'b', null,
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(6);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            versions: [0] });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'c',
            versions: [0, 1, 2] });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'd',
            versions: [0, 1, 2] });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'f',
            versions: [0, 1, 2] });
          triples[4].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            versions: [0] });
          triples[5].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g',
            versions: [1, 2] });
        });

        it('should estimate the total count as 6', function () {
          totalCount.should.equal(6);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null ex:p3 null', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersion(null, 'http://example.org/p3', null,
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
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

      describe('with pattern null null "a"^^http://example.org/literal', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersion(null, null, '"a"^^http://example.org/literal',
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"a"^^http://example.org/literal',
            versions:  [0, 1, 2] });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null f', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersion(null, null, 'f',
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(2);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'f',
            versions:  [0, 1, 2] });
          triples[1].should.eql({ subject:   'f',
            predicate: 'f',
            object:    'f',
            versions:  [1] });
        });

        it('should estimate the total count as 2', function () {
          totalCount.should.equal(2);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });
    });

    describe('being counted', function () {
      describe('without self value', function () {
        it('should invoke the callback with the ostrich document as `this`', function (done) {
          document.countTriplesVersion('a', 'b', 'c', function (error) {
            this.should.equal(document);
            done(error);
          });
        });
      });

      describe('with a self value', function () {
        var self = {};
        it('should invoke the callback with that value as `this`', function (done) {
          document.countTriplesVersion('a', 'b', 'c', function (error) {
            this.should.equal(self);
            done(error);
          }, self);
        });
      });

      describe('with a non-existing pattern', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersion('1', null, null,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null null', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersion(null, null, null,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 15', function () {
          totalCount.should.equal(15);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern a null null', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersion('a', null, null,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 9', function () {
          totalCount.should.equal(9);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null b null', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersion(null, 'b', null,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 6', function () {
          totalCount.should.equal(6);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null ex:p3 null', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersion(null, 'http://example.org/p3', null,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null null f', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesVersion(null, null, 'f',
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
          document.countTriplesVersion(null, null, '"a"^^http://example.org/literal',
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
