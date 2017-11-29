var ostrichNative = require('../build/Release/ostrich');
var fs = require('fs');

/*     Auxiliary methods for OstrichStore     */

var OstrichStorePrototype = ostrichNative.OstrichStore.prototype;

// Searches the document for triples with the given subject, predicate, object and version for a version materialized query.
OstrichStorePrototype.searchTriplesVersionMaterialized = function (subject, predicate, object, options, callback, self) {
  if (typeof  callback !== 'function') self = callback, callback = options, options = {};
  if (typeof  callback !== 'function') return;
  if (this.closed) return callback.call(self || this, new Error('Ostrich cannot be read because it is closed'));
  if (this.maxVersion < 0) return callback.call(self || this, new Error('An empty store can not be queried.'));
  if (typeof   subject !== 'string' ||   subject[0] === '?') subject   = '';
  if (typeof predicate !== 'string' || predicate[0] === '?') predicate = '';
  if (typeof    object !== 'string' ||    object[0] === '?') object    = '';
  var offset  = options && options.offset  ? Math.max(0, parseInt(options.offset, 10)) : 0,
      limit   = options && options.limit   ? Math.max(0, parseInt(options.limit,  10)) : 0,
      version = options && (options.version || options.version === 0) ? parseInt(options.version, 10) : -1;

  var this_ = this;
  this._operations++;
  this._searchTriplesVersionMaterialized(subject, predicate, object, offset, limit, version,
    function (error, triples, totalCount, hasExactCount) {
      this_._operations--;
      callback.call(self || this_, error, triples, totalCount, hasExactCount);
      this_._finishOperation();
    }, self);
};

// Gives an approximate number of matches of triples with the given subject, predicate, object and version for a version materialized query.
OstrichStorePrototype.countTriplesVersionMaterialized = function (subject, predicate, object, version, callback, self) {
  if (typeof version === 'function') {
    self = callback;
    callback = version;
    version = -1;
  }
  this.searchTriplesVersionMaterialized(subject, predicate, object, { offset: 0, limit: 1, version: version },
              function (error, triples, totalCount, hasExactCount) {
                callback.call(this, error, totalCount, hasExactCount);
              }, self);
};

// Searches the document for triples with the given subject, predicate, object, versionStart and versionEnd for a delta materialized query.
OstrichStorePrototype.searchTriplesDeltaMaterialized = function (subject, predicate, object, options, callback, self) {
  if (typeof  callback !== 'function') self = callback, callback = options, options = {};
  if (typeof  callback !== 'function') return;
  if (this.closed) return callback.call(self || this, new Error('Ostrich cannot be read because it is closed'));
  if (this.maxVersion < 0) return callback.call(self || this, new Error('An empty store can not be queried.'));
  if (typeof   subject !== 'string' ||   subject[0] === '?') subject   = '';
  if (typeof predicate !== 'string' || predicate[0] === '?') predicate = '';
  if (typeof    object !== 'string' ||    object[0] === '?') object    = '';
  var offset  = options && options.offset  ? Math.max(0, parseInt(options.offset, 10)) : 0,
      limit   = options && options.limit   ? Math.max(0, parseInt(options.limit,  10)) : 0,
      versionStart = options.versionStart,
      versionEnd   = options.versionEnd;
  if (!versionStart && versionStart !== 0) return callback.call(self || this, new Error('A `versionStart` option must be defined.'));
  if (!versionEnd   && versionEnd   !== 0) return callback.call(self || this, new Error('A `versionEnd` option must be defined.'));
  if (versionStart >= versionEnd) return callback.call(self || this, new Error('`versionStart` must be strictly smaller than `versionEnd`.'));
  if (versionEnd > this.maxVersion) return callback.call(self || this, new Error('`versionEnd` can not be larger than the maximum version.'));

  var this_ = this;
  this._operations++;
  this._searchTriplesDeltaMaterialized(subject, predicate, object, offset, limit, versionStart, versionEnd,
    function (error, triples, totalCount, hasExactCount) {
      this_._operations--;
      callback.call(self || this_, error, triples, totalCount, hasExactCount);
      this_._finishOperation();
    }, self);
};

// Gives an approximate number of matches of triples with the given subject, predicate, object, versionStart and versionEnd for a delta materialized query.
OstrichStorePrototype.countTriplesDeltaMaterialized = function (subject, predicate, object, versionStart, versionEnd, callback, self) {
  this.searchTriplesDeltaMaterialized(subject, predicate, object, { offset: 0, limit: 1, versionStart: versionStart, versionEnd: versionEnd },
    function (error, triples, totalCount, hasExactCount) {
      callback.call(this, error, totalCount, hasExactCount);
    }, self);
};

// Searches the document for triples with the given subject, predicate and object for a version query.
OstrichStorePrototype.searchTriplesVersion = function (subject, predicate, object, options, callback, self) {
  if (typeof  callback !== 'function') self = callback, callback = options, options = {};
  if (typeof  callback !== 'function') return;
  if (this.closed) return callback.call(self || this, new Error('Ostrich cannot be read because it is closed'));
  if (this.maxVersion < 0) return callback.call(self || this, new Error('An empty store can not be queried.'));
  if (typeof   subject !== 'string' ||   subject[0] === '?') subject   = '';
  if (typeof predicate !== 'string' || predicate[0] === '?') predicate = '';
  if (typeof    object !== 'string' ||    object[0] === '?') object    = '';
  var offset  = options && options.offset  ? Math.max(0, parseInt(options.offset, 10)) : 0,
      limit   = options && options.limit   ? Math.max(0, parseInt(options.limit,  10)) : 0;

  var this_ = this;
  this._operations++;
  this._searchTriplesVersion(subject, predicate, object, offset, limit,
    function (error, triples, totalCount, hasExactCount) {
      this_._operations--;
      callback.call(self || this_, error, triples, totalCount, hasExactCount);
      this_._finishOperation();
    }, self);
};

// Gives an approximate number of matches of triples with the given subject, predicate and object for a version query.
OstrichStorePrototype.countTriplesVersion = function (subject, predicate, object, callback, self) {
  this.searchTriplesVersion(subject, predicate, object, { offset: 0, limit: 1 },
    function (error, triples, totalCount, hasExactCount) {
      callback.call(this, error, totalCount, hasExactCount);
    }, self);
};

// Appends all triples, annotated with addition: true or false as the given version.
// The triples array must be sorted in SPO order.
OstrichStorePrototype.append = function (version, triples, callback, self) {
  if (typeof version !== 'number') {
    self = callback;
    callback = triples;
    triples = version;
    version = -1;
  }
  if (typeof callback !== 'function') return;
  if (this.closed) return callback.call(self || this, new Error('Ostrich cannot be read because it is closed'));
  if (this.readOnly) return callback.call(self || this, new Error('Can not append to Ostrich store in read-only mode'));

  var this_ = this;
  this._operations++;
  this._append(version, triples, function (error, insertedCount) {
    this_._operations--;
    callback.call(self || this, error, insertedCount);
    this_._finishOperation();
  }, self);
};

OstrichStorePrototype._finishOperation = function () {
  // Call the operations-callbacks if no operations are going on anymore.
  if (!this._operations) {
    for (var i = 0; i < this._operationsCallbacks.length; i++)
      this._operationsCallbacks[i]();
  }
};

// Appends all triples, annotated with addition: true or false as the given version.
// The triples array must be sorted in SPO order.
OstrichStorePrototype.close = function (remove, callback, self) {
  // Shift params if 'remove' is not given.
  if (typeof remove !== 'boolean') {
    self = callback;
    callback = remove;
    remove = false;
  }

  var this_ = this;
  if (this._isClosingCallbacks) {
    this._isClosingCallbacks.push(callbackSelfed);
    return;
  }
  this._isClosingCallbacks = [callbackSelfed];
  // If no appends are being done, close immediately,
  // otherwise wait for appends to finish.
  if (!this._operations)
    this._close(remove, onClosed, self);
  else {
    this._operationsCallbacks.push(function () {
      this_._close(remove, onClosed, self);
    });
  }

  function onClosed(e) {
    this_._isClosingCallbacks.forEach(function (cb) { cb && cb(e); });
    this_._isClosingCallbacks = null;
  }

  function callbackSelfed(e) {
    callback && callback.call(self, e);
  }
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
      document._operations = 0;
      document._operationsCallbacks = [];
      callback.call(self, null, document);
    });
  },
};
