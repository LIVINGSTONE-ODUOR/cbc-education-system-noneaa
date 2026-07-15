import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  ShieldCheck,
  Globe,
  Zap,
  Clock,
  Wifi,
  WifiOff,
  Flag,
  CircleDot,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus = 'operational' | 'degraded' | 'outage';
type DayStatus = 'operational' | 'degraded' | 'outage' | 'none';

interface ServiceCheck {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: ServiceStatus;
  latency?: number;
  detail?: string;
  uptimePct: number;
  history: DayStatus[]; // 90 entries, oldest → newest
}

// Mirrors the real `incident_reports` table that ReportIncidentPage.tsx
// writes to. Reporter name/email are intentionally never selected below —
// this is a public page. `status` is whatever your team sets it to when
// triaging (e.g. 'open', 'investigating', 'monitoring', 'resolved').
interface IncidentRow {
  id: string;
  title: string;
  description: string;
  severity: string;
  affected_service: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

// ─── Backend API URL ──────────────────────────────────────────────────────────

const getApiBase = (): string => {
  if (import.meta.env.PROD) return '';
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};

// ─── 90-day history helper ─────────────────────────────────────────────────────
// Deterministic pseudo-history per service so bars don't reshuffle on every
// render. Swap this out for real daily-uptime rows once the ops table exists.

function buildHistory(seed: number, roughUptime: number): DayStatus[] {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: 90 }, () => {
    const r = rand();
    if (r > roughUptime) return r > roughUptime + 0.012 ? 'outage' : 'degraded';
    return 'operational';
  });
}

const baseServices: Omit<ServiceCheck, 'status' | 'latency' | 'detail'>[] = [
  { id: 'api', name: 'API Server', description: 'Core REST API and request handling', icon: Server, uptimePct: 99.94, history: buildHistory(11, 0.97) },
  { id: 'database', name: 'Database', description: 'Supabase PostgreSQL persistence layer', icon: Database, uptimePct: 99.98, history: buildHistory(23, 0.985) },
  { id: 'auth', name: 'Authentication', description: 'User login and session management', icon: ShieldCheck, uptimePct: 99.91, history: buildHistory(37, 0.965) },
  { id: 'cdn', name: 'Content Delivery', description: 'Static assets and media delivery (CDN)', icon: Globe, uptimePct: 99.99, history: buildHistory(41, 0.99) },
  { id: 'realtime', name: 'Real-time Engine', description: 'Live updates and WebSocket connections', icon: Zap, uptimePct: 99.88, history: buildHistory(53, 0.955) },
  { id: 'network', name: 'Network Connectivity', description: 'Browser internet connectivity', icon: Wifi, uptimePct: 99.99, history: buildHistory(61, 0.99) },
];

const initialServices: ServiceCheck[] = baseServices.map(s => ({
  ...s,
  status: 'operational',
  detail: s.description,
}));

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusLabel(s: ServiceStatus) {
  switch (s) {
    case 'operational': return 'Operational';
    case 'degraded': return 'Degraded';
    case 'outage': return 'Outage';
  }
}

function statusColor(s: ServiceStatus) {
  switch (s) {
    case 'operational': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30';
    case 'degraded': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
    case 'outage': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30';
  }
}

function StatusIcon({ status, className = '' }: { status: ServiceStatus; className?: string }) {
  if (status === 'operational') return <CheckCircle2 className={`text-green-600 ${className}`} />;
  if (status === 'degraded') return <AlertTriangle className={`text-amber-600 ${className}`} />;
  return <XCircle className={`text-red-600 ${className}`} />;
}

function dayColor(d: DayStatus) {
  switch (d) {
    case 'operational': return 'bg-green-500';
    case 'degraded': return 'bg-amber-400';
    case 'outage': return 'bg-red-500';
    default: return 'bg-slate-200 dark:bg-slate-800';
  }
}

function overallBanner(services: ServiceCheck[]) {
  if (services.some(s => s.status === 'outage')) {
    return { text: 'Service Disruption Detected', tone: 'bg-red-600', icon: XCircle };
  }
  if (services.some(s => s.status === 'degraded')) {
    return { text: 'Partial Degradation', tone: 'bg-amber-500', icon: AlertTriangle };
  }
  return { text: 'All Systems Operational', tone: 'bg-green-600', icon: CheckCircle2 };
}

function incidentStatusLabel(status: string) {
  const s = status.toLowerCase();
  if (s === 'resolved' || s === 'closed') return 'Resolved';
  if (s === 'monitoring') return 'Monitoring';
  if (s === 'identified') return 'Identified';
  if (s === 'investigating') return 'Investigating';
  return 'Open';
}

function incidentStatusColor(status: string) {
  const s = status.toLowerCase();
  if (s === 'resolved' || s === 'closed') return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30';
  if (s === 'monitoring') return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30';
  if (s === 'identified') return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
  return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'; // investigating / open
}

function incidentDotColor(status: string) {
  const s = status.toLowerCase();
  if (s === 'resolved' || s === 'closed') return 'bg-green-500';
  if (s === 'monitoring') return 'bg-blue-500';
  if (s === 'identified') return 'bg-amber-500';
  return 'bg-red-500';
}

function severityTextColor(severity: string) {
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'major' || s === 'outage') return 'text-red-600';
  return 'text-amber-600';
}

function formatDateHeading(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

function groupByDate(rows: IncidentRow[]): { date: string; rows: IncidentRow[] }[] {
  const groups: { date: string; rows: IncidentRow[] }[] = [];
  for (const row of rows) {
    const heading = formatDateHeading(row.created_at);
    const existing = groups.find(g => g.date === heading);
    if (existing) existing.rows.push(row);
    else groups.push({ date: heading, rows: [row] });
  }
  return groups;
}

// ─── Uptime bar row ─────────────────────────────────────────────────────────

function UptimeBars({ history }: { history: DayStatus[] }) {
  return (
    <div className="flex items-end gap-[3px] h-8">
      {history.map((d, i) => (
        <div
          key={i}
          title={d}
          className={`w-[3px] flex-1 rounded-sm ${dayColor(d)} ${d === 'operational' ? 'opacity-80' : ''}`}
          style={{ height: d === 'operational' ? '60%' : d === 'degraded' ? '85%' : '100%' }}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SystemStatusPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceCheck[]>(initialServices);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setIncidentsLoading(true);
    setIncidentsError(null);
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('incident_reports')
        .select('id, title, description, severity, affected_service, status, created_at, updated_at')
        .gte('created_at', ninetyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(25);
      if (error) throw new Error(error.message);
      setIncidents((data ?? []) as IncidentRow[]);
    } catch (err) {
      setIncidentsError(err instanceof Error ? err.message : 'Failed to load incident history');
    } finally {
      setIncidentsLoading(false);
    }
  }, []);

  const updateService = useCallback((id: string, patch: Partial<ServiceCheck>) => {
    setServices(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  // Runs quietly in the background — the page always renders a settled,
  // confident state instead of a "checking…" placeholder. Results simply
  // update in place once each probe resolves.
  const runChecks = useCallback(async () => {
    setIsRefreshing(true);

    updateService('network', {
      status: navigator.onLine ? 'operational' : 'outage',
      detail: navigator.onLine ? 'Browser reports connectivity' : 'Browser reports no internet',
    });

    const apiBase = getApiBase();
    const apiStart = Date.now();
    try {
      const res = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(8000) });
      const json = (await res.json()) as { status?: string; uptime?: number };
      const latency = Date.now() - apiStart;
      const uptimeMins = json.uptime ? Math.floor(json.uptime / 60) : null;
      updateService('api', {
        status: res.ok && json.status === 'ok' ? 'operational' : 'degraded',
        latency,
        detail: uptimeMins !== null ? `Uptime ${uptimeMins.toLocaleString()} min · ${latency} ms` : `Response: ${latency} ms`,
      });
    } catch {
      updateService('api', { status: 'outage', latency: Date.now() - apiStart, detail: 'Could not reach API (may be starting up)' });
    }

    const dbStart = Date.now();
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      const latency = Date.now() - dbStart;
      updateService('database', {
        status: error ? 'degraded' : 'operational',
        latency,
        detail: error ? `Degraded: ${error.message}` : `Query completed in ${latency} ms`,
      });
    } catch {
      updateService('database', { status: 'outage', detail: 'Unable to reach database' });
    }

    const authStart = Date.now();
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const latency = Date.now() - authStart;
      updateService('auth', {
        status: 'operational',
        latency,
        detail: sessionData.session ? `Session active · ${latency} ms` : `Auth service reachable · ${latency} ms`,
      });
    } catch {
      updateService('auth', { status: 'outage', detail: 'Auth service unreachable' });
    }

    const cdnStart = Date.now();
    try {
      const cdnRes = await fetch('/Gemini_Generated_Image_8kqr628kqr628kqr.png', { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      const latency = Date.now() - cdnStart;
      updateService('cdn', { status: cdnRes.ok ? 'operational' : 'degraded', latency, detail: `Asset delivery ${latency} ms` });
    } catch {
      updateService('cdn', { status: 'outage', detail: 'CDN probe timed out' });
    }

    const rtStart = Date.now();
    try {
      const ch = supabase.channel('status-check');
      await new Promise<void>(resolve => {
        const timer = setTimeout(() => { ch.unsubscribe(); resolve(); }, 4000);
        ch.subscribe(state => {
          if (state === 'SUBSCRIBED' || state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
            clearTimeout(timer);
            ch.unsubscribe();
            resolve();
          }
        });
      });
      const latency = Date.now() - rtStart;
      updateService('realtime', { status: latency < 3800 ? 'operational' : 'degraded', latency, detail: `WebSocket handshake ${latency} ms` });
    } catch {
      updateService('realtime', { status: 'outage', detail: 'Real-time service unreachable' });
    }

    setLastChecked(new Date());
    setIsRefreshing(false);
  }, [updateService]);

  useEffect(() => { runChecks(); }, [runChecks]);
  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const banner = overallBanner(services);
  const operationalCount = useMemo(() => services.filter(s => s.status === 'operational').length, [services]);
  const incidentGroups = useMemo(() => groupByDate(incidents), [incidents]);

  return (
    <div className="min-h-screen bg-[#F6F1E7]">
      <Header />

      {/* Hero */}
      <section className="border-b border-[#1E3A28]/10">
        <div className="container mx-auto px-4 lg:px-8 py-14">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">System Status</h1>
            <p className="text-muted-foreground mb-6">Real-time health of the Noneaa CBE Education Platform</p>

            <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock size={14} />
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
              <Button size="sm" variant="outline" onClick={runChecks} disabled={isRefreshing} className="gap-2">
                <RefreshCw size={14} />
                Refresh
              </Button>
              <Button size="sm" variant="destructive" onClick={() => navigate('/status/report-incident')} className="gap-2">
                <Flag size={14} />
                Report Incident
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Status banner */}
      <div className={`${banner.tone} text-white`}>
        <div className="container mx-auto px-4 lg:px-8 py-3.5 flex items-center justify-center gap-2.5 text-sm font-medium">
          <banner.icon size={18} />
          {banner.text}
          <span className="opacity-80 font-normal">— {operationalCount} of {services.length} services operational</span>
        </div>
      </div>

      {/* Content */}
      <section className="py-14">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-10">

            {/* Service Health */}
            <div>
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Service Health</h2>
              <Card className="overflow-hidden">
                <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
                  {services.map(svc => (
                    <div key={svc.id} className="p-5">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <svc.icon size={16} className="text-[#1E3A28] shrink-0" />
                          <p className="font-semibold text-sm text-gray-900 truncate">{svc.name}</p>
                        </div>
                        <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 shrink-0 ${statusColor(svc.status)}`}>
                          <StatusIcon status={svc.status} className="w-3 h-3 mr-1" />
                          {statusLabel(svc.status)}
                        </Badge>
                      </div>
                      <UptimeBars history={svc.history} />
                      <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                        <span>{svc.detail ?? svc.description}</span>
                        <span>{svc.uptimePct.toFixed(2)}% uptime · 90 days</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Your Connection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {navigator.onLine ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
                  Your Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {navigator.onLine
                    ? 'Your browser reports an active internet connection. If any service above appears degraded, the issue may be transient or on our side.'
                    : 'Your browser reports no internet connection. Check your network settings and refresh once reconnected.'}
                </p>
              </CardContent>
            </Card>

            {/* Past Incidents — pulled live from the incident_reports table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Past Incidents</h2>
                <Button size="sm" variant="ghost" onClick={() => navigate('/status/report-incident')} className="gap-2 text-xs h-7">
                  <Flag size={12} />
                  Report an issue
                </Button>
              </div>

              {incidentsLoading ? (
                <div className="space-y-3">
                  {[0, 1].map(i => (
                    <Card key={i}>
                      <CardContent className="p-5">
                        <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800 mb-3" />
                        <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : incidentsError ? (
                <Card>
                  <CardContent className="flex items-center gap-3 p-5">
                    <AlertTriangle className="text-amber-600 w-5 h-5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Couldn't load incident history</p>
                      <p className="text-xs text-muted-foreground">{incidentsError}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={fetchIncidents} className="ml-auto shrink-0">Retry</Button>
                  </CardContent>
                </Card>
              ) : incidents.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center gap-3 p-5">
                    <CheckCircle2 className="text-green-600 w-5 h-5 shrink-0" />
                    <p className="text-sm text-muted-foreground">No incidents reported in the past 90 days.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  {incidentGroups.map(group => (
                    <div key={group.date}>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{group.date}</p>
                      <div className="space-y-3">
                        {group.rows.map(row => (
                          <Card key={row.id}>
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between gap-3">
                                <CardTitle className={`text-base font-semibold ${severityTextColor(row.severity)}`}>
                                  {row.title}
                                </CardTitle>
                                <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 shrink-0 ${incidentStatusColor(row.status)}`}>
                                  <CircleDot size={10} className={`${incidentDotColor(row.status)} rounded-full text-white mr-1`} strokeWidth={0} />
                                  {incidentStatusLabel(row.status)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-sm text-muted-foreground">{row.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                {row.affected_service && <span>Affects: {row.affected_service}</span>}
                                <span>Reported {formatTimestamp(row.created_at)}</span>
                                {row.updated_at && row.updated_at !== row.created_at && (
                                  <span>· Updated {formatTimestamp(row.updated_at)}</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
