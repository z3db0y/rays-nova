#include <node.h>
#include <v8.h>
#include <windows.h>
#include <thread>
#include <atomic>

std::atomic<bool> running(true);

void PollingLoop(v8::Isolate* isolate, v8::Persistent<v8::Function>* callback) {
    while (running) {
        // Polling mouse position and button states
        POINT p;
        GetCursorPos(&p);

        bool lmb = GetAsyncKeyState(VK_LBUTTON) & 0x8000;
        bool rmb = GetAsyncKeyState(VK_RBUTTON) & 0x8000;
        bool mmb = GetAsyncKeyState(VK_MBUTTON) & 0x8000;
        bool mb4 = GetAsyncKeyState(VK_XBUTTON1) & 0x8000;
        bool mb5 = GetAsyncKeyState(VK_XBUTTON2) & 0x8000;

        // Create a local scope for V8 operations
        v8::HandleScope handle_scope(isolate);
        auto context = isolate->GetCurrentContext();
        auto obj = v8::Object::New(isolate);

        obj->Set(context, v8::String::NewFromUtf8(isolate, "x").ToLocalChecked(), v8::Number::New(isolate, p.x)).Check();
        obj->Set(context, v8::String::NewFromUtf8(isolate, "y").ToLocalChecked(), v8::Number::New(isolate, p.y)).Check();
        obj->Set(context, v8::String::NewFromUtf8(isolate, "lmb").ToLocalChecked(), v8::Boolean::New(isolate, lmb)).Check();
        obj->Set(context, v8::String::NewFromUtf8(isolate, "rmb").ToLocalChecked(), v8::Boolean::New(isolate, rmb)).Check();
        obj->Set(context, v8::String::NewFromUtf8(isolate, "mmb").ToLocalChecked(), v8::Boolean::New(isolate, mmb)).Check();
        obj->Set(context, v8::String::NewFromUtf8(isolate, "mb4").ToLocalChecked(), v8::Boolean::New(isolate, mb4)).Check();
        obj->Set(context, v8::String::NewFromUtf8(isolate, "mb5").ToLocalChecked(), v8::Boolean::New(isolate, mb5)).Check();

        // Prepare the arguments for the callback
        v8::Local<v8::Value> argv[] = { obj };

        // Call the JS callback
        v8::Local<v8::Function> local_callback = v8::Local<v8::Function>::New(isolate, *callback);
        local_callback->Call(context, v8::Null(isolate), 1, argv).ToLocalChecked();

        // Sleep to throttle the loop (e.g., 60Hz update rate)
        std::this_thread::sleep_for(std::chrono::milliseconds(16));
    }
}

void StartPolling(const v8::FunctionCallbackInfo<v8::Value>& args) {
    if (!args[0]->IsFunction()) {
        args.GetIsolate()->ThrowException(v8::String::NewFromUtf8(args.GetIsolate(), "Expected a callback function").ToLocalChecked());
        return;
    }

    auto isolate = args.GetIsolate();
    v8::Persistent<v8::Function>* callback = new v8::Persistent<v8::Function>(isolate, v8::Local<v8::Function>::Cast(args[0]));

    // Start the polling loop in a separate thread
    std::thread(PollingLoop, isolate, callback).detach();
}

void StopPolling(const v8::FunctionCallbackInfo<v8::Value>& args) {
    running = false;
}

extern "C" NODE_MODULE_EXPORT void NODE_MODULE_INITIALIZER(v8::Local<v8::Object> exports, v8::Local<v8::Value> module, v8::Local<v8::Context> context) {
    NODE_SET_METHOD(exports, "startPolling", StartPolling);
    NODE_SET_METHOD(exports, "stopPolling", StopPolling);
}
