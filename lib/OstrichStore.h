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
  OstrichStore(const v8::Local<v8::Object>& handle, Controller* controller);

  // createOstrichStore(path, callback)
  static NAN_METHOD(Create);
  static const Nan::Persistent<v8::Function>& GetConstructor();

  // Accessors
  Controller* GetController() { return controller; }
  bool Supports(OstrichStoreFeatures feature) { return features & (int)feature; }

 private:
  Controller* controller;
  int features;

  // Construction and destruction
  ~OstrichStore();
  void Destroy();
  static NAN_METHOD(New);

  // OstrichStore#_searchTriples(subject, predicate, object, offset, limit, version, callback, self)
  static NAN_METHOD(SearchTriples);
  // OstrichStore#_features
  static NAN_PROPERTY_GETTER(Features);
  // OstrichStore#close([callback], [self])
  static NAN_METHOD(Close);
  // OstrichStore#closed
  static NAN_PROPERTY_GETTER(Closed);
};

// Converts a JavaScript literal to an HDT literal
std::string& toHdtLiteral(std::string& literal);
// Converts an HDT literal to a JavaScript literal
std::string& fromHdtLiteral(std::string& literal);

#endif
