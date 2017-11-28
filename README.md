# Ostrich for Node.js
[![Build Status](https://travis-ci.org/rdfostrich/ostrich-node.svg?branch=master)](https://travis-ci.org/rdfostrich/ostrich-node)
[![npm version](https://badge.fury.io/js/ostrich-bindings.svg)](https://www.npmjs.com/package/ostrich-bindings)
[![DOI](https://zenodo.org/badge/97819900.svg)](https://zenodo.org/badge/latestdoi/97819900)

[OSTRICH](https://github.com/rdfostrich/ostrich/) is a triple store with versioning support.

This `ostrich-bindings` package for Node.js provides C++ bindings to enable querying support from JavaScript.

## Usage

OSTRICH requires ZLib, Kyoto Cabinet and CMake (compilation only) to be installed.

### Importing the library
Install the library by adding `ostrich-bindings` to your `package.json` or executing

```bash
$ npm install ostrich-bindings
```

Then require the library.

```JavaScript
var ostrich = require('ostrich-bindings');
```

### Opening and closing an OSTRICH store

Open an OSTRICH folder with `ostrich.fromPath`,
which takes folder name and callback arguments.
The OSTRICH document will be passed to the callback.
Close the document with `close`.

```JavaScript
ostrich.fromPath('./test/test.ostrich', function (error, ostrichStore) {
  // Don't forget to close the store when you're done
  ostrichStore.close();
});
```

By default, a store will be opened in read-only mode, which will be faster.
To enable writing, open the store as follows:

```JavaScript
ostrich.fromPath('./test/test.ostrich', false, function (error, ostrichStore) {
  // Don't forget to close the store when you're done
  ostrichStore.close();
});
```

### Searching for triples matching a pattern in a certain version
Search for triples with `searchTriplesVersionMaterialized`,
which takes subject, predicate, object, options, and callback arguments.
Subject, predicate, and object can be IRIs or literals,
[represented as simple strings](https://github.com/RubenVerborgh/N3.js#triple-representation).
If any of these parameters is `null` or a variable, it is considered a wildcard.
Optionally, a version, offset and limit can be passed in an options object,
The version parameter will default to the latest available version if it is not provided.
The offset and limit parameters will select only the specified subset.

The callback returns an array of triples that match the pattern.
A third parameter indicates an estimate of the total number of matching triples.

```JavaScript
ostrich.fromPath('./test/test.ostrich', function (error, ostrichStore) {
  ostrichStore.searchTriplesVersionMaterialized('http://example.org/s1', null, null, { version: 1, offset: 0, limit: 10 },
    function (error, triples, totalCount) {
      console.log('Approximately ' + totalCount + ' triples match the pattern in the given version.');
      triples.forEach(function (triple) { console.log(triple); });
      ostrichStore.close();
    });
});
```

### Counting triples matching a pattern in a certain version
Retrieve an estimate of the total number of triples matching a pattern in a certain version with `countTriplesVersionMaterialized`,
which takes subject, predicate, object, version (optional), and callback arguments.

```JavaScript
ostrich.fromPath('./test/test.ostrich', function (error, ostrichStore) {
  ostrichStore.countTriplesVersionMaterialized('http://example.org/s1', null, null, 1,
    function (error, totalCount) {
      console.log('Approximately ' + totalCount + ' triples match the pattern in the given version.');
      ostrichStore.close();
    });
});
```

### Searching for triple differences matching a pattern between two versions
Similar to `searchTriplesVersionMaterialized`, `searchTriplesDeltaMaterialized`
allows you to search triples matching a pattern that are changed between two given versions.
Each triple is annotated with an `addition` field,
indicating whether or not it has been added relative to the two versions. 

The options object now takes the mandatory `versionStart` and `versionEnd` parameters.

```JavaScript
ostrich.fromPath('./test/test.ostrich', function (error, ostrichStore) {
  ostrichStore.searchTriplesDeltaMaterialized('http://example.org/s1', null, null, { versionStart: 0, versionEnd: 2, offset: 0, limit: 10 },
    function (error, triples, totalCount) {
      console.log('Approximately ' + totalCount + ' triples match the pattern between the two given versions.');
      triples.forEach(function (triple) { console.log((triple.addition ? '+ ' : '- ') + triple); });
      ostrichStore.close();
    });
});
```

### Counting triples matching a pattern between two versions
Retrieve an estimate of the total number of triples matching a pattern in a certain version with `countTriplesDeltaMaterialized`,
which takes subject, predicate, object, versionStart, versionEnd, and callback arguments.

```JavaScript
ostrich.fromPath('./test/test.ostrich', function (error, ostrichStore) {
  ostrichStore.countTriplesDeltaMaterialized('http://example.org/s1', null, null, 0, 2,
    function (error, totalCount) {
      console.log('Approximately ' + totalCount + ' triples match the pattern between the two given versions.');
      ostrichStore.close();
    });
});
```

### Searching for triples matching a pattern with version annotations
Finally, `searchTriplesVersion`
allows you to search triples matching a pattern over all versions.
Each triple is annotated with a list `versions` for all the versions it is present it. 

```JavaScript
ostrich.fromPath('./test/test.ostrich', function (error, ostrichStore) {
  ostrichStore.searchTriplesVersion('http://example.org/s1', null, null, { offset: 0, limit: 10 },
    function (error, triples, totalCount) {
      console.log('Approximately ' + totalCount + ' triples match the pattern in all versions.');
      triples.forEach(function (triple) { console.log(triple + ' ' + triple.versions); });
      ostrichStore.close();
    });
});
```

### Counting triples matching a pattern
Retrieve an estimate of the total number of triples matching a pattern over all version in a certain version with `countTriplesVersion`,
which takes subject, predicate, object, and callback arguments.

```JavaScript
ostrich.fromPath('./test/test.ostrich', function (error, ostrichStore) {
  ostrichStore.countTriplesVersion('http://example.org/s1', null, null,
    function (error, totalCount) {
      console.log('Approximately ' + totalCount + ' triples match the pattern in all versions.');
      ostrichStore.close();
    });
});
```

### Appending a new version
Inserts a new version into the store, with the given optional version id and an array of triples, annotated with `addition: true` or `addition: false`.
In the first version (0), all triples MUST be additions.

```JavaScript
ostrich.fromPath('./test/test.ostrich', false, function (error, ostrichStore) {
  ostrichStore.append(0, [{ subject: 'a', predicate: 'b', object: 'c', addition: true }, { subject: 'a', predicate: 'b', object: 'd', addition: true }],
    function (error, insertedCount) {
      console.log('Inserted ' + insertedCount + ' triples in version ' + ostrichStore.store.maxVersion);
      ostrichStore.close();
    });
});
```

## Standalone utility
The standalone utility `ostrich` allows you to query OSTRICH dataset from the command line.
<br>
To install system-wide, execute:
```bash
sudo npm install -g ostrich-bindings
```

Specify queries as follows:
```
ostrich dataset.ostrich --queryversionmaterialized '?s ?p ?o' --offset 200 --limit 100 --version 1 --format turtle
ostrich dataset.ostrich --querydeltamaterialized '?s ?p ?o' --offset 200 --limit 100 --versionStart 0 --versionEnd 2 --format turtle
ostrich dataset.ostrich --queryversion '?s ?p ?o' --offset 200 --limit 100 --format turtle
```
Replace any of the query variables by an [IRI or literal](https://github.com/RubenVerborgh/N3.js#triple-representation) to match specific patterns.

Or with less verbose parameters:
```
ostrich dataset.ostrich --qvm '?s ?p ?o' -o 200 -l 100 -v 1 -f turtle
ostrich dataset.ostrich --qdm '?s ?p ?o' -o 200 -l 100 --vs 0 -ve 2 -f turtle
ostrich dataset.ostrich --qv '?s ?p ?o' -o 200 -l 100 -f turtle
```

## Build manually
To build the module from source, follow these instructions:
```Shell
git clone https://git.datasciencelab.ugent.be/linked-data-fragments/Ostrich-Node
cd Ostrich-Node
git submodule init
git submodule update
npm install
npm test
```

If you make changes to the source, do the following to rebuild:
```bash
npm install && npm test
```

## License
This software is written by [Ruben Taelman](http://rubensworks.net/) and Miel Vander Sande.

This code is copyrighted by [Ghent University – imec](http://idlab.ugent.be/)
and released under the [MIT license](http://opensource.org/licenses/MIT).
