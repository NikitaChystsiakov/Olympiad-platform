import { useCallback, useEffect, useRef, useState } from 'react';
import type { DetectorRequest, DetectorResponse } from '@/workers/faceDetector.worker';
import { reportProctoringEvent } from './useProctoring';

export type CameraState = 'starting' | 'on' | 'off';
/** Why the camera is off: shown to the student with a matching hint. */
export type CameraError = 'denied' | 'notFound' | 'busy' | 'insecure' | 'ended' | 'unknown';
export type FaceState = 'unknown' | 'ok' | 'missing' | 'many' | 'unsupported';
/** The browser's site permission, when the Permissions API can tell. */
export type CameraPermission = 'granted' | 'prompt' | 'denied' | 'unknown';

/** Pause between the end of one detection and the start of the next, so runs never overlap. */
const DETECT_EVERY_MS = 700;
const MISSING_AFTER_MS = 3_000;
const REPEAT_COOLDOWN_MS = 15_000;

interface Detector {
  /** Number of faces in the current frame. */
  detect: (video: HTMLVideoElement) => Promise<number>;
  dispose: () => void;
}

const DETECTOR_READY_TIMEOUT_MS = 60_000;

/**
 * Runs face-api's tiny detector (~190 KB model from /models) in a Web Worker, so model
 * loading, shader compilation and inference never block the attempt page.
 */
async function createDetector(): Promise<Detector | null> {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
    return null;
  }
  const worker = new Worker(new URL('../workers/faceDetector.worker.ts', import.meta.url), { type: 'module' });
  const pending = new Map<number, { resolve: (faces: number) => void; reject: (error: Error) => void }>();
  let nextId = 0;

  const ready = new Promise<boolean>((resolve) => {
    const timer = window.setTimeout(() => resolve(false), DETECTOR_READY_TIMEOUT_MS);
    worker.addEventListener('message', (event: MessageEvent<DetectorResponse>) => {
      const message = event.data;
      if (message.type === 'ready' || message.type === 'failed') {
        window.clearTimeout(timer);
        resolve(message.type === 'ready');
        return;
      }
      const job = pending.get(message.id);
      if (!job) return;
      pending.delete(message.id);
      if (message.type === 'result') job.resolve(message.faces);
      else job.reject(new Error('Detection failed'));
    });
    worker.addEventListener('error', () => {
      window.clearTimeout(timer);
      resolve(false);
    });
  });
  worker.postMessage({ type: 'init', modelUrl: new URL('/models', window.location.origin).href } satisfies DetectorRequest);

  if (!(await ready)) {
    worker.terminate();
    return null;
  }

  return {
    detect: async (video) => {
      const frame = await createImageBitmap(video, { resizeWidth: 320, resizeHeight: 240, resizeQuality: 'low' });
      const id = ++nextId;
      return new Promise<number>((resolve, reject) => {
        pending.set(id, { resolve, reject });
        worker.postMessage({ type: 'detect', id, frame } satisfies DetectorRequest, [frame]);
      });
    },
    dispose: () => {
      worker.terminate();
      pending.forEach((job) => job.reject(new Error('Detector disposed')));
      pending.clear();
    },
  };
}

function classify(error: unknown): CameraError {
  const name = error instanceof DOMException || error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'notFound';
  if (name === 'NotReadableError' || name === 'AbortError') return 'busy';
  return 'unknown';
}

/** Hidden element the detector reads frames from; visible previews only mirror the stream. */
function createProbeVideo() {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('aria-hidden', 'true');
  Object.assign(video.style, { position: 'fixed', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none', left: '0', top: '0' });
  document.body.appendChild(video);
  return video;
}

/**
 * Owns one camera stream for the whole attempt page: it starts on the briefing (so the
 * student grants access and sees themselves before the timer runs) and keeps running
 * in the exam room. Events are sent only while `reporting` is true, i.e. during an attempt.
 */
export function useCameraProctoring(olympiadId: string, reporting: boolean) {
  const [cameraState, setCameraState] = useState<CameraState>('starting');
  const [cameraError, setCameraError] = useState<CameraError | null>(null);
  const [faceState, setFaceState] = useState<FaceState>('unknown');
  const [permission, setPermission] = useState<CameraPermission>('unknown');
  const [attempt, setAttempt] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const previews = useRef(new Set<HTMLVideoElement>());
  const reportingRef = useRef(reporting);
  reportingRef.current = reporting;

  const report = useCallback(
    (type: 'FACE_MISSING' | 'MULTIPLE_FACES' | 'CAMERA_UNAVAILABLE', metadata: string) => {
      if (reportingRef.current) reportProctoringEvent(olympiadId, type, metadata);
    },
    [olympiadId],
  );

  /** Callback ref for any <video> that should show the live preview. */
  const previewRef = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return;
    previews.current.add(video);
    if (streamRef.current && video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
      void video.play().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!olympiadId) return;

    let cancelled = false;
    let stopped = false;
    let timer: number | null = null;
    let detectorPromise: Promise<Detector | null> | null = null;
    let missingSince: number | null = null;
    let lastMissingReport = 0;
    let lastManyReport = 0;
    const probe = createProbeVideo();

    const stopDetection = () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      void detectorPromise?.then((detector) => detector?.dispose());
    };

    const fail = (error: CameraError) => {
      stopDetection();
      setCameraState('off');
      setCameraError(error);
      setFaceState('unknown');
      report('CAMERA_UNAVAILABLE', `Камера недоступна: ${error}`);
    };

    const handleFaces = (faces: number) => {
      const now = Date.now();
      if (faces === 0) {
        missingSince ??= now;
        setFaceState('missing');
        if (reportingRef.current && now - missingSince >= MISSING_AFTER_MS && now - lastMissingReport >= REPEAT_COOLDOWN_MS) {
          lastMissingReport = now;
          report('FACE_MISSING', 'Лицо не обнаружено в кадре дольше 3 секунд');
        }
        return;
      }
      missingSince = null;
      if (faces > 1) {
        setFaceState('many');
        if (reportingRef.current && now - lastManyReport >= REPEAT_COOLDOWN_MS) {
          lastManyReport = now;
          report('MULTIPLE_FACES', `В кадре обнаружено лиц: ${faces}`);
        }
      } else {
        setFaceState('ok');
      }
    };

    const start = async () => {
      setCameraState('starting');
      setCameraError(null);
      setFaceState('unknown');

      if (!navigator.mediaDevices?.getUserMedia) {
        fail('insecure');
        return;
      }

      // The model loads in its worker while the student is still answering the permission prompt.
      detectorPromise = createDetector();

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
      } catch (error) {
        if (!cancelled) fail(classify(error));
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (!cancelled) fail('ended');
      });

      probe.srcObject = stream;
      // Not awaited: play() on a hidden element may resolve late, and the stream is live already.
      void probe.play().catch(() => undefined);
      previews.current.forEach((video) => {
        if (!video.isConnected) {
          previews.current.delete(video);
          return;
        }
        video.srcObject = stream;
        void video.play().catch(() => undefined);
      });
      setCameraState('on');

      const detector = await detectorPromise;
      if (cancelled || stopped) return;
      if (!detector) {
        setFaceState('unsupported');
        return;
      }

      // Each run starts only after the previous one finished, however slow the device is.
      const loop = async () => {
        if (cancelled || stopped) return;
        if (probe.readyState >= 2) {
          try {
            const faces = await detector.detect(probe);
            if (!cancelled && !stopped) handleFaces(faces);
          } catch {
            // A dropped frame is not a signal; try again on the next tick.
          }
        }
        if (!cancelled && !stopped) timer = window.setTimeout(() => void loop(), DETECT_EVERY_MS);
      };
      void loop();
    };

    // Deferred so React's dev double-mount cancels the first run before it asks for the camera:
    // two overlapping requests for the same device can stall on macOS.
    const startTimer = window.setTimeout(() => void start(), 0);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      stopDetection();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      probe.srcObject = null;
      probe.remove();
    };
  }, [olympiadId, attempt, report]);

  // A camera that was already off when the attempt started still has to reach the report.
  useEffect(() => {
    if (reporting && cameraState === 'off' && cameraError) {
      reportProctoringEvent(olympiadId, 'CAMERA_UNAVAILABLE', `Камера недоступна: ${cameraError}`);
    }
    // Only on the transition into an attempt; later failures report themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reporting]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  // Follow the site permission: tells "waiting for the prompt" apart from "allowed but the
  // camera is silent", and restarts the camera as soon as a blocked permission is lifted.
  const stateRef = useRef({ cameraState, cameraError });
  stateRef.current = { cameraState, cameraError };
  useEffect(() => {
    let status: PermissionStatus | null = null;
    let disposed = false;
    const onChange = () => {
      if (!status) return;
      setPermission(status.state as CameraPermission);
      const { cameraState: current, cameraError: error } = stateRef.current;
      if (status.state === 'granted' && current === 'off' && error === 'denied') retry();
    };
    navigator.permissions
      ?.query({ name: 'camera' as PermissionName })
      .then((result) => {
        if (disposed) return;
        status = result;
        setPermission(result.state as CameraPermission);
        result.addEventListener('change', onChange);
      })
      .catch(() => setPermission('unknown'));
    return () => {
      disposed = true;
      status?.removeEventListener('change', onChange);
    };
  }, [retry]);

  return { previewRef, cameraState, cameraError, faceState, permission, retry };
}

export type CameraProctoring = ReturnType<typeof useCameraProctoring>;
