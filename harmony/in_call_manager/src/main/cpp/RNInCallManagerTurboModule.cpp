/*
 * MIT License
 *
 * Copyright (C) 2024 Huawei Device Co., Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

#include "RNInCallManagerTurboModule.h"

using namespace rnoh;
using namespace facebook;

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_start(jsi::Runtime &rt, react::TurboModule &turboModule,
                                                                      const jsi::Value *args, size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "start", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_stop(jsi::Runtime &rt, react::TurboModule &turboModule,
                                                                     const jsi::Value *args, size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "stop", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_turnScreenOff(jsi::Runtime &rt,
                                                                              react::TurboModule &turboModule,
                                                                              const jsi::Value *args, size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "turnScreenOff", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_turnScreenOn(jsi::Runtime &rt,
                                                                             react::TurboModule &turboModule,
                                                                             const jsi::Value *args, size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "turnScreenOn", args, count);
}


static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_setFlashOn(jsi::Runtime &rt,
                                                                           react::TurboModule &turboModule,
                                                                           const jsi::Value *args, size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "setFlashOn", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_setKeepScreenOn(jsi::Runtime &rt,
                                                                                react::TurboModule &turboModule,
                                                                                const jsi::Value *args, size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "setKeepScreenOn", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_setSpeakerphoneOn(jsi::Runtime &rt,
                                                                                  react::TurboModule &turboModule,
                                                                                  const jsi::Value *args,
                                                                                  size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "setSpeakerphoneOn", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_setForceSpeakerphoneOn(jsi::Runtime &rt,
                                                                                       react::TurboModule &turboModule,
                                                                                       const jsi::Value *args,
                                                                                       size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "setForceSpeakerphoneOn", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_setMicrophoneMute(jsi::Runtime &rt,
                                                                                  react::TurboModule &turboModule,
                                                                                  const jsi::Value *args,
                                                                                  size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "setMicrophoneMute", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_startRingtone(jsi::Runtime &rt,
                                                                              react::TurboModule &turboModule,
                                                                              const jsi::Value *args, size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "startRingtone", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_stopRingtone(jsi::Runtime &rt,
                                                                             react::TurboModule &turboModule,
                                                                             const jsi::Value *args, size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "stopRingtone", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_startProximitySensor(jsi::Runtime &rt,
                                                                                     react::TurboModule &turboModule,
                                                                                     const jsi::Value *args,
                                                                                     size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "startProximitySensor", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_stopProximitySensor(jsi::Runtime &rt,
                                                                                    react::TurboModule &turboModule,
                                                                                    const jsi::Value *args,
                                                                                    size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "stopProximitySensor", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_startRingback(jsi::Runtime &rt,
                                                                              react::TurboModule &turboModule,
                                                                              const jsi::Value *args, size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "startRingback", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_stopRingback(jsi::Runtime &rt,
                                                                             react::TurboModule &turboModule,
                                                                             const jsi::Value *args, size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "stopRingback", args, count);
}

static jsi::Value _hostFunction_InCallManagerTurboModuleSpecJSI_pokeScreen(jsi::Runtime &rt,
                                                                           react::TurboModule &turboModule,
                                                                           const jsi::Value *args, size_t count) {
    return static_cast<ArkTSTurboModule &>(turboModule).call(rt, "pokeScreen", args, count);
}

RNInCallManagerTurboModuleSpecJSI::RNInCallManagerTurboModuleSpecJSI(const ArkTSTurboModule::Context ctx,
                                                                     const std::string name)
    : ArkTSTurboModule(ctx, name) {
    
    methodMap_ = {
        ARK_METHOD_METADATA(addListener, 1),
        ARK_METHOD_METADATA(removeListeners, 1),
        ARK_ASYNC_METHOD_METADATA(getIsWiredHeadsetPluggedIn, 0),
        ARK_ASYNC_METHOD_METADATA(getAudioUriJS, 2),
        ARK_ASYNC_METHOD_METADATA(chooseAudioRoute, 1),
        ARK_ASYNC_METHOD_METADATA(requestAudioFocus, 0),
        ARK_ASYNC_METHOD_METADATA(abandonAudioFocus, 0),
    };
    
    methodMap_["start"] = MethodMetadata{3, _hostFunction_InCallManagerTurboModuleSpecJSI_start};
    methodMap_["stop"] = MethodMetadata{1, _hostFunction_InCallManagerTurboModuleSpecJSI_stop};
    methodMap_["turnScreenOff"] = MethodMetadata{0, _hostFunction_InCallManagerTurboModuleSpecJSI_turnScreenOff};
    methodMap_["turnScreenOn"] = MethodMetadata{0, _hostFunction_InCallManagerTurboModuleSpecJSI_turnScreenOn};
    methodMap_["setFlashOn"] = MethodMetadata{1, _hostFunction_InCallManagerTurboModuleSpecJSI_setFlashOn};
    methodMap_["setKeepScreenOn"] = MethodMetadata{1, _hostFunction_InCallManagerTurboModuleSpecJSI_setKeepScreenOn};
    methodMap_["setSpeakerphoneOn"] =
        MethodMetadata{1, _hostFunction_InCallManagerTurboModuleSpecJSI_setSpeakerphoneOn};
    methodMap_["setForceSpeakerphoneOn"] =
        MethodMetadata{1, _hostFunction_InCallManagerTurboModuleSpecJSI_setForceSpeakerphoneOn};
    methodMap_["setMicrophoneMute"] =
        MethodMetadata{1, _hostFunction_InCallManagerTurboModuleSpecJSI_setMicrophoneMute};
    methodMap_["startRingtone"] = MethodMetadata{2, _hostFunction_InCallManagerTurboModuleSpecJSI_startRingtone};
    methodMap_["stopRingtone"] = MethodMetadata{0, _hostFunction_InCallManagerTurboModuleSpecJSI_stopRingtone};
    methodMap_["startProximitySensor"] =
        MethodMetadata{0, _hostFunction_InCallManagerTurboModuleSpecJSI_startProximitySensor};
    methodMap_["stopProximitySensor"] =
        MethodMetadata{0, _hostFunction_InCallManagerTurboModuleSpecJSI_stopProximitySensor};
    methodMap_["startRingback"] = MethodMetadata{1, _hostFunction_InCallManagerTurboModuleSpecJSI_startRingback};
    methodMap_["stopRingback"] = MethodMetadata{0, _hostFunction_InCallManagerTurboModuleSpecJSI_stopRingback};
    methodMap_["pokeScreen"] = MethodMetadata{1, _hostFunction_InCallManagerTurboModuleSpecJSI_pokeScreen};
}