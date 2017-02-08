var ostrichNative = require('../build/Release/ostrich');

/*     Auxiliary methods for OstrichStore     */

var OstrichStorePrototype = ostrichNative.OstrichStore.prototype;

// Searches the document for triples with the given subject, predicate, and object.
OstrichStorePrototype.searchTriplesVersionMaterialized = function (subject, predicate, object, options, callback, self) {
  if (typeof  callback !== 'function') self = callback, callback = options, options = {};
  if (typeof  callback !== 'function') return;
  if (this.closed) return callback.call(self || this, new Error('Ostrich cannot be read because it is closed'));
  if (typeof   subject !== 'string' ||   subject[0] === '?') subject   = '';
  if (typeof predicate !== 'string' || predicate[0] === '?') predicate = '';
  if (typeof    object !== 'string' ||    object[0] === '?') object    = '';
  var offset  = options && options.offset  ? Math.max(0, parseInt(options.offset ,  10)) : 0,
      limit   = options && options.limit   ? Math.max(0, parseInt(options.limit  ,  10)) : 0,
      version = options && (options.version || options.version === 0) ? parseInt(options.version,  10) : -1;

  this._searchTriplesVersionMaterialized(subject, predicate, object, offset, limit, version, callback, self);
};

// Gives an approximate number of matches of triples with the given subject, predicate, and object.
OstrichStorePrototype.countTriples = function (subject, predicate, object, version, callback, self) {
  if (typeof(version) === 'function') {
    self = callback;
    callback = version;
    version = -1;
  }
  this.searchTriplesVersionMaterialized(subject, predicate, object, { offset: 0, limit: 0, version: version },
              function (error, triples, totalCount, hasExactCount) {
                callback.call(this, error, totalCount, hasExactCount);
              }, self);
};



/*     Module exports     */

module.exports = {
  // Creates an Ostrich store for the given path.
  fromPath: function (path, callback, self) {
    if (typeof callback !== 'function') return;
    if (typeof path !== 'string' || path.length === 0)
      return callback.call(self, Error('Invalid path: ' + path));
    if (path.charAt(path.length - 1) !== '/') path += '/';

    // Construct the native OstrichStore
    ostrichNative.createOstrichStore(path, function (error, document) {
      // Abort the creation if any error occurred
      if (error) {
        return callback.call(self, error);
      }
      // Document the features
      document.features = Object.freeze({
        searchTriplesVersionMaterialized:  true, // supported by default
        countTriples:                      true, // supported by default
      });
      callback.call(self, null, document);
    });
  },
};
