import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Edit2, Download, Share2 } from 'lucide-react';

interface StudentHeaderProps {
  student: {
    id: string;
    name: string;
    email: string;
    phone: string;
    grade: string;
    class: string;
    image: string;
    school: string;
    dateOfBirth: string;
    status: 'active' | 'inactive' | 'graduated';
  };
  onEdit?: () => void;
  lastUpdated?: string | null;
}

const StudentProfileHeader: React.FC<StudentHeaderProps> = ({ student, onEdit, lastUpdated }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200';
      case 'inactive':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200';
      case 'graduated':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card className="border-0 shadow-md dark:shadow-lg">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 border-white dark:border-slate-800 shadow">
                  <img
                    src={student.image}
                    alt={student.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Badge className={`absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0 capitalize ${getStatusColor(student.status)}`}>
                  {student.status}
                </Badge>
              </div>
            </div>

            {/* Student Information */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {student.name}
                </h1>
                <Badge variant="secondary" className="text-xs">{student.grade}</Badge>
                <Badge variant="secondary" className="text-xs">Class {student.class}</Badge>
              </div>

              {/* Contact & Location Info - single compact row, wraps on small screens */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs">{student.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs">{student.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs">{student.school}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">ID:</span>
                  <span className="text-xs font-mono">{student.id}</span>
                </div>
                {lastUpdated && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - single compact row */}
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button onClick={onEdit} variant="default" size="sm" className="gap-1.5">
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentProfileHeader;
