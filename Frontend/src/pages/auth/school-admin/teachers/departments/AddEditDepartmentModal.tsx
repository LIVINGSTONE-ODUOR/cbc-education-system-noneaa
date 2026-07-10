import { useEffect, useState, useCallback, useMemo } from 'react';
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
import { SearchableCombobox, type ComboboxOption } from '@/components/ui/searchable-combobox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronsUpDown, X } from 'lucide-react';
import { getTeachers } from '@/lib/api/teacherApi';
import { getLearningAreas, type LearningArea } from '@/lib/api/curriculumApi';
import type { StaffMember } from '@/pages/teacher/StaffManagement/types';
import type { Department, DepartmentFormData } from './types';

const schema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().optional().default(''),
  hodId: z.string().min(1, 'Please select a Head of Department'),
  code: z.string().optional().default(''),
  status: z.enum(['active', 'inactive']),
  learningAreaIds: z.array(z.string()).optional().default([]),
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
  const [teachers, setTeachers] = useState<StaffMember[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  const [learningAreas, setLearningAreas] = useState<LearningArea[]>([]);
  const [loadingLearningAreas, setLoadingLearningAreas] = useState(false);
  const [learningAreasError, setLearningAreasError] = useState<string | null>(null);
  const [learningAreaPopoverOpen, setLearningAreaPopoverOpen] = useState(false);

  const loadTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    setTeachersError(null);
    try {
      const res = await getTeachers({ limit: 200 });
      setTeachers(res.teachers || []);
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      setTeachersError(error?.message || 'Failed to load teachers.');
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  const loadLearningAreas = useCallback(async () => {
    setLoadingLearningAreas(true);
    setLearningAreasError(null);
    try {
      const res = await getLearningAreas({ is_active: true });
      setLearningAreas(res.data.learning_areas || []);
    } catch (error: any) {
      console.error('Error fetching learning areas:', error);
      setLearningAreasError(error?.message || 'Failed to load learning areas.');
    } finally {
      setLoadingLearningAreas(false);
    }
  }, []);

  // Fetch the real teacher list and the real learning areas (CBC curriculum)
  // from the backend whenever the modal opens — never hardcoded/mock lists.
  useEffect(() => {
    if (open) {
      void loadTeachers();
      void loadLearningAreas();
    }
  }, [open, loadTeachers, loadLearningAreas]);

  // Only active teachers make sense as a Head of Department.
  const activeTeachers = useMemo(
    () =>
      teachers
        .filter(t => (t.jobStatus || 'active').toLowerCase() === 'active')
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [teachers]
  );

  const hodOptions: ComboboxOption[] = useMemo(
    () =>
      activeTeachers.map(t => ({
        value: t.id,
        label: `${t.firstName} ${t.lastName}`.trim(),
        description: t.designation || undefined,
      })),
    [activeTeachers]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      hodId: '',
      code: '',
      status: 'active',
      learningAreaIds: [],
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
          learningAreaIds: department.learningAreaIds || [],
        });
      } else {
        form.reset({ name: '', description: '', hodId: '', code: '', status: 'active', learningAreaIds: [] });
      }
    }
  }, [open, department, form]);

  const onSubmit = async (values: FormValues) => {
    const selectedTeacher = activeTeachers.find(t => t.id === values.hodId);
    await onSave({
      name: values.name,
      description: values.description ?? '',
      hodId: values.hodId,
      hodName: selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`.trim() : '',
      code: values.code ?? '',
      status: values.status,
      learningAreaIds: values.learningAreaIds ?? [],
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

            {/* Learning Areas — fetched live from the database (CBC curriculum), no mock list */}
            <FormField
              control={form.control}
              name="learningAreaIds"
              render={({ field }) => {
                const selected = learningAreas.filter(la => field.value?.includes(la.id));
                const toggle = (laId: string) => {
                  const current = field.value ?? [];
                  field.onChange(
                    current.includes(laId)
                      ? current.filter(v => v !== laId)
                      : [...current, laId]
                  );
                };
                return (
                  <FormItem>
                    <FormLabel>Learning Areas</FormLabel>
                    <Popover open={learningAreaPopoverOpen} onOpenChange={setLearningAreaPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-normal"
                          >
                            {selected.length > 0
                              ? `${selected.length} learning area${selected.length > 1 ? 's' : ''} selected`
                              : 'Select learning areas'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search learning areas..." />
                          <CommandList>
                            {loadingLearningAreas ? (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Loading learning areas...
                              </div>
                            ) : learningAreasError ? (
                              <div className="py-6 text-center text-sm text-destructive">
                                {learningAreasError}
                              </div>
                            ) : (
                              <>
                                <CommandEmpty>No learning areas found.</CommandEmpty>
                                <CommandGroup>
                                  <ScrollArea className="h-60">
                                    {learningAreas.map(la => (
                                      <CommandItem
                                        key={la.id}
                                        value={`${la.name} ${la.code}`}
                                        onSelect={() => toggle(la.id)}
                                        className="cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={field.value?.includes(la.id)}
                                          className="mr-2"
                                        />
                                        <span className="flex-1">{la.name}</span>
                                        <span className="text-xs text-muted-foreground">{la.code}</span>
                                      </CommandItem>
                                    ))}
                                  </ScrollArea>
                                </CommandGroup>
                              </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {selected.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {selected.map(la => (
                          <Badge key={la.id} variant="secondary" className="gap-1 pr-1">
                            {la.name}
                            <button
                              type="button"
                              onClick={() => toggle(la.id)}
                              className="ml-1 rounded-full hover:bg-muted-foreground/20"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Head of Department */}
            <FormField
              control={form.control}
              name="hodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Head of Department <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <SearchableCombobox
                      options={hodOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Select HOD"
                      searchPlaceholder="Search teachers..."
                      emptyText={teachersError ? teachersError : 'No teachers found.'}
                      loading={loadingTeachers}
                      loadingText="Loading teachers..."
                    />
                  </FormControl>
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
