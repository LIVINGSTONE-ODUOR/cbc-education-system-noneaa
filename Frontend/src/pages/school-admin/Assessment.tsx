import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Plus, Download, BookOpen, TrendingUp, Users, FileText, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import { toast } from 'sonner';

const mockAssessments = [
  { id: '1', student: 'John Kamau', admNo: 'CBC/2024/001', grade: 'Grade4', subject: 'Mathematics', strand: 'Numbers', subStrand: 'Place Value', level: 'Exceeding', date: '2025-01-10', teacher: 'Mr. Ochieng', remarks: 'Excellent performance' },
  { id: '2', student: 'Jane Wanjiku', admNo: 'CBC/2024/002', grade: 'Grade5', subject: 'English', strand: 'Reading', subStrand: 'Comprehension', level: 'Meeting', date: '2025-01-10', teacher: 'Mrs. Njeri', remarks: 'Good progress' },
  { id: '3', student: 'David Ochieng', admNo: 'CBC/2024/003', grade: 'Grade3', subject: 'Kiswahili', strand: 'Kusoma', subStrand: 'Ufahamu', level: 'Approaching', date: '2025-01-09', teacher: 'Mr. Mwangi', remarks: 'Needs more practice' },
  { id: '4', student: 'Grace Njeri', admNo: 'CBC/2024/004', grade: 'Grade6', subject: 'Science', strand: 'Living Things', subStrand: 'Plants', level: 'Meeting', date: '2025-01-09', teacher: 'Mrs. Wambui', remarks: 'Consistent' },
  { id: '5', student: 'Brian Mwangi', admNo: 'CBC/2024/005', grade: 'Grade7', subject: 'Social Studies', strand: 'Citizenship', subStrand: 'National Unity', level: 'Below', date: '2025-01-08', teacher: 'Mr. Kipchoge', remarks: 'Extra support needed' },
  { id: '6', student: 'Faith Akinyi', admNo: 'CBC/2024/006', grade: 'Grade4', subject: 'Mathematics', strand: 'Geometry', subStrand: 'Shapes', level: 'Exceeding', date: '2025-01-08', teacher: 'Mr. Ochieng', remarks: 'Outstanding' },
  { id: '7', student: 'Kevin Kipchoge', admNo: 'CBC/2024/007', grade: 'Grade8', subject: 'Mathematics', strand: 'Algebra', subStrand: 'Equations', level: 'Meeting', date: '2025-01-07', teacher: 'Mrs. Akinyi', remarks: 'Steady improvement' },
  { id: '8', student: 'Lucy Wambui', admNo: 'CBC/2024/008', grade: 'PP1', subject: 'Language Activities', strand: 'Listening', subStrand: 'Oral Skills', level: 'Meeting', date: '2025-01-07', teacher: 'Mrs. Kamau', remarks: 'Very participative' },
];

const levelColors: Record<string, string> = {
  Exceeding: 'bg-green-100 text-green-700',
  Meeting: 'bg-blue-100 text-blue-700',
  Approaching: 'bg-amber-100 text-amber-700',
  Below: 'bg-red-100 text-red-700',
};

const competencyData = [
  { name: 'Exceeding', count: 25, color: '#22c55e' },
  { name: 'Meeting', count: 45, color: '#3b82f6' },
  { name: 'Approaching', count: 22, color: '#f59e0b' },
  { name: 'Below', count: 8, color: '#ef4444' },
];

const subjectPerformance = [
  { subject: 'Maths', exceeding: 30, meeting: 40, approaching: 20, below: 10 },
  { subject: 'English', exceeding: 25, meeting: 45, approaching: 22, below: 8 },
  { subject: 'Kiswahili', exceeding: 20, meeting: 50, approaching: 20, below: 10 },
  { subject: 'Science', exceeding: 35, meeting: 35, approaching: 20, below: 10 },
  { subject: 'Social St.', exceeding: 15, meeting: 45, approaching: 25, below: 15 },
];

const radarData = [
  { subject: 'Mathematics', score: 78 },
  { subject: 'English', score: 82 },
  { subject: 'Kiswahili', score: 75 },
  { subject: 'Science', score: 85 },
  { subject: 'Social Studies', score: 70 },
  { subject: 'CRE', score: 88 },
];

const learningAreas = ['Mathematics', 'English', 'Kiswahili', 'Science & Technology', 'Social Studies', 'CRE/IRE', 'Creative Arts', 'Physical Education', 'Language Activities'];

const Assessments = () => {
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('Term1');
  const [assessDialogOpen, setAssessDialogOpen] = useState(false);
  const [assessForm, setAssessForm] = useState({
    studentAdmNo: '', subject: '', strand: '', subStrand: '', level: 'Meeting', remarks: '',
  });

  const handleAddAssessment = () => {
    toast.success('Assessment recorded successfully');
    setAssessDialogOpen(false);
    setAssessForm({ studentAdmNo: '', subject: '', strand: '', subStrand: '', level: 'Meeting', remarks: '' });
  };

  const filteredAssessments = mockAssessments.filter(a => {
    const matchesGrade = selectedGrade === 'all' || a.grade === selectedGrade;
    const matchesSubject = selectedSubject === 'all' || a.subject === selectedSubject;
    return matchesGrade && matchesSubject;
  });

  const total = competencyData.reduce((s, c) => s + c.count, 0);

  return (
    <div className="min-h-screen">
    
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {competencyData.map(c => (
            <Card key={c.name}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${c.color}20` }}>
                    <BookOpen className="h-5 w-5" style={{ color: c.color }} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{c.name}</p>
                    <p className="text-2xl font-bold" style={{ color: c.color }}>{Math.round((c.count / total) * 100)}%</p>
                    <Progress value={(c.count / total) * 100} className="mt-1 h-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="records" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="records">Assessment Records</TabsTrigger>
              <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
              <TabsTrigger value="reports">Report Cards</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
              <Dialog open={assessDialogOpen} onOpenChange={setAssessDialogOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Assessment</Button></DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Record Assessment</DialogTitle><DialogDescription>Enter CBC competency assessment</DialogDescription></DialogHeader>
                  <div className="grid gap-4">
                    <div><Label>Student Admission No.</Label><Input placeholder="CBC/2024/001" value={assessForm.studentAdmNo} onChange={e => setAssessForm({ ...assessForm, studentAdmNo: e.target.value })} /></div>
                    <div><Label>Learning Area</Label>
                      <Select value={assessForm.subject} onValueChange={v => setAssessForm({ ...assessForm, subject: v })}>
                        <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                        <SelectContent>{learningAreas.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div><Label>Strand</Label><Input placeholder="e.g. Numbers" value={assessForm.strand} onChange={e => setAssessForm({ ...assessForm, strand: e.target.value })} /></div>
                      <div><Label>Sub-Strand</Label><Input placeholder="e.g. Place Value" value={assessForm.subStrand} onChange={e => setAssessForm({ ...assessForm, subStrand: e.target.value })} /></div>
                    </div>
                    <div><Label>Competency Level</Label>
                      <Select value={assessForm.level} onValueChange={v => setAssessForm({ ...assessForm, level: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Exceeding">Exceeding Expectations</SelectItem>
                          <SelectItem value="Meeting">Meeting Expectations</SelectItem>
                          <SelectItem value="Approaching">Approaching Expectations</SelectItem>
                          <SelectItem value="Below">Below Expectations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Remarks</Label><Textarea placeholder="Teacher's remarks..." value={assessForm.remarks} onChange={e => setAssessForm({ ...assessForm, remarks: e.target.value })} /></div>
                    <DialogFooter><Button onClick={handleAddAssessment} disabled={!assessForm.studentAdmNo || !assessForm.subject}>Save Assessment</Button></DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Records Tab */}
          <TabsContent value="records">
            <div className="flex gap-4 mb-4 flex-wrap">
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Grade" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Grades</SelectItem>
                  {['PP1', 'PP2', 'Grade3', 'Grade4', 'Grade5', 'Grade6', 'Grade7', 'Grade8'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Subjects</SelectItem>{learningAreas.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Term1">Term 1</SelectItem><SelectItem value="Term2">Term 2</SelectItem><SelectItem value="Term3">Term 3</SelectItem></SelectContent>
              </Select>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Student</TableHead><TableHead>Grade</TableHead><TableHead>Learning Area</TableHead><TableHead>Strand</TableHead><TableHead>Sub-Strand</TableHead><TableHead>Level</TableHead><TableHead>Teacher</TableHead><TableHead>Date</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredAssessments.map(a => (
                      <TableRow key={a.id}>
                        <TableCell><span className="font-medium">{a.student}</span><br /><span className="text-xs text-muted-foreground">{a.admNo}</span></TableCell>
                        <TableCell>{a.grade}</TableCell>
                        <TableCell>{a.subject}</TableCell>
                        <TableCell>{a.strand}</TableCell>
                        <TableCell>{a.subStrand}</TableCell>
                        <TableCell><Badge className={levelColors[a.level]}>{a.level}</Badge></TableCell>
                        <TableCell>{a.teacher}</TableCell>
                        <TableCell>{a.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-lg">Competency Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={competencyData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="count" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {competencyData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Performance by Subject</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={subjectPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="exceeding" stackId="a" fill="#22c55e" name="Exceeding" />
                      <Bar dataKey="meeting" stackId="a" fill="#3b82f6" name="Meeting" />
                      <Bar dataKey="approaching" stackId="a" fill="#f59e0b" name="Approaching" />
                      <Bar dataKey="below" stackId="a" fill="#ef4444" name="Below" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-lg">School Average Performance Radar</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar name="Average Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Report Cards Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Generate Report Cards</CardTitle>
                <CardDescription>Generate CBC-compliant learner progress reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div><Label>Grade</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                      <SelectContent>{['PP1', 'PP2', 'Grade1', 'Grade2', 'Grade3', 'Grade4', 'Grade5', 'Grade6', 'Grade7', 'Grade8', 'Grade9'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Term</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                      <SelectContent><SelectItem value="Term1">Term 1</SelectItem><SelectItem value="Term2">Term 2</SelectItem><SelectItem value="Term3">Term 3</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Year</Label><Input type="number" defaultValue={2025} /></div>
                </div>
                <div className="flex gap-2">
                  <Button><FileText className="h-4 w-4 mr-2" />Generate All Reports</Button>
                  <Button variant="outline"><Download className="h-4 w-4 mr-2" />Download as PDF</Button>
                </div>
                <div className="border rounded-lg p-6 bg-muted/30 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Select a grade and term above to generate report cards</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Assessments;
