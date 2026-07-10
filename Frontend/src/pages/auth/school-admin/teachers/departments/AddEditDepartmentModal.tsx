import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Department, DepartmentFormData } from './types';

interface TeacherOption {
  id: string;
  name: string;
}

const schema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().optional().default(''),
  hodId: z.string().min(1, 'Please select a Head of Department'),
  code: z.string().optional().default(''),
  status: z.enum(['active', 'inactive']),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  onSave: (data: DepartmentFormData) => Promise<void>;
}

export default function AddEditDepartmentModal({ open, onOpenChange, department, onSave }: Props) {
  const isEdit = !!department;
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    if (!user?.schoolId) return;
    try {
      setLoadingTeachers(true);
      setTeachersError(null);

      const { data, error } = await supabase
        .from('teachers')
        .select('id, first_name, last_name')
        .eq('school_id', user.schoolId)
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) throw error;

      setTeachers(
        (data || []).map(t => ({
          id: t.id,
          name: `${t.first_name} ${t.last_name}`.trim(),
        }))
      );
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setTeachersError('Failed to load teachers.');
    } finally {
      setLoadingTeachers(false);
    }
  }, [user?.schoolId]);

  // Fetch the real teacher list from the database whenever the modal opens,
  // so the HOD dropdown always reflects the school's current teachers.
  useEffect(() => {
    if (open) {
      void fetchTeachers();
    }
  }, [open, fetchTeachers]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      hodId: '',
      code: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (open) {
      if (department) {
        form.reset({
          name: department.name,
          description: department.description,
          hodId: department.hodId,
          code: department.code,
          status: department.status,
        });
      } else {
        form.reset({ name: '', description: '', hodId: '', code: '', status: 'active' });
      }
    }
  }, [open, department, form]);

  const onSubmit = async (values: FormValues) => {
    const selectedTeacher = teachers.find(t => t.id === values.hodId);
    await onSave({
      name: values.name,
      description: values.description ?? '',
      hodId: values.hodId,
      hodName: selectedTeacher?.name ?? '',
      code: values.code ?? '',
      status: values.status,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Department' : 'Add Department'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Department Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mathematics & Sciences" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Department Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. MATH-SCI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the department..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Head of Department */}
            <FormField
              control={form.control}
              name="hodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Head of Department <span className="text-destructive">*</span></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingTeachers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {loadingTeachers ? (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading teachers...
                          </span>
                        ) : (
                          <SelectValue placeholder="Select HOD" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teachers.length === 0 && !loadingTeachers ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No teachers found
                        </div>
                      ) : (
                        teachers.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {teachersError && (
                    <p className="text-sm text-destructive">{teachersError}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <Label>Status</Label>
                    <Switch
                      checked={field.value === 'active'}
                      onCheckedChange={checked => field.onChange(checked ? 'active' : 'inactive')}
                    />
                    <span className="text-sm text-muted-foreground">
                      {field.value === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
