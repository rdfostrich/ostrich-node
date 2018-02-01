require('should');

var ostrich = require('../lib/ostrich');
var _ = require('lodash');

describe('append', function () {
  describe('An ostrich store for an example ostrich path', function () {
    describe('being appended', function () {
      describe('without self value', function () {
        var document; prepareDocument(function (d) { document = d; });
        it('should invoke the callback with the ostrich document as `this`', function (done) {
          document.append(0, [], function (error) {
            this.should.equal(document);
            done(error);
          });
        });
      });

      describe('with a self value', function () {
        var document; prepareDocument(function (d) { document = d; });
        var self = {};
        it('should invoke the callback with that value as `this`', function (done) {
          document.append(0, [], function (error) {
            this.should.equal(self);
            done(error);
          }, self);
        });
      });

      describe('with 3 triples for version 0', function () {
        var count;
        var triples = [
          { subject: 'a', predicate: 'a', object: 'a', addition: true },
          { subject: 'a', predicate: 'a', object: 'b', addition: true },
          { subject: 'a', predicate: 'a', object: 'c', addition: true },
        ];
        var document; prepareDocument(function (d) { document = d; });
        beforeEach(function (done) {
          document.append(0, triples,
            function (error, c) {
              count = c;
              done(error);
            });
        });

        it('should have inserted 3 triples', function () {
          count.should.equal(3);
        });

        it('should have 3 triples for version 0', function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { version: 0 },
            function (error, triplesFound, countFound) {
              triplesFound.should.be.an.Array;
              triplesFound.should.have.lengthOf(3);
              triplesFound[0].should.eql(_.omit(triples[0], ['addition']));
              triplesFound[1].should.eql(_.omit(triples[1], ['addition']));
              triplesFound[2].should.eql(_.omit(triples[2], ['addition']));
              countFound.should.equal(3);
              done(error);
            });
        });
      });

      describe('with 4 triples for version 0, including deletions', function () {
        var document; prepareDocument(function (d) { document = d; });
        var triples = [
          { subject: 'a', predicate: 'a', object: 'a', addition: false },
          { subject: 'a', predicate: 'a', object: 'b', addition: false },
          { subject: 'a', predicate: 'a', object: 'd', addition: true  },
          { subject: 'a', predicate: 'a', object: 'e', addition: true  },
        ];

        it('should throw an error', function (done) {
          document.append(0, triples,
            function (error, c) {
              error.should.be.an.Error;
              error.message.should.equal('All triples of the initial snapshot MUST be additions, but a deletion was found.');
              done();
            });
        });
      });

      describe('with 3 triples for version 0 and 4 triples for version 1', function () {
        var document; prepareDocument(function (d) { document = d; });
        var count = 0;
        var triples0 = [
          { subject: 'a', predicate: 'a', object: 'a', addition: true },
          { subject: 'a', predicate: 'a', object: 'b', addition: true },
          { subject: 'a', predicate: 'a', object: 'c', addition: true },
        ];
        var triples1 = [
          { subject: 'a', predicate: 'a', object: 'a', addition: false },
          { subject: 'a', predicate: 'a', object: 'b', addition: false },
          { subject: 'a', predicate: 'a', object: 'd', addition: true  },
          { subject: 'a', predicate: 'a', object: 'e', addition: true  },
        ];

        beforeEach(function (done) {
          document.append(0, triples0,
            function (error, c) {
              count += c;
              if (error)
                done(error);
              else {
                document.append(1, triples1,
                  function (error, c) {
                    count += c;
                    done(error);
                  });
              }
            });
        });

        it('should have inserted 7 triples', function () {
          count.should.equal(7);
        });

        it('should have 3 triples for version 0', function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { version: 0 },
            function (error, triplesFound, countFound) {
              triplesFound.should.be.an.Array;
              triplesFound.should.have.lengthOf(3);
              triplesFound[0].should.eql(_.omit(triples0[0], ['addition']));
              triplesFound[1].should.eql(_.omit(triples0[1], ['addition']));
              triplesFound[2].should.eql(_.omit(triples0[2], ['addition']));
              countFound.should.equal(3);
              done(error);
            });
        });

        it('should have 3 triples for version 1', function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { version: 1 },
            function (error, triplesFound, countFound) {
              triplesFound.should.be.an.Array;
              triplesFound.should.have.lengthOf(3);
              triplesFound[0].should.eql(_.omit(triples0[2], ['addition']));
              triplesFound[1].should.eql(_.omit(triples1[2], ['addition']));
              triplesFound[2].should.eql(_.omit(triples1[3], ['addition']));
              countFound.should.equal(3);
              done(error);
            });
        });
      });

      describe('with 3 non-sorted triples for version 0 and 4 triples for version 1', function () {
        var document; prepareDocument(function (d) { document = d; });
        var count = 0;
        var triples0 = [
          { subject: 'a', predicate: 'a', object: 'c', addition: true },
          { subject: 'a', predicate: 'a', object: 'a', addition: true },
          { subject: 'a', predicate: 'a', object: 'b', addition: true },
        ];
        var triples1 = [
          { subject: 'a', predicate: 'a', object: 'e', addition: true  },
          { subject: 'a', predicate: 'a', object: 'a', addition: false },
          { subject: 'a', predicate: 'a', object: 'd', addition: true  },
          { subject: 'a', predicate: 'a', object: 'b', addition: false },
        ];

        beforeEach(function (done) {
          document.append(0, triples0,
            function (error, c) {
              count += c;
              if (error)
                done(error);
              else {
                document.append(1, triples1,
                  function (error, c) {
                    count += c;
                    done(error);
                  });
              }
            });
        });

        it('should have inserted 7 triples', function () {
          count.should.equal(7);
        });

        it('should have 3 triples for version 0', function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { version: 0 },
            function (error, triplesFound, countFound) {
              triplesFound.should.be.an.Array;
              triplesFound.should.have.lengthOf(3);
              triplesFound[0].should.eql(_.omit(triples0[0], ['addition']));
              triplesFound[1].should.eql(_.omit(triples0[1], ['addition']));
              triplesFound[2].should.eql(_.omit(triples0[2], ['addition']));
              countFound.should.equal(3);
              done(error);
            });
        });

        it('should have 3 triples for version 1', function (done) {
          document.searchTriplesVersionMaterialized(null, null, null, { version: 1 },
            function (error, triplesFound, countFound) {
              triplesFound.should.be.an.Array;
              triplesFound.should.have.lengthOf(3);
              triplesFound[0].should.eql(_.omit(triples0[2], ['addition']));
              triplesFound[1].should.eql(_.omit(triples1[2], ['addition']));
              triplesFound[2].should.eql(_.omit(triples1[3], ['addition']));
              countFound.should.equal(3);
              done(error);
            });
        });
      });

      describe('with 3 triples for 10 versions', function () {
        var document; prepareDocument(function (d) { document = d; });
        var count = 0;

        it('should have inserted 33 triples', function (done) {
          insert(0);
          function insert(v) {
            var triples = [
              { subject: 'a', predicate: 'a', object: 'a' + v, addition: true },
              { subject: 'a', predicate: 'a', object: 'b' + v, addition: true },
              { subject: 'a', predicate: 'a', object: 'c' + v, addition: true },
            ];
            document.append(v, triples,
              function (error, c) {
                count += c;
                if (v === 9) {
                  count.should.equal(30);
                  done(error);
                }
                else
                  insert(v + 1);
              });
          }
        });
      });
    });
  });
});

function prepareDocument(cb) {
  var document;
  beforeEach(function (done) {
    ostrich.fromPath('./test/test-temp.ostrich', false, function (error, ostrichStore) {
      document = ostrichStore;
      if (!cb(ostrichStore, done))
        done(error);
    });
  });
  afterEach(function (done) {
    // We completely remove the store
    document.close(true, done);
  });
}
