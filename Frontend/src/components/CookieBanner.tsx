import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Cookie, Shield, BarChart3, Target, ChevronDown, ChevronUp, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie-consent';
const COOKIE_PREFERENCES_KEY = 'cookie-preferences';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  personalization: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  personalization: false,
  marketing: false,
};

const getInitialBannerState = () => {
  if (typeof window === 'undefined') return false;
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  return !consent;
};

const COOKIE_CATEGORIES = [
  {
    key: 'essential' as const,
    label: 'Essential',
    icon: Shield,
    description: 'Required for the platform to function. These cannot be disabled.',
    locked: true,
  },
  {
    key: 'analytics' as const,
    label: 'Analytics',
    icon: BarChart3,
    description: 'Help us understand how you use the platform so we can improve it.',
    locked: false,
  },
  {
    key: 'personalization' as const,
    label: 'Personalization',
    icon: Cookie,
    description: 'Remember your preferences such as theme, language, and layout.',
    locked: false,
  },
  {
    key: 'marketing' as const,
    label: 'Marketing',
    icon: Target,
    description: 'Used to show relevant content and measure campaign effectiveness.',
    locked: false,
  },
];

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(getInitialBannerState);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  const saveAndClose = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'custom');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setShowBanner(false);
  };

  const handleAcceptAll = () => {
    saveAndClose({ essential: true, analytics: true, personalization: true, marketing: true });
  };

  const handleRejectAll = () => {
    saveAndClose({ essential: true, analytics: false, personalization: false, marketing: false });
  };

  const handleSavePreferences = () => {
    saveAndClose(preferences);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return;
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:p-6 pointer-events-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />

      {/* Banner */}
      <div className="relative w-full max-w-lg pointer-events-auto animate-in slide-in-from-bottom duration-300">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
                <Cookie className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Cookie Preferences</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manage your privacy</p>
              </div>
            </div>
            <button
              onClick={handleRejectAll}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <div className="px-5 pb-4">
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              We use cookies to keep the platform running smoothly and to understand how you interact with it. 
              You can customize your preferences below.
            </p>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 space-y-1 max-h-64 overflow-y-auto">
              {COOKIE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.key}
                    className="flex items-start gap-3 py-2.5 rounded-lg px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 mt-0.5">
                      <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{cat.label}</span>
                        {cat.locked ? (
                          <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full">
                            Always on
                          </span>
                        ) : (
                          <Switch
                            checked={preferences[cat.key]}
                            onCheckedChange={() => togglePreference(cat.key)}
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mr-auto"
            >
              {showSettings ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              {showSettings ? 'Hide settings' : 'Cookie settings'}
            </button>

            {showSettings ? (
              <Button size="sm" onClick={handleSavePreferences} className="text-xs h-8 px-4">
                Save Preferences
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectAll}
                  className="text-xs h-8 px-4"
                >
                  Reject All
                </Button>
                <Button size="sm" onClick={handleAcceptAll} className="text-xs h-8 px-4">
                  Accept All
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
