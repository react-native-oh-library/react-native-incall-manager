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
import { runningLock } from '@kit.BasicServicesKit';
import Logger from '../Logger'

const TAG: string = 'ProximityLockUtil';

class ProximityLockUtil {
  private currentProximityLock: runningLock.RunningLock = undefined;
  private lock_tag: string = 'running_lock_proximity_first';
  private lock_time: number = 0;

  constructor() {
    this.createProximityLock();
  }

  private createProximityLock(): void {
    runningLock.create(this.lock_tag, runningLock.RunningLockType.PROXIMITY_SCREEN_CONTROL,
      (err: Error, lock: runningLock.RunningLock) => {
        if (typeof err === 'undefined') {
          this.currentProximityLock = lock;
        } else {
          Logger.error(TAG, `create createProximityLock failed. error code: ${(err as BusinessError).code}`);
        }
      });
  }

  public isSupportedProximityLock(): boolean {
    return runningLock.isSupported(runningLock.RunningLockType.PROXIMITY_SCREEN_CONTROL);
  }

  public lock(): void {
    if (this.currentProximityLock) {
      try {
        if (this.currentProximityLock.isHolding()) {
          this.currentProximityLock.unhold();
        }
        this.currentProximityLock.hold(this.lock_time);
      } catch (error) {
        let err: BusinessError = error as BusinessError;
        Logger.error(TAG, `The lock call failed. error code: ${err.code}`);
      }
    }
  }

  public lockFromTime(timeout: number): void {
    if (this.currentProximityLock) {
      try {
        this.currentProximityLock.hold(timeout);
      } catch (error) {
        let err: BusinessError = error as BusinessError;
        Logger.error(TAG, `The lockFromTime call failed. error code: ${err.code}`);
      }
    }
  }

  public removeLock(): void {
    if (this.currentProximityLock && this.currentProximityLock.isHolding()) {
      this.currentProximityLock.unhold();
    }
  }
}

export default new ProximityLockUtil();
