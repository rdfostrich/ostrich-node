import * as fs from 'fs';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { quadToStringQuad, stringQuadToQuad, termToString } from 'rdf-string';
import type { IOstrichStoreNative } from './IOstrichStoreNative';
import type { IQuadDelta, IQuadVersion } from './utils';
import { serializeTerm, strcmp } from './utils';
const ostrichNative = require('../build/Release/ostrich.node');

/**
 * A class for accessing an OSTRICH archive.
 */
export class OstrichStore {
  public _operations = 0;
  public _operationsCallbacks: (() => void)[] = [];
  public _isClosingCallbacks?: ((error: Error) => void)[];

  public constructor(
    public readonly native: IOstrichStoreNative,
    public readonly dataFactory: RDF.DataFactory,
    public readonly readOnly: boolean,
    public readonly features: Record<string, boolean>,
  ) {}

  /**
   * The number of available versions.
   */
  public get maxVersion(): number {
    return this.native.maxVersion;
  }

  /**
   * If the store was closed.
   */
  public get closed(): boolean {
    return this.native.closed;
  }

  /**
   * Searches the document for triples with the given subject, predicate, object and version
   * for a version materialized query.
   * @param subject An RDF term.
   * @param predicate An RDF term.
   * @param object An RDF term.
   * @param options Options
   */
  public searchTriplesVersionMaterialized(
    subject: RDF.Term | undefined | null,
    predicate: RDF.Term | undefined | null,
    object: RDF.Term | undefined | null,
    options?: { offset?: number; limit?: number; version?: number },
  ): Promise<{ triples: RDF.Quad[]; totalCount: number; hasExactCount: boolean }> {
    return new Promise((resolve, reject) => {
      if (this.closed) {
        return reject(new Error('Attempted to query a closed OSTRICH store'));
      }
      if (this.maxVersion < 0) {
        return reject(new Error('Attempted to query an OSTRICH store without versions'));
      }
      const offset = options && options.offset ? Math.max(0, options.offset) : 0;
      const limit = options && options.limit ? Math.max(0, options.limit) : 0;
      const version = options && (options.version || options.version === 0) ? options.version : -1;
      this._operations++;
      this.native._searchTriplesVersionMaterialized(
        serializeTerm(subject),
        serializeTerm(predicate),
        serializeTerm(object),
        offset,
        limit,
        version,
        (error, triples, totalCount, hasExactCount) => {
          this._operations--;
          this._finishOperation();
          if (error) {
            return reject(error);
          }
          resolve({ triples: triples.map(triple => stringQuadToQuad(triple)), totalCount, hasExactCount });
        },
      );
    });
  }

  /**
   * Gives an approximate number of matches of triples with the given subject, predicate, object and version
   * for a version materialized query.
   * @param subject An RDF term.
   * @param predicate An RDF term.
   * @param object An RDF term.
   * @param version The version to obtain.
   */
  public async countTriplesVersionMaterialized(
    subject: RDF.Term | undefined | null,
    predicate: RDF.Term | undefined | null,
    object: RDF.Term | undefined | null,
    version = -1,
  ): Promise<{ totalCount: number; hasExactCount: boolean }> {
    const { totalCount, hasExactCount } = await this
      .searchTriplesVersionMaterialized(subject, predicate, object, { version, offset: 0, limit: 1 });
    return { totalCount, hasExactCount };
  }

  /**
   * Searches the document for triples with the given subject, predicate, object, versionStart and versionEnd
   * for a delta materialized query.
   * @param subject An RDF term.
   * @param predicate An RDF term.
   * @param object An RDF term.
   * @param options Options
   */
  public searchTriplesDeltaMaterialized(
    subject: RDF.Term | undefined | null,
    predicate: RDF.Term | undefined | null,
    object: RDF.Term | undefined | null,
    options: { offset?: number; limit?: number; versionStart: number; versionEnd: number },
  ): Promise<{ triples: IQuadDelta[]; totalCount: number; hasExactCount: boolean }> {
    return new Promise((resolve, reject) => {
      if (this.closed) {
        return reject(new Error('Attempted to query a closed OSTRICH store'));
      }
      if (this.maxVersion < 0) {
        return reject(new Error('Attempted to query an OSTRICH store without versions'));
      }
      const offset = options.offset ? Math.max(0, options.offset) : 0;
      const limit = options.limit ? Math.max(0, options.limit) : 0;
      const versionStart = options.versionStart;
      const versionEnd = options.versionEnd;
      if (versionStart >= versionEnd) {
        return reject(new Error(`'versionStart' must be strictly smaller than 'versionEnd'`));
      }
      if (versionEnd > this.maxVersion) {
        return reject(new Error(`'versionEnd' can not be larger than the maximum version (${this.maxVersion})`));
      }
      this._operations++;
      this.native._searchTriplesDeltaMaterialized(
        serializeTerm(subject),
        serializeTerm(predicate),
        serializeTerm(object),
        offset,
        limit,
        versionStart,
        versionEnd,
        (error, triples, totalCount, hasExactCount) => {
          this._operations--;
          this._finishOperation();
          if (error) {
            return reject(error);
          }
          resolve({
            triples: <IQuadDelta[]> triples.map(triple => {
              const quad = stringQuadToQuad(triple);
              Object.assign(quad, { addition: triple.addition });
              return quad;
            }),
            totalCount,
            hasExactCount,
          });
        },
      );
    });
  }

  /**
   * Gives an approximate number of matches of triples with the given subject, predicate, object,
   * versionStart and versionEnd for a delta materialized query.
   * @param subject An RDF term.
   * @param predicate An RDF term.
   * @param object An RDF term.
   * @param versionStart The initial version.
   * @param versionEnd The final version.
   */
  public async countTriplesDeltaMaterialized(
    subject: RDF.Term | undefined | null,
    predicate: RDF.Term | undefined | null,
    object: RDF.Term | undefined | null,
    versionStart: number,
    versionEnd: number,
  ): Promise<{ totalCount: number; hasExactCount: boolean }> {
    const { totalCount, hasExactCount } = await this.searchTriplesDeltaMaterialized(
      subject,
      predicate,
      object,
      { offset: 0, limit: 1, versionStart, versionEnd },
    );
    return { totalCount, hasExactCount };
  }

  /**
   * Searches the document for triples with the given subject, predicate and object for a version query.
   * @param subject An RDF term.
   * @param predicate An RDF term.
   * @param object An RDF term.
   * @param options Options
   */
  public searchTriplesVersion(
    subject: RDF.Term | undefined | null,
    predicate: RDF.Term | undefined | null,
    object: RDF.Term | undefined | null,
    options?: { offset?: number; limit?: number },
  ): Promise<{ triples: IQuadVersion[]; totalCount: number; hasExactCount: boolean }> {
    return new Promise((resolve, reject) => {
      if (this.closed) {
        return reject(new Error('Attempted to query a closed OSTRICH store'));
      }
      if (this.maxVersion < 0) {
        return reject(new Error('Attempted to query an OSTRICH store without versions'));
      }
      const offset = options && options.offset ? Math.max(0, options.offset) : 0;
      const limit = options && options.limit ? Math.max(0, options.limit) : 0;

      this._operations++;
      this.native._searchTriplesVersion(
        serializeTerm(subject),
        serializeTerm(predicate),
        serializeTerm(object),
        offset,
        limit,
        (error, triples, totalCount, hasExactCount) => {
          this._operations--;
          this._finishOperation();
          if (error) {
            return reject(error);
          }
          resolve({
            triples: <IQuadVersion[]> triples.map(triple => {
              const quad = stringQuadToQuad(triple);
              Object.assign(quad, { versions: triple.versions });
              return quad;
            }),
            totalCount,
            hasExactCount,
          });
        },
      );
    });
  }

  /**
   * Gives an approximate number of matches of triples with the given subject, predicate and object for a version query.
   * @param subject An RDF term.
   * @param predicate An RDF term.
   * @param object An RDF term.
   */
  public async countTriplesVersion(
    subject: RDF.Term | undefined | null,
    predicate: RDF.Term | undefined | null,
    object: RDF.Term | undefined | null,
  ): Promise<{ totalCount: number; hasExactCount: boolean }> {
    const { totalCount, hasExactCount } = await this
      .searchTriplesVersion(subject, predicate, object, { offset: 0, limit: 1 });
    return { totalCount, hasExactCount };
  }

  /**
   * Appends the given triples.
   * @param triples The triples to append, annotated with addition: true or false as the given version.
   * @param version The version to append at, defaults to the last version
   */
  public append(triples: IQuadDelta[], version = -1): Promise<number> {
    // Make sure our triples are sorted
    triples = triples.sort((left, right) => {
      const compS = strcmp(termToString(left.subject), termToString(right.subject));
      if (compS === 0) {
        const compP = strcmp(termToString(left.predicate), termToString(right.predicate));
        if (compP === 0) {
          return strcmp(termToString(left.object), termToString(right.object));
        }
        return compP;
      }
      return compS;
    });

    return this.appendSorted(triples, version);
  }

  /**
   * Appends the given triples.
   * The array is assumed to be sorted in SPO-order.
   * @param triples The triples to append, annotated with addition: true or false as the given version.
   * @param version The version to append at, defaults to the last version
   */
  public appendSorted(triples: IQuadDelta[], version = -1): Promise<number> {
    return new Promise((resolve, reject) => {
      if (this.closed) {
        return reject(new Error('Attempted to append to a closed OSTRICH store'));
      }
      if (this.readOnly) {
        return reject(new Error('Attempted to append to an OSTRICH store in read-only mode'));
      }

      this._operations++;
      if (version === -1) {
        version = this.maxVersion + 1;
      }
      this.native._append(
        version,
        triples.map(triple => ({ addition: triple.addition, ...quadToStringQuad(triple) })),
        (error, insertedCount) => {
          this._operations--;
          this._finishOperation();
          if (error) {
            return reject(error);
          }
          resolve(insertedCount);
        },
      );
    });
  }

  protected _finishOperation(): void {
    // Call the operations-callbacks if no operations are going on anymore.
    if (!this._operations) {
      for (const cb of this._operationsCallbacks) {
        cb();
      }
    }
  }

  public close(remove = false): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._closeInternal(remove, (error?: Error) => {
        if (error) {
          return reject(error);
        }
        resolve();
      });
    });
  }

  protected _closeInternal(remove: boolean, callback: (error?: Error) => void): void {
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
      this.native._close(remove, onClosed);
    } else {
      this._operationsCallbacks.push(() => {
        self.native._close(remove, onClosed);
      });
    }

    function onClosed(error?: Error): void {
      self._isClosingCallbacks!.forEach((cb: (error: Error) => void) => cb(error!));
      delete self._isClosingCallbacks;
    }

    function callbackSafe(error: Error): void {
      if (callback) {
        return callback(error);
      }
    }
  }
}

/**
 * Creates an Ostrich store for the given path.
 * @param path Path to an OSTRICH store.
 * @param options Options for opening the store.
 */
export function fromPath(
  path: string,
  options?: {
    readOnly?: boolean;
    strategyName?: string;
    strategyParameter?: string;
    dataFactory?: RDF.DataFactory;
  },
): Promise<OstrichStore> {
  return new Promise((resolve, reject) => {
    if (typeof path !== 'string' || path.length === 0) {
      reject(new Error(`Invalid path: ${path}`));
    }
    if (!path.endsWith('/')) {
      path += '/';
    }

    if (!options) {
      options = {};
    }

    if (typeof options.strategyName !== 'string') {
      options.strategyName = 'never';
      options.strategyParameter = '0';
    }

    // eslint-disable-next-line no-sync
    if (!options.readOnly && !fs.existsSync(path)) {
      try {
        // eslint-disable-next-line no-sync
        fs.mkdirSync(path);
      } catch (error: unknown) {
        throw new Error(`Unable to create new OSTRICH store at '${path}': ${(<Error> error).message}`);
      }
    }

    // Construct the native OstrichStore
    ostrichNative.createOstrichStore(
      path,
      options.readOnly,
      options.strategyName,
      options.strategyParameter,
      (error: Error, native: IOstrichStoreNative) => {
        // Abort the creation if any error occurred
        if (error) {
          return reject(error);
        }
        const document = new OstrichStore(
          native,
          options!.dataFactory || new DataFactory(),
          Boolean(options!.readOnly),
          Object.freeze({
            searchTriplesVersionMaterialized: true,
            countTriplesVersionMaterialized: true,
            searchTriplesDeltaMaterialized: true,
            countTriplesDeltaMaterialized: true,
            searchTriplesVersion: true,
            countTriplesVersion: true,
            appendVersionedTriples: !options!.readOnly,
          }),
        );
        resolve(document);
      },
    );
  });
}
