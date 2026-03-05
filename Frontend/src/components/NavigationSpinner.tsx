import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/** How long (ms) the spinner stays visible before fading out. */
const SPINNER_DISPLAY_DURATION = 2200;

/** Duration (ms) of the CSS fade-out transition. */
const FADE_TRANSITION_DURATION = 500;

/**
 * Paths where the navigation spinner should NOT be shown.
 * Login and Registration pages are excluded per requirements.
 */
const EXCLUDED_PATHS = ['/login', '/get-started', '/signup', '/admin-register'];

function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );
}

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
    return () => mq.removeEventListener('change', update);
  }, []);

  return isDark;
}

/**
 * Global navigation loading spinner that mimics the KUCCPS student portal
 * loader: a full-screen overlay with a thick circular broken-ring spinner
 * that rotates continuously clockwise.
 *
 * Behaviour:
 * - Covers the entire screen (page content is hidden behind the overlay)
 *   on every route change, so the spinner is always seen alone.
 * - Hidden on Login and Registration pages.
 * - Stays visible for SPINNER_DISPLAY_DURATION ms, then fades out.
 * - Respects the OS light/dark colour preference for the overlay background.
 */
export default function NavigationSpinner() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const isDark = useIsDark();

  const prevPathRef = useRef<string>(location.pathname);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevPathRef.current;

    // Update stored path for next comparison
    prevPathRef.current = currentPath;

    // Skip initial mount – no navigation has occurred yet
    if (prevPath === currentPath) return;

    // Clear any running timers from a previous navigation
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    // Never show on Login / Registration pages
    if (isExcludedPath(currentPath)) {
      setVisible(false);
      setFading(false);
      return;
    }

    // Show the spinner
    setFading(false);
    setVisible(true);

    // Begin fade-out after the display duration (page has almost certainly rendered)
    hideTimerRef.current = setTimeout(() => {
      setFading(true);
      // Remove from DOM after the CSS transition finishes
      fadeTimerRef.current = setTimeout(() => {
        setVisible(false);
        setFading(false);
      }, FADE_TRANSITION_DURATION);
    }, SPINNER_DISPLAY_DURATION);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [location.pathname]);

  if (!visible) return null;

  const bgColor = isDark ? '#000000' : '#ffffff';
  const spinnerColor = isDark ? '#9ca3af' : '#4b5563';

  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor,
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_TRANSITION_DURATION}ms ease`,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/*
       * KUCCPS-style spinner:
       *   – SVG circle with stroke-dasharray to create several short curved
       *     segments separated by visible gaps (broken-ring effect).
       *   – Tailwind's animate-spin drives the smooth clockwise rotation.
       *   – Thick stroke and large size so it is clearly visible on its own.
       */}
      <div className="animate-spin" aria-hidden="true" style={{ color: spinnerColor }}>
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          {/*
           * r=28 → circumference ≈ 176px.
           * strokeDasharray="44 18": each arc is ~44px with an 18px gap,
           * producing roughly 3 curved segments around the ring.
           */}
          <circle
            cx="36"
            cy="36"
            r="28"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray="44 18"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
