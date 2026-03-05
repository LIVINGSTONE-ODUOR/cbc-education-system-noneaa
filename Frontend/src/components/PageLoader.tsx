import React, { useState, useEffect, useRef } from 'react';

const MIN_DURATION = 1800;           // minimum visible time in ms
const MAX_PROGRESS_BEFORE_DONE = 95; // progress stops here until min time elapses
const PAUSE_BEFORE_FADE = 200;       // ms pause at 100% before starting fade
const FADE_DURATION = 500;           // ms for the opacity fade-out transition
const BAR_COUNT = 12;                // number of radial spinner bars

/** Detect dark mode from the OS/system preference only. */
function useIsDark() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setIsDark(mq.matches);

    mq.addEventListener('change', update);

    return () => {
      mq.removeEventListener('change', update);
    };
  }, []);

  return isDark;
}

/**
 * Full-screen loading overlay intended for login / registration pages.
 *
 * - Displays immediately on mount.
 * - Stays visible for at least MIN_DURATION ms.
 * - Smoothly fades out once the minimum time has elapsed.
 * - Follows the user's OS/system colour-scheme preference (light or dark).
 * - Disappears from the DOM entirely after the fade so it never blocks
 *   the underlying form or content.
 */
export default function PageLoader() {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);
  const isDark = useIsDark();

  const startRef = useRef(Date.now());
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    startRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min((elapsed / MIN_DURATION) * MAX_PROGRESS_BEFORE_DONE, MAX_PROGRESS_BEFORE_DONE);
      setProgress(pct);

      if (elapsed < MIN_DURATION) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        // Short pause at 100 % before fading out
        setTimeout(() => {
          setFading(true);
          setTimeout(() => setGone(true), FADE_DURATION);
        }, PAUSE_BEFORE_FADE);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (gone) return null;

  /* ── Theme colours ────────────────────────────────────────────────── */
  const bgColor    = isDark ? '#000000' : '#ffffff';
  const barColor   = isDark ? '#ffffff' : '#1f2937';
  const trackColor = isDark ? '#2d2d2d' : '#e5e7eb';
  const textColor  = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';

  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor,
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms ease`,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* ── Radial bar spinner ── */}
      <div
        aria-hidden="true"
        style={{ position: 'relative', width: 56, height: 56 }}
      >
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: 4,
              height: 26,
              marginLeft: -2,
              borderRadius: 2,
              backgroundColor: barColor,
              transformOrigin: 'center bottom',
              transform: `rotate(${i * (360 / BAR_COUNT)}deg)`,
              animation: 'page-loader-bar-fade 1s linear infinite',
              animationDelay: `${-(i / BAR_COUNT).toFixed(3)}s`,
            }}
          />
        ))}
      </div>

      {/* ── Progress bar ── */}
      <div
        aria-hidden="true"
        style={{
          width: 180,
          height: 4,
          backgroundColor: trackColor,
          borderRadius: 2,
          marginTop: 28,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#dc2626',
            borderRadius: 2,
            transition: 'width 0.05s linear',
          }}
        />
      </div>

      {/* ── Label ── */}
      <p
        style={{
          marginTop: 12,
          fontSize: 13,
          letterSpacing: '0.08em',
          color: textColor,
          fontFamily: 'inherit',
        }}
      >
        loading...
      </p>
    </div>
  );
}
