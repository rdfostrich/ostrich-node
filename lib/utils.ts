import type * as RDF from '@rdfjs/types';
import type { IStringQuad } from 'rdf-string';
import { termToString } from 'rdf-string';

/**
 * A string comparison function that is consistent with the sorting that happens in the string::compare function in C++
 * @param left The left term string.
 * @param right The right term string.
 */
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

/**
 * Convert a term to an OSTRICH-supported string.
 * @param term An RDF/JS term.
 */
export function serializeTerm(term: RDF.Term | undefined | null): string | null {
  if (!term || term.termType === 'Variable') {
    return '';
  }
  return termToString(term);
}

/**
 * Convert an RDF/JS quad to a delta quad.
 * @param quad An RDF/JS quad.
 * @param addition If the delta is an addition or deletion.
 */
export function quadDelta(quad: RDF.Quad, addition: boolean): IQuadDelta {
  Object.assign(quad, { addition });
  return <IQuadDelta> quad;
}

/**
 * Convert an RDF/JS quad to a version quad.
 * @param quad An RDF/JS quad.
 * @param versions The versions.
 */
export function quadVersion(quad: RDF.Quad, versions: number[]): IQuadVersion {
  Object.assign(quad, { versions });
  return <IQuadVersion> quad;
}

export interface IStringQuadDelta extends IStringQuad {
  addition: boolean;
}

export interface IStringQuadVersion extends IStringQuad {
  versions: number[];
}

export interface IQuadDelta extends RDF.Quad {
  addition: boolean;
}

export interface IQuadVersion extends RDF.Quad {
  versions: number[];
}
