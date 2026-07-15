import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, DownloadCloud, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
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
          {t('offlineAccess', 'Offline Access')}
        </CardTitle>
        <CardDescription>
          {t('offlineAccessDesc', 'Install the app and keep viewing your timetable and notes without internet.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">{t('connectionStatus', 'Connection status')}</p>
            <p className="text-xs text-muted-foreground">
              {isOnline
                ? t('onlineSyncing', 'Online — data is syncing normally.')
                : t('offlineLastSaved', "Offline — you're viewing your last saved data.")}
            </p>
          </div>
          <Badge variant={isOnline ? 'secondary' : 'outline'} className={isOnline ? '' : 'text-amber-600 border-amber-300 bg-amber-50'}>
            {isOnline ? t('online', 'Online') : t('offline', 'Offline')}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-md border p-3 flex-wrap">
          <div>
            <p className="text-sm font-medium">{t('installAsApp', 'Install as an app')}</p>
            <p className="text-xs text-muted-foreground">
              {installed
                ? t('alreadyInstalled', 'Already installed on this device.')
                : installPrompt
                  ? t('addToHomeScreenPrompt', 'Add NONEAA to your home screen for faster, offline-ready access.')
                  : t('openInChromeEdge', 'Open this site in Chrome or Edge to install it, or use "Add to Home Screen" on mobile.')}
            </p>
          </div>
          {installed ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> {t('installed', 'Installed')}
            </Badge>
          ) : (
            <Button size="sm" onClick={handleInstall} disabled={!installPrompt}>
              <DownloadCloud className="h-4 w-4 mr-1.5" /> {t('installApp', 'Install App')}
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">{t('availableOfflineOnce', 'Available offline once loaded at least once:')}</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>{t('offlineTimetable', 'Your class timetable')}</li>
            <li>{t('offlineNotebookNote', 'Personal notes and reminders (Digital Notebook — always saved on this device)')}</li>
            <li>{t('offlineAppItself', "The app itself, so you're not staring at a browser error screen")}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineAccess;
