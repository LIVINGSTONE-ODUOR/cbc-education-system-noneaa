import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCheck, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getAdministrators, setSignatory, Administrator } from '@/lib/api/schoolsApi';

/**
 * School Signatory settings card.
 *
 * Lets a school_admin see the school's registered administrators and
 * (re)assign which one is the "signatory" — the person whose name and
 * title appear on official documents like the Fee Structure PDF export
 * (see school_admins.is_principal, set once at registration but with no
 * way to change it afterward until now).
 *
 * Deliberately self-contained with its own fetch calls rather than going
 * through SchoolSettingsContext, since that context doesn't persist to
 * the backend yet (see its TODO comments) — this needs real persistence.
 */
export function SchoolSignatoryCard() {
  const { user } = useAuth();
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadAdministrators = async () => {
    if (!user?.schoolId) return;
    setIsLoading(true);
    try {
      const { administrators } = await getAdministrators(user.schoolId);
      setAdministrators(administrators);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load administrators');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdministrators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  const handleSetSignatory = async (userId: string) => {
    if (!user?.schoolId) return;
    setUpdatingUserId(userId);
    try {
      await setSignatory(user.schoolId, userId);
      // Reflect the change immediately rather than waiting on a refetch.
      setAdministrators((prev) =>
        prev.map((admin) => ({
          ...admin,
          is_principal: admin.user_id === userId,
        }))
      );
      toast.success('Signatory updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update signatory');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenLine className="w-5 h-5" />
          School Signatory
        </CardTitle>
        <CardDescription>
          The administrator whose name and title appear on official documents,
          like the Fee Structure PDF export. Only one administrator can be the
          signatory at a time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading administrators...
          </div>
        ) : administrators.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No administrators found for this school.
          </p>
        ) : (
          administrators.map((admin) => (
            <div
              key={admin.user_id}
              className="flex items-center justify-between gap-4 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{admin.name}</span>
                  {admin.is_principal && (
                    <Badge variant="secondary" className="gap-1">
                      <UserCheck className="h-3 w-3" />
                      Signatory
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {admin.role} &middot; {admin.email}
                </p>
              </div>

              {!admin.is_principal && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetSignatory(admin.user_id)}
                  disabled={updatingUserId !== null}
                >
                  {updatingUserId === admin.user_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Set as Signatory'
                  )}
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
