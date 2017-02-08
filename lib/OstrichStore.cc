#include <node.h>
#include <nan.h>
#include <assert.h>
#include <set>
#include <vector>
#include <HDTEnums.hpp>
#include <HDTManager.hpp>
#include <HDTVocabulary.hpp>
//#include <LiteralDictionary.hpp>
#include "OstrichStore.h"

using namespace std;
using namespace v8;
using namespace hdt;



/******** Construction and destruction ********/


// Creates a new Ostrich store.
OstrichStore::OstrichStore(const Local<Object>& handle, Controller* controller) : controller(controller), features(1) {
  this->Wrap(handle);
}

// Deletes the Ostrich store.
OstrichStore::~OstrichStore() { Destroy(); }

// Destroys the document, disabling all further operations.
void OstrichStore::Destroy() {
  if (controller) {
    //Controller::cleanup(controller);
    delete controller;
    controller = NULL;
  }
}

// Constructs a JavaScript wrapper for an Ostrich store.
NAN_METHOD(OstrichStore::New) {
  assert(info.IsConstructCall());
  info.GetReturnValue().Set(info.This());
}

// Returns the constructor of OstrichStore.
Nan::Persistent<Function> constructor;
const Nan::Persistent<Function>& OstrichStore::GetConstructor() {
  if (constructor.IsEmpty()) {
    // Create constructor template
    Local<FunctionTemplate> constructorTemplate = Nan::New<FunctionTemplate>(New);
    constructorTemplate->SetClassName(Nan::New("OstrichStore").ToLocalChecked());
    constructorTemplate->InstanceTemplate()->SetInternalFieldCount(1);
    // Create prototype
    Nan::SetPrototypeMethod(constructorTemplate, "_searchTriplesVersionMaterialized",  SearchTriplesVersionMaterialized);
    Nan::SetPrototypeMethod(constructorTemplate, "close",                              Close);
    Nan::SetAccessor(constructorTemplate->PrototypeTemplate(),
                     Nan::New("_features").ToLocalChecked(), Features);
    Nan::SetAccessor(constructorTemplate->PrototypeTemplate(),
                     Nan::New("closed").ToLocalChecked(), Closed);
    // Set constructor
    constructor.Reset(constructorTemplate->GetFunction());
  }
  return constructor;
}



/******** createOstrichStore ********/

class CreateWorker : public Nan::AsyncWorker {
  string path;
  Controller* controller;

public:
  CreateWorker(const char* path, Nan::Callback *callback)
    : Nan::AsyncWorker(callback), path(path), controller(NULL) { };

  void Execute() {
    try {
      controller = new Controller(path, HashDB::TCOMPRESS, true);
    }
    catch (const std::invalid_argument error) { SetErrorMessage(error.what()); }
  }

  void HandleOKCallback() {
    Nan::HandleScope scope;
    // Create a new OstrichStore
    Local<Object> newStore = Nan::NewInstance(Nan::New(OstrichStore::GetConstructor())).ToLocalChecked();
    new OstrichStore(newStore, controller);
    // Send the new OstrichStore through the callback
    const unsigned argc = 2;
    Local<Value> argv[argc] = { Nan::Null(), newStore };
    callback->Call(argc, argv);
  }
};

// Creates a new instance of OstrichStore.
// JavaScript signature: createOstrichStore(path, callback)
NAN_METHOD(OstrichStore::Create) {
  assert(info.Length() == 2);
  Nan::AsyncQueueWorker(new CreateWorker(*Nan::Utf8String(info[0]),
                                         new Nan::Callback(info[1].As<Function>())));
}



/******** OstrichStore#_searchTriplesVersionMaterialized ********/

class SearchTriplesVersionMaterializedWorker : public Nan::AsyncWorker {
  OstrichStore* store;
  // JavaScript function arguments
  string subject, predicate, object;
  uint32_t offset, limit;
  Persistent<Object> self;
  // Callback return values
  vector<Triple> triples;
  int version;
  uint32_t totalCount;
  bool hasExactCount;
  DictionaryManager* dict;

public:
  SearchTriplesVersionMaterializedWorker(OstrichStore* store, char* subject, char* predicate, char* object,
                      uint32_t offset, uint32_t limit, int32_t version, Nan::Callback* callback, Local<Object> self)
    : Nan::AsyncWorker(callback),
      store(store), subject(subject), predicate(predicate), object(object),
      offset(offset), limit(limit), version(version), totalCount(0) {
    SaveToPersistent("self", self);
  };

  void Execute() {
    TripleIterator* it = NULL;
    try {
      Controller* controller = store->GetController();

      // Check version
      version = version >= 0 ? version : controller->get_max_patch_id() - 1;

      // Prepare the triple pattern
      dict = controller->get_dictionary_manager(version);
      Triple triple_pattern(subject, predicate, toHdtLiteral(object), dict);

      // Estimate the total number of triples
      std::pair<size_t, ResultEstimationType> count_data = controller->get_version_materialized_count(triple_pattern, version);
      totalCount = count_data.first;
      it = controller->get_version_materialized(triple_pattern, offset, version);
      hasExactCount = count_data.second == EXACT;

      // Add matching triples to the result vector
      Triple t;
      long count = 0;

      while(it->next(&t) && (!limit || triples.size() < limit)) {
          triples.push_back(t);
          count++;
      };
    }
    catch (const runtime_error error) { SetErrorMessage(error.what()); }
    if (it)
      delete it;
  }

  void HandleOKCallback() {
    Nan::HandleScope scope;

    // Convert the triples into a JavaScript object array
    uint32_t count = 0;
    Local<Array> triplesArray = Nan::New<Array>(triples.size());
    const Local<String> SUBJECT   = Nan::New("subject").ToLocalChecked();
    const Local<String> PREDICATE = Nan::New("predicate").ToLocalChecked();
    const Local<String> OBJECT    = Nan::New("object").ToLocalChecked();
    for (vector<Triple>::const_iterator it = triples.begin(); it != triples.end(); it++) {
      Local<Object> tripleObject = Nan::New<Object>();
      tripleObject->Set(SUBJECT, Nan::New(it->get_subject(*dict).c_str()).ToLocalChecked());
      tripleObject->Set(PREDICATE, Nan::New(it->get_predicate(*dict).c_str()).ToLocalChecked());
      string object = it->get_object(*dict);
      tripleObject->Set(OBJECT, Nan::New(fromHdtLiteral(object).c_str()).ToLocalChecked());
      triplesArray->Set(count++, tripleObject);
    }

    // Send the JavaScript array and estimated total count through the callback
    const unsigned argc = 4;
    Local<Value> argv[argc] = { Nan::Null(), triplesArray,
                                Nan::New<Integer>((uint32_t)totalCount),
                                Nan::New<Boolean>((bool)hasExactCount) };
    callback->Call(GetFromPersistent("self")->ToObject(), argc, argv);
  }

  void HandleErrorCallback() {
    Nan::HandleScope scope;
    Local<Value> argv[] = { Exception::Error(Nan::New(ErrorMessage()).ToLocalChecked()) };
    callback->Call(GetFromPersistent("self")->ToObject(), 1, argv);
  }
};

// Searches for a triple pattern in the document.
// JavaScript signature: OstrichStore#_searchTriplesVersionMaterialized(subject, predicate, object, offset, limit, version, callback)
NAN_METHOD(OstrichStore::SearchTriplesVersionMaterialized) {
  assert(info.Length() == 8);
  Nan::AsyncQueueWorker(new SearchTriplesVersionMaterializedWorker(Unwrap<OstrichStore>(info.This()),
    *Nan::Utf8String(info[0]), *Nan::Utf8String(info[1]), *Nan::Utf8String(info[2]),
    info[3]->Uint32Value(), info[4]->Uint32Value(), info[5]->Uint32Value(),
    new Nan::Callback(info[6].As<Function>()),
    info[7]->IsObject() ? info[7].As<Object>() : info.This()));
}



/******** OstrichStore#features ********/


// Gets a bitvector indicating the supported features.
NAN_PROPERTY_GETTER(OstrichStore::Features) {
  OstrichStore* ostrichStore = Unwrap<OstrichStore>(info.This());
  info.GetReturnValue().Set(Nan::New<Integer>(ostrichStore->features));
}



/******** OstrichStore#close ********/

// Closes the document, disabling all further operations.
// JavaScript signature: OstrichStore#close([callback], [self])
NAN_METHOD(OstrichStore::Close) {
  // Destroy the current store
  OstrichStore* ostrichStore = Unwrap<OstrichStore>(info.This());
  ostrichStore->Destroy();

  // Call the callback if one was passed
  if (info.Length() >= 1 && info[0]->IsFunction()) {
    const Local<Function> callback = info[0].As<Function>();
    const Local<Object> self = info.Length() >= 2 && info[1]->IsObject() ?
                               info[1].As<Object>() : Nan::GetCurrentContext()->Global();
    const unsigned argc = 1;
    Handle<Value> argv[argc] = { Nan::Null() };
    callback->Call(self, argc, argv);
  }
}



/******** OstrichStore#closed ********/


// Gets a boolean indicating whether the document is closed.
NAN_PROPERTY_GETTER(OstrichStore::Closed) {
  OstrichStore* ostrichStore = Unwrap<OstrichStore>(info.This());
  info.GetReturnValue().Set(Nan::New<Boolean>(!ostrichStore->controller));
}



/******** Utility functions ********/


// The JavaScript representation for a literal with a datatype is
//   "literal"^^http://example.org/datatype
// whereas the HDT representation is
//   "literal"^^<http://example.org/datatype>
// The functions below convert when needed.


// Converts a JavaScript literal to an HDT literal
string& toHdtLiteral(string& literal) {
  // Check if the object is a literal with a datatype, which needs conversion
  string::const_iterator obj;
  string::iterator objLast;
  if (*(obj = literal.begin()) == '"' && *(objLast = literal.end() - 1) != '"') {
    // If the start of a datatype was found, surround it with angular brackets
    string::const_iterator datatype = objLast;
    while (obj != --datatype && *datatype != '@' && *datatype != '^');
    if (*datatype == '^') {
      // Allocate space for brackets, and update iterators
      literal.resize(literal.length() + 2);
      datatype += (literal.begin() - obj) + 1;
      objLast = literal.end() - 1;
      // Add brackets
      *objLast = '>';
      while (--objLast != datatype)
        *objLast = *(objLast - 1);
      *objLast = '<';
    }
  }
  return literal;
}

// Converts an HDT literal to a JavaScript literal
string& fromHdtLiteral(string& literal) {
  // Check if the literal has a datatype, which needs conversion
  string::const_iterator obj;
  string::iterator objLast;
  if (*(obj = literal.begin()) == '"' && *(objLast = literal.end() - 1) == '>') {
    // Find the start of the datatype
    string::iterator datatype = objLast;
    while (obj != --datatype && *datatype != '<');
    // Change the datatype representation by removing angular brackets
    if (*datatype == '<')
      literal.erase(datatype), literal.erase(objLast - 1);
  }
  return literal;
}
