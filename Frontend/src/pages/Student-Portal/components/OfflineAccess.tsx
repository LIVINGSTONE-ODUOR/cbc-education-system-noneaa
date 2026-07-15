import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, DownloadCloud, CheckCircle2 } from 'lucide-react';

// Chrome/Edge fire this before showing their own install UI; capturing it
// lets us trigger the native install prompt from our own button instead
// of relying on the browser's address-bar icon.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);

const OfflineAccess: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(isStandalone());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {isOnline ? <Wifi className="h-5 w-5 text-primary" /> : <WifiOff className="h-5 w-5 text-amber-600" />}
          Offline Access
        </CardTitle>
        <CardDescription>Install the app and keep viewing your timetable and notes without internet.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Connection status</p>
            <p className="text-xs text-muted-foreground">
              {isOnline ? 'Online — data is syncing normally.' : "Offline — you're viewing your last saved data."}
            </p>
          </div>
          <Badge variant={isOnline ? 'secondary' : 'outline'} className={isOnline ? '' : 'text-amber-600 border-amber-300 bg-amber-50'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-md border p-3 flex-wrap">
          <div>
            <p className="text-sm font-medium">Install as an app</p>
            <p className="text-xs text-muted-foreground">
              {installed
                ? 'Already installed on this device.'
                : installPrompt
                  ? 'Add NONEAA to your home screen for faster, offline-ready access.'
                  : 'Open this site in Chrome or Edge to install it, or use "Add to Home Screen" on mobile.'}
            </p>
          </div>
          {installed ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Installed
            </Badge>
          ) : (
            <Button size="sm" onClick={handleInstall} disabled={!installPrompt}>
              <DownloadCloud className="h-4 w-4 mr-1.5" /> Install App
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Available offline once loaded at least once:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Your class timetable</li>
            <li>Personal notes and reminders (Digital Notebook — always saved on this device)</li>
            <li>The app itself, so you're not staring at a browser error screen</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineAccess;
