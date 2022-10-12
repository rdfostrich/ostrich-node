var ostrichNative = require('../build/Release/ostrich');
var fs = require('fs');

// A string comparison function that is consistent with the sorting that happens in the string::compare function in C++
function strcmp(a, b) {
  var i, n;
  for (i = 0, n = Math.max(a.length, b.length); i < n && a.charAt(i) === b.charAt(i); ++i);
  if (i === n) return 0;
  return a.charAt(i) < b.charAt(i) ? -1 : 1;
}

/*     Auxiliary methods for OstrichStore     */

var OstrichStorePrototype = ostrichNative.OstrichStore.prototype;

// Searches the document for triples with the given subject, predicate, object and version for a version materialized query.
OstrichStorePrototype.searchTriplesVersionMaterialized = function (subject, predicate, object, options) {
  return new Promise((resolve, reject) => {
    if (this.closed) reject(new Error('Ostrich cannot be read because it is closed'));
    if (this.maxVersion < 0) reject(new Error('An empty store can not be queried.'));
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
        this_._finishOperation();
        if (error) reject(error);
        resolve({ triples, totalCount, hasExactCount });
      });
  });
};

// Gives an approximate number of matches of triples with the given subject, predicate, object and version for a version materialized query.
OstrichStorePrototype.countTriplesVersionMaterialized = function (subject, predicate, object, version) {
  if (version === undefined) version = -1;
  return new Promise((resolve, reject) => {
    this.searchTriplesVersionMaterialized(subject, predicate, object, { version, offset: 0, limit: 1 })
      .then(({ totalCount, hasExactCount }) => {
        resolve({ totalCount, hasExactCount });
      }).catch((e) => {
        reject(e);
      });
  });
};

// Searches the document for triples with the given subject, predicate, object, versionStart and versionEnd for a delta materialized query.
OstrichStorePrototype.searchTriplesDeltaMaterialized = function (subject, predicate, object, options) {
  return new Promise((resolve, reject) => {
    if (this.closed) reject(new Error('Ostrich cannot be read because it is closed'));
    if (this.maxVersion < 0) reject(new Error('An empty store can not be queried.'));
    if (typeof   subject !== 'string' ||   subject[0] === '?') subject   = '';
    if (typeof predicate !== 'string' || predicate[0] === '?') predicate = '';
    if (typeof    object !== 'string' ||    object[0] === '?') object    = '';
    var offset  = options && options.offset  ? Math.max(0, parseInt(options.offset, 10)) : 0,
        limit   = options && options.limit   ? Math.max(0, parseInt(options.limit,  10)) : 0,
        versionStart = options.versionStart,
        versionEnd   = options.versionEnd;
    if (!versionStart && versionStart !== 0) reject(new Error('A `versionStart` option must be defined.'));
    if (!versionEnd   && versionEnd   !== 0) reject(new Error('A `versionEnd` option must be defined.'));
    if (versionStart >= versionEnd) reject(new Error('`versionStart` must be strictly smaller than `versionEnd`.'));
    if (versionEnd > this.maxVersion) reject(new Error('`versionEnd` can not be larger than the maximum version.'));
    var this_ = this;
    this._operations++;
    this._searchTriplesDeltaMaterialized(subject, predicate, object, offset, limit, versionStart, versionEnd,
      function (error, triples, totalCount, hasExactCount) {
        this_._operations--;
        this_._finishOperation();
        if (error) reject(error);
        resolve({ triples, totalCount, hasExactCount });
      });
  });
};

// Gives an approximate number of matches of triples with the given subject, predicate, object, versionStart and versionEnd for a delta materialized query.
OstrichStorePrototype.countTriplesDeltaMaterialized = function (subject, predicate, object, versionStart, versionEnd) {
  return new Promise((resolve, reject) => {
    this.searchTriplesDeltaMaterialized(subject, predicate, object, { offset: 0, limit: 1, versionStart: versionStart, versionEnd: versionEnd })
      .then(({ totalCount, hasExactCount }) => {
        resolve({ totalCount, hasExactCount });
      }).catch((e) => {
        reject(e);
      });
  });
};

// Searches the document for triples with the given subject, predicate and object for a version query.
OstrichStorePrototype.searchTriplesVersion = function (subject, predicate, object, options) {
  return new Promise((resolve, reject) => {
    if (this.closed) reject(new Error('Ostrich cannot be read because it is closed'));
    if (this.maxVersion < 0) reject(new Error('An empty store can not be queried.'));
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
        this_._finishOperation();
        if (error) reject(error);
        resolve({ triples, totalCount, hasExactCount });
      });
  });
};

// Gives an approximate number of matches of triples with the given subject, predicate and object for a version query.
OstrichStorePrototype.countTriplesVersion = function (subject, predicate, object) {
  return new Promise((resolve, reject) => {
    this.searchTriplesVersion(subject, predicate, object, { offset: 0, limit: 1 })
      .then(({ totalCount, hasExactCount }) => {
        resolve(({ totalCount, hasExactCount }));
      }).catch((e) => {
        reject(e);
      });
  });
};

// Appends all triples, annotated with addition: true or false as the given version.
OstrichStorePrototype.append = function (version, triples) {
  if (typeof version !== 'number') {
    triples = version;
    version = -1;
  }

  // Make sure our triples are sorted
  triples = triples.sort(function (a, b) {
    var compS = strcmp(a.subject, b.subject);
    if (compS === 0) {
      var compP = strcmp(a.predicate, b.predicate);
      if (compP === 0)
        return strcmp(a.object, b.object);
      return compP;
    }
    return compS;
  });

  return this.appendSorted(version, triples);
};


// Appends all triples, annotated with addition: true or false as the given version.
// The array is assumed to be sorted in SPO-order already.
OstrichStorePrototype.appendSorted = function (version, triples) {
  if (typeof version !== 'number') {
    triples = version;
    version = -1;
  }
  return new Promise((resolve, reject) => {
    if (this.closed) reject(new Error('Ostrich cannot be read because it is closed'));
    if (this.readOnly) reject(new Error('Can not append to Ostrich store in read-only mode'));

    var this_ = this;
    this._operations++;
    this._append(version, triples, function (error, insertedCount) {
      this_._operations--;
      this_._finishOperation();
      if (error) reject(error);
      resolve(insertedCount);
    });
  });
};

OstrichStorePrototype._finishOperation = function () {
  // Call the operations-callbacks if no operations are going on anymore.
  if (!this._operations) {
    for (var i = 0; i < this._operationsCallbacks.length; i++)
      this._operationsCallbacks[i]();
  }
};


OstrichStorePrototype.close = function (remove = false) {
  return new Promise((resolve) => {
    this._closeInternal(remove, () => {
      resolve();
    });
  });
};

OstrichStorePrototype._closeInternal = function (remove, callback, self) {
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
  fromPath: function (path, readOnly, strategyName, strategyParameter) {
    return new Promise((resolve, reject) => {
      if (typeof path !== 'string' || path.length === 0)
        reject(Error('Invalid path: ' + path));
      if (path.charAt(path.length - 1) !== '/') path += '/';

      if (typeof strategyName !== 'string') {
        strategyName = 'never';
        strategyParameter = '0';
      }

      if (!readOnly && !fs.existsSync(path))
        fs.mkdirSync(path);

      // Construct the native OstrichStore
      ostrichNative.createOstrichStore(path, readOnly, strategyName, strategyParameter, function (error, document) {
        // Abort the creation if any error occurred
        if (error)
          reject(error);
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
        resolve(document);
      });
    });
  },
};
