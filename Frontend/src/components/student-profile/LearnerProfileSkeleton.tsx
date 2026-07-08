import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function LearnerProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Skeleton Header (matches StudentProfileHeader shape) */}
        <Card className="border-0 shadow-md dark:shadow-lg">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg" />
                  <div className="mt-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>

                {/* Student info */}
                <div className="flex-1 flex flex-col justify-center">
                  <div>
                    <Skeleton className="h-10 w-64 mb-3" />
                    <div className="flex flex-wrap gap-3 mb-4">
                      <Skeleton className="h-7 w-24 rounded-full" />
                      <Skeleton className="h-7 w-28 rounded-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 justify-center">
                  <Skeleton className="h-10 w-48 rounded-md" />
                  <Skeleton className="h-10 w-48 rounded-md" />
                  <Skeleton className="h-10 w-48 rounded-md" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action bar */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40 rounded-md" />
            <Skeleton className="h-10 w-52 rounded-md" />
          </div>
          <Skeleton className="h-5 w-56" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-44" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-64" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-56" />
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-5 w-48" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </CardContent>
            </Card>
          </div>

          {/* Main */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs value="dashboard" className="w-full">
              <TabsList className="grid grid-cols-3 mb-8 w-full">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="academics">Academics</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              </TabsList>

              {/* Dashboard tab */}
              <div className="space-y-6" aria-hidden>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-72 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-36" />
                          </div>
                          <Skeleton className="h-2 w-full rounded-full" />
                          <div className="flex justify-between text-xs">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-28" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <div className="px-6 pb-5">
                    <Skeleton className="h-10 w-56 rounded-md" />
                  </div>
                </Card>

                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-72" />
                    <Skeleton className="h-4 w-80 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center p-3 rounded-md"
                        >
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-64" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                          <Skeleton className="h-7 w-28 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-64" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-md">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-72" />
                            <Skeleton className="h-3 w-56" />
                          </div>
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Academics tab */}
              <div className="space-y-6" aria-hidden>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-72" />
                    <Skeleton className="h-4 w-80 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Skeleton className="h-3 w-28" />
                          </TableHead>
                          <TableHead>
                            <Skeleton className="h-3 w-36" />
                          </TableHead>
                          <TableHead>
                            <Skeleton className="h-3 w-24" />
                          </TableHead>
                          <TableHead>
                            <Skeleton className="h-3 w-40" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Skeleton className="h-4 w-44" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-24" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-16" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-56" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-52" />
                    <Skeleton className="h-4 w-80 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="p-4">
                              <Skeleton className="h-5 w-40" />
                              <Skeleton className="h-3 w-56 mt-3" />
                            </div>
                            <div className="px-4 py-2 flex justify-between items-center">
                              <Skeleton className="h-4 w-36" />
                              <Skeleton className="h-4 w-4 rounded" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance tab */}
              <div className="space-y-6" aria-hidden>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-72" />
                    <Skeleton className="h-4 w-80 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                          <CardContent className="pt-6 text-center space-y-3">
                            <Skeleton className="h-10 w-24 mx-auto" />
                            <Skeleton className="h-4 w-20 mx-auto" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="mt-8">
                      <Skeleton className="h-5 w-52 mb-4" />
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <Skeleton className="h-3 w-16" />
                            </TableHead>
                            <TableHead>
                              <Skeleton className="h-3 w-18" />
                            </TableHead>
                            <TableHead>
                              <Skeleton className="h-3 w-16" />
                            </TableHead>
                            <TableHead>
                              <Skeleton className="h-3 w-18" />
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.from({ length: 4 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Skeleton className="h-3 w-24" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-3 w-24" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-3 w-24" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-3 w-24" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

