var ostrichNative = require('../build/Release/ostrich');
var fs = require('fs');

/*     Auxiliary methods for OstrichStore     */

var OstrichStorePrototype = ostrichNative.OstrichStore.prototype;

// Searches the document for triples with the given subject, predicate, object and version for a version materialized query.
OstrichStorePrototype.searchTriplesVersionMaterialized = function (subject, predicate, object, options, callback, self) {
  if (typeof  callback !== 'function') self = callback, callback = options, options = {};
  if (typeof  callback !== 'function') return;
  if (this.closed) return callback.call(self || this, new Error('Ostrich cannot be read because it is closed'));
  if (typeof   subject !== 'string' ||   subject[0] === '?') subject   = '';
  if (typeof predicate !== 'string' || predicate[0] === '?') predicate = '';
  if (typeof    object !== 'string' ||    object[0] === '?') object    = '';
  var offset  = options && options.offset  ? Math.max(0, parseInt(options.offset, 10)) : 0,
      limit   = options && options.limit   ? Math.max(0, parseInt(options.limit,  10)) : 0,
      version = options && (options.version || options.version === 0) ? parseInt(options.version, 10) : -1;

  this._searchTriplesVersionMaterialized(subject, predicate, object, offset, limit, version, callback, self);
};

// Gives an approximate number of matches of triples with the given subject, predicate, object and version for a version materialized query.
OstrichStorePrototype.countTriplesVersionMaterialized = function (subject, predicate, object, version, callback, self) {
  if (typeof version === 'function') {
    self = callback;
    callback = version;
    version = -1;
  }
  this.searchTriplesVersionMaterialized(subject, predicate, object, { offset: 0, limit: 0, version: version },
              function (error, triples, totalCount, hasExactCount) {
                callback.call(this, error, totalCount, hasExactCount);
              }, self);
};

// Searches the document for triples with the given subject, predicate, object, versionStart and versionEnd for a delta materialized query.
OstrichStorePrototype.searchTriplesDeltaMaterialized = function (subject, predicate, object, options, callback, self) {
  if (typeof  callback !== 'function') self = callback, callback = options, options = {};
  if (typeof  callback !== 'function') return;
  if (this.closed) return callback.call(self || this, new Error('Ostrich cannot be read because it is closed'));
  if (typeof   subject !== 'string' ||   subject[0] === '?') subject   = '';
  if (typeof predicate !== 'string' || predicate[0] === '?') predicate = '';
  if (typeof    object !== 'string' ||    object[0] === '?') object    = '';
  var offset  = options && options.offset  ? Math.max(0, parseInt(options.offset, 10)) : 0,
      limit   = options && options.limit   ? Math.max(0, parseInt(options.limit,  10)) : 0,
      versionStart = options.versionStart,
      versionEnd   = options.versionEnd;
  if (!versionStart && versionStart !== 0) callback.call(self || this, new Error('A `versionStart` option must be defined.'));
  if (!versionEnd   && versionEnd   !== 0) callback.call(self || this, new Error('A `versionEnd` option must be defined.'));

  this._searchTriplesDeltaMaterialized(subject, predicate, object, offset, limit, versionStart, versionEnd, callback, self);
};

// Gives an approximate number of matches of triples with the given subject, predicate, object, versionStart and versionEnd for a delta materialized query.
OstrichStorePrototype.countTriplesDeltaMaterialized = function (subject, predicate, object, versionStart, versionEnd, callback, self) {
  this.searchTriplesDeltaMaterialized(subject, predicate, object, { offset: 0, limit: 0, versionStart: versionStart, versionEnd: versionEnd },
    function (error, triples, totalCount, hasExactCount) {
      callback.call(this, error, totalCount, hasExactCount);
    }, self);
};

// Searches the document for triples with the given subject, predicate and object for a version query.
OstrichStorePrototype.searchTriplesVersion = function (subject, predicate, object, options, callback, self) {
  if (typeof  callback !== 'function') self = callback, callback = options, options = {};
  if (typeof  callback !== 'function') return;
  if (this.closed) return callback.call(self || this, new Error('Ostrich cannot be read because it is closed'));
  if (typeof   subject !== 'string' ||   subject[0] === '?') subject   = '';
  if (typeof predicate !== 'string' || predicate[0] === '?') predicate = '';
  if (typeof    object !== 'string' ||    object[0] === '?') object    = '';
  var offset  = options && options.offset  ? Math.max(0, parseInt(options.offset, 10)) : 0,
      limit   = options && options.limit   ? Math.max(0, parseInt(options.limit,  10)) : 0;

  this._searchTriplesVersion(subject, predicate, object, offset, limit, callback, self);
};

// Gives an approximate number of matches of triples with the given subject, predicate and object for a version query.
OstrichStorePrototype.countTriplesVersion = function (subject, predicate, object, callback, self) {
  this.searchTriplesVersion(subject, predicate, object, { offset: 0, limit: 0 },
    function (error, triples, totalCount, hasExactCount) {
      callback.call(this, error, totalCount, hasExactCount);
    }, self);
};

// Appends all triples, annotated with addition: true or false as the given version.
// The triples array must be sorted in SPO order.
OstrichStorePrototype.append = function (version, triples, callback, self) {
  if (typeof  callback !== 'function') return;
  if (this.closed) return callback.call(self || this, new Error('Ostrich cannot be read because it is closed'));
  if (this.readOnly) return callback.call(self || this, new Error('Can not append to Ostrich store in read-only mode'));
  this._append(version, triples, callback, self);
};



/*     Module exports     */

module.exports = {
  // Creates an Ostrich store for the given path.
  fromPath: function (path, readOnly, callback, self) {
    if (typeof readOnly !== 'boolean') self = callback, callback = readOnly, readOnly = true;
    if (typeof callback !== 'function') return;
    if (typeof path !== 'string' || path.length === 0)
      return callback.call(self, Error('Invalid path: ' + path));
    if (path.charAt(path.length - 1) !== '/') path += '/';

    if (!readOnly && !fs.existsSync(path))
      fs.mkdirSync(path);

    // Construct the native OstrichStore
    ostrichNative.createOstrichStore(path, readOnly, function (error, document) {
      // Abort the creation if any error occurred
      if (error)
        return callback.call(self, error);
      // Document the features
      document.features = Object.freeze({
        searchTriplesVersionMaterialized:  true, // supported by default
        countTriplesVersionMaterialized:   true, // supported by default
        searchTriplesDeltaMaterialized:    true, // supported by default
        countTriplesDeltaMaterialized:     true, // supported by default
        searchTriplesVersion:              true, // supported by default
        countTriplesVersion:               true, // supported by default
        appendVersionedTriples:            !readOnly, // supported if not in readOnly-mode
      });
      document.readOnly = readOnly;
      callback.call(self, null, document);
    });
  },
};
