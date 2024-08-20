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

import { backgroundTaskManager } from '@kit.BackgroundTasksKit';
import wantAgent from '@ohos.app.ability.wantAgent';
import type common from '@ohos.app.ability.common'
import { type BusinessError } from '@ohos.base';
import Logger from '../Logger'

const TAG: string = 'ContinueBackgroundTaskModel';
const BACK_UPDATE_TIMEOUT: number = 5000;

export default class ContinueBackgroundTaskModel {
  private context: common.UIAbilityContext;
  private bgModesList: Array<string> = ['audioPlayback'];
  private bgModesDoubleList: Array<string> = ['audioPlayback', 'audioRecording'];

  constructor(context: common.UIAbilityContext) {
    this.context = context
  }

  // start continuous task
  public startContinueBackgroundTask(): void {
    let wantAgentInfo: wantAgent.WantAgentInfo = {
      wants: [
        {
          bundleName: this.context.abilityInfo.bundleName,
          abilityName: this.context.abilityInfo.name,
        }
      ],
      operationType: wantAgent.OperationType.START_ABILITY,
      requestCode: 0,
      wantAgentFlags: [wantAgent.WantAgentFlags.UPDATE_PRESENT_FLAG]
    }

    wantAgent.getWantAgent(wantAgentInfo).then((wantAgentObj) => {
      backgroundTaskManager.startBackgroundRunning(this.context, this.bgModesList, wantAgentObj).then(() => {
        Logger.info(TAG, 'startBackgroundRunning succeeded');
        setTimeout(() => {
          backgroundTaskManager.updateBackgroundRunning(this.context, this.bgModesDoubleList).then(() => {
            Logger.info(TAG, 'Operation updateBackgroundRunning succeeded');
          }).catch((error: BusinessError) => {
            Logger.info(TAG, `Operation updateBackgroundRunning failed. code is ${error.code} message
            is ${error.message}`);
          });
        }, BACK_UPDATE_TIMEOUT)
      }).catch((error: BusinessError) => {
        Logger.error(TAG, `Operation startBackgroundRunning failed. code is ${error.code} message is ${error.message}`);
      });
    });
  }

  // cancel continuous task
  public stopContinueBackgroundTask(): void {
    try {
      backgroundTaskManager.stopBackgroundRunning(this.context).then(() => {
        Logger.info(TAG, `stopBackgroundRunning succeeded`);
      }).catch((err: BusinessError) => {
        Logger.info(TAG, `stopBackgroundRunning failed Cause:  ${JSON.stringify(err)}`);
      })
    } catch (error) {
      Logger.error(TAG, `stopBackgroundRunning failed. code is ${error.code} message is ${error.message}`);
    }
  }
}
