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

import media from '@ohos.multimedia.media';
import type resourceManager from '@ohos.resourceManager';
import { type BusinessError } from '@ohos.base';
import { type common } from '@kit.AbilityKit';
import { audio } from '@kit.AudioKit';
import { avSession } from '@kit.AVSessionKit';
import Logger from '../Logger';
import { AudioFocusType } from '../index';

const TAG: string = 'PlayModel';
const AVSESSIONTAG: string = 'ringtoneplayering';
const AVSESSIONTYPE: 'audio' = 'audio';

class PlayModelEvent {
  static STATE_CHANGE: 'stateChange' = 'stateChange';
  static AUDIO_INTERRUPT: 'audioInterrupt' = 'audioInterrupt';
}

class PlayModelState {
  static INITIALIZED: string = 'initialized';
  static PREPARED: string = 'prepared';
  static COMPLETED: string = 'completed';
  static PLAYING: string = 'playing';
  static PAUSED: string = 'paused';
  static STOPPED: string = 'stopped';
  static ERROR: string = 'error';
}

export default class PlayModel {
  private context: common.UIAbilityContext;
  private audioRenderInfoObj: audio.AudioRendererInfo = {
    content: audio.ContentType.CONTENT_TYPE_MUSIC,
    usage: audio.StreamUsage.STREAM_USAGE_VOICE_COMMUNICATION,
    rendererFlags: 0
  };
  private onPlayComplete: (isComplete: boolean, avplayer: media.AVPlayer) => void;
  private interruptResultBack: (code: number, codeText: string) => void;
  private audioLoop: boolean = false;
  private isRequireAvSession: boolean = false;
  private interruptMode: audio.InterruptMode = audio.InterruptMode.SHARE_MODE;
  private avSession: avSession.AVSession;
  public avPlayer: media.AVPlayer | null = null;

  constructor(context: common.UIAbilityContext, isRequireAvSession: boolean,
    interruptResultBack?: (code: number, codeText: string) => void) {
    this.context = context;
    this.isRequireAvSession = isRequireAvSession;
    if (interruptResultBack) {
      this.interruptResultBack = interruptResultBack;
    }
  }

  private createAVSession(context: common.UIAbilityContext): void {
    Logger.debug(TAG, 'createAVSession begin');
    if (!this.avSession) {
      avSession.createAVSession(context, AVSESSIONTAG, AVSESSIONTYPE).then((data) => {
        Logger.debug(TAG, 'createAVSession succeed');
        this.avSession = data;
      });
    }
  };

  private destroyAVSession(): void {
    if (this.avSession) {
      Logger.debug(TAG, 'destroyAVSession begin');
      this.avSession?.destroy();
      this.avSession = null;
    }
  };

  public async prepareWithPlayFd(fileFd: resourceManager.RawFileDescriptor, renderInfo: audio.AudioRendererInfo,
    audioLoop: boolean): Promise<void> {
    Logger.info(TAG, `create AVPlayer playFd ${fileFd.fd}`);
    try {
      this.release();
      this.audioRenderInfoObj = renderInfo;
      this.audioLoop = audioLoop;
      this.avPlayer = await media.createAVPlayer();
      if (this.isRequireAvSession) {
        this.createAVSession(this.context);
      }
      this.onAudioInterrupt();
      this.avPlayer.on(PlayModelEvent.STATE_CHANGE, (state: media.AVPlayerState, reason: media.StateChangeReason) => {
        this.onStateChange(state, reason);
      });
      this.avPlayer.fdSrc = fileFd;
      Logger.info(TAG, `create AVPlayer success`);
    } catch (err) {
      Logger.error(TAG, `Invoke AVPlayer failed, code is ${(err as BusinessError).code}`);
    }
  }

  public setOnPlayComplete(complete: (isComplete: boolean, avplayer: media.AVPlayer) => void): void {
    this.onPlayComplete = complete;
  }

  public async stopAudio(): Promise<void> {
    if (!this.avPlayer) {
      return;
    }
    try {
      let statePlist: string[] =
        [PlayModelState.PREPARED, PlayModelState.PLAYING, PlayModelState.PAUSED, PlayModelState.COMPLETED];
      if (statePlist.indexOf(this.avPlayer.state) >= 0) {
        await this.avPlayer?.stop();
        this.destroyAVSession();
        Logger.info(TAG, 'Succeeded in stopping');
      } else {
        Logger.info(TAG, 'ingnore to stopping');
      }
    } catch (error) {
      let err: BusinessError = error as BusinessError;
      Logger.error(TAG, 'Failed to stop,error code is :' + err.code);
    }
  }

  public async pausedAudio(): Promise<void> {
    if (!this.avPlayer) {
      return;
    }
    try {
      let statePlist: string[] = [PlayModelState.PLAYING];
      if (statePlist.indexOf(this.avPlayer.state) >= 0) {
        await this.avPlayer?.pause();
        Logger.info(TAG, 'Succeeded in paused');
      } else {
        Logger.info(TAG, 'ingnore to paused');
      }
    } catch (error) {
      let err: BusinessError = error as BusinessError;
      Logger.error(TAG, 'Failed to paused,error code is :' + err.code);
    }
  }

  public async playAudio(): Promise<void> {
    if (!this.avPlayer) {
      Logger.error(TAG, 'first create avPlayer');
      return;
    }
    try {
      let isPlayerState: string = this.avPlayer.state as string;
      let requireStateList: PlayModelState[] = [PlayModelState.STOPPED, PlayModelState.INITIALIZED];
      let playStateList = [PlayModelState.PAUSED, PlayModelState.COMPLETED, PlayModelState.PREPARED];
      if (requireStateList.indexOf(isPlayerState) >= 0) {
        await this.avPlayer.prepare();
        Logger.info(TAG, 'Succeeded in preparing');
      } else if (playStateList.indexOf(isPlayerState) >= 0) {
        await this.avPlayer?.play();
        Logger.info(TAG, 'Succeeded in playing');
      }
      if (this.isRequireAvSession) {
        this.createAVSession(this.context);
      }
    } catch (err) {
      Logger.error(TAG, 'Failed to play,error is :' + (err as BusinessError).code);
    }
  }

  public async release(): Promise<void> {
    Logger.info(TAG, `avPlayer release`);
    try {
      this.destroyAVSession();
      if (this.avPlayer) {
        this.avPlayer.off(PlayModelEvent.STATE_CHANGE);
        this.offAudioInterrupt();
        let statePlist: string[] =
          [PlayModelState.PREPARED, PlayModelState.PLAYING, PlayModelState.PAUSED, PlayModelState.COMPLETED];
        if (statePlist.indexOf(this.avPlayer.state) >= 0) {
          await this.avPlayer.stop();
        }
        await this.avPlayer.release();
        this.avPlayer = null;
      }
    } catch (err) {
      Logger.error(TAG, `release AVPlayer failed, code is ${(err as BusinessError).code}`);
    }
  }

  public isPlaying(): boolean {
    return this.avPlayer?.state === PlayModelState.PLAYING;
  }

  public onAudioInterrupt(): void {
    if (this.avPlayer) {
      this.avPlayer.on(PlayModelEvent.AUDIO_INTERRUPT, async (interruptEvent: audio.InterruptEvent) => {

        let focusChangeStr: string = '';
        if (interruptEvent.forceType == audio.InterruptForceType.INTERRUPT_FORCE) {
          switch (interruptEvent.hintType) {
            case audio.InterruptHint.INTERRUPT_HINT_NONE: {
              focusChangeStr = AudioFocusType.HINT_NONE;
              break;
            }
            case audio.InterruptHint.INTERRUPT_HINT_PAUSE: {
              focusChangeStr = AudioFocusType.HINT_PAUSE;
              await this.pausedAudio();
              break;
            }
            case audio.InterruptHint.INTERRUPT_HINT_RESUME: {
              focusChangeStr = AudioFocusType.HINT_RESUME;
              await this.playAudio();
              break;
            }
            case audio.InterruptHint.INTERRUPT_HINT_STOP: {
              focusChangeStr = AudioFocusType.HINT_STOP;
              await this.stopAudio();
              break;
            }
            case audio.InterruptHint.INTERRUPT_HINT_DUCK: {
              focusChangeStr = AudioFocusType.HINT_DUCK;
              break;
            }
            case audio.InterruptHint.INTERRUPT_HINT_UNDUCK: {
              focusChangeStr = AudioFocusType.HINT_UNDUCK;
              break;
            }
            default:
              break;
          }
        } else if (interruptEvent.forceType == audio.InterruptForceType.INTERRUPT_SHARE) {
          switch (interruptEvent.hintType) {
            case audio.InterruptHint.INTERRUPT_HINT_NONE: {
              focusChangeStr = AudioFocusType.HINT_NONE;
              break;
            }
            case audio.InterruptHint.INTERRUPT_HINT_PAUSE: {
              focusChangeStr = AudioFocusType.HINT_PAUSE;
              await this.pausedAudio();
              break;
            }
            case audio.InterruptHint.INTERRUPT_HINT_RESUME: {
              focusChangeStr = AudioFocusType.HINT_RESUME;
              await this.playAudio();
              break;
            }
            default:
              break;
          }
        }
        if (this.interruptResultBack) {
          this.interruptResultBack(interruptEvent.hintType, focusChangeStr);
        }
      });
    }
  }

  public offAudioInterrupt(): void {
    if (this.avPlayer) {
      this.avPlayer.off(PlayModelEvent.AUDIO_INTERRUPT);
    }
  }

  private async onStateChange(state: media.AVPlayerState, reason: media.StateChangeReason): Promise<void> {
    Logger.info(TAG, `AVPlayer stateChange  ${reason}  :  ${state}`);
    try {
      switch (state) {
        case PlayModelState.INITIALIZED: {
          if (this.avPlayer) {
            this.avPlayer.audioRendererInfo = this.audioRenderInfoObj;
            await this.avPlayer.prepare();
            Logger.info(TAG, 'AVPlayer prepare succeeded.');
          }
          break;
        }
        case PlayModelState.PREPARED: {
          if (this.avPlayer) {
            this.avPlayer.loop = this.audioLoop;
            this.avPlayer.audioInterruptMode = this.interruptMode;
            await this.avPlayer.play();
            Logger.info(TAG, 'AVPlayer play succeeded.');
          }
          break;
        }
        case PlayModelState.COMPLETED: {
          if (this.onPlayComplete) {
            this.onPlayComplete(true, this.avPlayer);
          }
          if (this.avPlayer) {
            this.avPlayer.audioInterruptMode = this.interruptMode;
          }
          if (this.avPlayer && this.audioLoop) {
            await this.avPlayer.play();
          }
          break;
          
        }
        case PlayModelState.PAUSED: {
          this.avPlayer.audioInterruptMode = this.interruptMode;
          break;
        }
        case PlayModelState.STOPPED:
        case PlayModelState.ERROR: {
          if (this.onPlayComplete) {
            this.onPlayComplete(true, this.avPlayer);
          }
          this.release();
          break;
        }
      }
    } catch (err) {
      Logger.error(TAG, `AVPlayer onStateChange failed ${(err as BusinessError).code}`);
    }
  }
}
