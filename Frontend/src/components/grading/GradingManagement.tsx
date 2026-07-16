import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import {
  Plus, Pencil, Trash2, Check, X, Save, AlertCircle,
  Search, Star, Palette, Settings2, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface GradingLevel {
  id: string;
  scheme_id: string;
  code: string;
  name: string;
  min_score: number;
  max_score: number;
  color: string;
  sort_order: number;
  is_pass: boolean;
  is_active: boolean;
  description?: string;
}

interface GradingScheme {
  id: string;
  school_id: string;
  name: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  level_count: number;
}

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  return '';
};

const API_BASE = getApiUrl();

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('cbe_access_token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

const GRADE_COLORS = [
  { value: '#EF4444', label: 'Red' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6B7280', label: 'Gray' },
  { value: '#14B8A6', label: 'Teal' },
];

export default function GradingManagement() {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<GradingScheme[]>([]);
  const [levels, setLevels] = useState<GradingLevel[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateScheme, setShowCreateScheme] = useState(false);
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newSchemeDesc, setNewSchemeDesc] = useState('');
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<GradingLevel>>({});
  const [schemeSearch, setSchemeSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [levelDeleteConfirmId, setLevelDeleteConfirmId] = useState<string | null>(null);

  const schoolId = user?.schoolId;

  useEffect(() => {
    if (!schoolId) return;
    loadSchemes();
  }, [schoolId]);

  async function loadSchemes() {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/v1/grading/schemes?school_id=${schoolId}`);
      setSchemes(data.data || []);
      if (data.data?.length > 0 && !selectedSchemeId) {
        setSelectedSchemeId(data.data[0].id);
      }
    } catch {
      toast.error('Failed to load grading schemes');
    } finally {
      setLoading(false);
    }
  }

  async function loadLevels(schemeId: string) {
    try {
      const data = await apiFetch(`/api/v1/grading/schemes/${schemeId}/levels`);
      setLevels(data.data || []);
    } catch {
      toast.error('Failed to load grading levels');
    }
  }

  useEffect(() => {
    if (selectedSchemeId) loadLevels(selectedSchemeId);
  }, [selectedSchemeId]);

  async function createScheme() {
    if (!newSchemeName.trim()) return;
    try {
      await apiFetch('/api/v1/grading/schemes', {
        method: 'POST',
        body: JSON.stringify({ name: newSchemeName, description: newSchemeDesc, school_id: schoolId }),
      });
      toast.success('Grading scheme created');
      setShowCreateScheme(false);
      setNewSchemeName('');
      setNewSchemeDesc('');
      await loadSchemes();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function deleteScheme(id: string) {
    try {
      await apiFetch(`/api/v1/grading/schemes/${id}`, { method: 'DELETE' });
      toast.success('Scheme deleted');
      if (selectedSchemeId === id) setSelectedSchemeId(null);
      setDeleteConfirmId(null);
      await loadSchemes();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function setDefaultScheme(id: string) {
    try {
      await apiFetch(`/api/v1/grading/schemes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_default: true }),
      });
      toast.success('Default scheme updated');
      await loadSchemes();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function startEditLevel(level: GradingLevel) {
    setEditingLevel(level.id);
    setEditForm({ ...level });
  }

  function cancelEditLevel() {
    setEditingLevel(null);
    setEditForm({});
  }

  async function saveLevel(levelId: string) {
    if (!editForm.code || !editForm.name) {
      toast.error('Code and name are required');
      return;
    }
    if (editForm.min_score === undefined || editForm.max_score === undefined) {
      toast.error('Score range is required');
      return;
    }
    if (editForm.min_score > editForm.max_score) {
      toast.error('Min score cannot exceed max score');
      return;
    }
    try {
      await apiFetch(`/api/v1/grading/levels/${levelId}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      toast.success('Level updated');
      setEditingLevel(null);
      setEditForm({});
      if (selectedSchemeId) loadLevels(selectedSchemeId);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function addLevel() {
    if (!selectedSchemeId) return;
    try {
      await apiFetch('/api/v1/grading/levels', {
        method: 'POST',
        body: JSON.stringify({
          scheme_id: selectedSchemeId,
          code: 'NEW',
          name: 'New Level',
          min_score: 0,
          max_score: 10,
          sort_order: levels.length + 1,
          is_pass: false,
        }),
      });
      toast.success('Level added');
      if (selectedSchemeId) loadLevels(selectedSchemeId);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function deleteLevel(id: string) {
    try {
      await apiFetch(`/api/v1/grading/levels/${id}`, { method: 'DELETE' });
      toast.success('Level deleted');
      setLevelDeleteConfirmId(null);
      if (selectedSchemeId) loadLevels(selectedSchemeId);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const filteredSchemes = schemes.filter(s =>
    s.name.toLowerCase().includes(schemeSearch.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(schemeSearch.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading grading schemes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">Grading Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure CBC grading schemes and levels for your school
          </p>
        </div>
        <Button onClick={() => setShowCreateScheme(true)} className="shrink-0 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> New Scheme
        </Button>
      </div>

      {/* Create Scheme Form */}
      {showCreateScheme && (
        <Card className="w-full border-primary/30 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Create Grading Scheme</CardTitle>
            <CardDescription>
              Define a new CBC grading scheme with custom levels and score ranges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="schemeName" className="text-sm font-medium">
                  Scheme Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="schemeName"
                  value={newSchemeName}
                  onChange={e => setNewSchemeName(e.target.value)}
                  placeholder="e.g. CBC Standard Grade 4"
                  className="w-full"
                  autoFocus
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="schemeDesc">Description</Label>
                <Input
                  id="schemeDesc"
                  value={newSchemeDesc}
                  onChange={e => setNewSchemeDesc(e.target.value)}
                  placeholder="Brief description of this scheme"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button onClick={createScheme} disabled={!newSchemeName.trim()}>
                <Save className="w-4 h-4 mr-2" /> Create Scheme
              </Button>
              <Button variant="outline" onClick={() => { setShowCreateScheme(false); setNewSchemeName(''); setNewSchemeDesc(''); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Schemes List */}
        <div className="lg:col-span-1 space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-semibold text-lg">Schemes</h2>
            <Badge variant="secondary" className="text-xs shrink-0">{schemes.length} total</Badge>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search schemes..."
              value={schemeSearch}
              onChange={e => setSchemeSearch(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

          {filteredSchemes.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Settings2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">
                {schemeSearch ? 'No schemes match your search' : 'No grading schemes yet. Create one to get started.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {filteredSchemes.map(scheme => (
                <Card
                  key={scheme.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 w-full ${
                    selectedSchemeId === scheme.id
                      ? 'border-primary ring-2 ring-primary/20 shadow-md'
                      : 'hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedSchemeId(scheme.id)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm truncate">{scheme.name}</h3>
                          {scheme.is_default && (
                            <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                              <Star className="w-3 h-3 mr-0.5 inline" /> Default
                            </Badge>
                          )}
                        </div>
                        {scheme.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{scheme.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground/70 mt-1.5">{scheme.level_count} level{scheme.level_count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {!scheme.is_default && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={e => { e.stopPropagation(); setDefaultScheme(scheme.id); }}
                            title="Set as default"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <AlertDialog open={deleteConfirmId === scheme.id} onOpenChange={open => !open && setDeleteConfirmId(null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={e => { e.stopPropagation(); setDeleteConfirmId(scheme.id); }}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Grading Scheme</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{scheme.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteScheme(scheme.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Levels Panel */}
        <div className="lg:col-span-2 space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-semibold text-lg">Grading Levels</h2>
            {selectedSchemeId && (
              <Button variant="outline" size="sm" onClick={addLevel} className="shrink-0">
                <Plus className="w-4 h-4 mr-2" /> Add Level
              </Button>
            )}
          </div>

          {!selectedSchemeId ? (
            <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg border-muted-foreground/20">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">Select a scheme from the left to manage its grading levels</p>
            </div>
          ) : levels.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg border-muted-foreground/20">
              <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground mb-4">No levels defined yet. Add your first grading level.</p>
              <Button variant="outline" size="sm" onClick={addLevel}>
                <Plus className="w-4 h-4 mr-2" /> Add Level
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {levels
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((level, index) => (
                  <Card key={level.id} className="w-full overflow-hidden transition-all hover:shadow-sm">
                    <CardContent className="p-3 sm:p-4">
                      {editingLevel === level.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="space-y-1 min-w-0">
                              <Label className="text-xs font-medium">Code</Label>
                              <Input
                                value={editForm.code || ''}
                                onChange={e => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase().slice(0, 6) }))}
                                className="h-8 text-sm"
                                placeholder="e.g. BE"
                              />
                            </div>
                            <div className="space-y-1 min-w-0 sm:col-span-2">
                              <Label className="text-xs font-medium">Name</Label>
                              <Input
                                value={editForm.name || ''}
                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                className="h-8 text-sm"
                                placeholder="e.g. Below Expectation"
                              />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <Label className="text-xs font-medium">Color</Label>
                              <div className="flex gap-1 flex-wrap">
                                {GRADE_COLORS.map(c => (
                                  <button
                                    key={c.value}
                                    type="button"
                                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                                      editForm.color === c.value ? 'border-foreground scale-110' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: c.value }}
                                    onClick={() => setEditForm(f => ({ ...f, color: c.value }))}
                                    title={c.label}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1 min-w-0">
                              <Label className="text-xs font-medium">Min Score</Label>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={editForm.min_score ?? 0}
                                onChange={e => setEditForm(f => ({ ...f, min_score: Number(e.target.value) }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <Label className="text-xs font-medium">Max Score</Label>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={editForm.max_score ?? 0}
                                onChange={e => setEditForm(f => ({ ...f, max_score: Number(e.target.value) }))}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={editForm.is_pass ?? false}
                                onChange={e => setEditForm(f => ({ ...f, is_pass: e.target.checked }))}
                                className="rounded border-muted-foreground/30"
                              />
                              <span className="text-xs font-medium">Passing grade</span>
                            </label>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => saveLevel(level.id)}>
                                <Save className="w-3 h-3 mr-1" /> Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEditLevel}>
                                <X className="w-3 h-3 mr-1" /> Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Color badge */}
                            <div
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm"
                              style={{ backgroundColor: level.color || '#6B7280' }}
                            >
                              {level.code}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm break-words">{level.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Score: {level.min_score} – {level.max_score}
                                <span className="mx-1.5">&middot;</span>
                                <span className={level.is_pass ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                  {level.is_pass ? 'Pass' : 'Fail'}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground/70">Order: {level.sort_order}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditLevel(level)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <AlertDialog open={levelDeleteConfirmId === level.id} onOpenChange={open => !open && setLevelDeleteConfirmId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setLevelDeleteConfirmId(level.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Grading Level</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Delete "{level.code} - {level.name}"? This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteLevel(level.id)} className="bg-destructive text-destructive-foreground">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
