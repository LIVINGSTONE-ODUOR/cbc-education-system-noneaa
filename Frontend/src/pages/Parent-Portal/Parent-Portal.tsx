
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { User, BookOpen, Calendar, ChevronRight } from 'lucide-react';

const ParentPortal = () => {
  const [selectedChild, setSelectedChild] = useState("child1");

  const children = [
    {
      id: "child1",
      name: "James Kamau",
      grade: "Grade 5",
      school: "Makini School",
      image: "https://images.unsplash.com/photo-1524503033411-c9566986fc8f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: "child2",
      name: "Grace Wanjiku",
      grade: "Grade 3",
      school: "Nairobi Primary",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
    }
  ];

  const selectedChildData = children.find(child => child.id === selectedChild);

  // Sample academic data
  const academicPerformance = [
    { subject: "Mathematics", score: "85%", grade: "A", trend: "improved" },
    { subject: "English", score: "78%", grade: "B+", trend: "steady" },
    { subject: "Science", score: "92%", grade: "A", trend: "improved" },
    { subject: "Social Studies", score: "74%", grade: "B", trend: "needs work" },
    { subject: "Creative Arts", score: "88%", grade: "A-", trend: "steady" }
  ];

  // Sample upcoming activities
  const upcomingActivities = [
    { name: "Parents-Teacher Meeting", date: "May 15, 2025", time: "4:00 PM - 6:00 PM" },
    { name: "Science Exhibition", date: "May 20, 2025", time: "10:00 AM - 2:00 PM" },
    { name: "Sports Day", date: "May 25, 2025", time: "8:00 AM - 3:00 PM" }
  ];

  return (

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Parent Portal</CardTitle>
                <CardDescription>Welcome back, Mrs. Wanjiku</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <span className="text-sm text-muted-foreground">Select Child</span>
                  <Select value={selectedChild} onValueChange={setSelectedChild}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a child" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map(child => (
                        <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="mr-2 h-4 w-4" /> Academics
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" /> Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Communication card */}
            <Card>
              <CardHeader>
                <CardTitle>Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full mb-2">Message Teacher</Button>
                <Button variant="outline" className="w-full">School Announcements</Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="col-span-1 md:col-span-3 space-y-6">
            {/* Child overview */}
            {selectedChildData && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    <div className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0 border-4 border-primary/20">
                      <img 
                        src={selectedChildData.image} 
                        alt={selectedChildData.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-4 text-center md:text-left">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedChildData.name}</h2>
                        <p className="text-muted-foreground">{selectedChildData.grade} • {selectedChildData.school}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <Button variant="outline" size="sm">View Full Profile</Button>
                        <Button variant="outline" size="sm">Download Report</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Academic Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Performance</CardTitle>
                <CardDescription>Current term assessment for {selectedChildData?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicPerformance.map((subject, index) => (
                      <TableRow key={index}>
                        <TableCell>{subject.subject}</TableCell>
                        <TableCell>{subject.score}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            subject.grade.startsWith('A') ? 'text-green-600' : 
                            subject.grade.startsWith('B') ? 'text-blue-600' : 
                            'text-amber-600'
                          }`}>
                            {subject.grade}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            subject.trend === 'improved' ? 'bg-green-100 text-green-800' : 
                            subject.trend === 'steady' ? 'bg-blue-100 text-blue-800' : 
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {subject.trend}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* Upcoming Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Activities</CardTitle>
                <CardDescription>School events and activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingActivities.map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-md transition-colors">
                      <div>
                        <h4 className="font-semibold">{activity.name}</h4>
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
          </div>
        </div>
      </div>

  );
};

export default ParentPortal;
