import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, UserRound, CheckCircle2, XCircle, Clock3, FileWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getClassAttendanceRoster,
  saveClassAttendance,
  type AttendanceApiLearner,
  type AttendanceStatus,
} from '@/lib/api/attendanceApi';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; icon: React.ElementType; activeClass: string }[] = [
  { value: 'present', label: 'Present', icon: CheckCircle2, activeClass: 'bg-green-600 hover:bg-green-700 text-white border-green-600' },
  { value: 'absent', label: 'Absent', icon: XCircle, activeClass: 'bg-red-600 hover:bg-red-700 text-white border-red-600' },
  { value: 'late', label: 'Late', icon: Clock3, activeClass: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' },
  { value: 'excused', label: 'Excused', icon: FileWarning, activeClass: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' },
];

const todayISO = () => new Date().toISOString().split('T')[0];

interface MarkAttendanceProps {
  classId: string;
  className: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Lets a teacher mark daily attendance for one of their own assigned
// classes. The backend independently verifies the class assignment
// (GET/POST /api/v1/attendance/class/:classId), so even if this dialog
// were somehow opened for a class the teacher isn't assigned to, the
// request would be rejected with a 403.
const MarkAttendance: React.FC<MarkAttendanceProps> = ({ classId, className, open, onOpenChange }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [learners, setLearners] = useState<AttendanceApiLearner[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const date = todayISO();

  useEffect(() => {
    if (!open || !classId) return;
    setLoading(true);
    (async () => {
      try {
        const res = await getClassAttendanceRoster(classId, date);
        setLearners(res.data.learners || []);
        setAlreadyMarked(res.data.already_marked);
        const initial: Record<string, AttendanceStatus> = {};
        (res.data.learners || []).forEach((l) => {
          initial[l.learner_id] = l.status || 'present';
        });
        setStatuses(initial);
      } catch (error) {
        toast({
          title: 'Could not load class roster',
          description: getErrorMessage(error, 'Please try again.'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [open, classId, date, toast]);

  const setStatus = (learnerId: string, status: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [learnerId]: status }));
  };

  const markAllPresent = () => {
    const all: Record<string, AttendanceStatus> = {};
    learners.forEach((l) => { all[l.learner_id] = 'present'; });
    setStatuses(all);
  };

  const handleSave = async () => {
    if (learners.length === 0) return;
    setSaving(true);
    try {
      const records = learners.map((l) => ({
        learner_id: l.learner_id,
        status: statuses[l.learner_id] || 'present',
      }));
      const res = await saveClassAttendance(classId, date, records);
      toast({
        title: 'Attendance saved',
        description: `Recorded attendance for ${res.data.saved_count} student(s).`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Could not save attendance',
        description: getErrorMessage(error, 'Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Attendance — {className}</DialogTitle>
          <DialogDescription>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {alreadyMarked && ' · Attendance already recorded today — saving will update it.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : learners.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No students are enrolled in this class yet.
          </p>
        ) : (
          <>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={markAllPresent}>
                Mark all present
              </Button>
            </div>
            <div className="space-y-2">
              {learners.map((learner) => (
                <div key={learner.learner_id} className="flex items-center justify-between border rounded-md p-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {learner.photo_url ? (
                        <img src={learner.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserRound className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{learner.first_name} {learner.last_name}</p>
                      <p className="text-xs text-muted-foreground">ID: {learner.admission_number}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {STATUS_OPTIONS.map(({ value, label, icon: Icon, activeClass }) => {
                      const active = statuses[learner.learner_id] === value;
                      return (
                        <Button
                          key={value}
                          type="button"
                          size="sm"
                          variant="outline"
                          className={active ? activeClass : ''}
                          onClick={() => setStatus(learner.learner_id, value)}
                          title={label}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving || learners.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Attendance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarkAttendance;
