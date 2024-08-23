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

import { BusinessError } from '@ohos.base';
import { audio } from '@kit.AudioKit';
import Logger from '../Logger';

const TAG: string = 'VolumeManagerUtil';
const MICSTATECHANGE: 'micStateChange' = 'micStateChange';

class VolumeManagerUtil {
  private volumeGroupManager: audio.AudioVolumeGroupManager;

  constructor() {
    this.createAudioVolumeManager();
  }

  private createAudioVolumeManager(): void {
    // 麦克风、音量静音
    let audioVolumeManager = audio.getAudioManager().getVolumeManager();
    let groupId: number = audio.DEFAULT_VOLUME_GROUP_ID;

    audioVolumeManager.getVolumeGroupManager(groupId, (err: BusinessError, value: audio.AudioVolumeGroupManager) => {
      if (err) {
        Logger.error(TAG, `Failed to obtain the volume group infos list. ${err.code}`);
        return;
      }
      this.volumeGroupManager = value;
      this.volumeGroupManager.on(MICSTATECHANGE, (micStateChange: audio.MicStateChangeEvent) => {
        Logger.info(TAG, `Current microphone status is: ${micStateChange.mute} `);
      });
    });
  }

  public isRingerModeSilent(): boolean {
    return audio.AudioRingMode.RINGER_MODE_SILENT === this.getRingModeSync();
  }

  public getRingModeSync(): audio.AudioRingMode {
    if (!this.volumeGroupManager) {
      return audio.AudioRingMode.RINGER_MODE_NORMAL;
    }
    try {
      let value: audio.AudioRingMode = this.volumeGroupManager.getRingerModeSync();
      Logger.info(TAG, `Indicate that the ringer mode is obtained ${value}.`);
    } catch (err) {
      let error = err as BusinessError;
      Logger.error(TAG, `Failed to obtain the ringer mode, error ${error.code}.`);
      return audio.AudioRingMode.RINGER_MODE_NORMAL;
    }
  }

  public isMicrophoneMuteSync(): boolean {
    if (!this.volumeGroupManager) {
      return false;
    }
    return this.volumeGroupManager.isMicrophoneMuteSync();
  }
}

export default new VolumeManagerUtil();


