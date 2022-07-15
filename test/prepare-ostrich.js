const fs = require('fs');
const path = require('path');
const ostrich = require('../lib/ostrich');


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

const dataV0 = [{ subject: 'a', predicate: 'a', object: '"a"^^<http://example.org/literal>', addition: true },
  { subject: 'a', predicate: 'a', object: '"b"^^<http://example.org/literal>', addition: true },
  { subject: 'a', predicate: 'b', object: 'a', addition: true },
  { subject: 'a', predicate: 'b', object: 'c', addition: true },
  { subject: 'a', predicate: 'b', object: 'd', addition: true },
  { subject: 'a', predicate: 'b', object: 'f', addition: true },
  { subject: 'a', predicate: 'b', object: 'z', addition: true },
  { subject: 'c', predicate: 'c', object: 'c', addition: true }];

const dataV1 = [{ subject: 'a', predicate: 'a', object: '"b"^^<http://example.org/literal>', addition: false },
  { subject: 'a', predicate: 'a', object: '"z"^^<http://example.org/literal>', addition: true },
  { subject: 'a', predicate: 'b', object: 'a', addition: false },
  { subject: 'a', predicate: 'b', object: 'g', addition: true },
  { subject: 'a', predicate: 'b', object: 'z', addition: false },
  { subject: 'f', predicate: 'f', object: 'f', addition: true },
  { subject: 'z', predicate: 'z', object: 'z', addition: true }];

const dataV2 = [{ subject: 'a', predicate: 'a', object: '"z"^^<http://example.org/literal>', addition: false },
  { subject: 'f', predicate: 'f', object: 'f', addition: false },
  { subject: 'f', predicate: 'r', object: 's', addition: true },
  { subject: 'q', predicate: 'q', object: 'q', addition: true },
  { subject: 'r', predicate: 'r', object: 'r', addition: true }];

const dataV3 = [{ subject: 'z', predicate: 'z', object: 'z', addition: false },
  { subject: 'z', predicate: 'z', object: '"z"^^<http://example.org/literal>', addition: true }];


module.exports = {

  initializeThreeVersions: async function () {
    const ostrichStore = await ostrich.fromPath('./test/test.ostrich', false);
    await ostrichStore.append(0, dataV0);
    await ostrichStore.append(1, dataV1);
    await ostrichStore.append(2, dataV2);
    return ostrichStore;
  },

  initializeFourVersions: async function () {
    const ostrichStore = await ostrich.fromPath('./test/test.ostrich', false, 'interval', '2');
    await ostrichStore.append(0, dataV0);
    await ostrichStore.append(1, dataV1);
    await ostrichStore.append(2, dataV2);
    await ostrichStore.append(3, dataV3);
    return ostrichStore;
  },

  cleanUp: function () {
    if (fs.existsSync('./test/test.ostrich/')) {
      const files = fs.readdirSync('./test/test.ostrich/');
      for (const file of files)
        fs.unlinkSync(path.join('./test/test.ostrich/', file));
    }
  },

  closeAndCleanUp: async function (ostrichStore) {
    await ostrichStore.close();
    this.cleanUp();
  },

};
