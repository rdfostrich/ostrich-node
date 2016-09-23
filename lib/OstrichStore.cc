#include <node.h>
#include <nan.h>
#include <assert.h>
#include <set>
#include <vector>
#include <HDTEnums.hpp>
#include <HDTManager.hpp>
#include <HDTVocabulary.hpp>
#include <LiteralDictionary.hpp>
#include "OstrichStore.h"

using namespace v8;
using namespace hdt;



/******** Construction and destruction ********/


// Creates a new HDT document.
OstrichStore::OstrichStore(const Local<Object>& handle, Controller* controller) : controller(controller), features(1) {
  this->Wrap(handle);
}

// Deletes the HDT document.
OstrichStore::~OstrichStore() { Destroy(); }

// Destroys the document, disabling all further operations.
void OstrichStore::Destroy() {
  if (controller) {
    Controller::cleanup(controller);
    delete controller;
    controller = NULL;
  }
}

// Constructs a JavaScript wrapper for an HDT document.
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
    Nan::SetPrototypeMethod(constructorTemplate, "_searchTriples",  SearchTriples);
    Nan::SetPrototypeMethod(constructorTemplate, "close",           Close);
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
  string filename;
  Controller* controller;

public:
  CreateWorker(const char* path, Nan::Callback *callback)
    : Nan::AsyncWorker(callback), path(path), controller(NULL) { };

  void Execute() {
    try {
      controller = new Controller(HashDB::TCOMPRESS);
      int patch_count = 0;

      DIR *dir;
      if ((dir = opendir(patchesBasePatch.c_str())) != NULL) {
          for (int i = startIndex; i <= endIndex; i++) {
              string versionname = to_string(i);
              string versionPath = patchesBasePatch + k_path_separator + versionname;
              populate_controller_with_version(versionpatch_count_count++, versionPath);
          }
          closedir(dir);
      }
    }
    catch (const runtime_error error) { SetErrorMessage(error.what()); }
  }

  void populate_controller_with_version(int patch_id, string path) {
      std::smatch base_match;
      std::regex regex_additions("([a-z0-9]*).nt.additions.txt");
      std::regex regex_deletions("([a-z0-9]*).nt.deletions.txt");

      DictionaryManager *dict = controller->get_snapshot_manager()->get_dictionary_manager(0);
      bool first = patch_id == 0;
      Patch patch(dict);
      CombinedTripleIterator* it = new CombinedTripleIterator();

      if (controller->get_max_patch_id() >= patch_id) {
          if (first) {
              cout << "Skipped constructing snapshot because it already exists, loaded instead." << endl;
              controller->get_snapshot_manager()->load_snapshot(patch_id);
          } else {
              cout << "Skipped constructing patch because it already exists, loading instead..." << endl;
              DictionaryManager* dict_patch = controller->get_dictionary_manager(patch_id);
              if (controller->get_patch_tree_manager()->get_patch_tree(patch_id, dict_patch)->get_max_patch_id() < patch_id) {
                  controller->get_patch_tree_manager()->load_patch_tree(patch_id, dict_patch);
              }
              cout << "Loaded!" << endl;
          }
          return;
      }

      DIR *dir;
      struct dirent *ent;
      StopWatch st;
      cout << "Loading patch... " << endl;
      if ((dir = opendir(path.c_str())) != NULL) {
          while ((ent = readdir(dir)) != NULL) {
              string filename = string(ent->d_name);
              string full_path = path + k_path_separator + filename;
              if (filename != "." && filename != "..") {
                  int count = 0;
                  bool additions = std::regex_match(filename, base_match, regex_additions);
                  bool deletions = std::regex_match(filename, base_match, regex_deletions);
                  cout << "\nFILE: " << full_path << endl; // TODO
                  if (first && additions) {
                      it->appendIterator(get_from_file(full_path));
                  } else if(!first && (additions || deletions)) {
                      IteratorTripleString *subIt = get_from_file(full_path);
                      while (subIt->hasNext()) {
                          TripleString* tripleString = subIt->next();
                          patch.add(PatchElement(Triple(tripleString->getSubject(), tripleString->getPredicate(), tripleString->getObject(), dict), additions));
                          count++;
                      }
                  }
              }
          }
          closedir(dir);
      }
      long long duration = st.stopReal() / 1000;

      long long added;
      if (first) {
          //std::cout.setstate(std::ios_base::failbit); // Disable cout info from HDT
          HDT* hdt = controller->get_snapshot_manager()->create_snapshot(0, it, BASEURI);
          //std::cout.clear();
          added = hdt->getTriples()->getNumberOfElements();
          delete it;
      } else {
          added = patch.get_size();
          controller->append(patch, patch_id, dict);
      }
      cout << "  Added: " << added << endl;
      cout << "  Duration: " << duration << endl;
      long long rate = added / duration;
      cout << "  Rate: " << rate << " triples / ms" << endl;
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
// JavaScript signature: createOstrichStore(filename, callback)
NAN_METHOD(OstrichStore::Create) {
  assert(info.Length() == 2);
  Nan::AsyncQueueWorker(new CreateWorker(*Nan::Utf8String(info[0]),
                                         new Nan::Callback(info[1].As<Function>())));
}



/******** OstrichStore#_searchTriples ********/

class SearchTriplesWorker : public Nan::AsyncWorker {
  OstrichStore* store;
  // JavaScript function arguments
  string subject, predicate, object;
  uint32_t offset, limit;
  Persistent<Object> self;
  // Callback return values
  vector<Triple> triples;
  map<unsigned int, string> subjects, predicates, objects;
  unsigned int version;
  uint32_t totalCount;
  bool hasExactCount;

public:
  SearchTriplesWorker(OstrichStore* store, char* subject, char* predicate, char* object,
                      uint32_t offset, uint32_t limit, uint32_t version, Nan::Callback* callback, Local<Object> self)
    : Nan::AsyncWorker(callback),
      store(store), subject(subject), predicate(predicate), object(object),
      offset(offset), limit(limit), version(version), totalCount(0) {
    SaveToPersistent("self", self);
  };

  void Execute() {
    TripleIterator* it = NULL;
    try {
      Controller* controller = store->getController();

      // Prepare the triple pattern
      DictionaryManager *dict = controller->get_snapshot_manager()->get_dictionary_manager(0);
      Triple triple_pattern(subject, predicate, object, dict);

      // Estimate the total number of triples
      it = controller->get(triple_pattern, offset, version);

      // Add matching triples to the result vector
      Triple t;
      long count = 0;
      //TODO: Add count estimation once implemented
      while(it->next(&t)) {
        if ((limit == -2 || limit-- > 0)) {
          triples.push_back(t);

          if (!subjects.count(triple.getSubject())) {
            subjects[triple.getSubject()] = dict->idToString(triple.getSubject(), SUBJECT);
          }
          if (!predicates.count(triple.getPredicate())) {
            predicates[triple.getPredicate()] = dict->idToString(triple.getPredicate(), PREDICATE);
          }
          if (!objects.count(triple.getObject())) {
            string object(dict->idToString(triple.getObject(), OBJECT));
            objects[triple.getObject()] = fromHdtLiteral(object);
          }
        }
        count++;
      };

    }
    catch (const runtime_error error) { SetErrorMessage(error.what()); }
    if (it)
      delete it;
  }

  void HandleOKCallback() {
    Nan::HandleScope scope;
    // Convert the triple components into strings
    map<unsigned int, string>::const_iterator it;
    map<unsigned int, Local<String> > subjectStrings, predicateStrings, objectStrings;
    for (it = subjects.begin(); it != subjects.end(); it++)
      subjectStrings[it->first] = Nan::New(it->second.c_str()).ToLocalChecked();
    for (it = predicates.begin(); it != predicates.end(); it++)
      predicateStrings[it->first] = Nan::New(it->second.c_str()).ToLocalChecked();
    for (it = objects.begin(); it != objects.end(); it++)
      objectStrings[it->first] = Nan::New(it->second.c_str()).ToLocalChecked();

    // Convert the triples into a JavaScript object array
    uint32_t count = 0;
    Local<Array> triplesArray = Nan::New<Array>(triples.size());
    const Local<String> SUBJECT   = Nan::New("subject").ToLocalChecked();
    const Local<String> PREDICATE = Nan::New("predicate").ToLocalChecked();
    const Local<String> OBJECT    = Nan::New("object").ToLocalChecked();
    for (vector<Triple>::const_iterator it = triples.begin(); it != triples.end(); it++) {
      Local<Object> tripleObject = Nan::New<Object>();
      tripleObject->Set(SUBJECT, subjectStrings[it->getSubject()]);
      tripleObject->Set(PREDICATE, predicateStrings[it->getPredicate()]);
      tripleObject->Set(OBJECT, objectStrings[it->getObject()]);
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
// JavaScript signature: OstrichStore#_searchTriples(subject, predicate, object, offset, limit, version, callback)
NAN_METHOD(OstrichStore::SearchTriples) {
  assert(info.Length() == 8);
  Nan::AsyncQueueWorker(new SearchTriplesWorker(Unwrap<OstrichStore>(info.This()),
    *Nan::Utf8String(info[0]), *Nan::Utf8String(info[1]), *Nan::Utf8String(info[2]),
    info[3]->Uint32Value(), info[4]->Uint32Value(), info[5]->Uint32Value(),
    new Nan::Callback(info[6].As<Function>()),
    info[6]->IsObject() ? info[7].As<Object>() : info.This()));
}



/******** OstrichStore#features ********/


// Gets a bitvector indicating the supported features.
NAN_PROPERTY_GETTER(OstrichStore::Features) {
  OstrichStore* OstrichStore = Unwrap<OstrichStore>(info.This());
  info.GetReturnValue().Set(Nan::New<Integer>(OstrichStore->features));
}



/******** OstrichStore#close ********/

// Closes the document, disabling all further operations.
// JavaScript signature: OstrichStore#close([callback], [self])
NAN_METHOD(OstrichStore::Close) {
  // Destroy the current store
  OstrichStore* OstrichStore = Unwrap<OstrichStore>(info.This());
  OstrichStore->Destroy();

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
  OstrichStore* OstrichStore = Unwrap<OstrichStore>(info.This());
  info.GetReturnValue().Set(Nan::New<Boolean>(!OstrichStore->controller));
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
