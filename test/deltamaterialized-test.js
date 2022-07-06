require('should');

const prepare = require('./prepare-ostrich');

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

describe('delta materialization', function () {
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
      prepare.closeAndCleanUp(document);
    });

    describe('asked for supported features', function () {
      it('should return an object', function () {
        document.features.should.be.an.instanceof(Object);
      });

      it('should support searchTriplesDeltaMaterialized', function () {
        document.features.searchTriplesDeltaMaterialized.should.be.true;
      });

      it('should support countTriplesDeltaMaterialized', function () {
        document.features.countTriplesDeltaMaterialized.should.be.true;
      });

      /* it('should not support searchLiterals', function () {
       document.features.searchLiterals.should.be.false;
       });*/
    });

    describe('being searched', function () {
      describe('without self value', function () {
        it('should invoke the callback with the ostrich document as `this`', function (done) {
          document.searchTriplesDeltaMaterialized('a', 'b', 'c', { versionStart: 0, versionEnd: 1 }, function (error) {
            this.should.equal(document);
            done(error);
          });
        });
      });

      describe('with a self value', function () {
        var self = {};
        it('should invoke the callback with that value as `this`', function (done) {
          document.searchTriplesDeltaMaterialized('a', 'b', 'c', { versionStart: 0, versionEnd: 1 }, function (error) {
            this.should.equal(self);
            done(error);
          }, self);
        });
      });

      describe('with a non-existing pattern between version 0 and 1', function () {
        var triples, totalCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('1', null, null, { versionStart: 0, versionEnd: 1 },
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

      describe('with a non-existing pattern between version 1 and 2', function () {
        var triples, totalCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('1', null, null, { versionStart: 1, versionEnd: 2 },
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

      describe('with a non-existing pattern between version 0 and 2', function () {
        var triples, totalCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('1', null, null, { versionStart: 0, versionEnd: 2 },
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

      describe('with pattern null null null between version 0 and 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(7);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"b"^^http://example.org/literal',
            addition:  false });
          triples[1].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"z"^^http://example.org/literal',
            addition:  true });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            addition:  false });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g',
            addition:  true });
          triples[4].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            addition:  false });
          triples[5].should.eql({ subject:   'f',
            predicate: 'f',
            object:    'f',
            addition:  true });
          triples[6].should.eql({ subject:   'z',
            predicate: 'z',
            object:    'z',
            addition:  true });
        });

        it('should estimate the total count as 7', function () {
          totalCount.should.equal(7);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null null between version 1 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 1, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"z"^^http://example.org/literal',
            addition:  false });
          triples[1].should.eql({ subject:   'f',
            predicate: 'f',
            object:    'f',
            addition:  false });
          triples[2].should.eql({ subject:   'f',
            predicate: 'r',
            object:    's',
            addition:  true });
          triples[3].should.eql({ subject:   'q',
            predicate: 'q',
            object:    'q',
            addition:  true });
          triples[4].should.eql({ subject:   'r',
            predicate: 'r',
            object:    'r',
            addition:  true });
        });

        it('should estimate the total count as 15', function () {
          totalCount.should.equal(15);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern null null null between version 0 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(8);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"b"^^http://example.org/literal',
            addition:  false });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            addition:  false });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g',
            addition:  true });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            addition:  false });
          triples[4].should.eql({ subject:   'f',
            predicate: 'r',
            object:    's',
            addition:  true });
          triples[5].should.eql({ subject:   'q',
            predicate: 'q',
            object:    'q',
            addition:  true });
          triples[6].should.eql({ subject:   'r',
            predicate: 'r',
            object:    'r',
            addition:  true });
          triples[7].should.eql({ subject:   'z',
            predicate: 'z',
            object:    'z',
            addition:  true });
        });

        it('should estimate the total count as 8', function () {
          totalCount.should.equal(8);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null null, offset 0 and limit 5 between version 0 and 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1, offset: 0, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"b"^^http://example.org/literal',
            addition:  false });
          triples[1].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"z"^^http://example.org/literal',
            addition:  true });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            addition:  false });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g',
            addition:  true });
          triples[4].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            addition:  false });
        });

        it('should estimate the total count as 7', function () {
          totalCount.should.equal(7);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null null, offset 0 and limit 5 between version 1 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 1, versionEnd: 2, offset: 0, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"z"^^http://example.org/literal',
            addition:  false });
          triples[1].should.eql({ subject:   'f',
            predicate: 'f',
            object:    'f',
            addition:  false });
          triples[2].should.eql({ subject:   'f',
            predicate: 'r',
            object:    's',
            addition:  true });
          triples[3].should.eql({ subject:   'q',
            predicate: 'q',
            object:    'q',
            addition:  true });
          triples[4].should.eql({ subject:   'r',
            predicate: 'r',
            object:    'r',
            addition:  true });
        });

        it('should estimate the total count as 15', function () {
          totalCount.should.equal(15);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern null null null, offset 0 and limit 5 between version 0 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 2, offset: 0, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"b"^^http://example.org/literal',
            addition:  false });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            addition:  false });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g',
            addition:  true });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            addition:  false });
          triples[4].should.eql({ subject:   'f',
            predicate: 'r',
            object:    's',
            addition:  true });
        });

        it('should estimate the total count as 8', function () {
          totalCount.should.equal(8);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null null, offset 2 and limit 5 between version 0 and 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1, offset: 2, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            addition:  false });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g',
            addition:  true });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            addition:  false });
          triples[3].should.eql({ subject:   'f',
            predicate: 'f',
            object:    'f',
            addition:  true });
          triples[4].should.eql({ subject:   'z',
            predicate: 'z',
            object:    'z',
            addition:  true });
        });

        it('should estimate the total count as 7', function () {
          totalCount.should.equal(7);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null null, offset 2 and limit 5 between version 1 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 1, versionEnd: 2, offset: 2, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(3);
          triples[0].should.eql({ subject:   'f',
            predicate: 'r',
            object:    's',
            addition:  true });
          triples[1].should.eql({ subject:   'q',
            predicate: 'q',
            object:    'q',
            addition:  true });
          triples[2].should.eql({ subject:   'r',
            predicate: 'r',
            object:    'r',
            addition:  true });
        });

        it('should estimate the total count as 15', function () {
          totalCount.should.equal(15);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern null null null, offset 2 and limit 5 between version 0 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 2, offset: 2, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g',
            addition:  true });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            addition:  false });
          triples[2].should.eql({ subject:   'f',
            predicate: 'r',
            object:    's',
            addition:  true });
          triples[3].should.eql({ subject:   'q',
            predicate: 'q',
            object:    'q',
            addition:  true });
          triples[4].should.eql({ subject:   'r',
            predicate: 'r',
            object:    'r',
            addition:  true });
        });

        it('should estimate the total count as 8', function () {
          totalCount.should.equal(8);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null null, offset 10 and limit 5 between version 0 and 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 1, offset: 10, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 7', function () {
          totalCount.should.equal(7);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null null, offset 10 and limit 5 between version 1 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 1, versionEnd: 2, offset: 10, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 15', function () {
          totalCount.should.equal(15);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern null null null, offset 10 and limit 5 between version 0 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, null, { versionStart: 0, versionEnd: 2, offset: 10, limit: 5 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 8', function () {
          totalCount.should.equal(8);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern f null null between version 0 and 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('f', null, null, { versionStart: 0, versionEnd: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'f',
            predicate: 'f',
            object:    'f',
            addition:  true });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern f null null between version 1 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('f', null, null, { versionStart: 1, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(2);
          triples[0].should.eql({ subject:   'f',
            predicate: 'f',
            object:    'f',
            addition:  false });
          triples[1].should.eql({ subject:   'f',
            predicate: 'r',
            object:    's',
            addition:  true });
        });

        it('should estimate the total count as 2', function () {
          totalCount.should.equal(2);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern f null null between version 0 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('f', null, null, { versionStart: 0, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'f',
            predicate: 'r',
            object:    's',
            addition:  true });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern z null null, offset 0 and limit 1 between version 0 and 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('z', null, null, { versionStart: 0, versionEnd: 1, offset: 0, limit: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'z',
            predicate: 'z',
            object:    'z',
            addition:  true });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern z null null, offset 0 and limit 1 between version 1 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('z', null, null, { versionStart: 1, versionEnd: 2, offset: 0, limit: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with no matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 2', function () {
          totalCount.should.equal(2);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern z null null, offset 0 and limit 1 between version 0 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('z', null, null, { versionStart: 0, versionEnd: 2, offset: 0, limit: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'z',
            predicate: 'z',
            object:    'z',
            addition:  true });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern z null null, offset 10 and limit 1 between version 0 and 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('z', null, null, { versionStart: 0, versionEnd: 1, offset: 10, limit: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with no matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern z null null, offset 10 and limit 1 between version 1 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('z', null, null, { versionStart: 1, versionEnd: 2, offset: 10, limit: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with no matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 2', function () {
          totalCount.should.equal(2);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern z null null, offset 10 and limit 1 between version 0 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('z', null, null, { versionStart: 0, versionEnd: 2, offset: 10, limit: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with no matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern a ?p ?o between version 0 and 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('a', '?p', '?o', { versionStart: 0, versionEnd: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(5);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"b"^^http://example.org/literal',
            addition:  false });
          triples[1].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"z"^^http://example.org/literal',
            addition:  true });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            addition:  false });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g',
            addition:  true });
          triples[4].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            addition:  false });
        });

        it('should estimate the total count as 5', function () {
          totalCount.should.equal(5);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern a ?p ?o between version 1 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('a', '?p', '?o', { versionStart: 1, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"z"^^http://example.org/literal',
            addition:  false });
        });

        it('should estimate the total count as 9', function () {
          totalCount.should.equal(9);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern a ?p ?o between version 0 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized('a', '?p', '?o', { versionStart: 0, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(4);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"b"^^http://example.org/literal',
            addition:  false });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            addition:  false });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g',
            addition:  true });
          triples[3].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            addition:  false });
        });

        it('should estimate the total count as 4', function () {
          totalCount.should.equal(4);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null b null between version 0 and 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, 'b', null, { versionStart: 0, versionEnd: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(3);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            addition:  false });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g',
            addition:  true });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            addition:  false });
        });

        it('should estimate the total count as 3', function () {
          totalCount.should.equal(3);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null b null between version 1 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, 'b', null, { versionStart: 1, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with no matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 6', function () {
          totalCount.should.equal(6);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern null b null between version 0 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, 'b', null, { versionStart: 0, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(3);
          triples[0].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'a',
            addition:  false });
          triples[1].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'g',
            addition:  true });
          triples[2].should.eql({ subject:   'a',
            predicate: 'b',
            object:    'z',
            addition:  false });
        });

        it('should estimate the total count as 3', function () {
          totalCount.should.equal(3);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null ex:p3 null between version 0 and 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, 'http://example.org/p3', null, { versionStart: 0, versionEnd: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with no matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(0);
        });

        it('should estimate the total count as 0', function () {
          totalCount.should.equal(0);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null ex:p3 null between version 1 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, 'http://example.org/p3', null, { versionStart: 1, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with no matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(0);
        });

        it('should estimate the total count as 0', function () {
          totalCount.should.equal(0);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern null ex:p3 null between version 0 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, 'http://example.org/p3', null, { versionStart: 0, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with no matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(0);
        });

        it('should estimate the total count as 0', function () {
          totalCount.should.equal(0);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 0 and 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, '"b"^^http://example.org/literal', { versionStart: 0, versionEnd: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"b"^^http://example.org/literal',
            addition:  false });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 1 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, '"b"^^http://example.org/literal', { versionStart: 1, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with no matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 2', function () {
          totalCount.should.equal(2);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 0 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, '"b"^^http://example.org/literal', { versionStart: 0, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'a',
            predicate: 'a',
            object:    '"b"^^http://example.org/literal',
            addition:  false });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null f between version 0 and 1', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, 'f', { versionStart: 0, versionEnd: 1 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'f',
            predicate: 'f',
            object:    'f',
            addition:  true });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null f between version 1 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, 'f', { versionStart: 1, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.have.lengthOf(1);
          triples[0].should.eql({ subject:   'f',
            predicate: 'f',
            object:    'f',
            addition:  false });
        });

        it('should estimate the total count as 1', function () {
          totalCount.should.equal(1);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern null null f between version 0 and 2', function () {
        var triples, totalCount, hasExactCount;
        before(function (done) {
          document.searchTriplesDeltaMaterialized(null, null, 'f', { versionStart: 0, versionEnd: 2 },
            function (error, t, c, e) { triples = t; totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return an array with matches', function () {
          triples.should.be.an.Array;
          triples.should.be.empty;
        });

        it('should estimate the total count as 0', function () {
          totalCount.should.equal(0);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });
    });

    describe('being counted', function () {
      describe('without self value', function () {
        it('should invoke the callback with the ostrich document as `this`', function (done) {
          document.countTriplesDeltaMaterialized('a', 'b', 'c', 0, 1, function (error) {
            this.should.equal(document);
            done(error);
          });
        });
      });

      describe('with a self value', function () {
        var self = {};
        it('should invoke the callback with that value as `this`', function (done) {
          document.countTriplesDeltaMaterialized('a', 'b', 'c', 0, 1, function (error) {
            this.should.equal(self);
            done(error);
          }, self);
        });
      });

      describe('with a non-existing pattern between version 0 and 1', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized('1', null, null, 0, 1,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with a non-existing pattern between version 1 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized('1', null, null, 1, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with a non-existing pattern between version 0 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized('1', null, null, 0, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null null between version 0 and 1', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, null, null, 0, 1,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 7', function () {
          totalCount.should.equal(7);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null null between version 1 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, null, null, 1, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 15', function () {
          totalCount.should.equal(15);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern null null null between version 0 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, null, null, 0, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 8', function () {
          totalCount.should.equal(8);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern a null null between version 0 and 1', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized('a', null, null, 0, 1,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 5', function () {
          totalCount.should.equal(5);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern a null null between version 1 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized('a', null, null, 1, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 9', function () {
          totalCount.should.equal(9);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern a null null between version 0 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized('a', null, null, 0, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 4', function () {
          totalCount.should.equal(4);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null b null between version 0 and 1', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, 'b', null, 0, 1,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 3', function () {
          totalCount.should.equal(3);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null b null between version 1 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, 'b', null, 1, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 6', function () {
          totalCount.should.equal(6);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern null b null between version 0 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, 'b', null, 0, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 3', function () {
          totalCount.should.equal(3);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null ex:p3 null between version 0 and 1', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, 'http://example.org/p3', null, 0, 1,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null ex:p3 null between version 1 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, 'http://example.org/p3', null, 1, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern null ex:p3 null between version 0 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, 'http://example.org/p3', null, 0, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null f between version 0 and 1', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, null, 'f', 0, 1,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 1', function () {
          totalCount.should.equal(1);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null f between version 1 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, null, 'f', 1, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 1', function () {
          totalCount.should.equal(1);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern null null f between version 0 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, null, 'f', 0, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 0', function () {
          totalCount.should.equal(0);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 0 and 1', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, null, '"b"^^http://example.org/literal', 0, 1,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 1', function () {
          totalCount.should.equal(1);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 1 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, null, '"b"^^http://example.org/literal', 1, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 2', function () {
          totalCount.should.equal(2);
        });

        // it('should not be an exact count', function () {
        //   hasExactCount.should.equal(false);
        // });
      });

      describe('with pattern null null "b"^^http://example.org/literal between version 0 and 2', function () {
        var totalCount, hasExactCount;
        before(function (done) {
          document.countTriplesDeltaMaterialized(null, null, '"b"^^http://example.org/literal', 0, 2,
            function (error, c, e) { totalCount = c; hasExactCount = e; done(error); });
        });

        it('should return 1', function () {
          totalCount.should.equal(1);
        });

        // it('should be an exact count', function () {
        //   hasExactCount.should.equal(true);
        // });
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
