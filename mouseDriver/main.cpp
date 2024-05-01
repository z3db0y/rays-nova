#include <node.h>
#include <v8.h>
#include <windows.h>

void poll(const v8::FunctionCallbackInfo<v8::Value> &args)
{
    POINT p;
    GetCursorPos(&p);

    bool lmb = GetAsyncKeyState(VK_LBUTTON) & (1 << 15);
    bool rmb = GetAsyncKeyState(VK_RBUTTON) & (1 << 15);
    bool mmb = GetAsyncKeyState(VK_MBUTTON) & (1 << 15);

    bool mb4 = GetAsyncKeyState(VK_XBUTTON1) & (1 << 15);
    bool mb5 = GetAsyncKeyState(VK_XBUTTON2) & (1 << 15);

    v8::Isolate *isolate = args.GetIsolate();
    v8::Local<v8::Object> obj = v8::Object::New(isolate);

    obj->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "x").ToLocalChecked(), v8::Number::New(isolate, p.x));
    obj->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "y").ToLocalChecked(), v8::Number::New(isolate, p.y));
    obj->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "lmb").ToLocalChecked(), v8::Boolean::New(isolate, lmb));
    obj->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "rmb").ToLocalChecked(), v8::Boolean::New(isolate, rmb));
    obj->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "mmb").ToLocalChecked(), v8::Boolean::New(isolate, mmb));
    obj->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "mb4").ToLocalChecked(), v8::Boolean::New(isolate, mb4));
    obj->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "mb5").ToLocalChecked(), v8::Boolean::New(isolate, mb5));

    args.GetReturnValue().Set(obj);
}

extern "C" NODE_MODULE_EXPORT void
NODE_MODULE_INITIALIZER(v8::Local<v8::Object> exports, v8::Local<v8::Value> module, v8::Local<v8::Context> context)
{
    NODE_SET_METHOD(exports, "poll", poll);
}