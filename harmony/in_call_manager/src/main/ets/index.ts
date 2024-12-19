/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

export * from './Logger';

export enum InCallManagerEventType {
  PROXIMITY_TYPE = 'Proximity',
  WIRED_HEADSET_TYPE = 'WiredHeadset',
  NOISY_AUDIO_TYPE = 'NoisyAudio',
  MEDIA_BUTTON_TYPE = 'MediaButton',
  ON_AUDIO_FOCUS_CHANGE_TYPE = 'onAudioFocusChange',
}

export type MediaType = 'video' | 'audio';

export enum MediaTypeEnum {
  VIDEO = 'video',
  AUDIO = 'audio',
}

export enum PlayCategoryType {
  PLAY_BACK = 'playback',
  DEFAULT = 'default',
}

export enum RingAudioType {
  RING_STONE = 'ringtone',
  BUSY_TONE = 'busytone',
  RING_BACK = 'ringback',
}

export enum DefaultToneUriType {
  RINGS_TONE_URI = 'defaultRingToneUri',
  RING_BACK_URI = 'defaultRingBackUri',
  BUSY_TONE_URI = 'defaultBusyToneUri',
}

export enum ToneUriFromType {
  DEFAULT = '_DEFAULT_',
  BUNDLE = '_BUNDLE_',
  DTMF = '_DTMF_',
}

export enum AudioFocusType {
  HINT_NONE = 'INTERRUPT_HINT_NONE',
  HINT_PAUSE = 'INTERRUPT_HINT_PAUSE',
  HINT_STOP = 'INTERRUPT_HINT_STOP',
  HINT_DUCK = 'INTERRUPT_HINT_DUCK',
  HINT_UNDUCK = 'INTERRUPT_HINT_UNDUCK',
  HINT_RESUME = 'INTERRUPT_HINT_RESUME',
}

export class RingtoneFilePath {
  static bundleRingBackFilePath: string = 'incallmanager_ringback';
  static bundleRingBackFilePathExt: string = 'mp3';
  static bundleRingToneFilePath: string = 'incallmanager_ringtone';
  static bundleRingToneFilePathExt: string = 'mp3';
  static bundleBusyToneFilePath: string = 'incallmanager_busytone';
  static bundleBusyToneFilePathExt: string = 'mp3';

  static defaultRingBackFilePath: string = 'incallmanager_ringback';
  static defaultRingBackFilePathExt: string = 'mp3';
  static defaultRingToneFilePath: string = 'incallmanager_ringtone';
  static defaultRingToneFilePathExt: string = 'mp3';
  static defaultBusyToneFilePath: string = 'incallmanager_busytone';
  static defaultBusyToneFilePathExt: string = 'mp3';
}
;


export class MediaEventString {
  static KEYCODE_MEDIA_PLAY: string = 'KEYCODE_MEDIA_PLAY';
  static KEYCODE_MEDIA_PAUSE: string = 'KEYCODE_MEDIA_PAUSE';
  static KEYCODE_MEDIA_PLAY_PAUSE: string = 'KEYCODE_MEDIA_PLAY_PAUSE';
  static KEYCODE_MEDIA_NEXT: string = 'KEYCODE_MEDIA_NEXT';
  static KEYCODE_MEDIA_PREVIOUS: string = 'KEYCODE_MEDIA_PREVIOUS';
  static KEYCODE_MEDIA_FAST_FORWARD: string = 'KEYCODE_MEDIA_FAST_FORWARD';
  static KEYCODE_MEDIA_REWIND: string = 'KEYCODE_MEDIA_REWIND';
  static KEYCODE_MEDIA_CLOSE: string = 'KEYCODE_MEDIA_CLOSE';
  static KEYCODE_MEDIA_EJECT: string = 'KEYCODE_MEDIA_EJECT';
  static KEYCODE_MEDIA_RECORD: string = 'KEYCODE_MEDIA_RECORD';
  static KEYCODE_MEDIA_STOP: string = 'KEYCODE_MEDIA_STOP';
  static KEYCODE_UNKNOW: string = 'KEYCODE_UNKNOW';
  static HAND_UP: string = 'HAND_UP';
  static ANSWER: string = 'ANSWER';
}