import type { Worker } from 'tesseract.js';

// Restricting Tesseract's output to this set dramatically improves accuracy
// for scanned arithmetic — it never has to guess between a letter and a digit.
// 'x'/'X' are included because printed/handwritten multiplication is often an
// x rather than ×; the math parser already treats lowercase x as multiply, and
// the caller lowercases OCR output before parsing so uppercase X works too.
const WHITELIST = '0123456789+-xX*/.=()%, ';

let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    // Dynamically imported: tesseract.js's JS is only ever needed by people who
    // actually open Scan, so it has no business sitting in the main bundle (or
    // the PWA precache) for every visitor the way the calculator itself does.
    workerPromise = import('tesseract.js')
      .then(async ({ createWorker }) => {
        const worker = await createWorker('eng');
        await worker.setParameters({ tessedit_char_whitelist: WHITELIST });
        return worker;
      })
      .catch((err) => {
        workerPromise = null; // allow retry on next scan instead of permanently failing
        throw err;
      });
  }
  return workerPromise;
}

/** Pre-warms the OCR worker (downloads/initializes the model) without blocking a scan. */
export function preloadOcr(): void {
  getWorker().catch(() => {
    /* a real scan attempt will surface the error to the user */
  });
}

/** Runs OCR on a captured frame and returns the raw recognized text (one line per detected text line). */
export async function recognizeText(image: HTMLCanvasElement): Promise<string> {
  const worker = await getWorker();
  const result = await worker.recognize(image);
  return result.data.text;
}
