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

import { TurboModule, type TurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import window from '@ohos.window';
import type common from '@ohos.app.ability.common';
import { type BusinessError } from '@kit.BasicServicesKit';
import { sensor } from '@kit.SensorServiceKit';
import { avSession } from '@kit.AVSessionKit';
import { audio } from '@kit.AudioKit';
import { fileIo } from '@kit.CoreFileKit';
import type { resourceManager } from '@kit.LocalizationKit';
import {
  InCallManagerEventType,
  type MediaType,
  MediaTypeEnum,
  ToneUriFromType,
  PlayCategoryType,
} from './index';
import ContinueBackgroundTaskModel from './model/ContinueBackgroundTaskModel';
import ProximityLockUtil from './utils/ProximityLockUtil';
import AudioRoutingMangaerUtil from './utils/AudioRoutingMangaerUtil';
import VolumeManagerUtil from './utils/VolumeManagerUtil';
import FlashUtil from './utils/FlashUtil';
import AudioFileUtil from './utils/AudioFileUtil';
import PlayModel from './model/PlayModel';
import AudioSessionNotificationUtil from './utils/AudioSessionNotificationUtil';
import Logger from './Logger';

const TAG: string = 'InCallManagerTurboModule';

export class RNInCallManagerTurboModule extends TurboModule {
  static AVSESSION_TAG: string = 'avSession';
  static AVSESSION_TYPE_VOICE_CALL: avSession.AVSessionType = 'voice_call';
  static AVSESSION_TYPE_VIDEO_CALL: avSession.AVSessionType = 'video_call';
  static AVSESSION_TYPE_VOICE: avSession.AVSessionType = 'audio';
  static AVSESSION_TYPE_VIDEO: avSession.AVSessionType = 'video';
  private windowClass: window.Window | null = null;
  private continueBackgroundTask: ContinueBackgroundTaskModel;
  private audioSession: avSession.AVSession;
  private media: string;
  private audioSessionInitialized: boolean = false;
  private ringtone: PlayModel;
  private ringback: PlayModel;
  private busytone: PlayModel;
  private isProximityRegistered: boolean = false;
  private proximityIsNear: boolean = false;
  private isAudioSessionRouteChangeRegistered: boolean = false;
  private forceSpeakerOn: number = 0;
  private incallAudioMode: avSession.AVSessionType;
  private isOrigAudioSetupStored: boolean = false;
  private origIsSpeakerPhoneOn: boolean = false;
  private origIsMicrophoneMute: boolean = false;

  constructor(ctx: TurboModuleContext) {
    super(ctx);
    this.getWindowClass();
    this.audioSession = null;
    this.audioSessionInitialized = false;
    this.ringtone = null;
    this.ringback = null;
    this.ringback = null;
    this.isProximityRegistered = false;
    this.proximityIsNear = false;
    this.incallAudioMode = RNInCallManagerTurboModule.AVSESSION_TYPE_VOICE_CALL;
    this.forceSpeakerOn = 0;
    this.media = MediaTypeEnum.AUDIO;
    this.continueBackgroundTask = new ContinueBackgroundTaskModel(this.ctx.uiAbilityContext as common.UIAbilityContext);
  }

  public addListener(type?: string): void {
  }

  public removeListeners(type?: number): void {
  }

  public start(
    media: MediaType,
    auto: boolean,
    ringback: string): void {
    if (this.audioSessionInitialized) {
      return;
    }
    if (this.ringtone && this.ringtone.isPlaying()) {
      Logger.info(TAG, 'stop ringtone');
      this.stopRingtone();
    }
    this.media = media;
    const isVideo = media === MediaTypeEnum.VIDEO;
    this.incallAudioMode = isVideo ? RNInCallManagerTurboModule.AVSESSION_TYPE_VIDEO_CALL :
    RNInCallManagerTurboModule.AVSESSION_TYPE_VOICE_CALL;
    if (!this.audioSession) {
      avSession.createAVSession(this.ctx.uiAbilityContext, RNInCallManagerTurboModule.AVSESSION_TAG,
        this.incallAudioMode, (err: BusinessError, data: avSession.AVSession) => {
          if (err) {
            Logger.error(`CreateAVSession BusinessError: code: ${err.code}`);
          } else {
            this.audioSession = data;
            AudioSessionNotificationUtil.startAudioSessionKeyEventNotification(this.audioSession,
              (keyText: string, code: number) => {
                this.sendMediaButtonEvent(keyText, code);
              });
            data.activate();
          }
        });
    }
    this.storeOriginalAudioSetup();
    this.forceSpeakerOn = 0;
    this.startAudioSessionNotification();
    if (ringback && ringback.length > 0) {
      this.startRingback(ringback);
    }
    this.audioSessionInitialized = true;
  }

  public stop(busytoneUriType: string): Promise<void> {
    if (!this.audioSessionInitialized) {
      return;
    }
    this.stopRingback();
    if (busytoneUriType.length > 0 && this.startBusytone(busytoneUriType)) {
      return;
    } else {
      this.restoreOriginalAudioSetup();
      this.stopBusytone();
      this.stopAudioSessionNotification();
      this.setSpeakerphoneOn(false);
      this.setMicrophoneMute(false);
      if (this.audioSession) {
        this.audioSession.deactivate((err: BusinessError) => {
          if (err) {
            Logger.error(`deactivate BusinessError: code: ${err.code}`);
          }
          this.audioSession.destroy();
          this.audioSession = null;
        });
      }
      this.forceSpeakerOn = 0;
      this.audioSessionInitialized = false;
    }
  }

  public turnScreenOff(): void {
    if (!ProximityLockUtil.isSupportedProximityLock()) {
      Logger.error(`The current device turnScreenOff call is not Supported.`);
      return;
    }
    try {
      ProximityLockUtil.lock();
    } catch (error) {
      let err: BusinessError = error as BusinessError;
      Logger.error(`The turnScreenOff call failed. error code: ${err.code}`);
    }
  }

  public turnScreenOn(): void {
    if (!ProximityLockUtil.isSupportedProximityLock()) {
      Logger.error(`The current device turnScreenOn call is not Supported.`);
      return;
    }
    try {
      ProximityLockUtil.removeLock();
    } catch (error) {
      let err: BusinessError = error as BusinessError;
      Logger.error(`The turnScreenOn call failed. error code: ${err.code}`);
    }
  }

  public getIsWiredHeadsetPluggedIn(): Promise<{ isWiredHeadsetPluggedIn: boolean }> {
    return new Promise((resolve) => {
      let isWiredHeadsetPluggedIn = AudioRoutingMangaerUtil ? AudioRoutingMangaerUtil.isWiredHeadsetPluggedIn() : false;
      resolve({ isWiredHeadsetPluggedIn: isWiredHeadsetPluggedIn });
    });
  }

  public setFlashOn(enable: boolean): void {
    FlashUtil.setFlashOn(this.ctx.uiAbilityContext, enable);
  }

  public setKeepScreenOn(enable: boolean): void {
    try {
      this.windowClass.setWindowKeepScreenOn(enable);
    } catch (error) {
      let err: BusinessError = error as BusinessError;
      Logger.error(`The setKeepScreenOn call failed. error code: ${err.code}`);
    }
  }

  public setSpeakerphoneOn(enable: boolean): void {
    Logger.error(TAG, 'current not support setSpeakerphoneOn');
  }

  public setForceSpeakerphoneOn(flag: number): void {
    if (flag < -1 || flag > 1) {
      return;
    }
    this.forceSpeakerOn = flag;
    Logger.error(TAG, 'current not support setForceSpeakerphoneOn');
  }

  public setMicrophoneMute(enable: boolean): void {
    if (enable !== VolumeManagerUtil.isMicrophoneMuteSync()) {
      Logger.error(TAG, 'current not support setMicrophoneMute');
    }
  }

  public startRingtone(
    ringtoneUriType: string,
    category: string,
  ): void {
    try {
      if (this.ringtone) {
        if (this.ringtone.isPlaying()) {
          Logger.info(TAG, 'startRingtone is already playing.');
          return;
        } else {
          this.stopRingtone();
        }
      }
      if (VolumeManagerUtil.isRingerModeSilent()) {
        Logger.info(TAG, "startRingtone(): ringer is silent. leave without play.");
        return;
      }
      let ringtoneUri: resourceManager.RawFileDescriptor =
        AudioFileUtil.getRingtoneUri(this.ctx.uiAbilityContext, ringtoneUriType);
      if (!ringtoneUri) {
        Logger.info(TAG, 'startRingtone: no available media');
        return;
      }
      let audioRenderInfoObj: audio.AudioRendererInfo = {
        content: audio.ContentType.CONTENT_TYPE_MUSIC,
        usage: audio.StreamUsage.STREAM_USAGE_RINGTONE,
        rendererFlags: 0
      };
      let fileFd: resourceManager.RawFileDescriptor = ringtoneUri;
      this.ringtone =
        new PlayModel(this.ctx.uiAbilityContext, false, (interruptCode: number, interruptText: string) => {
          let data: { eventText: string, eventCode: number } = {
            eventText: interruptText,
            eventCode: interruptCode,
          };
          this.ctx.rnInstance.emitDeviceEvent(InCallManagerEventType.ONAUDIOFOCUSCHANGE_TYPE, data);
        });
      this.ringtone.setOnPlayComplete((isComplete: boolean) => {
      });
      this.ringtone.prepareWithPlayFd(fileFd, audioRenderInfoObj, true);
      if (category === PlayCategoryType.PLAY_BACK && this.continueBackgroundTask) {
        this.continueBackgroundTask.startContinueBackgroundTask();
      }
    } catch (error) {
      Logger.error(TAG, `Failed to startRingtone. ${error.code}`);
    }
  }

  public stopRingtone(): void {
    if (this.continueBackgroundTask) {
      this.continueBackgroundTask.stopContinueBackgroundTask();
    }
    if (this.ringtone && this.ringtone.avPlayer) {
      this.ringtone.release();
      this.ringtone = null;
    }
  }

  public startProximitySensor(): void {
    if (this.isProximityRegistered === true) {
      return;
    }
    try {
      if (AudioRoutingMangaerUtil.checkAudioRoute([audio.DeviceType.EARPIECE], audio.DeviceFlag.OUTPUT_DEVICES_FLAG)) {
        this.turnScreenOff();
      }
      sensor.on(sensor.SensorId.PROXIMITY, (data: sensor.ProximityResponse) => {
        let state: boolean = data.distance === 0;
        if (state !== this.proximityIsNear) {
          this.proximityIsNear = state;
          this.ctx.rnInstance.emitDeviceEvent(InCallManagerEventType.PROXIMITY_TYPE, { isNear: state });
        }
      }, { interval: 'normal' });
      this.isProximityRegistered = true;
    } catch (error) {
      let e: BusinessError = error as BusinessError;
      Logger.error(`The startProximitySensor call failed. error code: ${e.code}`);
    }
  }

  public stopProximitySensor(): void {
    if (this.isProximityRegistered === false) {
      return;
    }
    try {
      if (AudioRoutingMangaerUtil.checkAudioRoute([audio.DeviceType.EARPIECE], audio.DeviceFlag.OUTPUT_DEVICES_FLAG)) {
        this.turnScreenOn();
      }
      sensor.off(sensor.SensorId.PROXIMITY);
    } catch (error) {
      let err: BusinessError = error as BusinessError;
      Logger.error(`The stopProximitySensor call failed. error code: ${err.code}`);
    }
    this.isProximityRegistered = false;
  }

  public startRingback(ringbackUriType: string): void {
    try {
      if (this.ringback && this.ringback.isPlaying()) {
        Logger.info(TAG, 'startRingback is already playing.');
        return;
      } else if (this.ringback && !this.ringback.isPlaying()) {
        this.stopRingback();
      }
      let ringbackUriTypeNew: string =
        ringbackUriType === ToneUriFromType.DTMF ? ToneUriFromType.DEFAULT : ringbackUriType;

      let ringbackUri: resourceManager.RawFileDescriptor =
        AudioFileUtil.getRingbackUri(this.ctx.uiAbilityContext, ringbackUriTypeNew);
      if (!ringbackUri) {
        Logger.info(TAG, 'startRingback: no available media');
        return;
      }
      let isEarDevice: boolean = AudioRoutingMangaerUtil.checkAudioRoute([audio.DeviceType.EARPIECE],
        audio.DeviceFlag.OUTPUT_DEVICES_FLAG) ||
        this.incallAudioMode !== RNInCallManagerTurboModule.AVSESSION_TYPE_VIDEO_CALL;
      let audioRenderInfoObj: audio.AudioRendererInfo = {
        content: isEarDevice ? audio.ContentType.CONTENT_TYPE_SPEECH : audio.ContentType.CONTENT_TYPE_MUSIC,
        usage: audio.StreamUsage.STREAM_USAGE_VOICE_COMMUNICATION,
        rendererFlags: 0
      };
      let fileFd: resourceManager.RawFileDescriptor = ringbackUri;
      this.ringback =
        new PlayModel(this.ctx.uiAbilityContext, false, (interruptCode: number, interruptText: string) => {
          let data = {
            eventText: interruptText,
            eventCode: interruptCode,
          };
          this.ctx.rnInstance.emitDeviceEvent(InCallManagerEventType.ONAUDIOFOCUSCHANGE_TYPE, data);
        });
      this.ringback.prepareWithPlayFd(fileFd, audioRenderInfoObj, true);
      if (this.continueBackgroundTask) {
        this.continueBackgroundTask.startContinueBackgroundTask();
      }
      this.setSpeakerphoneOn(false);
    } catch (error) {
      let err: BusinessError = error as BusinessError;
      Logger.error(TAG, `The startRingback call failed. error code: ${err.code}`);
    }
  }

  public stopRingback(): void {
    if (this.continueBackgroundTask) {
      this.continueBackgroundTask.stopContinueBackgroundTask();
    }
    if (this.ringback) {
      this.ringback.release();
      this.ringback = null;
    }
  }

  public pokeScreen(timeout: number): void {
    Logger.error(TAG, `The current device pokeScreen call is not Supported.`);
  }

  public getAudioUriJS(audioType: string, fileType: string): Promise<string> {
    return new Promise((resolve) => {
      let result: resourceManager.RawFileDescriptor =
        AudioFileUtil.getAudioUriJS(this.ctx.uiAbilityContext, audioType, fileType);
      let filePath: string = AudioFileUtil.getAudioPath(audioType, fileType);
      if (result) {
        let resultFile: fileIo.File = fileIo.dup(result.fd);
        resolve(resultFile.path ? resultFile.path + filePath : '');
      } else {
        resolve('');
      }
    });
  }

  public chooseAudioRoute(route: string): Promise<string> {
    Logger.error(TAG, 'not support chooseAudioRoute');
    return new Promise((reject) => {
      reject('not support chooseAudioRoute');
    });
  }

  public requestAudioFocus(): Promise<string> {
    return new Promise((reject) => {
      reject('not support requestAudioFocus');
    });
  }

  public abandonAudioFocus(): Promise<string> {
    return new Promise((reject) => {
      reject('not support abandonAudioFocus');
    });
  }

  private startBusytone(busytoneUriStatus: string): boolean {
    try {
      if (this.busytone && this.busytone.isPlaying()) {
        return false;
      } else if (this.busytone && !this.busytone.isPlaying()) {
        this.stopBusytone();
      }
      let busytoneUriType: string = busytoneUriStatus === ToneUriFromType.DTMF ? ToneUriFromType.DEFAULT
        : busytoneUriStatus;
      let busytoneUri: resourceManager.RawFileDescriptor =
        AudioFileUtil.getBusytoneUri(this.ctx.uiAbilityContext, busytoneUriType);
      if (!busytoneUri) {
        Logger.info(TAG, 'startBusytone: no available media');
        return;
      }
      let audioRenderInfoObj: audio.AudioRendererInfo = {
        content: audio.ContentType.CONTENT_TYPE_SONIFICATION,
        usage: audio.StreamUsage.STREAM_USAGE_VOICE_COMMUNICATION,
        rendererFlags: 0
      };
      let fileFd: resourceManager.RawFileDescriptor = busytoneUri;
      this.busytone =
        new PlayModel(this.ctx.uiAbilityContext, false, (interruptCode: number, interruptText: string) => {
          let data = {
            eventText: interruptText,
            eventCode: interruptCode,
          };
          this.ctx.rnInstance.emitDeviceEvent(InCallManagerEventType.ONAUDIOFOCUSCHANGE_TYPE, data);
        });
      this.busytone.setOnPlayComplete((isComplete: boolean) => {
        this.stop('');
      });
      this.busytone.prepareWithPlayFd(fileFd, audioRenderInfoObj, false);
      return true;
    } catch (error) {
      let err: BusinessError = error as BusinessError;
      Logger.error(`The startBusytone call failed. error code: ${err.code}`);
      return false;
    }
  }

  private stopBusytone(): void {
    if (this.busytone) {
      this.busytone.release();
      this.busytone = null;
    }
  }

  private storeOriginalAudioSetup(): void {
    if (!this.isOrigAudioSetupStored) {
      this.origIsSpeakerPhoneOn = AudioRoutingMangaerUtil.isSpeakerphoneOn();
      this.origIsMicrophoneMute = VolumeManagerUtil.isMicrophoneMuteSync();
      this.isOrigAudioSetupStored = true;
    }
  }

  private restoreOriginalAudioSetup(): void {
    if (this.isOrigAudioSetupStored) {
      this.setSpeakerphoneOn(this.origIsSpeakerPhoneOn);
      this.setMicrophoneMute(this.origIsMicrophoneMute);
      this.isOrigAudioSetupStored = false;
    }
  }

  private startAudioSessionNotification(): void {
    this.startAudioSessionRouteChangeNotification();
    this.startProximitySensor();
    this.setKeepScreenOn(true);
  }

  private stopAudioSessionNotification(): void {
    AudioSessionNotificationUtil.stopAudioSessionKeyEventNotification(this.audioSession);
    this.stopAudioSessionRouteChangeNotification();
    this.stopProximitySensor();
    this.setKeepScreenOn(false);
    this.turnScreenOn();
  }

  private sendMediaButtonEvent(keyText: string, code: number): void {
    let params: { eventText: string, eventCode: number } = {
      eventText: keyText,
      eventCode: code
    };
    this.ctx.rnInstance.emitDeviceEvent(InCallManagerEventType.MEDIABUTTON_TYPE, params);
  }

  private startAudioSessionRouteChangeNotification(): void {
    if (this.isAudioSessionRouteChangeRegistered) {
      return;
    }
    if (!AudioRoutingMangaerUtil) {
      return;
    }
    AudioRoutingMangaerUtil.onDeviceChangeWithWiredheadset((param: { isPlugged: boolean, hasMic: boolean, deviceName: string },
      isConnect: boolean) => {
      this.ctx.rnInstance.emitDeviceEvent(InCallManagerEventType.WIREDHEADSET_TYPE, param);
      if (!isConnect) {
        this.ctx.rnInstance.emitDeviceEvent(InCallManagerEventType.NOISYAUDIO_TYPE, null);
      }
    });
    this.isAudioSessionRouteChangeRegistered = true;
  }

  private stopAudioSessionRouteChangeNotification(): void {
    if (!this.isAudioSessionRouteChangeRegistered) {
      return;
    }
    if (!AudioRoutingMangaerUtil) {
      return;
    }
    AudioRoutingMangaerUtil.offDeviceChange();
    this.isAudioSessionRouteChangeRegistered = false;
  }

  private async getWindowClass(): Promise<void> {
    this.windowClass = await window.getLastWindow(this.ctx.uiAbilityContext);
    return;
  }
}