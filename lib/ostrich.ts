import * as fs from 'fs';

const ostrichNative = require('../build/Release/ostrich.node');

// A string comparison function that is consistent with the sorting that happens in the string::compare function in C++
export function strcmp(left: string, right: string): number {
  const maxLen = Math.max(left.length, right.length);
  let i;
  for (i = 0; i < maxLen && left.charAt(i) === right.charAt(i); ++i) {
    // Do nothing
  }
  if (i === maxLen) {
    return 0;
  }
  return left.charAt(i) < right.charAt(i) ? -1 : 1;
}

export interface ITripleRaw {
  subject: string;
  predicate: string;
  object: string;
}

export interface ITripleDeltaRaw extends ITripleRaw {
  addition: boolean;
}

export interface ITripleVersionRaw extends ITripleRaw {
  versions: number[];
}

// TODO: convert to class extends from OstrichStorePrototype?
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type OstrichStore = {
  _isClosingCallbacks?: ((error?: Error) => void)[];

  searchTriplesVersionMaterialized: (
    subject: string | undefined | null,
    predicate: string | undefined | null,
    object: string | undefined | null,
    options?: { offset?: number; limit?: number; version?: number },
  ) => Promise<{ triples: ITripleRaw[]; totalCount: number; hasExactCount: boolean }>;
  countTriplesVersionMaterialized: (
    subject: string | undefined | null,
    predicate: string | undefined | null,
    object: string | undefined | null,
    version?: number,
  ) => Promise<{ totalCount: number; hasExactCount: boolean }>;
  searchTriplesDeltaMaterialized: (
    subject: string | undefined | null,
    predicate: string | undefined | null,
    object: string | undefined | null,
    options?: { offset?: number; limit?: number; versionStart?: number; versionEnd?: number },
  ) => Promise<{ triples: ITripleDeltaRaw[]; totalCount: number; hasExactCount: boolean }>;
  countTriplesDeltaMaterialized: (
    subject: string | undefined | null,
    predicate: string | undefined | null,
    object: string | undefined | null,
    versionStart?: number,
    versionEnd?: number,
  ) => Promise<{ totalCount: number; hasExactCount: boolean }>;
  searchTriplesVersion: (
    subject: string | undefined | null,
    predicate: string | undefined | null,
    object: string | undefined | null,
    options?: { offset?: number; limit?: number },
  ) => Promise<{ triples: ITripleVersionRaw[]; totalCount: number; hasExactCount: boolean }>;
  countTriplesVersion: (
    subject: string | undefined | null,
    predicate: string | undefined | null,
    object: string | undefined | null,
  ) => Promise<{ totalCount: number; hasExactCount: boolean }>;

  append: (triples: ITripleDeltaRaw[], version?: number) => Promise<number>;
  appendSorted: (triples: ITripleDeltaRaw[], version?: number) => Promise<number>;
  close: (remove?: boolean) => Promise<void>;

  _close: (remove: boolean, callback: (error?: Error) => void) => void;
  features: Record<string, boolean>;
  readOnly: boolean;
  _operations: number;
  _operationsCallbacks: (() => void)[];
  maxVersion: number;
};

/*     Auxiliary methods for OstrichStore     */

const OstrichStorePrototype = ostrichNative.OstrichStore.prototype;

/**
 * Searches the document for triples with the given subject, predicate, object and version
 * for a version materialized query.
 * @param subject An RDF term.
 * @param predicate An RDF term.
 * @param object An RDF term.
 * @param options Options
 */
OstrichStorePrototype.searchTriplesVersionMaterialized = function(
  subject: string | undefined | null,
  predicate: string | undefined | null,
  object: string | undefined | null,
  options?: { offset?: number; limit?: number; version?: number },
): Promise<{ triples: ITripleRaw[]; totalCount: number; hasExactCount: boolean }> {
  return new Promise((resolve, reject) => {
    if (this.closed) {
      reject(new Error('Ostrich cannot be read because it is closed'));
    }
    if (this.maxVersion < 0) {
      reject(new Error('An empty store can not be queried.'));
    }
    if (typeof subject !== 'string' || subject.startsWith('?')) {
      subject = '';
    }
    if (typeof predicate !== 'string' || predicate.startsWith('?')) {
      predicate = '';
    }
    if (typeof object !== 'string' || object.startsWith('?')) {
      object = '';
    }
    const offset = options && options.offset ? Math.max(0, options.offset) : 0;
    const limit = options && options.limit ? Math.max(0, options.limit) : 0;
    const version = options && (options.version || options.version === 0) ? options.version : -1;
    this._operations++;
    this._searchTriplesVersionMaterialized(
      subject,
      predicate,
      object,
      offset,
      limit,
      version,
      (error: Error | undefined, triples: ITripleRaw[], totalCount: number, hasExactCount: boolean) => {
        this._operations--;
        this._finishOperation();
        if (error) {
          reject(error);
        }
        resolve({ triples, totalCount, hasExactCount });
      },
    );
  });
};

/**
 * Gives an approximate number of matches of triples with the given subject, predicate, object and version
 * for a version materialized query.
 * @param subject An RDF term.
 * @param predicate An RDF term.
 * @param object An RDF term.
 * @param version The version to obtain.
 */
OstrichStorePrototype.countTriplesVersionMaterialized = function(
  subject: string | undefined | null,
  predicate: string | undefined | null,
  object: string | undefined | null,
  version = -1,
): Promise<{ totalCount: number; hasExactCount: boolean }> {
  return new Promise((resolve, reject) => {
    (<OstrichStore> this).searchTriplesVersionMaterialized(subject, predicate, object, { version, offset: 0, limit: 1 })
      .then(({ totalCount, hasExactCount }) => {
        resolve({ totalCount, hasExactCount });
      })
      .catch((error: Error) => reject(error));
  });
};

/**
 * Searches the document for triples with the given subject, predicate, object, versionStart and versionEnd
 * for a delta materialized query.
 * @param subject An RDF term.
 * @param predicate An RDF term.
 * @param object An RDF term.
 * @param options Options
 */
OstrichStorePrototype.searchTriplesDeltaMaterialized = function(
  subject: string | undefined | null,
  predicate: string | undefined | null,
  object: string | undefined | null,
  options?: { offset?: number; limit?: number; versionStart?: number; versionEnd?: number },
): Promise<{ triples: ITripleDeltaRaw[]; totalCount: number; hasExactCount: boolean }> {
  return new Promise((resolve, reject) => {
    if (this.closed) {
      reject(new Error('Ostrich cannot be read because it is closed'));
    }
    if (this.maxVersion < 0) {
      reject(new Error('An empty store can not be queried.'));
    }
    if (typeof subject !== 'string' || subject.startsWith('?')) {
      subject = '';
    }
    if (typeof predicate !== 'string' || predicate.startsWith('?')) {
      predicate = '';
    }
    if (typeof object !== 'string' || object.startsWith('?')) {
      object = '';
    }
    const offset = options && options.offset ? Math.max(0, options.offset) : 0;
    const limit = options && options.limit ? Math.max(0, options.limit) : 0;
    const versionStart = options?.versionStart;
    const versionEnd = options?.versionEnd;
    if (versionStart === undefined) {
      return reject(new Error('A `versionStart` option must be defined.'));
    }
    if (versionEnd === undefined) {
      return reject(new Error('A `versionEnd` option must be defined.'));
    }
    if (versionStart >= versionEnd) {
      return reject(new Error('`versionStart` must be strictly smaller than `versionEnd`.'));
    }
    if (versionEnd > this.maxVersion) {
      return reject(new Error('`versionEnd` can not be larger than the maximum version.'));
    }
    this._operations++;
    this._searchTriplesDeltaMaterialized(
      subject,
      predicate,
      object,
      offset,
      limit,
      versionStart,
      versionEnd,
      (error: Error, triples: ITripleDeltaRaw[], totalCount: number, hasExactCount: boolean) => {
        this._operations--;
        this._finishOperation();
        if (error) {
          reject(error);
        }
        resolve({ triples, totalCount, hasExactCount });
      },
    );
  });
};

/**
 * Gives an approximate number of matches of triples with the given subject, predicate, object,
 * versionStart and versionEnd for a delta materialized query.
 * @param subject An RDF term.
 * @param predicate An RDF term.
 * @param object An RDF term.
 * @param versionStart The initial version.
 * @param versionEnd The final version.
 */
OstrichStorePrototype.countTriplesDeltaMaterialized = function(
  subject: string | undefined | null,
  predicate: string | undefined | null,
  object: string | undefined | null,
  versionStart: number,
  versionEnd: number,
): Promise<{ totalCount: number; hasExactCount: boolean }> {
  return new Promise((resolve, reject) => {
    (<OstrichStore> this).searchTriplesDeltaMaterialized(
      subject,
      predicate,
      object,
      { offset: 0, limit: 1, versionStart, versionEnd },
    )
      .then(({ totalCount, hasExactCount }) => {
        resolve({ totalCount, hasExactCount });
      })
      .catch((error: Error) => reject(error));
  });
};

/**
 * Searches the document for triples with the given subject, predicate and object for a version query.
 * @param subject An RDF term.
 * @param predicate An RDF term.
 * @param object An RDF term.
 * @param options Options
 */
OstrichStorePrototype.searchTriplesVersion = function(
  subject: string | undefined | null,
  predicate: string | undefined | null,
  object: string | undefined | null,
  options?: { offset?: number; limit?: number },
): Promise<{ triples: ITripleVersionRaw[]; totalCount: number; hasExactCount: boolean }> {
  return new Promise((resolve, reject) => {
    if (this.closed) {
      reject(new Error('Ostrich cannot be read because it is closed'));
    }
    if (this.maxVersion < 0) {
      reject(new Error('An empty store can not be queried.'));
    }
    if (typeof subject !== 'string' || subject.startsWith('?')) {
      subject = '';
    }
    if (typeof predicate !== 'string' || predicate.startsWith('?')) {
      predicate = '';
    }
    if (typeof object !== 'string' || object.startsWith('?')) {
      object = '';
    }
    const offset = options && options.offset ? Math.max(0, options.offset) : 0;
    const limit = options && options.limit ? Math.max(0, options.limit) : 0;

    this._operations++;
    this._searchTriplesVersion(
      subject,
      predicate,
      object,
      offset,
      limit,
      (error: Error, triples: ITripleVersionRaw[], totalCount: number, hasExactCount: boolean) => {
        this._operations--;
        this._finishOperation();
        if (error) {
          reject(error);
        }
        resolve({ triples, totalCount, hasExactCount });
      },
    );
  });
};

/**
 * Gives an approximate number of matches of triples with the given subject, predicate and object for a version query.
 * @param subject An RDF term.
 * @param predicate An RDF term.
 * @param object An RDF term.
 */
OstrichStorePrototype.countTriplesVersion = function(
  subject: string | undefined | null,
  predicate: string | undefined | null,
  object: string | undefined | null,
): Promise<{ totalCount: number; hasExactCount: boolean }> {
  return new Promise((resolve, reject) => {
    (<OstrichStore> this).searchTriplesVersion(subject, predicate, object, { offset: 0, limit: 1 })
      .then(({ totalCount, hasExactCount }) => {
        resolve({ totalCount, hasExactCount });
      })
      .catch((error: Error) => reject(error));
  });
};

/**
 * Appends the given triples.
 * @param triples The triples to append, annotated with addition: true or false as the given version.
 * @param version The version to append at, defaults to the last version
 */
OstrichStorePrototype.append = function(triples: ITripleDeltaRaw[], version = -1): Promise<number> {
  // Make sure our triples are sorted
  triples = triples.sort((left, right) => {
    const compS = strcmp(left.subject, right.subject);
    if (compS === 0) {
      const compP = strcmp(left.predicate, right.predicate);
      if (compP === 0) {
        return strcmp(left.object, right.object);
      }
      return compP;
    }
    return compS;
  });

  return this.appendSorted(triples, version);
};

/**
 * Appends the given triples.
 * The array is assumed to be sorted in SPO-order.
 * @param triples The triples to append, annotated with addition: true or false as the given version.
 * @param version The version to append at, defaults to the last version
 */
OstrichStorePrototype.appendSorted = function(triples: ITripleDeltaRaw[], version = -1): Promise<number> {
  return new Promise((resolve, reject) => {
    if (this.closed) {
      reject(new Error('Ostrich cannot be read because it is closed'));
    }
    if (this.readOnly) {
      reject(new Error('Can not append to Ostrich store in read-only mode'));
    }

    this._operations++;
    this._append(version, triples, (error: Error, insertedCount: number) => {
      this._operations--;
      this._finishOperation();
      if (error) {
        reject(error);
      }
      resolve(insertedCount);
    });
  });
};

OstrichStorePrototype._finishOperation = function() {
  // Call the operations-callbacks if no operations are going on anymore.
  if (!this._operations) {
    for (const cb of this._operationsCallbacks) {
      cb();
    }
  }
};

OstrichStorePrototype.close = function(remove = false): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    this._closeInternal(remove, (error?: Error) => {
      if (error) {
        return reject(error);
      }
      resolve();
    });
  });
};

OstrichStorePrototype._closeInternal = function(remove: boolean, callback: (error?: Error) => void) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias,consistent-this
  const self: OstrichStore = this;
  if (this._isClosingCallbacks) {
    this._isClosingCallbacks.push(callbackSafe);
    return;
  }
  this._isClosingCallbacks = [ callbackSafe ];
  // If no appends are being done, close immediately,
  // otherwise wait for appends to finish.
  if (!this._operations) {
    this._close(remove, onClosed);
  } else {
    this._operationsCallbacks.push(() => {
      self._close(remove, onClosed);
    });
  }

  function onClosed(error?: Error): void {
    self._isClosingCallbacks?.forEach((cb: (error?: Error) => void) => cb(error));
    delete self._isClosingCallbacks;
  }

  function callbackSafe(error: Error): void {
    if (callback) {
      return callback(error);
    }
  }
};

/*     Module exports     */

/**
 * Creates an Ostrich store for the given path.
 * @param path
 * @param readOnly
 * @param strategyName
 * @param strategyParameter
 */
export function fromPath(
  path: string,
  readOnly?: boolean,
  strategyName?: string,
  strategyParameter?: string,
): Promise<OstrichStore> {
  return new Promise((resolve, reject) => {
    if (typeof path !== 'string' || path.length === 0) {
      reject(new Error(`Invalid path: ${path}`));
    }
    if (!path.endsWith('/')) {
      path += '/';
    }

    if (typeof strategyName !== 'string') {
      strategyName = 'never';
      strategyParameter = '0';
    }

    // eslint-disable-next-line no-sync
    if (!readOnly && !fs.existsSync(path)) {
      // eslint-disable-next-line no-sync
      fs.mkdirSync(path);
    }

    // Construct the native OstrichStore
    ostrichNative.createOstrichStore(
      path,
      readOnly,
      strategyName,
      strategyParameter,
      (error: Error, document: OstrichStore) => {
        // Abort the creation if any error occurred
        if (error) {
          reject(error);
        }
        // Document the features
        document.features = Object.freeze({
          searchTriplesVersionMaterialized: true,
          countTriplesVersionMaterialized: true,
          searchTriplesDeltaMaterialized: true,
          countTriplesDeltaMaterialized: true,
          searchTriplesVersion: true,
          countTriplesVersion: true,
          appendVersionedTriples: !readOnly,
        });
        document.readOnly = Boolean(readOnly);
        document._operations = 0;
        document._operationsCallbacks = [];
        resolve(document);
      },
    );
  });
}
