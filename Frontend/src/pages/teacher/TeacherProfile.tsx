
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Calendar, User, ChevronRight, ChevronDown, ChevronUp, Users, Layout } from 'lucide-react';

const Teacher = () => {
  const [activeTab, setActiveTab] = useState("classes");
  const [selectedClass, setSelectedClass] = useState("6B");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Teacher details
  const teacher = {
    name: "Mrs. Jane Njoroge",
    id: "TC-4527",
    role: "Senior Teacher - Mathematics",
    school: "Nairobi Academy",
    experience: "8 years",
    email: "j.njoroge@nairobiacademy.edu",
    phone: "+254 712 345 678",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
  };

  // Classes taught
  const classes = [
    { id: "6A", name: "Grade 6A", students: 32, subjects: ["Mathematics"] },
    { id: "6B", name: "Grade 6B", students: 34, subjects: ["Mathematics"] },
    { id: "7A", name: "Grade 7A", students: 30, subjects: ["Mathematics"] },
    { id: "5C", name: "Grade 5C", students: 33, subjects: ["Mathematics"] }
  ];

  // Students data for the selected class
  const students = [
    { 
      id: "ST1001",
      name: "David Ochieng",
      performance: 85,
      attendance: 92,
      assignments: 8,
      image: "https://images.unsplash.com/photo-1600267204091-5c1ab8b10c02?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
      details: {
        strengths: "Problem-solving, arithmetic",
        weaknesses: "Geometry, word problems",
        recentScores: [78, 85, 92, 80],
        notes: "Shows consistent improvement in arithmetic"
      }
    },
    { 
      id: "ST1002",
      name: "Sarah Wambui",
      performance: 92,
      attendance: 96,
      assignments: 10,
      image: "https://images.unsplash.com/photo-1669240158612-28a42d2956a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
      details: {
        strengths: "Algebra, critical thinking",
        weaknesses: "None significant",
        recentScores: [90, 95, 88, 94],
        notes: "Exceptional student, could benefit from advanced material"
      }
    },
    { 
      id: "ST1003",
      name: "John Kamau",
      performance: 72,
      attendance: 85,
      assignments: 6,
      image: "https://images.unsplash.com/photo-1567784177951-6fa58317e16b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
      details: {
        strengths: "Fractions, measurement",
        weaknesses: "Algebra concepts, attention to detail",
        recentScores: [65, 70, 75, 78],
        notes: "Showing improvement but needs more practice with algebra"
      }
    },
    { 
      id: "ST1004",
      name: "Lucy Muthoni",
      performance: 88,
      attendance: 90,
      assignments: 9,
      image: "https://images.unsplash.com/photo-1509839862600-309617c3201e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
      details: {
        strengths: "Geometry, statistics",
        weaknesses: "Mental arithmetic",
        recentScores: [85, 90, 86, 92],
        notes: "Very consistent performer, strong analytical skills"
      }
    }
  ];

  // Upcoming lessons for today
  const todayLessons = [
    { time: "8:00 AM - 9:30 AM", class: "Grade 6B", subject: "Mathematics", topic: "Introduction to Algebra" },
    { time: "10:00 AM - 11:30 AM", class: "Grade 7A", subject: "Mathematics", topic: "Geometry: Circles and Arcs" },
    { time: "1:00 PM - 2:30 PM", class: "Grade 5C", subject: "Mathematics", topic: "Fractions and Decimals" }
  ];

  // Teaching resources
  const resources = [
    { name: "Algebra Worksheets", type: "PDF", lastUsed: "Yesterday", downloads: 45 },
    { name: "Geometry Visual Aids", type: "PowerPoint", lastUsed: "2 days ago", downloads: 32 },
    { name: "Fractions Practice Tests", type: "Word", lastUsed: "Last week", downloads: 67 },
    { name: "CBC Mathematics Guide", type: "PDF", lastUsed: "Yesterday", downloads: 58 }
  ];

  const toggleStudentDetails = (studentId: string) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
    } else {
      setExpandedStudent(studentId);
    }
  };

  return (

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="col-span-1">
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-secondary/20">
                    <img 
                      src={teacher.image} 
                      alt={teacher.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className="text-xl font-bold mt-4">{teacher.name}</h2>
                  <p className="text-muted-foreground">{teacher.role}</p>
                  <div className="bg-secondary/10 text-secondary text-sm px-3 py-1 rounded-full mt-2">
                    ID: {teacher.id}
                  </div>
                </div>
                
                <div className="space-y-1 border-t pt-4">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">School:</span>
                    <span className="font-medium">{teacher.school}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Experience:</span>
                    <span className="font-medium">{teacher.experience}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium text-sm">{teacher.email}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{teacher.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" /> View Timetable
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" /> Teaching Resources
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" /> Performance Reports
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="col-span-1 md:col-span-3 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-8">
                <TabsTrigger value="classes">Classes</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
              
              {/* Classes Tab */}
              <TabsContent value="classes" className="space-y-6">
                {/* Class Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>My Classes</CardTitle>
                    <CardDescription>Select a class to view student details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(classItem => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name} ({classItem.students} students)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                
                {/* Student List */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {classes.find(c => c.id === selectedClass)?.name} Students
                    </CardTitle>
                    <CardDescription>
                      {students.length} students enrolled in this class
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {students.map((student) => (
                        <div key={student.id} className="border rounded-md overflow-hidden">
                          {/* Student summary row */}
                          <div 
                            className="p-4 flex justify-between items-center hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleStudentDetails(student.id)}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full overflow-hidden">
                                <img 
                                  src={student.image} 
                                  alt={student.name} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="font-semibold">{student.name}</h4>
                                <p className="text-sm text-muted-foreground">ID: {student.id}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-6">
                              <div className="text-center">
                                <div className="text-sm text-muted-foreground">Performance</div>
                                <div className={`font-bold ${
                                  student.performance >= 90 ? 'text-green-600' : 
                                  student.performance >= 80 ? 'text-blue-600' : 
                                  student.performance >= 70 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {student.performance}%
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-muted-foreground">Attendance</div>
                                <div className="font-bold text-primary">{student.attendance}%</div>
                              </div>
                              <div className="text-center hidden md:block">
                                <div className="text-sm text-muted-foreground">Assignments</div>
                                <div className="font-bold">{student.assignments}/10</div>
                              </div>
                              <Button variant="ghost" size="sm">
                                {expandedStudent === student.id ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Expanded student details */}
                          {expandedStudent === student.id && (
                            <div className="p-4 bg-muted/20 border-t">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h5 className="font-semibold mb-2">Performance Analysis</h5>
                                  <div className="space-y-2">
                                    <div>
                                      <div className="flex justify-between text-sm">
                                        <span>Strengths:</span>
                                        <span className="text-green-600">{student.details.strengths}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-sm">
                                        <span>Areas for Improvement:</span>
                                        <span className="text-amber-600">{student.details.weaknesses}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-sm">
                                        <span>Teacher's Notes:</span>
                                        <span className="text-gray-600">{student.details.notes}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h5 className="font-semibold mb-2">Recent Assessment Scores</h5>
                                  <div className="flex justify-between space-x-2">
                                    {student.details.recentScores.map((score, index) => (
                                      <div key={index} className="flex-1 text-center">
                                        <div className={`text-sm font-bold ${
                                          score >= 90 ? 'text-green-600' : 
                                          score >= 80 ? 'text-blue-600' : 
                                          score >= 70 ? 'text-amber-600' : 'text-red-600'
                                        }`}>
                                          {score}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">Test {index + 1}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 flex justify-end space-x-2">
                                <Button variant="outline" size="sm">View Full Profile</Button>
                                <Button size="sm">Add Assessment</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <Button variant="outline">Download Class List</Button>
                    <Button>Generate Class Report</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Schedule</CardTitle>
                    <CardDescription>May 2, 2025</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Topic</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todayLessons.map((lesson, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{lesson.time}</TableCell>
                            <TableCell>{lesson.class}</TableCell>
                            <TableCell>{lesson.subject}</TableCell>
                            <TableCell>{lesson.topic}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="ml-auto">View Full Schedule</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Resources Tab */}
              <TabsContent value="resources" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <div>
                      <CardTitle>Teaching Resources</CardTitle>
                      <CardDescription>Access and manage your teaching materials</CardDescription>
                    </div>
                    <Button className="mt-4 sm:mt-0">Upload New Resource</Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Input placeholder="Search resources..." />
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Last Used</TableHead>
                            <TableHead>Downloads</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {resources.map((resource, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{resource.name}</TableCell>
                              <TableCell>{resource.type}</TableCell>
                              <TableCell>{resource.lastUsed}</TableCell>
                              <TableCell>{resource.downloads}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Reports</CardTitle>
                    <CardDescription>Generate and view student assessment reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center space-x-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Class Reports</h3>
                              <p className="text-sm text-muted-foreground">Overall class performance analytics</p>
                            </div>
                          </div>
                          <Button className="mt-4 w-full" variant="outline">Generate Report</Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center space-x-4">
                            <div className="bg-secondary/10 p-3 rounded-full">
                              <User className="h-6 w-6 text-secondary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Individual Reports</h3>
                              <p className="text-sm text-muted-foreground">Student-specific performance data</p>
                            </div>
                          </div>
                          <Button className="mt-4 w-full" variant="outline">Select Student</Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center space-x-4">
                            <div className="bg-kenya-gold/10 p-3 rounded-full">
                              <BookOpen className="h-6 w-6 text-kenya-gold" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Subject Analysis</h3>
                              <p className="text-sm text-muted-foreground">Subject-wise performance breakdown</p>
                            </div>
                          </div>
                          <Button className="mt-4 w-full" variant="outline">View Analysis</Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center space-x-4">
                            <div className="bg-kenya-green/10 p-3 rounded-full">
                              <Calendar className="h-6 w-6 text-kenya-green" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Term Reports</h3>
                              <p className="text-sm text-muted-foreground">End of term comprehensive reports</p>
                            </div>
                          </div>
                          <Button className="mt-4 w-full" variant="outline">Generate Term Report</Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
  );
};

export default Teacher;
