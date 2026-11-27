import { useEffect, useRef, useState } from 'react';
import { X, Camera, CameraOff, Zap, ZapOff } from 'lucide-react';
import { evaluateExpression, Decimal, MathError } from '../engine/mathParser';
import { formatResult } from '../utils/format';
import { recognizeText } from '../engine/ocrService';
import { playKeyFeedback, triggerHaptic } from '../utils/soundAndHaptics';
import { trackFeatureUsed } from '../utils/analytics';
import type { CalculatorApi } from '../hooks/useCalculator';
import { AutoFitText } from './AutoFitText';

interface ScanScreenProps {
  calc: CalculatorApi;
  onClose: () => void;
  onInsert: (result: string) => void;
}

const MAX_CAPTURE_DIMENSION = 1280;

/** Pulls one or more "expr = result" lines out of raw OCR text, re-validating every expression with our own parser rather than trusting OCR's arithmetic. */
function extractCaptures(rawText: string): Array<{ expression: string; result: string }> {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean);

  const captures: Array<{ expression: string; result: string }> = [];
  for (const line of lines) {
    const exprPart = line.split('=')[0].trim().replace(/,/g, '');
    if (!exprPart) continue;
    try {
      const value = evaluateExpression(exprPart, { angleMode: 'DEG', ans: new Decimal(0), memory: new Decimal(0) });
      captures.push({ expression: exprPart, result: formatResult(value) });
    } catch {
      // not every OCR'd line is a valid expression (stray marks, labels, etc.) — skip it
    }
  }
  return captures;
}

export function ScanScreen({ calc, onClose, onInsert }: ScanScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser has no camera API.');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        const track = stream.getVideoTracks()[0];
        const capabilities = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
        setTorchSupported(Boolean(capabilities?.torch));
      })
      .catch((err) => {
        if (!cancelled) setCameraError(err instanceof Error ? err.message : 'Camera permission denied.');
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      /* torch control not actually supported on this device despite the capability flag */
    }
  };

  const handleScan = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    playKeyFeedback('accent');
    setScanning(true);
    setScanMessage(null);
    try {
      const scale = Math.min(1, MAX_CAPTURE_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const rawText = await recognizeText(canvas);
      const captures = extractCaptures(rawText);

      if (captures.length === 0) {
        setScanMessage("Couldn't read a number there — try moving closer or improving the light.");
        await triggerHaptic();
      } else {
        for (const c of captures) calc.addHistoryEntry(c.expression, c.result);
        trackFeatureUsed('number_capture_scan', { count: captures.length });
        playKeyFeedback('accent');
      }
    } catch (err) {
      setScanMessage(err instanceof MathError ? err.message : 'Scan failed — try again.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 px-3 pt-2 pb-2 border-b border-amber-hairline">
        <button onClick={onClose} aria-label="Close number capture" className="w-6 h-6 rounded-full border border-amber/60 flex items-center justify-center text-amber shrink-0">
          <X size={13} />
        </button>
        <span className="tabular-display text-amber font-bold text-sm tracking-wide">Number Capture</span>
      </div>

      <div className="h-[18vh] min-h-[90px] max-h-[160px] overflow-y-auto px-3">
        {calc.history.length === 0 && <div className="text-amber/20 text-xs py-2 text-right tabular-display">No captures yet</div>}
        {calc.history.map((h) => (
          <button
            key={h.id}
            onClick={() => {
              trackFeatureUsed('tape_history_reused');
              onInsert(h.result);
            }}
            className="relative w-full flex items-center justify-end gap-2 py-2 border-b border-amber-hairline text-right active:bg-white/5"
          >
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-amber rounded-full" />
            <AutoFitText
              text={`${h.expression} = ${h.result}`}
              maxFontSize={14}
              minFontSize={9}
              className="flex-1 min-w-0 text-right"
              fontClassName="tabular-display text-amber/90"
            />
          </button>
        ))}
      </div>

      <div className="relative mx-3 mb-3 rounded-2xl overflow-hidden bg-black" style={{ height: '34vh', minHeight: 160, maxHeight: 260 }}>
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
            <div className="w-16 h-16 rounded-full border-2 border-amber/50 flex items-center justify-center">
              <CameraOff size={26} className="text-amber/50" />
            </div>
            <p className="text-amber/60 text-xs tabular-display">{cameraError}</p>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        )}

        <div className="absolute left-3 bottom-3">
          <button
            onClick={handleScan}
            disabled={scanning || !!cameraError}
            className="flex items-center gap-1.5 rounded-lg border border-amber text-amber text-xs font-bold tracking-wide px-3 py-1.5 disabled:opacity-40 active:bg-amber/10"
          >
            <Camera size={13} />
            {scanning ? 'Reading…' : 'Scan'}
          </button>
        </div>

        {torchSupported && (
          <button
            onClick={toggleTorch}
            aria-label={torchOn ? 'Turn flash off' : 'Turn flash on'}
            className="absolute right-3 bottom-3 w-8 h-8 rounded-full border border-amber/60 flex items-center justify-center text-amber active:bg-amber/10"
          >
            {torchOn ? <Zap size={14} /> : <ZapOff size={14} />}
          </button>
        )}

        {scanMessage && (
          <div className="absolute left-3 right-3 top-3 rounded-lg bg-black/70 border border-amber/40 px-2 py-1.5 text-center">
            <span className="text-amber-dim text-[11px] tabular-display">{scanMessage}</span>
          </div>
        )}
      </div>
    </>
  );
}
