import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, X, MapPin, CheckCircle2, Trash2 } from 'lucide-react';
import {
  getLostFoundItems,
  createLostFoundItem,
  resolveLostFoundItem,
  deleteLostFoundItem,
  type LostFoundItem,
} from '@/lib/api/lostFoundApi';
import { useLanguage } from '@/contexts/LanguageContext';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

type FilterType = 'all' | 'lost' | 'found';

const LostAndFound: React.FC = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showResolved, setShowResolved] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [itemType, setItemType] = useState<'lost' | 'found'>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [posting, setPosting] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getLostFoundItems({
        status: showResolved ? 'all' : 'open',
        type: filter === 'all' ? undefined : filter,
      });
      setItems(res.data.items || []);
    } catch (e) {
      setError(getErrorMessage(e, t('couldNotLoadLostFound', 'Could not load the Lost & Found board.')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, showResolved]);

  const resetForm = () => {
    setItemType('lost');
    setTitle('');
    setDescription('');
    setLocation('');
    setContactInfo('');
  };

  const handlePost = async () => {
    if (!title.trim()) return;
    setPosting(true);
    try {
      await createLostFoundItem({
        item_type: itemType,
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        contact_info: contactInfo.trim() || undefined,
      });
      resetForm();
      setShowForm(false);
      await refresh();
    } catch (e) {
      alert(getErrorMessage(e, t('couldNotPostBoard', 'Could not post to the Lost & Found board.')));
    } finally {
      setPosting(false);
    }
  };

  const handleResolve = async (id: string) => {
    setBusyId(id);
    try {
      await resolveLostFoundItem(id);
      await refresh();
    } catch (e) {
      alert(getErrorMessage(e, t('couldNotMarkResolved', 'Could not mark this as resolved.')));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm', 'Delete this post?'))) return;
    setBusyId(id);
    try {
      await deleteLostFoundItem(id);
      await refresh();
    } catch (e) {
      alert(getErrorMessage(e, t('couldNotDeletePost', 'Could not delete this post.')));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            {t('lostAndFound', 'Lost & Found')}
          </CardTitle>
          <CardDescription>{t('lostAndFoundDesc', 'Lost something on campus, or found something? Post it here.')}</CardDescription>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> {t('newPost', 'New post')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="rounded-md border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t('newLostFoundPost', 'New Lost & Found post')}</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1">
              <Label>{t('iLabel', 'I...')}</Label>
              <Select value={itemType} onValueChange={(v) => setItemType(v as 'lost' | 'found')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lost">{t('lostAnItem', 'Lost an item')}</SelectItem>
                  <SelectItem value="found">{t('foundAnItem', 'Found an item')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="lf-title">{t('itemLabel', 'Item')}</Label>
              <Input
                id="lf-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('itemPlaceholder', 'e.g. Blue water bottle')}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lf-description">{t('descriptionLabel', 'Description')}</Label>
              <Textarea
                id="lf-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder={t('descriptionPlaceholder', 'Any details that help identify it')}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lf-location">
                {itemType === 'lost' ? t('lastSeenWhere', 'Last seen where?') : t('whereFoundIt', 'Where did you find it?')}
              </Label>
              <Input
                id="lf-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('locationPlaceholder', 'e.g. Library, 2nd floor')}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lf-contact">{t('howReachYou', 'How should people reach you?')}</Label>
              <Input
                id="lf-contact"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder={t('contactPlaceholder', 'e.g. Ask for John in 9B, or an email')}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>{t('cancel', 'Cancel')}</Button>
              <Button onClick={handlePost} disabled={posting || !title.trim()}>
                {posting ? t('postingEllipsis', 'Posting...') : t('postButton', 'Post')}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'lost', 'found'] as FilterType[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? t('allFilter', 'All') : f === 'lost' ? t('lostFilter', 'Lost') : t('foundFilter', 'Found')}
            </Button>
          ))}
          <Button
            size="sm"
            variant={showResolved ? 'default' : 'outline'}
            onClick={() => setShowResolved((v) => !v)}
          >
            {showResolved ? t('showingResolved', 'Showing resolved') : t('showResolvedBtn', 'Show resolved')}
          </Button>
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
            {t('nothingPostedYet', 'Nothing posted yet. Lost or found something? Be the first to post.')}
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-md border p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={item.item_type === 'lost' ? 'destructive' : 'default'}>
                        {item.item_type === 'lost' ? t('lostFilter', 'Lost') : t('foundFilter', 'Found')}
                      </Badge>
                      {item.status === 'resolved' && <Badge variant="outline">{t('resolved', 'Resolved')}</Badge>}
                      <p className="text-sm font-medium truncate">{item.title}</p>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {item.location}
                        </span>
                      )}
                      {item.contact_info && <span>{t('contactLabel', 'Contact')}: {item.contact_info}</span>}
                      {item.reporter && (
                        <span>
                          {t('postedByPrefix', 'Posted by')} {item.reporter.first_name} {item.reporter.last_name}
                        </span>
                      )}
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {item.status === 'open' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title={t('markResolvedTitle', 'Mark resolved')}
                        disabled={busyId === item.id}
                        onClick={() => handleResolve(item.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title={t('deleteTitle', 'Delete')}
                        disabled={busyId === item.id}
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">{t('visibleFooter', 'Visible to everyone at your school. Resolve or delete only your own posts.')}</p>
      </CardFooter>
    </Card>
  );
};

export default LostAndFound;
