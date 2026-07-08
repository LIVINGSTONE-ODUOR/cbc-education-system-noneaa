import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, Calendar, ChevronRight, Users, ArrowRight, Printer, FileText } from 'lucide-react';
import StudentProfileHeader from '@/components/student-profile/StudentProfileHeader';
import LearnerProfileSkeleton from '@/components/student-profile/LearnerProfileSkeleton';
import { getLearnerById } from '@/lib/api/learnersApi';

type LearnerBackendLike = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  admission_number?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  current_class?: { grade_level: string; stream_name?: string | null; id?: string } | null;
  parent?: {
    first_name?: string | null;
    last_name?: string | null;
    phone_number?: string | null;
  } | null;
  photo_url?: string | null;
  birth_certificate_number?: string | null;
};

const StudentProfile = () => {
  const location = useLocation();
  const learnerId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('id');
  }, [location.search]);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);

  React.useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        setIsLoading(true);
        if (!learnerId) {
          if (isMounted) {
            setStudent(null);
          }
          return;
        }
        const data = await getLearnerById(learnerId);
        if (!isMounted) return;
        setStudent(data);
      } catch {
        if (!isMounted) return;
        setStudent(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void run();
    return () => {
      isMounted = false;
    };
  }, [learnerId]);

  // Fallback UI still needs data shape for the profile layout.
  // If the backend returns null/undefined, we keep a minimal safe object.
  const safeStudent =
    student ?? {
      id: learnerId ?? '—',
      name: '—',
      email: '—',
      phone: '—',
      grade: '—',
      school: '—',
      class: '—',
      classTeacher: '—',
      age: '—',
      joinDate: '—',
      dateOfBirth: '—',
      image: 'https://via.placeholder.com/200',
      status: 'active' as const,
      guardianName: '—',
      guardianPhone: '—',
    };

  if (isLoading) {
    return <LearnerProfileSkeleton />;
  }

  // Student details - Enhanced with more information
  const subjects = [
    { name: "Mathematics", completed: 78, upcoming: 3, score: 85 },
    { name: "English", completed: 82, upcoming: 1, score: 92 },
    { name: "Kiswahili", completed: 75, upcoming: 4, score: 88 },
    { name: "Science", completed: 80, upcoming: 2, score: 76 },
    { name: "Social Studies", completed: 85, upcoming: 0, score: 91 },
    { name: "Creative Arts", completed: 90, upcoming: 2, score: 94 },
  ];

  // Homework and assignments
  const assignments = [
    { id: 1, title: "Mathematics Problem Set", dueDate: "May 5, 2025", status: "completed" },
    { id: 2, title: "English Essay Writing", dueDate: "May 7, 2025", status: "pending" },
    { id: 3, title: "Science Project", dueDate: "May 10, 2025", status: "pending" },
    { id: 4, title: "Social Studies Research", dueDate: "May 12, 2025", status: "pending" },
  ];

  // Attendance data
  const attendance = {
    present: 87,
    absent: 4,
    late: 9,
    total: 100,
  };

  // Recent activities
  const recentActivities = [
    { id: 1, activity: "Submitted Mathematics assignment", date: "May 1, 2025", time: "10:30 AM" },
    { id: 2, activity: "Participated in Science lab experiment", date: "April 29, 2025", time: "2:15 PM" },
    { id: 3, activity: "Completed English quiz", date: "April 28, 2025", time: "11:45 AM" },
    { id: 4, activity: "Attended virtual field trip", date: "April 25, 2025", time: "9:00 AM" },
  ];

  // Use the existing helper functions below.

  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200",
      pending: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200",
    };
    return styles[status] || styles.pending;
  };

  const getGradeStyles = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAttendanceCardStyles = (type: string) => {
    const styles: Record<string, string> = {
      present: "bg-emerald-50 dark:bg-emerald-950/30 border dark:border-emerald-900",
      late: "bg-amber-50 dark:bg-amber-950/30 border dark:border-emerald-900",
      absent: "bg-red-50 dark:bg-red-950/30 border dark:border-red-900",
    };
    return styles[type] || "";
  };

  const getAttendanceTextStyles = (type: string) => {
    const styles: Record<string, string> = {
      present: "text-emerald-600 dark:text-emerald-400",
      late: "text-amber-600 dark:text-amber-400",
      absent: "text-red-600 dark:text-red-400",
    };
    return styles[type] || "";
  };

  const getAttendanceLabelStyles = (type: string) => {
    const styles: Record<string, string> = {
      present: "text-emerald-800 dark:text-emerald-300",
      late: "text-amber-800 dark:text-amber-300",
      absent: "text-red-800 dark:text-red-300",
    };
    return styles[type] || "";
  };

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Student details - Enhanced with more information
  const student = {
    id: "ST12345",
    name: "David Ochieng",
    email: "david.ochieng@example.com",
    phone: "+254 701 234 567",
    grade: "Grade 6",
    school: "Nairobi Academy",
    class: "6B",
    classTeacher: "Mrs. Njoroge",
    age: 12,
    joinDate: "January 2020",
    dateOfBirth: "March 15, 2013",
    image: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
    status: 'active' as const,
    guardianName: "John Ochieng",
    guardianPhone: "+254 722 334 455"
  };
  
  // Academic data
  const subjects = [
    { name: "Mathematics", completed: 78, upcoming: 3, score: 85 },
    { name: "English", completed: 82, upcoming: 1, score: 92 },
    { name: "Kiswahili", completed: 75, upcoming: 4, score: 88 },
    { name: "Science", completed: 80, upcoming: 2, score: 76 },
    { name: "Social Studies", completed: 85, upcoming: 0, score: 91 },
    { name: "Creative Arts", completed: 90, upcoming: 2, score: 94 }
  ];
  
  // Homework and assignments
  const assignments = [
    { id: 1, title: "Mathematics Problem Set", dueDate: "May 5, 2025", status: "completed" },
    { id: 2, title: "English Essay Writing", dueDate: "May 7, 2025", status: "pending" },
    { id: 3, title: "Science Project", dueDate: "May 10, 2025", status: "pending" },
    { id: 4, title: "Social Studies Research", dueDate: "May 12, 2025", status: "pending" },
  ];
  
  // Attendance data
  const attendance = {
    present: 87,
    absent: 4,
    late: 9,
    total: 100
  };
  
  // Recent activities
  const recentActivities = [
    { id: 1, activity: "Submitted Mathematics assignment", date: "May 1, 2025", time: "10:30 AM" },
    { id: 2, activity: "Participated in Science lab experiment", date: "April 29, 2025", time: "2:15 PM" },
    { id: 3, activity: "Completed English quiz", date: "April 28, 2025", time: "11:45 AM" },
    { id: 4, activity: "Attended virtual field trip", date: "April 25, 2025", time: "9:00 AM" }
  ];

  // Helper functions for styling
  const getStatusStyles = (status: string) => {
    const styles = {
      completed: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200",
      pending: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200"
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getGradeStyles = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 80) return "text-blue-600 dark:text-blue-400";
    if (score >= 70) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAttendanceCardStyles = (type: string) => {
    const styles = {
      present: "bg-emerald-50 dark:bg-emerald-950/30 border dark:border-emerald-900",
      late: "bg-amber-50 dark:bg-amber-950/30 border dark:border-amber-900",
      absent: "bg-red-50 dark:bg-red-950/30 border dark:border-red-900"
    };
    return styles[type as keyof typeof styles] || "";
  };

  const getAttendanceTextStyles = (type: string) => {
    const styles = {
      present: "text-emerald-600 dark:text-emerald-400",
      late: "text-amber-600 dark:text-amber-400",
      absent: "text-red-600 dark:text-red-400"
    };
    return styles[type as keyof typeof styles] || "";
  };

  const getAttendanceLabelStyles = (type: string) => {
    const styles = {
      present: "text-emerald-800 dark:text-emerald-300",
      late: "text-amber-800 dark:text-amber-300",
      absent: "text-red-800 dark:text-red-300"
    };
    return styles[type as keyof typeof styles] || "";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <StudentProfileHeader 
          student={student}
          onEdit={() => setIsEditMode(!isEditMode)}
        />

        {/* Action Bar */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              Print Profile
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last Updated: June 2, 2026
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Guardian Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Guardian Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{student.guardianName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{student.guardianPhone}</p>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{student.dateOfBirth}</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start hover:bg-primary/5 dark:hover:bg-primary/10">
                  <Calendar className="mr-2 h-4 w-4" /> View Schedule
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-primary/5 dark:hover:bg-primary/10">
                  <BookOpen className="mr-2 h-4 w-4" /> Learning Materials
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-primary/5 dark:hover:bg-primary/10">
                  <Users className="mr-2 h-4 w-4" /> Class Community
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-8 w-full">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="academics">Academics</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              </TabsList>
              
              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* Subject Progress Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Subject Progress</CardTitle>
                    <CardDescription>Current learning progress across all subjects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {subjects.map((subject, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{subject.name}</span>
                            <span className="text-muted-foreground">{subject.completed}% Completed</span>
                          </div>
                          <div className="h-2 bg-muted dark:bg-muted/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-primary/80 dark:from-primary/80 dark:to-primary/60 rounded-full transition-all" 
                              style={{ width: `${subject.completed}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>{subject.upcoming} upcoming lessons</span>
                            <span>Score: {subject.score}/100</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="ml-auto" variant="outline">
                      View All Subjects <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Assignments */}
                <Card>
                  <CardHeader>
                    <CardTitle>Homework & Assignments</CardTitle>
                    <CardDescription>Track your pending and completed tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {assignments.map((assignment) => (
                        <div 
                          key={assignment.id} 
                          className="flex justify-between items-center p-3 hover:bg-muted/50 dark:hover:bg-muted/30 rounded-md transition-colors"
                        >
                          <div>
                            <h4 className="font-semibold">{assignment.title}</h4>
                            <p className="text-sm text-muted-foreground">Due: {assignment.dueDate}</p>
                          </div>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${getStatusStyles(assignment.status)}`}>
                              {assignment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div 
                          key={activity.id} 
                          className="flex justify-between items-center p-3 hover:bg-muted/50 dark:hover:bg-muted/30 rounded-md transition-colors"
                        >
                          <div>
                            <h4 className="font-semibold">{activity.activity}</h4>
                            <p className="text-sm text-muted-foreground">{activity.date} • {activity.time}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Academics Tab */}
              <TabsContent value="academics" className="space-y-6">
                {/* Academic Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Performance</CardTitle>
                    <CardDescription>Subject-wise performance analytics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Current Score</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Teacher Comments</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjects.map((subject, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{subject.name}</TableCell>
                            <TableCell>{subject.score}/100</TableCell>
                            <TableCell>
                              <span className={`font-semibold ${getGradeStyles(subject.score)}`}>
                                {subject.score >= 90 ? 'A' : 
                                 subject.score >= 80 ? 'B' : 
                                 subject.score >= 70 ? 'C' : 'D'}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {subject.score >= 90 ? 'Excellent work!' : 
                               subject.score >= 80 ? 'Good progress.' : 
                               subject.score >= 70 ? 'Satisfactory.' : 'Needs improvement.'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                {/* Learning Resources */}
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Resources</CardTitle>
                    <CardDescription>Access your study materials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['Mathematics', 'English', 'Science', 'Social Studies'].map((subject, index) => (
                        <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow dark:hover:shadow-lg cursor-pointer">
                          <CardContent className="p-0">
                            <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
                              <h3 className="font-semibold">{subject}</h3>
                              <p className="text-sm text-muted-foreground">
                                {Math.floor(Math.random() * 10) + 5} resources available
                              </p>
                            </div>
                            <div className="bg-muted/50 dark:bg-muted/30 px-4 py-2 flex justify-between items-center hover:bg-muted dark:hover:bg-muted/50 transition-colors">
                              <span className="text-sm font-medium">View Materials</span>
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Overview</CardTitle>
                    <CardDescription>Term 2, 2025 attendance record</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <Card className={getAttendanceCardStyles("present")}>
                        <CardContent className="pt-6 text-center">
                          <h3 className={`text-3xl font-bold ${getAttendanceTextStyles("present")}`}>
                            {attendance.present}%
                          </h3>
                          <p className={`font-medium ${getAttendanceLabelStyles("present")}`}>Present</p>
                        </CardContent>
                      </Card>
                      <Card className={getAttendanceCardStyles("late")}>
                        <CardContent className="pt-6 text-center">
                          <h3 className={`text-3xl font-bold ${getAttendanceTextStyles("late")}`}>
                            {attendance.late}%
                          </h3>
                          <p className={`font-medium ${getAttendanceLabelStyles("late")}`}>Late</p>
                        </CardContent>
                      </Card>
                      <Card className={getAttendanceCardStyles("absent")}>
                        <CardContent className="pt-6 text-center">
                          <h3 className={`text-3xl font-bold ${getAttendanceTextStyles("absent")}`}>
                            {attendance.absent}%
                          </h3>
                          <p className={`font-medium ${getAttendanceLabelStyles("absent")}`}>Absent</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Monthly Breakdown</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead>Present</TableHead>
                            <TableHead>Late</TableHead>
                            <TableHead>Absent</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {["January", "February", "March", "April"].map((month, index) => (
                            <TableRow key={index}>
                              <TableCell>{month}</TableCell>
                              <TableCell>{85 + Math.floor(Math.random() * 10)}%</TableCell>
                              <TableCell>{Math.floor(Math.random() * 10)}%</TableCell>
                              <TableCell>{Math.floor(Math.random() * 7)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
