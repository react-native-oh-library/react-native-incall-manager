/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

'use strict';
import {
    Platform,
    Vibration,
    NativeModules, TurboModuleRegistry
} from 'react-native';

const _InCallManager = TurboModuleRegistry.get('InCallManagerTurboModule') ? TurboModuleRegistry.getEnforcing('InCallManagerTurboModule') : NativeModules.InCallManager;
console.log("_InCallManager", _InCallManager);
class InCallManager {
    constructor() {
        this.vibrate = false;
        this.audioUriMap = {
            ringtone: { _BUNDLE_: null, _DEFAULT_: null },
            ringback: { _BUNDLE_: null, _DEFAULT_: null },
            busytone: { _BUNDLE_: null, _DEFAULT_: null },
        };
    }

    start(setup) {
        setup = (setup === undefined) ? {} : setup;
        let auto = (setup.auto === false) ? false : true;
        let media = (setup.media === 'video') ? 'video' : 'audio';
        let ringback = (!!setup.ringback) ? (typeof setup.ringback === 'string') ? setup.ringback : "" : "";
        _InCallManager.start(media, auto, ringback);
    }

    stop(setup) {
        setup = (setup === undefined) ? {} : setup;
        let busytone = (!!setup.busytone) ? (typeof setup.busytone === 'string') ? setup.busytone : "" : "";
        _InCallManager.stop(busytone);
    }

    turnScreenOff() {
        _InCallManager.turnScreenOff();
    }

    turnScreenOn() {
        _InCallManager.turnScreenOn();
    }

    async getIsWiredHeadsetPluggedIn() {
        let isPluggedIn = await _InCallManager.getIsWiredHeadsetPluggedIn();
        return { isWiredHeadsetPluggedIn: isPluggedIn };
    }

    setFlashOn(enable, brightness) {
        if (Platform.OS === 'ios') {
            enable = (enable === true) ? true : false;
            brightness = (typeof brightness === 'number') ? brightness : 0;
            _InCallManager.setFlashOn(enable, brightness);
        } else if (Platform.OS === 'harmony') {
            enable = (enable === true) ? true : false;
            _InCallManager.setFlashOn(enable);
        } else {
            console.log("Android doesn't support setFlashOn(enable, brightness)");
        }
    }


    setKeepScreenOn(enable) {
        enable = (enable === true) ? true : false;
        _InCallManager.setKeepScreenOn(enable);
    }

    setSpeakerphoneOn(enable) {
        if (Platform.OS === 'harmony') {
            console.log("harmony doesn't support setForceSpeakerphoneOn()");
        } else {
            enable = (enable === true) ? true : false;
            _InCallManager.setSpeakerphoneOn(enable);
        }
    }

    setForceSpeakerphoneOn(_flag) {
        if (Platform.OS === 'harmony') {
            console.log("harmony doesn't support setForceSpeakerphoneOn()");
        } else {
            let flag = (typeof _flag === "boolean") ? (_flag) ? 1 : -1 : 0;
            _InCallManager.setForceSpeakerphoneOn(flag);
        }
    }

    setMicrophoneMute(enable) {

        if (Platform.OS === 'android') {
            enable = (enable === true) ? true : false;
            _InCallManager.setMicrophoneMute(enable);
        }
        else if (Platform.OS === 'harmony') {
            console.log("harmony doesn't support setMicrophoneMute()");
        } else if (Platform.OS === 'ios') {
            console.log("ios doesn't support setMicrophoneMute()");
        }
    }

    startRingtone(ringtone, vibrate_pattern, ios_category, seconds) {
        ringtone = (typeof ringtone === 'string') ? ringtone : "_DEFAULT_";
        this.vibrate = (Array.isArray(vibrate_pattern)) ? true : false;
        ios_category = (ios_category === 'playback') ? 'playback' : "default";
        seconds = (typeof seconds === 'number' && seconds > 0) ? parseInt(seconds) : -1; // --- android only, default looping

        if (Platform.OS === 'android') {
            _InCallManager.startRingtone(ringtone, seconds);
        } else {
            _InCallManager.startRingtone(ringtone, ios_category);
        }

        // --- should not use repeat, it may cause infinite loop in some cases.
        if (this.vibrate) {
            Vibration.vibrate(vibrate_pattern, false); // --- ios needs RN 0.34 to support vibration pattern
        }
    }

    stopRingtone() {
        if (this.vibrate) {
            Vibration.cancel();
        }
        _InCallManager.stopRingtone();
    }

    startProximitySensor() {
        _InCallManager.startProximitySensor();
    }

    stopProximitySensor() {
        _InCallManager.stopProximitySensor();
    }

    startRingback(ringback) {
        ringback = (typeof ringback === 'string') ? ringback : "_DTMF_";
        _InCallManager.startRingback(ringback);
    }

    stopRingback() {
        _InCallManager.stopRingback();
    }

    pokeScreen(_timeout) {
        if (Platform.OS === 'android') {
            let timeout = (typeof _timeout === "number" && _timeout > 0) ? _timeout : 3000; // --- default 3000 ms
            _InCallManager.pokeScreen(timeout);
        } else if (Platform.OS === 'harmony') {
            console.log("harmony doesn't support pokeScreen()");
        }
        else {
            console.log("ios doesn't support pokeScreen()");
        }
    }

    async getAudioUri(audioType, fileType) {
        if (typeof this.audioUriMap[audioType] === "undefined") {
            return null;
        }
        if (this.audioUriMap[audioType][fileType]) {
            return this.audioUriMap[audioType][fileType];
        } else {
            try {
                let result = await _InCallManager.getAudioUriJS(audioType, fileType);
                if (typeof result === 'string' && result.length > 0) {
                    this.audioUriMap[audioType][fileType] = result;
                    return result
                } else {
                    return null;
                }
            } catch (err) {
                return null;
            }
        }
    }

    async chooseAudioRoute(route) {
        if (Platform.OS === 'android') {
            let result = await _InCallManager.chooseAudioRoute(route);
            return result;
        } else if (Platform.OS === 'harmony') {
            console.log("harmony doesn't support chooseAudioRoute()");
        }
        else {
            console.log("ios doesn't support chooseAudioRoute()");
        }
    }

    async requestAudioFocus() {
        if (Platform.OS === 'android') {
            return await _InCallManager.requestAudioFocusJS();
        } else if (Platform.OS === 'harmony') {
            console.log("harmony doesn't support requestAudioFocus()");
        }
        else {
            console.log("ios doesn't support requestAudioFocus()");
        }
    }

    async abandonAudioFocus() {
        if (Platform.OS === 'android') {
            return await _InCallManager.abandonAudioFocusJS();
        } else if (Platform.OS === 'harmony') {
            console.log("harmony doesn't support abandonAudioFocus()");
        } else {
            console.log("ios doesn't support abandonAudioFocus()");
        }
    }
}

export default new InCallManager();
