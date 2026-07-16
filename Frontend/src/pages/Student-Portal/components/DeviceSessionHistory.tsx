import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Laptop, Smartphone, Tablet, Monitor, AlertCircle, ChevronDown } from 'lucide-react';
import { getMySessions, revokeSession, type UserSession } from '@/lib/api/sessionsApi';
import { useLanguage } from '@/contexts/LanguageContext';

// Lightweight user-agent parsing — good enough to show "Chrome on Windows"
// / "Safari on iPhone" without pulling in a whole UA-parser dependency for
// one settings card. Falls back to "Unknown device" for anything it can't
// confidently classify rather than guessing.
const parseUserAgent = (ua: string | null, unknownDeviceLabel: string): { device: string; label: string; icon: React.ElementType } => {
  if (!ua) return { device: 'unknown', label: unknownDeviceLabel, icon: Monitor };

  const isTablet = /iPad|Tablet/i.test(ua);
  const isMobile = !isTablet && /Mobi|iPhone|Android/i.test(ua);

  let os = 'Unknown OS';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iOS/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';

  const icon = isTablet ? Tablet : isMobile ? Smartphone : Laptop;
  const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  return { device, label: `${browser} on ${os}`, icon };
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const DeviceSessionHistory: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMySessions();
      setSessions(res.data.sessions || []);
    } catch (err: any) {
      setError(err.message || t('failedToLoadSessions', 'Failed to load your session history'));
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  // Lazy-load: only hit the sessions endpoint the first time the card is
  // expanded, instead of on every settings page visit.
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      load();
    }
  }, [isOpen, hasLoaded]);

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      setError(err.message || t('failedToSignOutDevice', 'Failed to sign out that device'));
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Card>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full text-left"
      >
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Laptop className="h-5 w-5 text-primary" /> {t('deviceSessionHistory', 'Device & Session History')}
            </CardTitle>
            <CardDescription>{t('deviceSessionHistoryDesc', 'Everywhere your account is currently signed in.')}</CardDescription>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </CardHeader>
      </button>
      {isOpen && (
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('noActiveSessions', 'No active sessions found.')}</p>
        ) : (
          sessions.map((session) => {
            const { label, icon: Icon } = parseUserAgent(session.user_agent, t('unknownDevice', 'Unknown device'));
            return (
              <div
                key={session.id}
                className="flex items-center justify-between gap-4 rounded-md border p-3 flex-wrap"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{label}</p>
                      {session.is_current && (
                        <Badge variant="secondary" className="font-normal">{t('thisDevice', 'This device')}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.ip_address || t('unknownIp', 'Unknown IP')} · {t('signedInAt', 'Signed in')} {formatDateTime(session.created_at)}
                    </p>
                  </div>
                </div>
                {!session.is_current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(session.id)}
                    disabled={revokingId === session.id}
                  >
                    {revokingId === session.id ? t('signingOutEllipsis', 'Signing out...') : t('signOutButton', 'Sign Out')}
                  </Button>
                )}
              </div>
            );
          })
        )}
        <p className="text-xs text-muted-foreground pt-1">
          {t('dontRecognizeDevice', "Don't recognize a device? Sign it out here, then change your password above.")}
        </p>
      </CardContent>
      )}
    </Card>
  );
};

export default DeviceSessionHistory;
