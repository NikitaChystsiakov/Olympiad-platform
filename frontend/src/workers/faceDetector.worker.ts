/// <reference lib="webworker" />
/**
 * Face detection off the main thread. TensorFlow compiles WebGL shaders and runs the model
 * synchronously; on a slow GPU (or the CPU fallback) that froze the attempt page for seconds.
 * Here the page only ships a small ImageBitmap per frame and gets back a face count.
 */
import * as faceapi from '@vladmandic/face-api';

export type DetectorRequest = { type: 'init'; modelUrl: string } | { type: 'detect'; id: number; frame: ImageBitmap };
export type DetectorResponse =
  | { type: 'ready'; backend: string }
  | { type: 'failed'; reason: string }
  | { type: 'result'; id: number; faces: number }
  | { type: 'error'; id: number };

const scope = self as unknown as DedicatedWorkerGlobalScope;
const post = (message: DetectorResponse) => scope.postMessage(message);

// face-api only knows browser and Node environments; a worker gets the browser one with
// OffscreenCanvas. Inputs are always tensors, so the image and video slots are never used.
const unsupported = () => {
  throw new Error('Not available in a worker');
};
faceapi.env.setEnv({
  Canvas: OffscreenCanvas as unknown as typeof HTMLCanvasElement,
  CanvasRenderingContext2D: OffscreenCanvasRenderingContext2D as unknown as typeof CanvasRenderingContext2D,
  Image: class {} as unknown as typeof HTMLImageElement,
  ImageData,
  Video: class {} as unknown as typeof HTMLVideoElement,
  createCanvasElement: () => new OffscreenCanvas(1, 1) as unknown as HTMLCanvasElement,
  createImageElement: unsupported,
  createVideoElement: unsupported,
  fetch: (url, init) => fetch(url, init),
  readFile: unsupported,
} as faceapi.Environment);

let options: faceapi.TinyFaceDetectorOptions | null = null;

/** Backend controls are in the bundled TensorFlow.js but missing from face-api's typings. */
const tf = faceapi.tf as typeof faceapi.tf & {
  setBackend: (name: string) => Promise<boolean>;
  getBackend: () => string;
  ready: () => Promise<void>;
};

async function init(modelUrl: string) {
  try {
    if (!(await tf.setBackend('webgl'))) await tf.setBackend('cpu');
  } catch {
    await tf.setBackend('cpu');
  }
  await tf.ready();
  await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
  options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 });
  // Warm-up: the first run compiles every shader, so pay for it before the attempt starts.
  const blank = tf.zeros([240, 320, 3], 'int32') as faceapi.tf.Tensor3D;
  await faceapi.detectAllFaces(blank, options);
  blank.dispose();
  return tf.getBackend();
}

scope.addEventListener('message', async (event: MessageEvent<DetectorRequest>) => {
  const request = event.data;
  if (request.type === 'init') {
    try {
      post({ type: 'ready', backend: await init(request.modelUrl) });
    } catch (error) {
      post({ type: 'failed', reason: error instanceof Error ? error.message : String(error) });
    }
    return;
  }

  const { id, frame } = request;
  if (!options) {
    frame.close();
    post({ type: 'error', id });
    return;
  }
  const tensor = tf.browser.fromPixels(frame);
  try {
    const faces = await faceapi.detectAllFaces(tensor, options);
    post({ type: 'result', id, faces: faces.length });
  } catch {
    post({ type: 'error', id });
  } finally {
    tensor.dispose();
    frame.close();
  }
});
