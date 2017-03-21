#ifndef OstrichStore_H
#define OstrichStore_H

#include <node.h>
#include <nan.h>
#include <HDTManager.hpp>

#include "../deps/ostrich/src/main/cpp/controller/controller.h"

enum OstrichStoreFeatures {
  Versioning = 1, // The document supports versioning
};

class OstrichStore : public node::ObjectWrap {
 public:
  OstrichStore(string path, const v8::Local<v8::Object>& handle, Controller* controller);

  // createOstrichStore(path, callback)
  static NAN_METHOD(Create);
  static const Nan::Persistent<v8::Function>& GetConstructor();

  // Accessors
  Controller* GetController() { return controller; }
  bool Supports(OstrichStoreFeatures feature) { return features & (int)feature; }

 private:
  Controller* controller;
  int features;
  string path;

  // Construction and destruction
  ~OstrichStore();
  void Destroy(bool remove);
  static NAN_METHOD(New);

  // OstrichStore#_searchTriplesVersionMaterialized(subject, predicate, object, offset, limit, version, callback, self)
  static NAN_METHOD(SearchTriplesVersionMaterialized);
  // OstrichStore#_searchTriplesDeltaMaterialized(subject, predicate, object, offset, limit, version_start, version_end, callback, self)
  static NAN_METHOD(SearchTriplesDeltaMaterialized);
  // OstrichStore#_searchTriplesVersion(subject, predicate, object, offset, limit, callback, self)
  static NAN_METHOD(SearchTriplesVersion);
  // OstrichStore#maxVersion
  static NAN_PROPERTY_GETTER(MaxVersion);
  // OstrichStore#_append(version, triples, callback, self)
  static NAN_METHOD(Append);
  // OstrichStore#_features
  static NAN_PROPERTY_GETTER(Features);
  // OstrichStore#close([remove], [callback], [self])
  static NAN_METHOD(Close);
  // OstrichStore#closed
  static NAN_PROPERTY_GETTER(Closed);
};

// Converts a JavaScript literal to an HDT literal
std::string& toHdtLiteral(std::string& literal);
// Converts an HDT literal to a JavaScript literal
std::string& fromHdtLiteral(std::string& literal);

#endif
