import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Award, Trophy, Plus, X, Pencil, Trash2, ExternalLink } from 'lucide-react';
import {
  getPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  type PortfolioItem,
  type PortfolioCategory,
} from '@/lib/api/portfolioApi';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const CATEGORY_META: Record<PortfolioCategory, { label: string; icon: React.ElementType }> = {
  project: { label: 'Project', icon: Briefcase },
  certificate: { label: 'Certificate', icon: Award },
  achievement: { label: 'Achievement', icon: Trophy },
};

type FilterCategory = 'all' | PortfolioCategory;

const emptyForm = {
  category: 'project' as PortfolioCategory,
  title: '',
  description: '',
  organization: '',
  academic_year: '',
  date_achieved: '',
  external_link: '',
};

const Portfolio: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterCategory>('all');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPortfolioItems({ category: filter === 'all' ? undefined : filter });
      setItems(res.data.items || []);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load your portfolio.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const openNewForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (item: PortfolioItem) => {
    setEditingId(item.id);
    setForm({
      category: item.category,
      title: item.title,
      description: item.description || '',
      organization: item.organization || '',
      academic_year: item.academic_year || '',
      date_achieved: item.date_achieved || '',
      external_link: item.external_link || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        organization: form.organization.trim() || undefined,
        academic_year: form.academic_year.trim() || undefined,
        date_achieved: form.date_achieved || undefined,
        external_link: form.external_link.trim() || undefined,
      };
      if (editingId) {
        await updatePortfolioItem(editingId, payload);
      } else {
        await createPortfolioItem(payload);
      }
      closeForm();
      await refresh();
    } catch (e) {
      alert(getErrorMessage(e, 'Could not save this portfolio item.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this item from your portfolio?')) return;
    setBusyId(id);
    try {
      await deletePortfolioItem(id);
      await refresh();
    } catch (e) {
      alert(getErrorMessage(e, 'Could not delete this item.'));
    } finally {
      setBusyId(null);
    }
  };

  // Group by academic year so multi-year growth is easy to see at a glance.
  const grouped = useMemo(() => {
    const groups = new Map<string, PortfolioItem[]>();
    for (const item of items) {
      const key = item.academic_year?.trim() || 'Undated';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [items]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Portfolio
          </CardTitle>
          <CardDescription>Your projects, certificates, and achievements, year by year.</CardDescription>
        </div>
        {!showForm && (
          <Button size="sm" onClick={openNewForm}>
            <Plus className="h-4 w-4 mr-1" /> Add item
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{editingId ? 'Edit item' : 'New portfolio item'}</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v as PortfolioCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="pf-title">Title</Label>
              <Input
                id="pf-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Science Fair Robotics Project"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pf-description">Description</Label>
              <Textarea
                id="pf-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="What was it, and what did you do?"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pf-org">
                  {form.category === 'certificate' ? 'Issued by' : 'Organization / event'}
                </Label>
                <Input
                  id="pf-org"
                  value={form.organization}
                  onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                  placeholder="e.g. Kenya Science and Engineering Fair"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pf-year">Academic year</Label>
                <Input
                  id="pf-year"
                  value={form.academic_year}
                  onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
                  placeholder="e.g. 2024/2025"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pf-date">Date achieved</Label>
                <Input
                  id="pf-date"
                  type="date"
                  value={form.date_achieved}
                  onChange={(e) => setForm((f) => ({ ...f, date_achieved: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pf-link">Link (optional)</Label>
                <Input
                  id="pf-link"
                  value={form.external_link}
                  onChange={(e) => setForm((f) => ({ ...f, external_link: e.target.value }))}
                  placeholder="Drive, GitHub, or image link"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeForm}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add to portfolio'}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'project', 'certificate', 'achievement'] as FilterCategory[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : CATEGORY_META[f as PortfolioCategory].label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nothing here yet. Add your first project, certificate, or achievement.
          </p>
        ) : (
          <div className="space-y-5">
            {grouped.map(([year, yearItems]) => (
              <div key={year}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {year}
                </p>
                <div className="space-y-2">
                  {yearItems.map((item) => {
                    const meta = CATEGORY_META[item.category];
                    const Icon = meta.icon;
                    return (
                      <div key={item.id} className="flex items-start gap-3 rounded-md border p-3">
                        <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <Badge variant="outline">{meta.label}</Badge>
                          </div>
                          {item.organization && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.organization}</p>
                          )}
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                            {item.date_achieved && (
                              <span>{new Date(item.date_achieved).toLocaleDateString()}</span>
                            )}
                            {item.external_link && (
                              <a
                                href={item.external_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" /> View
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title="Edit"
                            disabled={busyId === item.id}
                            onClick={() => openEditForm(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title="Delete"
                            disabled={busyId === item.id}
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
        <p className="text-xs text-muted-foreground">Private to you — visible only on your own account.</p>
      </CardFooter>
    </Card>
  );
};

export default Portfolio;
