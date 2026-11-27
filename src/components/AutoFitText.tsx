import { useCallback, useLayoutEffect, useRef, useState } from 'react';

interface AutoFitTextProps {
  text: string;
  maxFontSize: number;
  minFontSize: number;
  className?: string;
  fontClassName?: string;
}

let measureCanvas: HTMLCanvasElement | null = null;

/** Measures text width off-DOM via canvas, so fitting never mutates the visible span. */
function measureTextWidth(text: string, font: string): number {
  if (!measureCanvas) measureCanvas = document.createElement('canvas');
  const ctx = measureCanvas.getContext('2d');
  if (!ctx) return 0;
  ctx.font = font;
  return ctx.measureText(text).width;
}

/**
 * Renders text on a single line that never truncates: it measures its own
 * natural width (off-DOM, via canvas — never touches the visible element) and
 * shrinks font-size to fit, down to minFontSize. If it still wouldn't fit on
 * one line even at minFontSize, it wraps instead of clipping so every
 * character stays visible. Re-measures on text change and on container resize
 * (orientation change, chassis width change when the scientific deck toggles).
 */
export function AutoFitText({ text, maxFontSize, minFontSize, className = '', fontClassName = '' }: AutoFitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [wrap, setWrap] = useState(false);

  const recalc = useCallback(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;
    const containerWidth = container.clientWidth;
    if (containerWidth === 0 || text === '') {
      setFontSize(maxFontSize);
      setWrap(false);
      return;
    }

    const computed = window.getComputedStyle(textEl);
    const font = `${computed.fontWeight} ${maxFontSize}px ${computed.fontFamily}`;
    const textWidth = measureTextWidth(text, font);

    if (textWidth <= containerWidth) {
      setFontSize(maxFontSize);
      setWrap(false);
      return;
    }
    const fitted = maxFontSize * (containerWidth / textWidth);
    if (fitted >= minFontSize) {
      setFontSize(Math.floor(fitted));
      setWrap(false);
    } else {
      setFontSize(minFontSize);
      setWrap(true);
    }
  }, [text, maxFontSize, minFontSize]);

  useLayoutEffect(() => {
    recalc();
  }, [recalc]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    let lastWidth = container.clientWidth;
    const observer = new ResizeObserver(() => {
      // Only re-fit on width changes — height changes are a *consequence* of
      // fitting (wrapped text grows taller), so reacting to them too would
      // create a measure/re-render feedback loop.
      const width = container.clientWidth;
      if (width !== lastWidth) {
        lastWidth = width;
        recalc();
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [recalc]);

  return (
    <div ref={containerRef} className={`w-full ${wrap ? '' : 'overflow-hidden'} ${className}`}>
      <span
        ref={textRef}
        className={fontClassName}
        style={
          wrap
            ? { fontSize, whiteSpace: 'normal', wordBreak: 'break-all', display: 'block', width: '100%', textAlign: 'right' }
            : { fontSize, whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '100%' }
        }
      >
        {text}
      </span>
    </div>
  );
}
