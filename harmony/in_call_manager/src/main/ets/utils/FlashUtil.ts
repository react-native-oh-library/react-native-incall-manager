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

import { type BusinessError } from '@ohos.base';
import Logger from '../Logger'
import { camera } from '@kit.CameraKit';
import { type common } from '@kit.AbilityKit';

const TAG: string = 'FlashUtil'

export default class FlashUtil {
  public static setFlashOn(context: common.UIAbilityContext, enable: boolean): void {
    let cameraManager: camera.CameraManager | undefined = undefined;
    try {
      cameraManager = camera.getCameraManager(context);
      let torchMode: camera.TorchMode = enable ? camera.TorchMode.ON : camera.TorchMode.OFF;
      let isSupported: boolean = cameraManager.isTorchModeSupported(torchMode);
      if (isSupported) {
        cameraManager.setTorchMode(torchMode);
      } else {
        Logger.error(TAG, `The current device setFlashOn call is not Supported.`);
      }

    } catch (error) {
      let err: BusinessError = error as BusinessError;
      Logger.error(TAG, `The setFlashOn call failed. error code: ${err.code}`);
    }
  }
}


