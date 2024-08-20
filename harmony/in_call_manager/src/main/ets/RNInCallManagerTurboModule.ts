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
import Logger from './Logger';
import { type BusinessError, runningLock } from '@kit.BasicServicesKit';
import { sensor } from '@kit.SensorServiceKit';
import { avSession } from '@kit.AVSessionKit';
import { audio } from '@kit.AudioKit';
import { fileIo } from '@kit.CoreFileKit';
import { KeyCode, type KeyEvent } from '@kit.InputKit';
import {
  InCallManagerEventType,
  type MediaType,
  MediaTypeEnum,
  RingAudioType,
  DefaultToneUriType,
  ToneUriFromType,
  RingtoneFilePath,
  MediaEventString,
  PlayCategoryType
} from './index';
import ContinueBackgroundTaskModel from './model/ContinueBackgroundTaskModel';
import ProximityLockUtil from './utils/ProximityLockUtil';
import AudioRoutingMangaerUtil from './utils/AudioRoutingMangaerUtil';
import VolumeManagerUtil from './utils/VolumeManagerUtil';
import FlashUtil from './utils/FlashUtil';
import PlayModel from './model/PlayModel';
import type { resourceManager } from '@kit.LocalizationKit';

const TAG: string = 'InCallManagerTurboModule';
const AUDIO_FILE_PATH_BEFORE: string = '/src/main/resources/rawfile/';

export class RNInCallManagerTurboModule extends TurboModule {
  static AVSESSION_TAG: string = 'avSession';
  static AVSESSION_TYPE_VOICE_CALL: avSession.AVSessionType = 'voice_call';
  static AVSESSION_TYPE_VIDEO_CALL: avSession.AVSessionType = 'video_call';
  static AVSESSION_TYPE_VOICE: avSession.AVSessionType = 'audio';
  static AVSESSION_TYPE_VIDEO: avSession.AVSessionType = 'video';
  private windowClass: window.Window | undefined = undefined;
  private continueBackgroundTask: ContinueBackgroundTaskModel;
  private audioSession: avSession.AVSession = undefined;
  private media: string = undefined;
  private audioSessionInitialized: boolean = false;
  private ringtone: PlayModel = undefined;
  private ringback: PlayModel = undefined;
  private busytone: PlayModel = undefined;
  private isProximityRegistered: boolean = false;
  private proximityIsNear: boolean = false;
  private isAudioSessionRouteChangeRegistered: boolean = false;
  private forceSpeakerOn: number = 0;
  private incallAudioMode: avSession.AVSessionType = undefined;
  private isOrigAudioSetupStored: boolean = false;
  private origIsSpeakerPhoneOn: boolean = false;
  private origIsMicrophoneMute: boolean = false;

  constructor(ctx: TurboModuleContext) {
    super(ctx);
    this.getWindowClass();
    this.audioSession = undefined;
    this.audioSessionInitialized = false;
    this.ringtone = undefined;
    this.ringback = undefined;
    this.ringback = undefined;
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
            this.startAudioSessionKeyEventNotification();
            data.activate();
          }
        });
    }
    this.storeOriginalAudioSetup();
    this.forceSpeakerOn = 0;
    this.startAudioSessionNotification();
    if (ringback.length > 0) {
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
          this.audioSession = undefined;
        });
      }
      this.forceSpeakerOn = 0;
      this.audioSessionInitialized = false;
    }
  }

  public turnScreenOff(): void {
    if (!ProximityLockUtil) {
      return;
    }
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
    if (!ProximityLockUtil) {
      return;
    }
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
      let isWiredHeadsetPluggedIn = this.isWiredHeadsetPluggedIn();
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
    if (!AudioRoutingMangaerUtil) {
      return;
    }
    if (AudioRoutingMangaerUtil) {
      Logger.error(TAG, 'current not support setSpeakerphoneOn');
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (enable !== AudioRoutingMangaerUtil.isCommunicationDeviceActiveSync(audio.CommunicationDeviceType.SPEAKER)) {
      AudioRoutingMangaerUtil.setCommunicationDevice(audio.CommunicationDeviceType.SPEAKER, enable);
    }
  }

  public setForceSpeakerphoneOn(flag: number): void {
    if (flag < -1 || flag > 1) {
      return;
    }
    this.forceSpeakerOn = flag;
    if (AudioRoutingMangaerUtil) {
      Logger.error(TAG, 'current not support setForceSpeakerphoneOn');
      return;
    }
    if (!AudioRoutingMangaerUtil) {
      return;
    }
    if (flag === 1) {
      // SPEAKER
      AudioRoutingMangaerUtil.setCommunicationDevice(audio.CommunicationDeviceType.SPEAKER, true);
    } else if (flag === -1) {
      // EARPIECE
      AudioRoutingMangaerUtil.setCommunicationDevice(audio.CommunicationDeviceType.SPEAKER, false);
    } else {
      // default
      AudioRoutingMangaerUtil.setCommunicationDevice(audio.CommunicationDeviceType.SPEAKER, false);
    }
  }

  public setMicrophoneMute(enable: boolean): void {
    if (!VolumeManagerUtil) {
      return;
    }
    if (VolumeManagerUtil) {
      Logger.error(TAG, 'current not support setMicrophoneMute');
      return;
    }
    if (enable !== VolumeManagerUtil.isMicrophoneMuteSync()) {
      try {
        VolumeManagerUtil.setMicrophoneMute(enable);
      } catch (error) {
        let err: BusinessError = error as BusinessError;
        Logger.error(`Failed to setMicrophoneMute. ${err.code}`);
      }
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
        Logger.debug(TAG, "startRingtone(): ringer is silent. leave without play.");
        return;
      }
      let ringtoneUri: resourceManager.RawFileDescriptor = this.getRingtoneUri(ringtoneUriType);
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
          let data = {
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
      if (this.checkAudioRoute([audio.DeviceType.EARPIECE], audio.DeviceFlag.OUTPUT_DEVICES_FLAG)) {
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
      if (this.checkAudioRoute([audio.DeviceType.EARPIECE], audio.DeviceFlag.OUTPUT_DEVICES_FLAG)) {
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
      if (this.ringback) {
        if (this.ringback.isPlaying()) {
          Logger.info(TAG, 'startRingback is already playing.');
          return;
        } else {
          this.stopRingback();
        }
      }
      let ringbackUriTypeNew = ringbackUriType === ToneUriFromType.DTMF ? ToneUriFromType.DEFAULT : ringbackUriType;

      let ringbackUri: resourceManager.RawFileDescriptor = this.getRingbackUri(ringbackUriTypeNew);
      if (!ringbackUri) {
        Logger.info(TAG, 'startRingback: no available media');
        return;
      }
      let isEarDevice = this.checkAudioRoute([audio.DeviceType.EARPIECE],
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
      this.ringback.setOnPlayComplete((isComplete: boolean) => {
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
      this.ringback = undefined;
    }
  }

  public pokeScreen(timeout: number): void {
    if (!runningLock.isSupported) {
      Logger.error(TAG, `The current device pokeScreen call is not Supported.`);
      return;
    }
    Logger.error(TAG, `The current device pokeScreen call is not Supported.`);
  }


  public getAudioUriJS(audioType: string, fileType: string): Promise<string | null> {
    return new Promise((resolve) => {
      let result: resourceManager.RawFileDescriptor;
      let filePath: string = '';
      if (audioType === RingAudioType.RINGBACK) {
        let fileBundle: string = RingtoneFilePath.bundleRingBackFilePath;
        let fileBundleExt: string = RingtoneFilePath.bundleRingBackFilePathExt;
        let fileSysPath: string = RingtoneFilePath.defaultRingBackFilePath;
        let fileSysWithExt: string = RingtoneFilePath.defaultRingBackFilePathExt;
        filePath = fileType === ToneUriFromType.BUNDLE ? `${AUDIO_FILE_PATH_BEFORE}${fileBundle}.${fileBundleExt}` :
          `${AUDIO_FILE_PATH_BEFORE}${fileSysPath}.${fileSysWithExt}`;
        result = this.getRingbackUri(fileType);
      } else if (audioType === RingAudioType.BUSYTONE) {
        let fileBundle: string = RingtoneFilePath.bundleBusyToneFilePath;
        let fileBundleExt: string = RingtoneFilePath.bundleBusyToneFilePathExt;
        let fileSysPath: string = RingtoneFilePath.defaultBusyToneFilePath;
        let fileSysWithExt: string = RingtoneFilePath.defaultBusyToneFilePathExt;
        filePath = fileType === ToneUriFromType.BUNDLE ? `${AUDIO_FILE_PATH_BEFORE}${fileBundle}.${fileBundleExt}` :
          `${AUDIO_FILE_PATH_BEFORE}${fileSysPath}.${fileSysWithExt}`;
        result = this.getBusytoneUri(fileType);
      } else if (audioType === RingAudioType.RINGSTONE) {
        let fileBundle: string = RingtoneFilePath.bundleRingToneFilePath;
        let fileBundleExt: string = RingtoneFilePath.bundleRingToneFilePathExt;
        let fileSysPath: string = RingtoneFilePath.defaultRingToneFilePath;
        let fileSysWithExt: string = RingtoneFilePath.defaultRingToneFilePathExt;
        filePath = fileType === ToneUriFromType.BUNDLE ? `${AUDIO_FILE_PATH_BEFORE}${fileBundle}.${fileBundleExt}` :
          `${AUDIO_FILE_PATH_BEFORE}${fileSysPath}.${fileSysWithExt}`;
        result = this.getRingtoneUri(fileType);
      }
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
      if (this.busytone) {
        if (this.busytone.isPlaying()) {
          return false;
        } else {
          this.stopBusytone();
        }
      }
      let busytoneUriType: string = busytoneUriStatus === ToneUriFromType.DTMF ? ToneUriFromType.DEFAULT
        : busytoneUriStatus;
      let busytoneUri: resourceManager.RawFileDescriptor = this.getBusytoneUri(busytoneUriType);
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

      return false;
    }
  }

  private stopBusytone(): void {
    if (this.busytone) {
      this.busytone.release();
      this.busytone = undefined;
    }
  }

  private isWiredHeadsetPluggedIn(): boolean {
    if (!AudioRoutingMangaerUtil) {
      return false;
    }

    return this.checkAudioRoute([audio.DeviceType.WIRED_HEADPHONES, audio.DeviceType.BLUETOOTH_SCO],
      audio.DeviceFlag.OUTPUT_DEVICES_FLAG) ||
    this.checkAudioRoute([audio.DeviceType.WIRED_HEADSET, audio.DeviceType.BLUETOOTH_SCO],
      audio.DeviceFlag.INPUT_DEVICES_FLAG);
  }

  private checkAudioRoute(targetPortTypeArray: audio.DeviceType[], routeType: audio.DeviceFlag): boolean {
    if (!AudioRoutingMangaerUtil) {
      return false;
    }
    try {
      let deviceDescriptors: audio.AudioDeviceDescriptors;
      if (routeType === audio.DeviceFlag.OUTPUT_DEVICES_FLAG) {
        let rendererInfo: audio.AudioRendererInfo = {
          usage: audio.StreamUsage.STREAM_USAGE_VOICE_COMMUNICATION,
          rendererFlags: 0
        }
        deviceDescriptors = AudioRoutingMangaerUtil.getPreferOutputDeviceForRendererInfo(rendererInfo);
      } else if (routeType === audio.DeviceFlag.INPUT_DEVICES_FLAG) {
        let capturerInfo: audio.AudioCapturerInfo = {
          source: audio.SourceType.SOURCE_TYPE_VOICE_COMMUNICATION,
          capturerFlags: 0
        }
        deviceDescriptors = AudioRoutingMangaerUtil.getPreferredInputDeviceForCapturerInfoSync(capturerInfo);
      } else {
        deviceDescriptors = AudioRoutingMangaerUtil.getDevicesSync(routeType);
      }
      let isCurrentRoute = false;
      deviceDescriptors.forEach((desc: audio.AudioDeviceDescriptor) => {
        if (targetPortTypeArray.indexOf(desc.deviceType) >= 0) {
          isCurrentRoute = true;
        }
      });
      return isCurrentRoute;
    } catch (error) {
      let e: BusinessError = error as BusinessError;
      Logger.error(TAG, `The checkAudioRoute call failed. error code: ${e.code}`);
      return false;
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
    this.stopAudioSessionKeyEventNotification();
    this.stopAudioSessionRouteChangeNotification();
    this.stopProximitySensor();
    this.setKeepScreenOn(false);
    this.turnScreenOn();
  }

  private startAudioSessionKeyEventNotification(): void {
    if (this.audioSession) {
      this.audioSession.on('play', () => {

        let keyText: string = MediaEventString.KEYCODE_MEDIA_PLAY;
        let code = KeyCode.KEYCODE_MEDIA_PLAY;
        this.sendMediaButtonEvent(keyText, code);
      });
      this.audioSession.on('pause', () => {
        let keyText: string = MediaEventString.KEYCODE_MEDIA_PAUSE;
        let code = KeyCode.KEYCODE_MEDIA_PAUSE;
        this.sendMediaButtonEvent(keyText, code);
      });
      this.audioSession.on('playNext', () => {
        let keyText: string = MediaEventString.KEYCODE_MEDIA_NEXT;
        let code = KeyCode.KEYCODE_MEDIA_NEXT;
        this.sendMediaButtonEvent(keyText, code);
      });
      this.audioSession.on('stop', () => {
        let keyText: string = MediaEventString.KEYCODE_MEDIA_STOP;
        let code = KeyCode.KEYCODE_MEDIA_STOP;
        this.sendMediaButtonEvent(keyText, code);
      });
      this.audioSession.on('playPrevious', () => {
        let keyText: string = MediaEventString.KEYCODE_MEDIA_PREVIOUS;
        let code = KeyCode.KEYCODE_MEDIA_PREVIOUS;
        this.sendMediaButtonEvent(keyText, code);
      });
      this.audioSession.on('fastForward', () => {
        let keyText: string = MediaEventString.KEYCODE_MEDIA_FAST_FORWARD;
        let code = KeyCode.KEYCODE_MEDIA_FAST_FORWARD;
        this.sendMediaButtonEvent(keyText, code);
      });
      this.audioSession.on('rewind', () => {
        let keyText: string = MediaEventString.KEYCODE_MEDIA_REWIND;
        let code = KeyCode.KEYCODE_MEDIA_REWIND;
        this.sendMediaButtonEvent(keyText, code);
      });
      this.audioSession.on('answer', () => {
        let keyText: string = MediaEventString.ANSWER;
        let code = KeyCode.KEYCODE_MEDIA_PLAY;
        this.sendMediaButtonEvent(keyText, code);
      });
      this.audioSession.on('hangUp', () => {
        let keyText: string = MediaEventString.HAND_UP;
        let code = KeyCode.KEYCODE_MEDIA_CLOSE;
        this.sendMediaButtonEvent(keyText, code);
      });
      this.audioSession.on('handleKeyEvent', (event: KeyEvent) => {
        let keyText: string = '';
        switch (event.key.code) {
          case KeyCode.KEYCODE_MEDIA_PLAY:
            keyText = MediaEventString.KEYCODE_MEDIA_PLAY;
            break;
          case KeyCode.KEYCODE_MEDIA_PAUSE:
            keyText = MediaEventString.KEYCODE_MEDIA_PAUSE;
            break;
          case KeyCode.KEYCODE_MEDIA_PLAY_PAUSE:
            keyText = MediaEventString.KEYCODE_MEDIA_PLAY_PAUSE;
            break;
          case KeyCode.KEYCODE_MEDIA_NEXT:
            keyText = MediaEventString.KEYCODE_MEDIA_NEXT;
            break;
          case KeyCode.KEYCODE_MEDIA_PREVIOUS:
            keyText = MediaEventString.KEYCODE_MEDIA_PREVIOUS;
            break;
          case KeyCode.KEYCODE_MEDIA_CLOSE:
            keyText = MediaEventString.KEYCODE_MEDIA_CLOSE;
            break;
          case KeyCode.KEYCODE_MEDIA_EJECT:
            keyText = MediaEventString.KEYCODE_MEDIA_EJECT;
            break;
          case KeyCode.KEYCODE_MEDIA_RECORD:
            keyText = MediaEventString.KEYCODE_MEDIA_RECORD;
            break;
          case KeyCode.KEYCODE_MEDIA_STOP:
            keyText = MediaEventString.KEYCODE_MEDIA_STOP;
            break;
          default:
            keyText = MediaEventString.KEYCODE_UNKNOW;
            break;
        }
        this.sendMediaButtonEvent(keyText, event.key.code);
      });
    }
  }

  private sendMediaButtonEvent(keyText: string, code: number): void {
    let params = {
      eventText: keyText,
      eventCode: code
    };
    this.ctx.rnInstance.emitDeviceEvent(InCallManagerEventType.MEDIABUTTON_TYPE, params);
  }

  private stopAudioSessionKeyEventNotification(): void {
    if (this.audioSession) {
      this.audioSession.off('play');
      this.audioSession.off('pause');
      this.audioSession.off('playNext');
      this.audioSession.off('stop');
      this.audioSession.off('playPrevious');
      this.audioSession.off('fastForward');
      this.audioSession.off('rewind');
      this.audioSession.off('answer');
      this.audioSession.off('hangUp');
      this.audioSession.off('handleKeyEvent');
    }
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


  private getRingbackUri(ringPathType: string): resourceManager.RawFileDescriptor {
    let fileBundle: string = RingtoneFilePath.bundleRingBackFilePath;
    let fileBundleExt: string = RingtoneFilePath.bundleRingBackFilePathExt;
    let fileSysPath: string = RingtoneFilePath.defaultRingBackFilePath;
    let fileSysWithExt: string = RingtoneFilePath.defaultRingBackFilePathExt;
    if ((!ringPathType || ringPathType === ToneUriFromType.DEFAULT)) {
      return this.getDefaultUserUri(DefaultToneUriType.RINGBACKURI);
    }
    let typeStr: string = ringPathType;
    let uri: resourceManager.RawFileDescriptor =
      this.getAudioUriPath(typeStr, fileBundle, fileBundleExt, fileSysPath, fileSysWithExt,
        DefaultToneUriType.RINGBACKURI);
    return uri;
  }

  private getBusytoneUri(ringPathType: string): resourceManager.RawFileDescriptor {
    let fileBundle: string = RingtoneFilePath.bundleBusyToneFilePath;
    let fileBundleExt: string = RingtoneFilePath.bundleBusyToneFilePathExt;
    let fileSysPath: string = RingtoneFilePath.defaultBusyToneFilePath;
    let fileSysWithExt: string = RingtoneFilePath.defaultBusyToneFilePathExt;
    if ((!ringPathType || ringPathType === ToneUriFromType.DEFAULT)) {
      return this.getDefaultUserUri(DefaultToneUriType.BUSYTONEURI);
    }
    let typeStr: string = ringPathType;
    let uri: resourceManager.RawFileDescriptor =
      this.getAudioUriPath(typeStr, fileBundle, fileBundleExt, fileSysPath, fileSysWithExt,
        DefaultToneUriType.BUSYTONEURI);
    return uri;
  }

  private getRingtoneUri(ringPathType: string): resourceManager.RawFileDescriptor {
    let fileBundle: string = RingtoneFilePath.bundleRingToneFilePath;
    let fileBundleExt: string = RingtoneFilePath.bundleRingToneFilePathExt;
    let fileSysPath: string = RingtoneFilePath.defaultRingToneFilePath;
    let fileSysWithExt: string = RingtoneFilePath.defaultRingToneFilePathExt;
    if ((!ringPathType || ringPathType === ToneUriFromType.DEFAULT)) {
      return this.getDefaultUserUri(DefaultToneUriType.RINGSTONEURI);
    }
    let typeStr: string = ringPathType;
    let uri: resourceManager.RawFileDescriptor =
      this.getAudioUriPath(typeStr, fileBundle, fileBundleExt, fileSysPath, fileSysWithExt,
        DefaultToneUriType.RINGSTONEURI);
    return uri;
  }

  private getAudioUriPath(type: string, fileBundle: string, fileBundleExt: string, fileSysPath: string,
    fileSysWithExt: string, uriDefault: string): resourceManager.RawFileDescriptor {
    if (type === ToneUriFromType.BUNDLE) {
      let fileFd = this.ctx.uiAbilityContext.resourceManager.getRawFdSync(fileBundle + '.' + fileBundleExt);
      if (fileFd.fd > 0) {
        return fileFd;
      } else {
        return this.getDefaultUserUri(uriDefault);
      }
    }
    let uriBundle: resourceManager.RawFileDescriptor;
    if (!uriBundle) {
      let sysPath = fileSysPath + '.' + fileSysWithExt;
      uriBundle = this.getSysFileUri(sysPath);
    }
    if (!uriBundle) {
      return this.getDefaultUserUri(uriDefault);
    }
    return uriBundle;
  }

  private getSysFileUri(target: string): resourceManager.RawFileDescriptor {
    let sysFileUri: resourceManager.RawFileDescriptor = this.ctx.uiAbilityContext.resourceManager.getRawFdSync(target);
    if (sysFileUri.fd) {
      return sysFileUri;
    }
    return null;
  }

  private getDefaultUserUri(type: string): resourceManager.RawFileDescriptor {
    if (type === DefaultToneUriType.RINGSTONEURI) {
      let path = `${RingtoneFilePath.defaultRingToneFilePath}.${RingtoneFilePath.defaultRingToneFilePathExt}`;
      let sysFileUri: resourceManager.RawFileDescriptor = this.ctx.uiAbilityContext.resourceManager.getRawFdSync(path);
      if (sysFileUri.fd) {
        return sysFileUri;
      }
      return null;
    } else if (type === DefaultToneUriType.RINGBACKURI) {
      let path =
        `${this.ctx.uiAbilityContext.resourceDir}/${RingtoneFilePath.defaultRingBackFilePath}.${RingtoneFilePath.defaultRingBackFilePathExt}`;
      let sysFileUri: resourceManager.RawFileDescriptor = this.ctx.uiAbilityContext.resourceManager.getRawFdSync(path);
      if (sysFileUri.fd) {
        return sysFileUri;
      }
      return null;
    } else if (type === DefaultToneUriType.BUSYTONEURI) {
      let path =
        `${this.ctx.uiAbilityContext.resourceDir}/${RingtoneFilePath.defaultBusyToneFilePath}.${RingtoneFilePath.defaultBusyToneFilePathExt}`;
      let sysFileUri: resourceManager.RawFileDescriptor = this.ctx.uiAbilityContext.resourceManager.getRawFdSync(path);
      if (sysFileUri.fd) {
        return sysFileUri;
      }
      return null;
    } else {
      let path =
        `${this.ctx.uiAbilityContext.resourceDir}/${RingtoneFilePath.defaultBusyToneFilePath}.${RingtoneFilePath.defaultBusyToneFilePathExt}`;
      let sysFileUri: resourceManager.RawFileDescriptor = this.ctx.uiAbilityContext.resourceManager.getRawFdSync(path);
      if (sysFileUri.fd) {
        return sysFileUri;
      }
      return null;
    }
  }

  private async getWindowClass(): Promise<void> {
    this.windowClass = await window.getLastWindow(this.ctx.uiAbilityContext);
    return;
  }
}