import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/** How long (ms) the spinner stays visible before fading out. */
const SPINNER_DISPLAY_DURATION = 700;

/** Duration (ms) of the CSS fade-out transition. */
const FADE_TRANSITION_DURATION = 400;

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

/**
 * Global navigation loading spinner that mimics the KUCCPS student portal
 * loader: a thin circular ring made of several curved dashed segments that
 * rotates continuously clockwise.
 *
 * Behaviour:
 * - Appears centred on screen on every route change.
 * - Hidden on Login and Registration pages.
 * - Fades out automatically after the page finishes rendering.
 */
export default function NavigationSpinner() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

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

  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      {/*
       * KUCCPS-style spinner:
       *   – SVG circle with stroke-dasharray to create several short curved
       *     segments separated by visible gaps (broken-ring effect).
       *   – Tailwind's animate-spin drives the smooth clockwise rotation.
       *   – currentColor inherits the text-gray-400 applied to the wrapper.
       */}
      <div className="animate-spin text-gray-400" aria-hidden="true">
        <svg
          width="38"
          height="38"
          viewBox="0 0 38 38"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <circle
            cx="19"
            cy="19"
            r="16"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="20 8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
