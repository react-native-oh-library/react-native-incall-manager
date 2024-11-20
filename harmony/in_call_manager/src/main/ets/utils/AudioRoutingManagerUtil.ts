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
import { audio } from '@kit.AudioKit';
import Logger from '../Logger';

const TAG: string = 'AudioRoutingManagerUtil';
const DEVICECHANGE: 'deviceChange' = 'deviceChange';

class AudioRoutingManagerUtil {
  private routingManager: audio.AudioRoutingManager;

  constructor() {
    this.createRouteManager();
  }

  private createRouteManager(): void {
    let routingManager: audio.AudioRoutingManager = audio.getAudioManager().getRoutingManager();
    this.routingManager = routingManager;
  }

  public isSpeakerphoneOn(): boolean {
    if (!this.routingManager) {
      return false;
    }
    return this.routingManager.isCommunicationDeviceActiveSync(audio.CommunicationDeviceType.SPEAKER);
  }

  public isCommunicationDeviceActiveSync(deviceType: audio.CommunicationDeviceType): boolean {
    if (!this.routingManager) {
      return false;
    }
    return this.routingManager.isCommunicationDeviceActiveSync(deviceType);
  }

  public getPreferOutputDeviceForRendererInfo(rendererInfo: audio.AudioRendererInfo): audio.AudioDeviceDescriptors {
    if (!this.routingManager) {
      return;
    }
    return this.routingManager.getPreferredOutputDeviceForRendererInfoSync(rendererInfo);
  }

  public getPreferredInputDeviceForCapturerInfoSync(rendererInfo: audio.AudioCapturerInfo): audio.AudioDeviceDescriptors {
    if (!this.routingManager) {
      return;
    }
    return this.routingManager.getPreferredInputDeviceForCapturerInfoSync(rendererInfo);
  }

  public setCommunicationDevice(deviceType: audio.CommunicationDeviceType, enable: boolean): void {
    if (!this.routingManager) {
      return;
    }
    if (this.routingManager) {
      Logger.error(TAG, 'current not support change output device route');
      return;
    }
    this.routingManager.setCommunicationDevice(deviceType, enable, (err: BusinessError) => {
      if (err) {
        Logger.error(TAG, `Failed to set the active status of the device. ${err.code}`);
        return;
      }
      let rendererInfo: audio.AudioRendererInfo = {
        usage: audio.StreamUsage.STREAM_USAGE_VOICE_COMMUNICATION,
        rendererFlags: 0
      };
      let currentDevice: audio.AudioDeviceDescriptors = this.getPreferOutputDeviceForRendererInfo(rendererInfo);
      Logger.info(TAG,
        `setCommunicationDevice sucess, deviceType:${currentDevice.length > 0 ? currentDevice[0].deviceType : ''}}`);
    });
  }

  public getDevicesSync(deviceFlag: audio.DeviceFlag): audio.AudioDeviceDescriptors {
    if (!this.routingManager) {
      return;
    }
    return this.routingManager.getDevicesSync(deviceFlag);
  }

  public onDeviceChangeWithWiredHeadSet(changeCk: (params: { isPlugged: boolean, hasMic: boolean, deviceName: string },
    isConnect: boolean) => void): void {
    if (!this.routingManager) {
      return;
    }
    this.routingManager.on(DEVICECHANGE, audio.DeviceFlag.ALL_DEVICES_FLAG,
      (deviceChanged: audio.DeviceChangeAction) => {
        let sendParams: { isPlugged: boolean, hasMic: boolean, deviceName: string } = {
          isPlugged: false,
          hasMic: false,
          deviceName: ''
        };
        let isFindWired: boolean = false;
        deviceChanged.deviceDescriptors.forEach((desc: audio.AudioDeviceDescriptor) => {
          if (desc.deviceType === audio.DeviceType.WIRED_HEADSET) {
            sendParams = {
              isPlugged: deviceChanged.type === audio.DeviceChangeType.CONNECT,
              hasMic: true,
              deviceName: desc.name
            };
            isFindWired = true;
          } else if (desc.deviceType === audio.DeviceType.WIRED_HEADPHONES) {
            sendParams = {
              isPlugged: deviceChanged.type === audio.DeviceChangeType.CONNECT,
              hasMic: false,
              deviceName: desc.name
            };
            isFindWired = true;
          } else if (desc.deviceType === audio.DeviceType.BLUETOOTH_SCO) {
            sendParams = {
              isPlugged: deviceChanged.type === audio.DeviceChangeType.CONNECT,
              hasMic: true,
              deviceName: desc.name
            };
            isFindWired = true;
          } else if (desc.deviceType === audio.DeviceType.USB_HEADSET) {
            sendParams = {
              isPlugged: deviceChanged.type === audio.DeviceChangeType.CONNECT,
              hasMic: true,
              deviceName: desc.name
            };
            isFindWired = true;
          }
        })
        if (isFindWired && changeCk) {
          changeCk(sendParams, deviceChanged.type === audio.DeviceChangeType.CONNECT);
        }
      });
  }

  public offDeviceChange(): void {
    if (!this.routingManager) {
      return;
    }
    this.routingManager.off(DEVICECHANGE);
  }

  public isWiredHeadsetPluggedIn(): boolean {
    return this.checkAudioRoute([audio.DeviceType.USB_HEADSET, audio.DeviceType.WIRED_HEADPHONES, audio.DeviceType.BLUETOOTH_SCO],
      audio.DeviceFlag.OUTPUT_DEVICES_FLAG) ||
    this.checkAudioRoute([audio.DeviceType.USB_HEADSET, audio.DeviceType.WIRED_HEADSET, audio.DeviceType.BLUETOOTH_SCO],
      audio.DeviceFlag.INPUT_DEVICES_FLAG);
  }

  public checkAudioRoute(targetPortTypeArray: audio.DeviceType[], routeType: audio.DeviceFlag): boolean {
    try {
      let deviceDescriptors: audio.AudioDeviceDescriptors;
      if (routeType === audio.DeviceFlag.OUTPUT_DEVICES_FLAG) {
        let rendererInfo: audio.AudioRendererInfo = {
          usage: audio.StreamUsage.STREAM_USAGE_VOICE_COMMUNICATION,
          rendererFlags: 0
        }
        deviceDescriptors = this.getPreferOutputDeviceForRendererInfo(rendererInfo);
      } else if (routeType === audio.DeviceFlag.INPUT_DEVICES_FLAG) {
        let captureInfo: audio.AudioCapturerInfo = {
          source: audio.SourceType.SOURCE_TYPE_VOICE_COMMUNICATION,
          capturerFlags: 0
        }
        deviceDescriptors = this.getPreferredInputDeviceForCapturerInfoSync(captureInfo);
      } else {
        deviceDescriptors = this.getDevicesSync(routeType);
      }
      let isCurrentRoute: boolean = false;
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
}

export default new AudioRoutingManagerUtil();
