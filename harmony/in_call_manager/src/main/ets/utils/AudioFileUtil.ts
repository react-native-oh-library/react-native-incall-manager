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

import { type common } from '@kit.AbilityKit';
import { resourceManager } from '@kit.LocalizationKit';
import { DefaultToneUriType, RingAudioType, RingtoneFilePath, ToneUriFromType } from '../index';
import Logger from '../Logger';

const TAG: string = 'AudioFileUtil'
const AUDIO_FILE_PATH_BEFORE: string = '/src/main/resources/rawfile/';

export default class AudioFileUtil {
  public static getAudioPath(audioType: string,
    fileType: string): string {
    let filePath: string = '';
    if (audioType === RingAudioType.RING_BACK) {
      let fileBundle: string = RingtoneFilePath.bundleRingBackFilePath;
      let fileBundleExt: string = RingtoneFilePath.bundleRingBackFilePathExt;
      let fileSysPath: string = RingtoneFilePath.defaultRingBackFilePath;
      let fileSysWithExt: string = RingtoneFilePath.defaultRingBackFilePathExt;
      filePath = fileType === ToneUriFromType.BUNDLE ? `${AUDIO_FILE_PATH_BEFORE}${fileBundle}.${fileBundleExt}` :
        `${AUDIO_FILE_PATH_BEFORE}${fileSysPath}.${fileSysWithExt}`;
    } else if (audioType === RingAudioType.BUSY_TONE) {
      let fileBundle: string = RingtoneFilePath.bundleBusyToneFilePath;
      let fileBundleExt: string = RingtoneFilePath.bundleBusyToneFilePathExt;
      let fileSysPath: string = RingtoneFilePath.defaultBusyToneFilePath;
      let fileSysWithExt: string = RingtoneFilePath.defaultBusyToneFilePathExt;
      filePath = fileType === ToneUriFromType.BUNDLE ? `${AUDIO_FILE_PATH_BEFORE}${fileBundle}.${fileBundleExt}` :
        `${AUDIO_FILE_PATH_BEFORE}${fileSysPath}.${fileSysWithExt}`;
    } else if (audioType === RingAudioType.RING_STONE) {
      let fileBundle: string = RingtoneFilePath.bundleRingToneFilePath;
      let fileBundleExt: string = RingtoneFilePath.bundleRingToneFilePathExt;
      let fileSysPath: string = RingtoneFilePath.defaultRingToneFilePath;
      let fileSysWithExt: string = RingtoneFilePath.defaultRingToneFilePathExt;
      filePath = fileType === ToneUriFromType.BUNDLE ? `${AUDIO_FILE_PATH_BEFORE}${fileBundle}.${fileBundleExt}` :
        `${AUDIO_FILE_PATH_BEFORE}${fileSysPath}.${fileSysWithExt}`;
    } else {
      Logger.error(`The getAudioPath call failed param audioType invalid value`);
    }
    return filePath;
  }

  public static getAudioUriJS(context: common.UIAbilityContext,
    audioType: string, fileType: string): resourceManager.RawFileDescriptor {
    let result: resourceManager.RawFileDescriptor;
    if (audioType === RingAudioType.RING_BACK) {
      result = AudioFileUtil.getRingBackUri(context, fileType);
    } else if (audioType === RingAudioType.BUSY_TONE) {
      result = AudioFileUtil.getBusyToneUri(context, fileType);
    } else if (audioType === RingAudioType.RING_STONE) {
      result = AudioFileUtil.getRingtoneUri(context, fileType);
    } else {
      Logger.error(`The getAudioUriJS call failed param audioType invalid value`);
    }
    return result;
  }

  public static getRingBackUri(context: common.UIAbilityContext,
    ringPathType: string): resourceManager.RawFileDescriptor {
    let fileBundle: string = RingtoneFilePath.bundleRingBackFilePath;
    let fileBundleExt: string = RingtoneFilePath.bundleRingBackFilePathExt;
    let fileSysPath: string = RingtoneFilePath.defaultRingBackFilePath;
    let fileSysWithExt: string = RingtoneFilePath.defaultRingBackFilePathExt;
    if ((!ringPathType || ringPathType === ToneUriFromType.DEFAULT)) {
      return AudioFileUtil.getDefaultUserUri(context, DefaultToneUriType.RING_BACK_URI);
    }
    let typeStr: string = ringPathType;
    let uri: resourceManager.RawFileDescriptor =
      AudioFileUtil.getAudioUriPath(context, typeStr, fileBundle, fileBundleExt, fileSysPath, fileSysWithExt,
        DefaultToneUriType.RING_BACK_URI);
    return uri;
  }

  public static getBusyToneUri(context: common.UIAbilityContext,
    ringPathType: string): resourceManager.RawFileDescriptor {
    let fileBundle: string = RingtoneFilePath.bundleBusyToneFilePath;
    let fileBundleExt: string = RingtoneFilePath.bundleBusyToneFilePathExt;
    let fileSysPath: string = RingtoneFilePath.defaultBusyToneFilePath;
    let fileSysWithExt: string = RingtoneFilePath.defaultBusyToneFilePathExt;
    if ((!ringPathType || ringPathType === ToneUriFromType.DEFAULT)) {
      return AudioFileUtil.getDefaultUserUri(context, DefaultToneUriType.BUSY_TONE_URI);
    }
    let typeStr: string = ringPathType;
    let uri: resourceManager.RawFileDescriptor =
      AudioFileUtil.getAudioUriPath(context, typeStr, fileBundle, fileBundleExt, fileSysPath, fileSysWithExt,
        DefaultToneUriType.BUSY_TONE_URI);
    return uri;
  }

  public static getRingtoneUri(context: common.UIAbilityContext,
    ringPathType: string): resourceManager.RawFileDescriptor {
    let fileBundle: string = RingtoneFilePath.bundleRingToneFilePath;
    let fileBundleExt: string = RingtoneFilePath.bundleRingToneFilePathExt;
    let fileSysPath: string = RingtoneFilePath.defaultRingToneFilePath;
    let fileSysWithExt: string = RingtoneFilePath.defaultRingToneFilePathExt;
    if ((!ringPathType || ringPathType === ToneUriFromType.DEFAULT)) {
      return AudioFileUtil.getDefaultUserUri(context, DefaultToneUriType.RINGS_TONE_URI);
    }
    let typeStr: string = ringPathType;
    let uri: resourceManager.RawFileDescriptor =
      AudioFileUtil.getAudioUriPath(context, typeStr, fileBundle, fileBundleExt, fileSysPath, fileSysWithExt,
        DefaultToneUriType.RINGS_TONE_URI);
    return uri;
  }

  private static getAudioUriPath(context: common.UIAbilityContext, type: string, fileBundle: string,
    fileBundleExt: string, fileSysPath: string,
    fileSysWithExt: string, uriDefault: string): resourceManager.RawFileDescriptor {
    if (type === ToneUriFromType.BUNDLE) {
      let fileFd: resourceManager.RawFileDescriptor =
        context.resourceManager.getRawFdSync(fileBundle + '.' + fileBundleExt);
      if (fileFd.fd > 0) {
        return fileFd;
      } else {
        return AudioFileUtil.getDefaultUserUri(context, uriDefault);
      }
    }
    let uriBundle: resourceManager.RawFileDescriptor;
    if (!uriBundle) {
      let sysPath: string = fileSysPath + '.' + fileSysWithExt;
      uriBundle = AudioFileUtil.getSysFileUri(context, sysPath);
    }
    if (!uriBundle) {
      return AudioFileUtil.getDefaultUserUri(context, uriDefault);
    }
    return uriBundle;
  }

  private static getSysFileUri(context: common.UIAbilityContext, target: string): resourceManager.RawFileDescriptor {
    let sysFileUri: resourceManager.RawFileDescriptor = context.resourceManager.getRawFdSync(target);
    if (sysFileUri.fd) {
      return sysFileUri;
    }
    return null;
  }

  private static getDefaultUserUri(context: common.UIAbilityContext, type: string): resourceManager.RawFileDescriptor {
    if (type === DefaultToneUriType.RINGS_TONE_URI) {
      let path: string =
        `${context.resourceDir}/${RingtoneFilePath.defaultRingToneFilePath}.${RingtoneFilePath.defaultRingToneFilePathExt}`;
      let sysFileUri: resourceManager.RawFileDescriptor = context.resourceManager.getRawFdSync(path);
      if (sysFileUri.fd) {
        return sysFileUri;
      }
      return null;
    } else if (type === DefaultToneUriType.RING_BACK_URI) {
      let path: string =
        `${context.resourceDir}/${RingtoneFilePath.defaultRingBackFilePath}.${RingtoneFilePath.defaultRingBackFilePathExt}`;
      let sysFileUri: resourceManager.RawFileDescriptor = context.resourceManager.getRawFdSync(path);
      if (sysFileUri.fd) {
        return sysFileUri;
      }
      return null;
    } else if (type === DefaultToneUriType.BUSY_TONE_URI) {
      let path: string =
        `${context.resourceDir}/${RingtoneFilePath.defaultBusyToneFilePath}.${RingtoneFilePath.defaultBusyToneFilePathExt}`;
      let sysFileUri: resourceManager.RawFileDescriptor = context.resourceManager.getRawFdSync(path);
      if (sysFileUri.fd) {
        return sysFileUri;
      }
      return null;
    } else {
      let path: string =
        `${context.resourceDir}/${RingtoneFilePath.defaultBusyToneFilePath}.${RingtoneFilePath.defaultBusyToneFilePathExt}`;
      let sysFileUri: resourceManager.RawFileDescriptor = context.resourceManager.getRawFdSync(path);
      if (sysFileUri.fd) {
        return sysFileUri;
      }
      return null;
    }
  }
}


