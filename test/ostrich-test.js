require('should');

var ostrich = require('../lib/ostrich');

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

    describe('without self value', function () {
      it('should invoke the callback with `global` as `this`', function (done) {
        ostrich.fromPath('./test/test.ostrich', function (error, ostrichStore) {
          this.should.equal(global);
          ostrichStore.close();
          done(error);
        });
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
  });

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

      it('should support searchTriplesVersionMaterialized', function () {
        document.features.searchTriplesVersionMaterialized.should.be.true;
      });

      it('should support countTriples', function () {
        document.features.countTriples.should.be.true;
      });

      /* it('should not support searchLiterals', function () {
        document.features.searchLiterals.should.be.false;
      });*/
    });

    describe('being searched', function () {
      describe('without self value', function () {
        it('should invoke the callback with the ostrich document as `this`', function (done) {
          document.searchTriplesVersionMaterialized('a', 'b', 'c', function (error) {
            this.should.equal(document);
            done(error);
          });
        });
      });

      describe('with a self value', function () {
        var self = {};
        it('should invoke the callback with that value as `this`', function (done) {
          document.searchTriplesVersionMaterialized('a', 'b', 'c', function (error) {
            this.should.equal(self);
            done(error);
          }, self);
        });
      });

      describe('with a non-existing pattern', function () {
        var triples, totalCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('1', null, null,
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
          document.searchTriplesVersionMaterialized(null, null, null,
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
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

      describe('with pattern null null null, offset 0 and limit 5', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { offset: 0, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
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

      describe('with pattern null null null, offset 2 and limit 5', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { offset: 2, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
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

      describe('with pattern null null null, offset 10 and limit 5', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { offset: 10, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
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

      describe('with pattern f null null', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('f', null, null,
                          function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
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

      describe('with pattern c null null, offset 0 and limit 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('c', null, null, { offset: 0, limit: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
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

      describe('with pattern c null null, offset 10 and limit 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized('c', null, null, { offset: 10, limit: 1 },
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
          document.searchTriplesVersionMaterialized('a', '?p', '?o',
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
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

      describe('with pattern null b null', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, 'b', null,
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          console.log(triples); // TODO
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

      describe('with pattern null ex:p3 null', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, 'http://example.org/p3', null,
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
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

      describe('with pattern null null "a"^^http://example.org/literal', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, '"a"^^http://example.org/literal',
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
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

      describe('with pattern null null f', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesVersionMaterialized(null, null, 'f',
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
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
    });

    describe('being counted', function () {
      describe('without self value', function () {
        it('should invoke the callback with the ostrich document as `this`', function (done) {
          document.countTriples('a', 'b', 'c', function (error) {
            this.should.equal(document);
            done(error);
          });
        });
      });

      describe('with a self value', function () {
        var self = {};
        it('should invoke the callback with that value as `this`', function (done) {
          document.countTriples('a', 'b', 'c', function (error) {
            this.should.equal(self);
            done(error);
          }, self);
        });
      });

      describe('with a non-existing pattern', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriples('q', null, null,
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
          document.countTriples(null, null, null,
                                function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 9', function () {
          totalCount.should.equal(9);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern a null null', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriples('a', null, null,
                                function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 6', function () {
          totalCount.should.equal(6);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null b null', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriples(null, 'b', null,
                                function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 4', function () {
          totalCount.should.equal(4);
        });

        it('should be an exact count', function () {
          hasExactCount.should.equal(true);
        });
      });

      describe('with pattern null ex:p3 null', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriples(null, 'http://example.org/p3', null,
                                function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        it('should not be an exact count', function () {
          hasExactCount.should.equal(false);
        });
      });

      describe('with pattern null null f', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriples(null, null, 'f',
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
          document.countTriples(null, null, '"a"^^http://example.org/literal',
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
