import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";
import { TurboModuleRegistry } from 'react-native';


export interface Spec extends TurboModule {
    start(
        media: "video" | "audio",
        auto: boolean,
        ringback: string,
    ): void;
    stop(busytoneUriType: string): void;

    turnScreenOff(): void;

    turnScreenOn(): void;

    getIsWiredHeadsetPluggedIn(): Promise<{ isWiredHeadsetPluggedIn: boolean }>;

    setFlashOn(enable: boolean): void;

    setKeepScreenOn(enable: boolean): void;

    setSpeakerphoneOn(enable: boolean): void;

    setForceSpeakerphoneOn(flag: number): void;

    setMicrophoneMute(enable: boolean): void;

    startRingtone(
        ringtone: string,
        category: string
    ): void;

    stopRingtone(): void;

    startProximitySensor(): void;

    stopProximitySensor(): void;

    startRingback(ringbackUriType: string): void;

    stopRingback(): void;

    pokeScreen(timeout: number): void;

    getAudioUriJS(audioType: string, fileType: string): Promise<string | null>;

    chooseAudioRoute(route: string): Promise<any>;

    requestAudioFocus(): Promise<any>;

    abandonAudioFocus(): Promise<any>;
}

export default TurboModuleRegistry.get<Spec>('InCallManagerTurboModule') as Spec | null;