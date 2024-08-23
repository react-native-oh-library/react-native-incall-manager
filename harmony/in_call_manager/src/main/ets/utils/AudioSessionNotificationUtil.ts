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

import { KeyCode, KeyEvent } from '@kit.InputKit';
import { avSession } from '@kit.AVSessionKit';
import { MediaEventString } from '../index';

const TAG: string = 'AudioSessionNotificationUtil';

export default class AudioSessionNotificationUtil {
  public static startAudioSessionKeyEventNotification(audioSession: avSession.AVSession,
    eventBack: (keyText: string, code: number) => void) {
    if (audioSession) {
      audioSession.on('play', () => {
        let keyText: string = MediaEventString.KEYCODE_MEDIA_PLAY;
        let code = KeyCode.KEYCODE_MEDIA_PLAY;
        eventBack(keyText, code);
      });
      audioSession.on('pause', () => {
        let keyText: string = MediaEventString.KEYCODE_MEDIA_PAUSE;
        let code = KeyCode.KEYCODE_MEDIA_PAUSE;
        eventBack(keyText, code);
      });
      audioSession.on('playNext', () => {
        let keyText: string = MediaEventString.KEYCODE_MEDIA_NEXT;
        let code = KeyCode.KEYCODE_MEDIA_NEXT;
        eventBack(keyText, code);
      });
      audioSession.on('stop', () => {
        let keyText: string = MediaEventString.KEYCODE_MEDIA_STOP;
        let code = KeyCode.KEYCODE_MEDIA_STOP;
        eventBack(keyText, code);
      });
      audioSession.on('playPrevious', () => {
        let keyText: string = MediaEventString.KEYCODE_MEDIA_PREVIOUS;
        let code = KeyCode.KEYCODE_MEDIA_PREVIOUS;
        eventBack(keyText, code);
      });
      audioSession.on('fastForward', () => {
        let keyText: string = MediaEventString.KEYCODE_MEDIA_FAST_FORWARD;
        let code = KeyCode.KEYCODE_MEDIA_FAST_FORWARD;
        eventBack(keyText, code);
      });
      audioSession.on('rewind', () => {
        let keyText: string = MediaEventString.KEYCODE_MEDIA_REWIND;
        let code = KeyCode.KEYCODE_MEDIA_REWIND;
        eventBack(keyText, code);
      });
      audioSession.on('answer', () => {
        let keyText: string = MediaEventString.ANSWER;
        let code = KeyCode.KEYCODE_MEDIA_PLAY;
        eventBack(keyText, code);
      });
      audioSession.on('hangUp', () => {
        let keyText: string = MediaEventString.HAND_UP;
        let code = KeyCode.KEYCODE_MEDIA_CLOSE;
        eventBack(keyText, code);
      });
      audioSession.on('handleKeyEvent', (event: KeyEvent) => {
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
        eventBack(keyText, event.key.code);
      });
    }
  }

  public static stopAudioSessionKeyEventNotification(audioSession: avSession.AVSession) {
    if (audioSession) {
      audioSession.off('play');
      audioSession.off('pause');
      audioSession.off('playNext');
      audioSession.off('stop');
      audioSession.off('playPrevious');
      audioSession.off('fastForward');
      audioSession.off('rewind');
      audioSession.off('answer');
      audioSession.off('hangUp');
      audioSession.off('handleKeyEvent');
    }
  }
}


