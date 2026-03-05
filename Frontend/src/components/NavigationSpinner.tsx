import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/** How long (ms) the spinner stays visible before fading out. */
const SPINNER_DISPLAY_DURATION = 1000;

/** Duration (ms) of the CSS fade-out transition. */
const FADE_TRANSITION_DURATION = 300;

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

/** Detect dark mode from the browser-stored preference, falling back to OS. */
function useIsDark() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('theme-mode');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    // React to theme changes from another tab/window
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme-mode') {
        if (e.newValue === 'dark') setIsDark(true);
        else if (e.newValue === 'light') setIsDark(false);
        else setIsDark(mq.matches);
      }
    };

    // React to OS preference changes only when no stored preference exists
    const handleMq = () => {
      if (!localStorage.getItem('theme-mode')) setIsDark(mq.matches);
    };

    window.addEventListener('storage', handleStorage);
    mq.addEventListener('change', handleMq);

    return () => {
      window.removeEventListener('storage', handleStorage);
      mq.removeEventListener('change', handleMq);
    };
  }, []);

  return isDark;
}

/**
 * loader: a full-screen overlay with a small, thin circular broken-ring
 * spinner that rotates continuously clockwise.
 *
 * Behaviour:
 * - Covers the entire screen (page content is hidden behind the overlay)
 *   on every page load/reload and every route change, so the spinner is
 *   always seen alone.
 * - Hidden on Login and Registration pages.
 * - Stays visible for SPINNER_DISPLAY_DURATION ms, then fades out.
 * - Respects the user's browser-stored colour preference (light/dark), falling
 *   back to the OS colour scheme when no browser preference is stored.
 */
export default function NavigationSpinner() {
  const location = useLocation();
  const isDark = useIsDark();

  // Show the spinner immediately on initial page load / reload (unless excluded).
  const [visible, setVisible] = useState(() => !isExcludedPath(location.pathname));
  const [fading, setFading] = useState(false);

  // Track whether this is the first render (initial load / reload).
  const isInitialMount = useRef(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentPath = location.pathname;

    // Clear any running timers from a previous navigation
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    if (isInitialMount.current) {
      // First render: spinner is already visible (set in useState).
      // Just schedule its fade-out; skip the "show" step.
      isInitialMount.current = false;

      if (!isExcludedPath(currentPath)) {
        hideTimerRef.current = setTimeout(() => {
          setFading(true);
          fadeTimerRef.current = setTimeout(() => {
            setVisible(false);
            setFading(false);
          }, FADE_TRANSITION_DURATION);
        }, SPINNER_DISPLAY_DURATION);
      } else {
        // Excluded path on initial load – ensure spinner stays hidden.
        setVisible(false);
        setFading(false);
      }

      return () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      };
    }

    // Subsequent renders: a route change has occurred.

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
       * style spinner:
       *   – Small, thin SVG circle (36×36px, 3px stroke) matching the
       *     compact spinner seen on the KUCCPS student portal.
       *   – stroke-dasharray creates a broken-ring effect with visible gaps.
       *   – animate-spin-fast (0.4 s) drives the fast clockwise rotation.
       */}
      <div className="animate-spin-fast" aria-hidden="true" style={{ color: spinnerColor }}>
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          {/*
           * r=15 → circumference ≈ 94px.
           * strokeDasharray="24 8": each arc is ~24px with an 8px gap,
           * producing roughly 3 curved segments around the ring.
           */}
          <circle
            cx="18"
            cy="18"
            r="15"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="24 8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
