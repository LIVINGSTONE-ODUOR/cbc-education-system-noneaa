import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Search, School, FlaskConical, BookOpen, Briefcase, LayoutGrid } from 'lucide-react';
import { getCampusLocations, type CampusLocation, type CampusLocationCategory } from '@/lib/api/campusMapApi';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

type FilterCategory = 'all' | CampusLocationCategory;

const CATEGORY_META: Record<CampusLocationCategory, { label: string; icon: React.ElementType }> = {
  classroom: { label: 'Classroom', icon: School },
  lab: { label: 'Lab', icon: FlaskConical },
  library: { label: 'Library', icon: BookOpen },
  office: { label: 'Office', icon: Briefcase },
  other: { label: 'Other', icon: MapPin },
};

const CampusMap: React.FC = () => {
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
        if (!cancelled) setError(getErrorMessage(e, 'Could not load the campus map.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [category, debouncedSearch]);

  // Group by building for a directory-style layout.
  const grouped = useMemo(() => {
    const groups = new Map<string, CampusLocation[]>();
    for (const loc of locations) {
      const key = loc.building?.trim() || 'Unassigned area';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(loc);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [locations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          Campus Map
        </CardTitle>
        <CardDescription>Find classrooms, labs, the library, and offices around campus.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by room name or number..."
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={category === 'all' ? 'default' : 'outline'}
            onClick={() => setCategory('all')}
          >
            All
          </Button>
          {(Object.keys(CATEGORY_META) as CampusLocationCategory[]).map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={category === cat ? 'default' : 'outline'}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_META[cat].label}
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
              ? 'No locations match your search.'
              : "Your school hasn't published a campus map yet. Check back later."}
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
                            <Badge variant="outline">{meta.label}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            {loc.floor && <span>Floor: {loc.floor}</span>}
                            {loc.room_number && <span>Room: {loc.room_number}</span>}
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
        <p className="text-xs text-muted-foreground">Maintained by your school's teachers and admins.</p>
      </CardFooter>
    </Card>
  );
};

export default CampusMap;
