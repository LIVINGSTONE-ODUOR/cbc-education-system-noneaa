import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NotebookPen, Bell, Trash2, Pencil, Plus, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Note {
  id: string;
  title: string;
  body: string;
  reminderDate: string | null; // yyyy-mm-dd, optional
  createdAt: string;
  updatedAt: string;
}

interface DigitalNotebookProps {
  userId: string;
}

const storageKey = (userId: string) => `student-notebook:${userId}`;

const loadNotes = (userId: string): Note[] => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
};

const saveNotes = (userId: string, notes: Note[]) => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(notes));
  } catch {
    // localStorage may be unavailable (private browsing, quota) — fail quietly,
    // the user's notes just won't persist this session.
  }
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const DigitalNotebook: React.FC<DigitalNotebookProps> = ({ userId }) => {
  const { t } = useLanguage();
  const [notes, setNotes] = useState<Note[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  useEffect(() => {
    if (!userId) return;
    setNotes(loadNotes(userId));
  }, [userId]);

  const persist = (next: Note[]) => {
    setNotes(next);
    saveNotes(userId, next);
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setReminderDate('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!title.trim() && !body.trim()) return;
    const now = new Date().toISOString();

    if (editingId) {
      persist(
        notes.map((n) =>
          n.id === editingId
            ? { ...n, title: title.trim() || t('untitledNote'), body, reminderDate: reminderDate || null, updatedAt: now }
            : n
        )
      );
    } else {
      const note: Note = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: title.trim() || t('untitledNote'),
        body,
        reminderDate: reminderDate || null,
        createdAt: now,
        updatedAt: now,
      };
      persist([note, ...notes]);
    }
    resetForm();
  };

  const handleEdit = (note: Note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setBody(note.body);
    setReminderDate(note.reminderDate || '');
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    persist(notes.filter((n) => n.id !== id));
  };

  const { dueReminders, upcomingReminders, plainNotes } = useMemo(() => {
    const today = todayKey();
    const due: Note[] = [];
    const upcoming: Note[] = [];
    const plain: Note[] = [];
    for (const n of notes) {
      if (n.reminderDate && n.reminderDate <= today) due.push(n);
      else if (n.reminderDate) upcoming.push(n);
      else plain.push(n);
    }
    due.sort((a, b) => (a.reminderDate || '').localeCompare(b.reminderDate || ''));
    upcoming.sort((a, b) => (a.reminderDate || '').localeCompare(b.reminderDate || ''));
    return { dueReminders: due, upcomingReminders: upcoming, plainNotes: plain };
  }, [notes]);

  const NoteCard: React.FC<{ note: Note; overdue?: boolean }> = ({ note, overdue }) => (
    <div className={`rounded-md border p-3 space-y-1 ${overdue ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{note.title}</p>
          {note.reminderDate && (
            <p className="text-xs flex items-center gap-1 text-amber-600 mt-0.5">
              <Bell className="h-3 w-3" /> {new Date(note.reminderDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(note)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(note.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {note.body && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{note.body}</p>}
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <NotebookPen className="h-5 w-5 text-primary" />
            {t('digitalNotebook')}
          </CardTitle>
          <CardDescription>{t('digitalNotebookDesc')}</CardDescription>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> {t('newNoteButton')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{editingId ? t('editNoteTitle') : t('newNoteButton')}</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <Label htmlFor="note-title">{t('titleLabel')}</Label>
              <Input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('titlePlaceholder')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="note-body">{t('noteLabel')}</Label>
              <Textarea id="note-body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder={t('notePlaceholder')} />
            </div>
            <div className="space-y-1 max-w-[200px]">
              <Label htmlFor="note-reminder">{t('reminderDateOptional')}</Label>
              <Input id="note-reminder" type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>{t('cancelButton')}</Button>
              <Button onClick={handleSave}>{editingId ? t('saveChangesButton') : t('addNoteButton')}</Button>
            </div>
          </div>
        )}

        {dueReminders.length === 0 && upcomingReminders.length === 0 && plainNotes.length === 0 && !showForm ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('noNotesYet')}</p>
        ) : (
          <div className="space-y-4">
            {dueReminders.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
                  <Bell className="h-3.5 w-3.5" /> {t('dueWord')}
                </p>
                {dueReminders.map((n) => (
                  <NoteCard key={n.id} note={n} overdue />
                ))}
              </div>
            )}
            {upcomingReminders.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t('upcomingReminders')}</p>
                {upcomingReminders.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            )}
            {plainNotes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t('notesWord')}</p>
                {plainNotes.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
      {notes.length > 0 && (
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {notes.length} {t('notesSavedOnDevice')}
          </p>
        </CardFooter>
      )}
    </Card>
  );
};

export default DigitalNotebook;
