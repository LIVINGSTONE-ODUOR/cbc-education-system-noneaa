import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Search, School, FlaskConical, BookOpen, Briefcase, LayoutGrid } from 'lucide-react';
import { getCampusLocations, type CampusLocation, type CampusLocationCategory } from '@/lib/api/campusMapApi';
import { useLanguage, type TranslationKey } from '@/contexts/LanguageContext';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

type FilterCategory = 'all' | CampusLocationCategory;

const CATEGORY_META: Record<CampusLocationCategory, { labelKey: TranslationKey; icon: React.ElementType }> = {
  classroom: { labelKey: 'categoryClassroom', icon: School },
  lab: { labelKey: 'categoryLab', icon: FlaskConical },
  library: { labelKey: 'categoryLibrary', icon: BookOpen },
  office: { labelKey: 'categoryOffice', icon: Briefcase },
  other: { labelKey: 'categoryOther', icon: MapPin },
};

const CampusMap: React.FC = () => {
  const { t } = useLanguage();
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<FilterCategory>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce the search box so we're not firing a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getCampusLocations({
          category: category === 'all' ? undefined : category,
          q: debouncedSearch || undefined,
        });
        if (!cancelled) setLocations(res.data.locations || []);
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e, t('couldNotLoadCampusMap')));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [category, debouncedSearch, t]);

  // Group by building for a directory-style layout.
  const grouped = useMemo(() => {
    const groups = new Map<string, CampusLocation[]>();
    for (const loc of locations) {
      const key = loc.building?.trim() || t('unassignedArea');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(loc);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [locations, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          {t('campusMap')}
        </CardTitle>
        <CardDescription>{t('campusMapDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchRoomPlaceholder')}
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={category === 'all' ? 'default' : 'outline'}
            onClick={() => setCategory('all')}
          >
            {t('allFilter')}
          </Button>
          {(Object.keys(CATEGORY_META) as CampusLocationCategory[]).map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={category === cat ? 'default' : 'outline'}
              onClick={() => setCategory(cat)}
            >
              {t(CATEGORY_META[cat].labelKey)}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : locations.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {search || category !== 'all'
              ? t('noLocationsMatchSearch')
              : t('noCampusMapYet')}
          </p>
        ) : (
          <div className="space-y-5">
            {grouped.map(([building, locs]) => (
              <div key={building}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {building}
                </p>
                <div className="space-y-2">
                  {locs.map((loc) => {
                    const meta = CATEGORY_META[loc.category];
                    const Icon = meta.icon;
                    return (
                      <div key={loc.id} className="flex items-start gap-3 rounded-md border p-3">
                        <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium truncate">{loc.name}</p>
                            <Badge variant="outline">{t(meta.labelKey)}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            {loc.floor && <span>{t('floorLabel')} {loc.floor}</span>}
                            {loc.room_number && <span>{t('roomLabel')} {loc.room_number}</span>}
                          </div>
                          {loc.description && (
                            <p className="text-sm text-muted-foreground mt-1">{loc.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">{t('maintainedByTeachers')}</p>
      </CardFooter>
    </Card>
  );
};

export default CampusMap;
