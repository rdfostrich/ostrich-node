# Ostrich for Node.js
[![Build Status](https://travis-ci.org/rdfostrich/ostrich-node.svg?branch=master)](https://travis-ci.org/rdfostrich/ostrich-node)
[![npm version](https://badge.fury.io/js/ostrich-bindings.svg)](https://www.npmjs.com/package/ostrich-bindings)
[![DOI](https://zenodo.org/badge/97819900.svg)](https://zenodo.org/badge/latestdoi/97819900)

This package provides TypeScript/JavaScript bindings for [OSTRICH](https://github.com/rdfostrich/ostrich/) RDF archives.

Concretely, it has the following features:
* Creating a new OSTRICH store
* Appending to an OSTRICH store
* Querying (VM/DM/VQ) an OSTRICH store by triple pattern.
* Obtaining cardinality estimates (VM/DM/VQ) in an OSTRICH store by triple pattern.

## Installation

```bash
$ npm install ostrich-bindings
```
or
```bash
$ yarn add ostrich-bindings
```

**WARNING**: OSTRICH requires ZLib, Kyoto Cabinet and CMake (compilation only) to be installed.
See [`install-kc-ci.sh`](https://github.com/rdfostrich/ostrich-node/blob/master/install-kc-ci.sh) on how to install Kyoto Cabinet.

## Usage

### Opening and closing

An OSTRICH store can be opened using `fromPath`,
which takes path name and an option object.
The OSTRICH document will be passed to the callback.
Close the document with `close`.

```TypeScript
import { fromPath } from 'ostrich-bindings';

const store = await fromPath('./test/test.ostrich');

// --- Do stuff ---

// Don't forget to close the store when you're done
await store.close();
```

By default, a store will be opened in read-only mode, which will be faster.
To enable writing, open the store as follows:

```JavaScript
import { fromPath } from 'ostrich-bindings';

const store = await fromPath('./test/test.ostrich', { readOnly: false });

// --- Do stuff ---

// Don't forget to close the store when you're done
await store.close();
```

Checking if a store is closed can be done via the field `store.closed`;

### Reading the number of versions

The number of versions available in a store can be read as follows:

```typescript
console.log(store.maxVersion);
```

### Searching for triples matching a pattern in a certain version (VM)

Search for triples with `searchTriplesVersionMaterialized`,
which takes subject, predicate, object, options, and callback arguments.

Subject, predicate, and object can be IRIs or literals,
[represented as RDF/JS terms](https://rdf.js.org/data-model-spec/#term-interface).
If any of these parameters is `null` or a variable, it is considered a wildcard.

Optionally, a version, offset and limit can be passed in an options object,
The version parameter will default to the latest available version if it is not provided.
The offset and limit parameters will select only the specified subset.

The async function will return an array of triples that match the pattern,
and a field indicating an estimate of the total number of matching triples.

```JavaScript
import { fromPath } from 'ostrich-bindings';

const store = await fromPath('./test/test.ostrich', { readOnly: false });

const { triples, totalCount } = await ostrichStore
    .searchTriplesVersionMaterialized('http://example.org/s1', null, null, { version: 1, offset: 0, limit: 10 });
console.log('Approximately ' + totalCount + ' triples match the pattern in the given version.');
console.log(triples);

await ostrichStore.close();
```

### Counting triples matching a pattern in a certain version (VM)

Retrieve an estimate of the total number of triples matching a pattern in a certain version with `countTriplesVersionMaterialized`,
which takes subject, predicate, object, version (optional), and callback arguments.

```JavaScript
import { fromPath } from 'ostrich-bindings';

const store = await fromPath('./test/test.ostrich', { readOnly: false });

const { totalCount } = await ostrichStore
    .countTriplesVersionMaterialized('http://example.org/s1', null, null, { version: 1, offset: 0, limit: 10 });
console.log('Approximately ' + totalCount + ' triples match the pattern in the given version.');

await ostrichStore.close();
```

### Searching for triple differences matching a pattern between two versions (DM)

Similar to `searchTriplesVersionMaterialized`, `searchTriplesDeltaMaterialized`
allows you to search triples matching a pattern that are changed between two given versions.
Each triple is annotated with an `addition` field,
indicating whether or not it has been added relative to the two versions. 

The options object now takes the mandatory `versionStart` and `versionEnd` parameters.

```JavaScript
import { fromPath } from 'ostrich-bindings';

const store = await fromPath('./test/test.ostrich', { readOnly: false });

const { triples, totalCount } = await ostrichStore
    .searchTriplesDeltaMaterialized('http://example.org/s1', null, null, { versionStart: 0, versionEnd: 2, offset: 0, limit: 10 });
console.log('Approximately ' + totalCount + ' triples match the pattern between the two given versions.');
console.log(triples);

await ostrichStore.close();
```

### Counting triples matching a pattern between two versions (DM)

Retrieve an estimate of the total number of triples matching a pattern in a certain version with `countTriplesDeltaMaterialized`,
which takes subject, predicate, object, versionStart, versionEnd, and callback arguments.

```JavaScript
import { fromPath } from 'ostrich-bindings';

const store = await fromPath('./test/test.ostrich', { readOnly: false });

const { totalCount } = await ostrichStore
    .countTriplesDeltaMaterialized('http://example.org/s1', null, null, { versionStart: 0, versionEnd: 2, offset: 0, limit: 10 });
console.log('Approximately ' + totalCount + ' triples match the pattern between the two given versions.');

await ostrichStore.close();
```

### Searching for triples matching a pattern with version annotations (VQ)

Finally, `searchTriplesVersion`
allows you to search triples matching a pattern over all versions.
Each triple is annotated with a list `versions` for all the versions it is present it. 

```JavaScript
import { fromPath } from 'ostrich-bindings';

const store = await fromPath('./test/test.ostrich', { readOnly: false });

const { triples, totalCount } = await ostrichStore
    .searchTriplesVersion('http://example.org/s1', null, null, { offset: 0, limit: 10 });
console.log('Approximately ' + totalCount + ' triples match the pattern in all versions.');
console.log(triples); // TODO

await ostrichStore.close();
```

### Counting triples matching a pattern (VQ)

Retrieve an estimate of the total number of triples matching a pattern over all version in a certain version with `countTriplesVersion`,
which takes subject, predicate, object, and callback arguments.

```JavaScript
import { fromPath } from 'ostrich-bindings';

const store = await fromPath('./test/test.ostrich', { readOnly: false });

const { totalCount } = await ostrichStore
    .countTriplesVersion('http://example.org/s1', null, null, { offset: 0, limit: 10 });
console.log('Approximately ' + totalCount + ' triples match the pattern in all versions.');

await ostrichStore.close();
```

### Appending a new version

Inserts a new version into the store, with the given optional version id and an array of triples, annotated with `addition: true` or `addition: false`.
In the first version (0), all triples MUST be additions.

```JavaScript
import { fromPath } from 'ostrich-bindings';
import { DataFactory } from 'rdf-data-factory';

const store = await fromPath('./test/test.ostrich', { readOnly: false });

const { totalCount } = await ostrichStore.append([
    quadDelta()
]);
console.log('Approximately ' + totalCount + ' triples match the pattern in all versions.');

await ostrichStore.close();


ostrich.fromPath('./test/test.ostrich', false, function (error, ostrichStore) {
  ostrichStore.append(0, [{ subject: 'a', predicate: 'b', object: 'c', addition: true }, { subject: 'a', predicate: 'b', object: 'd', addition: true }],
    function (error, insertedCount) {
      console.log('Inserted ' + insertedCount + ' triples in version ' + ostrichStore.store.maxVersion);
      ostrichStore.close();
    });
});
```

Note: if the array of triples is already sorted in SPO-order,
`appendSorted` can be called which will result in better performance.
Behaviour is undefined if this is called with an array that is not sorted.

## Standalone utility

The command-line utility `ostrich` allows you to query OSTRICH dataset from the command line.

To install system-wide, execute:
```bash
npm install -g ostrich-bindings
```

Specify queries as follows:
```
ostrich vm dataset.ostrich '?s ?p ?o' --offset 200 --limit 100 --version 1 --format turtle
ostrich dm dataset.ostrich '?s ?p ?o' --offset 200 --limit 100 --versionStart 0 --versionEnd 2
ostrich vq dataset.ostrich '?s ?p ?o' --offset 200 --limit 100
```
Replace any of the query variables by an [IRI or literal](https://www.npmjs.com/package/rdf-string) to match specific patterns.

Or with less verbose parameters:
```
ostrich vm dataset.ostrich '?s ?p ?o' -o 200 -l 100 -v 1 -f turtle
ostrich dm dataset.ostrich '?s ?p ?o' -o 200 -l 100 -s 0 -e 2
ostrich vq dataset.ostrich '?s ?p ?o' -o 200 -l 100
```

## Build manually

To build the module from source, follow these instructions:
```Shell
git clone --recurse-submodules git@github.com:rdfostrich/ostrich-node.git
cd ostrich-node
yarn install
yarn run test
```

If you make changes to the source, do the following to rebuild:
```bash
yarn install
```

## License
This software is written by [Ruben Taelman](http://rubensworks.net/), Miel Vander Sande, and Olivier Pelgrin.

This code is copyrighted by [Ghent University – imec](http://idlab.ugent.be/)
and released under the [MIT license](http://opensource.org/licenses/MIT).
