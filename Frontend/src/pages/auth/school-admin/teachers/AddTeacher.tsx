import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export default function AddTeacherPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    employeeNumber: '',
    subjects: '',
    qualifications: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.phoneNumber ||
        !formData.subjects
      ) {
        throw new Error('Please fill in all required fields.');
      }

      // Use backend invite endpoint. The previous approach inserted directly into Supabase
      // `teachers` from the frontend, which does not match your backend schema/constraints.
      const { inviteTeacher } = await import('@/lib/api/teacherApi');

      const subjects_taught = formData.subjects
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const qualifications = formData.qualifications
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await inviteTeacher({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        tsc_number: formData.employeeNumber || undefined,
        subjects_taught,
        qualifications: qualifications.length ? qualifications : undefined,
        staff_type: 'teaching',
        job_status: 'active',
      });

      toast({
        title: 'Teacher Invited Successfully',
        description: `${formData.firstName} ${formData.lastName} has been invited.`,
      });

      navigate('/school-admin/teachers');
    } catch (error: unknown) {
      console.error('Error adding teacher:', error);
      toast({
        title: 'Add Teacher Failed',
        description: getErrorMessage(error, 'Failed to add teacher. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/school-admin/teachers">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New Teacher</h1>
          <p className="text-muted-foreground mt-1">Create a new teacher account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic details about the teacher</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+254 7XX XXX XXX"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
              <CardDescription>Work-related information</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeNumber">Employee Number</Label>
                <Input
                  id="employeeNumber"
                  name="employeeNumber"
                  placeholder="TCH001"
                  value={formData.employeeNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjects">Subjects (comma-separated) *</Label>
                <Input
                  id="subjects"
                  name="subjects"
                  placeholder="Mathematics, Science, English"
                  value={formData.subjects}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualifications">Qualifications</Label>
                <Input
                  id="qualifications"
                  name="qualifications"
                  placeholder="B.Ed, PGDE, etc."
                  value={formData.qualifications}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Teacher'
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/school-admin/teachers">Cancel</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

