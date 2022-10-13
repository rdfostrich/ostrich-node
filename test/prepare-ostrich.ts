import type { OstrichStore } from '../lib/OstrichStore';
import { quadDelta } from '../lib/utils';

const fs = require('fs');
const path = require('path');
const quad = require('rdf-quad');
const ostrich = require('../lib/OstrichStore');

// eslint-disable-next-line multiline-comment-style
/*
0:
 <a> <a> "a"^^<http://example.org/literal> .
 <a> <a> "b"^^<http://example.org/literal> .
 <a> <b> <a> .
 <a> <b> <c> .
 <a> <b> <d> .
 <a> <b> <f> .
 <a> <b> <z> .
 <c> <c> <c> .

1:
 <a> <a> "a"^^<http://example.org/literal> .
 <a> <b> <c> .
 <a> <b> <d> .
 <a> <b> <f> .
 <c> <c> <c> .
 <a> <a> "z"^^<http://example.org/literal> .
 <a> <b> <g> .
 <f> <f> <f> .
 <z> <z> <z> .

2:
 <a> <a> "a"^^<http://example.org/literal> .
 <a> <b> <c> .
 <a> <b> <d> .
 <a> <b> <f> .
 <c> <c> <c> .
 <a> <b> <g> .
 <f> <r> <s> .
 <q> <q> <q> .
 <r> <r> <r> .
 <z> <z> <z> .

3:
 <a> <a> "a"^^<http://example.org/literal> .
 <a> <b> <c> .
 <a> <b> <d> .
 <a> <b> <f> .
 <c> <c> <c> .
 <a> <b> <g> .
 <f> <r> <s> .
 <q> <q> <q> .
 <r> <r> <r> .
 <z> <z> "z"^^<http://example.org/literal> .

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

2 -> 3:
 - <z> <z> <z> .
 + <z> <z> "z"^^<http://example.org/literal> .
*/

const dataV0 = [
  quadDelta(quad('a', 'a', '"a"^^<http://example.org/literal>'), true),
  quadDelta(quad('a', 'a', '"b"^^<http://example.org/literal>'), true),
  quadDelta(quad('a', 'b', 'a'), true),
  quadDelta(quad('a', 'b', 'c'), true),
  quadDelta(quad('a', 'b', 'd'), true),
  quadDelta(quad('a', 'b', 'f'), true),
  quadDelta(quad('a', 'b', 'z'), true),
  quadDelta(quad('c', 'c', 'c'), true),
];

const dataV1 = [
  quadDelta(quad('a', 'a', '"b"^^<http://example.org/literal>'), false),
  quadDelta(quad('a', 'a', '"z"^^<http://example.org/literal>'), true),
  quadDelta(quad('a', 'b', 'a'), false),
  quadDelta(quad('a', 'b', 'g'), true),
  quadDelta(quad('a', 'b', 'z'), false),
  quadDelta(quad('f', 'f', 'f'), true),
  quadDelta(quad('z', 'z', 'z'), true),
];

const dataV2 = [
  quadDelta(quad('a', 'a', '"z"^^<http://example.org/literal>'), false),
  quadDelta(quad('f', 'f', 'f'), false),
  quadDelta(quad('f', 'r', 's'), true),
  quadDelta(quad('q', 'q', 'q'), true),
  quadDelta(quad('r', 'r', 'r'), true),
];

const dataV3 = [
  quadDelta(quad('z', 'z', 'z'), false),
  quadDelta(quad('z', 'z', '"z"^^<http://example.org/literal>'), true),
];

export async function initializeThreeVersions(tag: string): Promise<OstrichStore> {
  const ostrichStore = await ostrich.fromPath(`./test/test-${tag}.ostrich`, false);
  await ostrichStore.append(dataV0, 0);
  await ostrichStore.append(dataV1, 1);
  await ostrichStore.append(dataV2, 2);
  return ostrichStore;
}

export async function initializeFourVersions(): Promise<OstrichStore> {
  const ostrichStore = await ostrich.fromPath('./test/test.ostrich', false, 'interval', '2');
  await ostrichStore.append(dataV0, 0);
  await ostrichStore.append(dataV1, 1);
  await ostrichStore.append(dataV2, 2);
  await ostrichStore.append(dataV3, 3);
  return ostrichStore;
}

export function cleanUp(tag: string): void {
  const name = `./test/test-${tag}.ostrich`;
  if (fs.existsSync(name)) {
    const files = fs.readdirSync(name);
    for (const file of files) {
      fs.unlinkSync(path.join(name, file));
    }
  }
}

export async function closeAndCleanUp(ostrichStore: OstrichStore, tag: string): Promise<void> {
  await ostrichStore.close();
  cleanUp(tag);
}
