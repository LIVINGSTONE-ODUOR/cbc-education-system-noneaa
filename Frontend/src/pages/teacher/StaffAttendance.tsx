import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Calendar, CheckCircle, XCircle, Users, Clock, Save, TrendingUp, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { toast } from 'sonner';

const grades = ['PP1', 'PP2', 'Grade1', 'Grade2', 'Grade3', 'Grade4', 'Grade5', 'Grade6', 'Grade7', 'Grade8', 'Grade9'];

const initialStudentAttendance = [
  { id: '1', name: 'John Kamau', admNo: 'CBC/2024/001', present: true, late: false },
  { id: '2', name: 'Jane Wanjiku', admNo: 'CBC/2024/002', present: true, late: false },
  { id: '3', name: 'David Ochieng', admNo: 'CBC/2024/003', present: false, late: false },
  { id: '4', name: 'Grace Njeri', admNo: 'CBC/2024/004', present: true, late: true },
  { id: '5', name: 'Brian Mwangi', admNo: 'CBC/2024/005', present: true, late: false },
  { id: '6', name: 'Faith Akinyi', admNo: 'CBC/2024/006', present: false, late: false },
  { id: '7', name: 'Kevin Kipchoge', admNo: 'CBC/2024/007', present: true, late: false },
  { id: '8', name: 'Lucy Wambui', admNo: 'CBC/2024/008', present: true, late: false },
  { id: '9', name: 'Samuel Otieno', admNo: 'CBC/2024/009', present: true, late: true },
  { id: '10', name: 'Mercy Chebet', admNo: 'CBC/2024/010', present: true, late: false },
];

const mockStaffAttendance = [
  { id: '1', name: 'Peter Ochieng', staffNo: 'STF/001', role: 'Teacher', present: true, checkIn: '07:45', checkOut: '16:30' },
  { id: '2', name: 'Mary Njeri', staffNo: 'STF/002', role: 'Teacher', present: true, checkIn: '07:30', checkOut: '16:15' },
  { id: '3', name: 'James Mwangi', staffNo: 'STF/003', role: 'Admin', present: true, checkIn: '07:15', checkOut: '-' },
  { id: '4', name: 'Sarah Wambui', staffNo: 'STF/004', role: 'Accountant', present: false, checkIn: '-', checkOut: '-' },
  { id: '5', name: 'Tom Akinyi', staffNo: 'STF/005', role: 'Teacher', present: true, checkIn: '07:50', checkOut: '-' },
];

const weeklyTrend = [
  { day: 'Mon', rate: 94 }, { day: 'Tue', rate: 92 }, { day: 'Wed', rate: 96 },
  { day: 'Thu', rate: 88 }, { day: 'Fri', rate: 91 },
];

const gradeAttendance = [
  { grade: 'PP1', rate: 92 }, { grade: 'PP2', rate: 88 }, { grade: 'G1', rate: 95 },
  { grade: 'G2', rate: 90 }, { grade: 'G3', rate: 93 }, { grade: 'G4', rate: 80 },
  { grade: 'G5', rate: 87 }, { grade: 'G6', rate: 94 }, { grade: 'G7', rate: 91 },
  { grade: 'G8', rate: 89 }, { grade: 'G9', rate: 96 },
];

const monthlyData = [
  { week: 'W1', students: 92, staff: 96 }, { week: 'W2', students: 95, staff: 94 },
  { week: 'W3', students: 88, staff: 98 }, { week: 'W4', students: 94, staff: 95 },
];

const AdminAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGrade, setSelectedGrade] = useState<string>('Grade4');
  const [attendance, setAttendance] = useState(initialStudentAttendance);

  const presentCount = attendance.filter(s => s.present).length;
  const absentCount = attendance.filter(s => !s.present).length;
  const lateCount = attendance.filter(s => s.late).length;
  const attendanceRate = Math.round((presentCount / attendance.length) * 100);

  const toggleAttendance = (id: string) => {
    setAttendance(prev => prev.map(s => s.id === id ? { ...s, present: !s.present } : s));
  };

  const toggleLate = (id: string) => {
    setAttendance(prev => prev.map(s => s.id === id ? { ...s, late: !s.late } : s));
  };

  const markAllPresent = () => {
    setAttendance(prev => prev.map(s => ({ ...s, present: true })));
    toast.success('All students marked present');
  };

  const saveAttendance = () => {
    toast.success(`Attendance saved for ${selectedGrade} - ${selectedDate}`);
  };

  return (
    <div className="min-h-screen">
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="p-4"><div className="flex items-center gap-4"><div className="p-2 rounded-lg bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{attendance.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-4"><div className="p-2 rounded-lg bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Present</p><p className="text-2xl font-bold text-green-600">{presentCount}</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-4"><div className="p-2 rounded-lg bg-red-100"><XCircle className="h-5 w-5 text-red-600" /></div><div><p className="text-sm text-muted-foreground">Absent</p><p className="text-2xl font-bold text-red-600">{absentCount}</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-4"><div className="p-2 rounded-lg bg-amber-100"><Clock className="h-5 w-5 text-amber-600" /></div><div><p className="text-sm text-muted-foreground">Late</p><p className="text-2xl font-bold text-amber-600">{lateCount}</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-4"><div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Rate</p><p className="text-2xl font-bold">{attendanceRate}%</p><Progress value={attendanceRate} className="mt-1 h-1.5" /></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="mark" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
            <TabsTrigger value="staff">Staff Attendance</TabsTrigger>
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
          </TabsList>

          {/* Mark Attendance Tab */}
          <TabsContent value="mark">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Student Attendance</CardTitle>
                    <CardDescription>Mark daily attendance for {selectedGrade}</CardDescription>
                  </div>
                  <div className="flex gap-4 items-center flex-wrap">
                    <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>{grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={markAllPresent}>Mark All Present</Button>
                    <Button onClick={saveAttendance}><Save className="h-4 w-4 mr-2" />Save</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="w-12">Present</TableHead><TableHead>Adm No.</TableHead><TableHead>Student Name</TableHead><TableHead className="w-12">Late</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {attendance.map(s => (
                      <TableRow key={s.id} className={!s.present ? 'bg-red-50/50' : s.late ? 'bg-amber-50/50' : ''}>
                        <TableCell><Checkbox checked={s.present} onCheckedChange={() => toggleAttendance(s.id)} /></TableCell>
                        <TableCell className="font-medium">{s.admNo}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell><Checkbox checked={s.late} disabled={!s.present} onCheckedChange={() => toggleLate(s.id)} /></TableCell>
                        <TableCell>
                          {!s.present ? <Badge variant="destructive">Absent</Badge> :
                           s.late ? <Badge className="bg-amber-100 text-amber-700">Late</Badge> :
                           <Badge variant="default">Present</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Attendance Tab */}
          <TabsContent value="staff">
            <Card>
              <CardHeader><CardTitle>Staff Attendance</CardTitle><CardDescription>{selectedDate}</CardDescription></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Staff No.</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {mockStaffAttendance.map(s => (
                      <TableRow key={s.id} className={!s.present ? 'bg-red-50/50' : ''}>
                        <TableCell className="font-medium">{s.staffNo}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.role}</TableCell>
                        <TableCell>{s.checkIn}</TableCell>
                        <TableCell>{s.checkOut}</TableCell>
                        <TableCell><Badge variant={s.present ? 'default' : 'destructive'}>{s.present ? 'Present' : 'Absent'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-lg">Weekly Attendance Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[80, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Attendance by Grade</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={gradeAttendance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" />
                      <YAxis domain={[70, 100]} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-lg">Monthly Overview - Students vs Staff</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[80, 100]} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="students" fill="#3b82f6" name="Students" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="staff" fill="#22c55e" name="Staff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminAttendance;
