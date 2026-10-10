import { useEffect, useRef, useState } from 'react';
import { reportProctoringEvent } from './useProctoring';

export type CameraState = 'starting' | 'on' | 'off';
export type FaceState = 'unknown' | 'ok' | 'missing' | 'many' | 'unsupported';

const DETECT_EVERY_MS = 700;
const MISSING_AFTER_MS = 3_000;
const REPEAT_COOLDOWN_MS = 15_000;

type Detector = (video: HTMLVideoElement) => Promise<number>;

interface NativeFaceDetector {
  detect: (source: HTMLVideoElement) => Promise<unknown[]>;
}

/**
 * Prefers the native FaceDetector (Chromium with the flag) and otherwise lazy-loads
 * face-api's tiny detector (~190 KB model served from /models), so detection works everywhere.
 */
async function createDetector(): Promise<Detector | null> {
  const NativeCtor = (window as unknown as { FaceDetector?: new (options: object) => NativeFaceDetector }).FaceDetector;
  if (NativeCtor) {
    try {
      const native = new NativeCtor({ maxDetectedFaces: 5, fastMode: true });
      return async (video) => (await native.detect(video)).length;
    } catch {
      // Fall through to face-api.
    }
  }
  try {
    const faceapi = await import('@vladmandic/face-api');
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 });
    return async (video) => (await faceapi.detectAllFaces(video, options)).length;
  } catch {
    return null;
  }
}

export function useCameraProctoring(olympiadId: string, enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>('starting');
  const [faceState, setFaceState] = useState<FaceState>('unknown');

  useEffect(() => {
    if (!enabled || !olympiadId) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: number | null = null;
    let missingSince: number | null = null;
    let lastMissingReport = 0;
    let lastManyReport = 0;

    const start = async () => {
      setCameraState('starting');
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' }, audio: false });
      } catch {
        if (cancelled) return;
        setCameraState('off');
        reportProctoringEvent(olympiadId, 'CAMERA_UNAVAILABLE', 'Доступ к камере отклонён или камеры нет');
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      setCameraState('on');

      const detect = await createDetector();
      if (cancelled) return;
      if (!detect) {
        setFaceState('unsupported');
        return;
      }

      timer = window.setInterval(async () => {
        const current = videoRef.current;
        if (!current || current.readyState < 2) return;
        let faces: number;
        try {
          faces = await detect(current);
        } catch {
          return;
        }
        if (cancelled) return;
        const now = Date.now();

        if (faces === 0) {
          missingSince ??= now;
          setFaceState('missing');
          if (now - missingSince >= MISSING_AFTER_MS && now - lastMissingReport >= REPEAT_COOLDOWN_MS) {
            lastMissingReport = now;
            reportProctoringEvent(olympiadId, 'FACE_MISSING', 'Лицо не обнаружено в кадре дольше 3 секунд');
          }
          return;
        }

        missingSince = null;
        if (faces > 1) {
          setFaceState('many');
          if (now - lastManyReport >= REPEAT_COOLDOWN_MS) {
            lastManyReport = now;
            reportProctoringEvent(olympiadId, 'MULTIPLE_FACES', `В кадре обнаружено лиц: ${faces}`);
          }
        } else {
          setFaceState('ok');
        }
      }, DETECT_EVERY_MS);
    };

    void start();

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [enabled, olympiadId]);

  return { videoRef, cameraState, faceState };
}
