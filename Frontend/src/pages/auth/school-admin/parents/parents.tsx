import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Users,
  Lock,
  Unlock,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Shield,
  Send,
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  Loader2,
} from 'lucide-react';

import ProtectedTableSkeleton from '@/components/skeletons/ProtectedTableSkeleton';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// Type Definitions
// ============================================================================

interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  national_id: string;
  passport_number?: string;
  occupation?: string;
  relationship: string;
  date_of_birth?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  user?: {
    id: string;
    email: string;
    status: string;
    email_verified: boolean;
    last_login?: string;
    created_at?: string;
  };
  linked_learners?: LinkedLearner[];
  total_children?: number;
}

interface LinkedLearner {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  admission_number: string;
  gender: string;
  date_of_birth: string;
  grade_level: string;
  stream_name?: string;
  is_active: boolean;
  link_id: string;
  is_primary: boolean;
  relationship: string;
}

interface School {
  id: string;
  name: string;
  code?: string;
}

interface Learner {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  grade_level: string;
}

interface ParentStats {
  total_parents: number;
  active_parents: number;
  inactive_parents: number;
  verified_emails: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T[];
  pagination?: PaginationInfo;
  message?: string;
}

import {
  getParents,
  getSchools,
  getLearners,
  createParent,
  updateParent,
  deleteParent,
  linkLearner,
  unlinkLearner,
  sendParentInvite,
  getParent as getSingleParent,
} from '@/lib/api/parentsApi';

// ============================================================================
// getAuthToken (kept for consistency - used in other places?)
// ============================================================================
// apiCall remnants removed - using parentsApi

// ============================================================================
// Parent Management Component
// ============================================================================

export default function ParentManagement() {
  // State
  const [parents, setParents] = useState<Parent[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Stats
  const [stats, setStats] = useState<ParentStats>({
    total_parents: 0,
    active_parents: 0,
    inactive_parents: 0,
    verified_emails: 0,
  });

  // Dialogs
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);


  // Invite state
  const [inviteChannel, setInviteChannel] = useState<'email' | 'sms'>('email');


  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    national_id: '',
    passport_number: '',
    occupation: '',
    relationship: 'guardian',
    date_of_birth: '',
  });

  const [linkFormData, setLinkFormData] = useState({
    learner_id: '',
    relationship: 'guardian',
    is_primary: false,
  });

  const [unlinkData, setUnlinkData] = useState<{
    learner_id: string;
    learner_name: string;
  } | null>(null);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchParents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getParents({
        page,
        limit,
        search: searchQuery || undefined,
        is_active: filterStatus === 'all' ? undefined : filterStatus === 'active',
      });

      setParents(response.data || []);
      setPagination(response.pagination || { page, limit, total: response.data?.length || 0, pages: 1 });

      // Calculate stats
      const parentList = response.data || [];
      const totalActive = parentList.filter((p) => p.is_active).length;
      const totalVerified = parentList.filter((p) => p.user?.email_verified).length;

      setStats({
        total_parents: response.pagination?.total || parentList.length,
        active_parents: totalActive,
        inactive_parents: (response.pagination?.total || parentList.length) - totalActive,
        verified_emails: totalVerified,
      });
    } catch (error) {
      console.error('Fetch parents error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load parents');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, filterStatus]);

  const fetchSchools = useCallback(async () => {
    try {
      const response = await getSchools();
      setSchools(response.data || []);
    } catch (error) {
      console.error('Fetch schools error:', error);
    }
  }, []);

  const fetchLearners = useCallback(async () => {
    try {
      const response = await getLearners();
      setLearners(response.data || []);
    } catch (error) {
      console.error('Fetch learners error:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchParents();
    fetchSchools();
    fetchLearners();
  }, [fetchParents, fetchSchools, fetchLearners]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleViewParent = (parent: Parent) => {
    setSelectedParent(parent);
    setShowViewDialog(true);
  };

  const handleEditParent = (parent: Parent) => {
    setSelectedParent(parent);
    setFormData({
      first_name: parent.first_name,
      last_name: parent.last_name,
      email: parent.email,
      phone_number: parent.phone_number,
      national_id: parent.national_id || '',
      passport_number: parent.passport_number || '',
      occupation: parent.occupation || '',
      relationship: parent.relationship || 'guardian',
      date_of_birth: parent.date_of_birth || '',
    });
    setShowEditDialog(true);
  };

  const handleAddParent = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      national_id: '',
      passport_number: '',
      occupation: '',
      relationship: 'guardian',
      date_of_birth: '',
    });
    setSelectedParent(null);
    setShowAddDialog(true);
  };

  const handleSaveParent = async () => {
    try {
      setIsLoading(true);

      if (!formData.first_name || !formData.last_name || !formData.email) {
        toast.error('Please fill in required fields (First Name, Last Name, Email)');
        return;
      }

      if (selectedParent) {
        // Update existing
        await updateParent(selectedParent.id, formData);

        toast.success('Parent updated successfully');
        setShowEditDialog(false);
      } else {
        // Create new
        await createParent(formData);

        toast.success('Parent added successfully');
        setShowAddDialog(false);
      }

      await fetchParents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save parent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (parent: Parent) => {
    try {
      setIsLoading(true);

      await updateParent(parent.id, { is_active: !parent.is_active });

      toast.success(`Parent ${!parent.is_active ? 'activated' : 'deactivated'} successfully`);
      await fetchParents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update parent status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteParent = async () => {
    if (!selectedParent) return;

    try {
      setIsLoading(true);

      await apiCall(`/parents/${selectedParent.id}`, {
        method: 'DELETE',
      });

      toast.success('Parent deleted successfully');
      setShowDeleteDialog(false);
      await fetchParents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete parent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkLearner = async () => {
    if (!selectedParent || !linkFormData.learner_id) {
      toast.error('Please select a learner');
      return;
    }

    try {
      setIsLoading(true);

      await apiCall(`/parents/${selectedParent.id}/link-learner`, {
        method: 'POST',
        body: JSON.stringify(linkFormData),
      });

      toast.success('Learner linked successfully');
      setShowLinkDialog(false);
      setLinkFormData({ learner_id: '', relationship: 'guardian', is_primary: false });

      // Refresh the view
      const response: ApiResponse<Parent> = await apiCall(`/parents/${selectedParent.id}`);
      setSelectedParent(response.data[0]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to link learner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkLearner = async () => {
    if (!selectedParent || !unlinkData) return;

    try {
      setIsLoading(true);

      await apiCall(`/parents/${selectedParent.id}/unlink/${unlinkData.learner_id}`, {
        method: 'DELETE',
      });

      toast.success('Learner unlinked successfully');
      setShowUnlinkDialog(false);
      setUnlinkData(null);

      // Refresh the view
      const response: ApiResponse<Parent> = await apiCall(`/parents/${selectedParent.id}`);
      setSelectedParent(response.data[0]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to unlink learner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedParent) return;

    try {
      setIsLoading(true);

      const response = await apiCall(`/parents/${selectedParent.id}/send-invite`, {
        method: 'POST',
        body: JSON.stringify({ channel: inviteChannel }),
      });

      toast.success(`Portal invite sent via ${inviteChannel} to ${response.data.to}`);
      setShowInviteDialog(false);
      setInviteChannel('email');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const headers = [
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Relationship',
        'Status',
        'Email Verified',
        'Created Date',
      ];

      const rows = parents.map((p) => [
        p.first_name,
        p.last_name,
        p.email,
        p.phone_number,
        p.relationship,
        p.is_active ? 'Active' : 'Inactive',
        p.user?.email_verified ? 'Yes' : 'No',
        new Date(p.created_at).toLocaleDateString(),
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parents_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Parents exported successfully');
    } catch (error) {
      toast.error('Failed to export parents');
    }
  };

  // ============================================================================
  // Filtered Data
  // ============================================================================

  const filteredParents = useMemo(() => {
    return parents.filter((parent) => {
      const matchesSearch =
        searchQuery === '' ||
        parent.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parent.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parent.phone_number.includes(searchQuery);

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' ? parent.is_active : !parent.is_active);

      const matchesVerified =
        filterVerified === 'all' ||
        (filterVerified === 'verified'
          ? parent.user?.email_verified
          : !parent.user?.email_verified);

      return matchesSearch && matchesStatus && matchesVerified;
    });
  }, [parents, searchQuery, filterStatus, filterVerified]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parent Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage parent accounts and learner connections
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={loading || parents.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={handleAddParent} disabled={loading} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Parent
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total_parents}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Active</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.active_parents}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Verified</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.verified_emails}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Inactive</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.inactive_parents}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, email, phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as 'all' | 'active' | 'inactive');
                setPage(1);
              }}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background cursor-pointer appearance-none pr-8"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Email Verified Filter */}
            <select
              value={filterVerified}
              onChange={(e) => {
                setFilterVerified(e.target.value as 'all' | 'verified' | 'unverified');
                setPage(1);
              }}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background cursor-pointer appearance-none pr-8"
            >
              <option value="all">All Emails</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchParents()}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parents Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Relationship</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Verified</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <ProtectedTableSkeleton rowCount={8} columnCount={6} />
                  </td>
                </tr>
              ) : filteredParents.length === 0 ? (

                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No parents found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredParents.map((parent) => (
                  <TableRow key={parent.id} className="hover:bg-muted/50 transition-colors">
                    {/* Name */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {parent.first_name[0]}
                            {parent.last_name[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {parent.first_name} {parent.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">ID: {parent.national_id || 'N/A'}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{parent.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{parent.phone_number}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Relationship */}
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="capitalize">
                        {parent.relationship}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            parent.is_active ? 'bg-green-500' : 'bg-gray-400'
                          )}
                        />
                        <span className="text-sm">{parent.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </TableCell>

                    {/* Email Verified */}
                    <TableCell>
                      {parent.user?.email_verified ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            onClick={() => handleViewParent(parent)}
                            className="gap-2 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleEditParent(parent)}
                            className="gap-2 cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedParent(parent);
                              setShowLinkDialog(true);
                            }}
                            className="gap-2 cursor-pointer"
                          >
                            <LinkIcon className="h-4 w-4" />
                            <span>Link Learner</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedParent(parent);
                              setShowInviteDialog(true);
                            }}
                            className="gap-2 cursor-pointer"
                            disabled={!parent.user_id}
                          >
                            <Send className="h-4 w-4" />
                            <span>Send Invite</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(parent)}
                            className="gap-2 cursor-pointer"
                          >
                            {parent.is_active ? (
                              <>
                                <Lock className="h-4 w-4" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="h-4 w-4" />
                                <span>Activate</span>
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedParent(parent);
                              setShowDeleteDialog(true);
                            }}
                            className="gap-2 text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of{' '}
            {pagination.total} parents
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.pages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ========== DIALOGS ========== */}

      {/* View Parent Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parent Details</DialogTitle>
          </DialogHeader>

          {selectedParent ? (
            <div className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase mb-1">Name</p>
                    <p className="font-medium">
                      {selectedParent.first_name} {selectedParent.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase mb-1">Relationship</p>
                    <p className="font-medium capitalize">{selectedParent.relationship}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase mb-1">Email</p>
                    <p className="font-medium">{selectedParent.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase mb-1">Phone</p>
                    <p className="font-medium">{selectedParent.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase mb-1">National ID</p>
                    <p className="font-medium">{selectedParent.national_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase mb-1">Occupation</p>
                    <p className="font-medium">{selectedParent.occupation || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Account Status */}
              {selectedParent.user && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Account Status</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase mb-1">Portal Status</p>
                      <Badge variant="outline" className="capitalize">
                        {selectedParent.user.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase mb-1">Email Verified</p>
                      <Badge
                        variant="outline"
                        className={
                          selectedParent.user.email_verified
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }
                      >
                        {selectedParent.user.email_verified ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {selectedParent.user.last_login && (
                      <div>
                        <p className="text-muted-foreground text-xs uppercase mb-1">Last Login</p>
                        <p className="font-medium">
                          {new Date(selectedParent.user.last_login).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Parent Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Parent</DialogTitle>
            <DialogDescription>Update parent information</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>National ID</Label>
                <Input
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Occupation</Label>
                <Input
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Relationship *</Label>
                <Select
                  value={formData.relationship}
                  onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="grandparent">Grandparent</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveParent} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Parent Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Parent</DialogTitle>
            <DialogDescription>Create a new parent account</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>National ID</Label>
                <Input
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Occupation</Label>
                <Input
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Relationship *</Label>
                <Select
                  value={formData.relationship}
                  onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="grandparent">Grandparent</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveParent} disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Parent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Learner Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Link Learner</DialogTitle>
            <DialogDescription>Connect a learner to this parent</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Learner *</Label>
              <Select
                value={linkFormData.learner_id}
                onValueChange={(value) => setLinkFormData({ ...linkFormData, learner_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select learner" />
                </SelectTrigger>
                <SelectContent>
                  {learners.map((learner) => (
                    <SelectItem key={learner.id} value={learner.id}>
                      {learner.first_name} {learner.last_name} ({learner.admission_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Relationship *</Label>
              <Select
                value={linkFormData.relationship}
                onValueChange={(value) => setLinkFormData({ ...linkFormData, relationship: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="grandparent">Grandparent</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_primary"
                checked={linkFormData.is_primary}
                onChange={(e) => setLinkFormData({ ...linkFormData, is_primary: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <Label htmlFor="is_primary" className="cursor-pointer">
                Set as primary parent
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleLinkLearner} disabled={isLoading}>
              {isLoading ? 'Linking...' : 'Link Learner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Portal Invite</DialogTitle>
            <DialogDescription>Send an invite to access the parent portal</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Send Via *</Label>
              <Select
                value={inviteChannel}
                onValueChange={(value) => setInviteChannel(value as 'email' | 'sms')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {inviteChannel === 'email' && selectedParent?.email && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="text-blue-900">
                  Invite will be sent to: <span className="font-medium">{selectedParent.email}</span>
                </p>
              </div>
            )}

            {inviteChannel === 'sms' && selectedParent?.phone_number && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="text-blue-900">
                  Invite will be sent to: <span className="font-medium">{selectedParent.phone_number}</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSendInvite} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Dialog */}
      <AlertDialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Learner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink <span className="font-medium">{unlinkData?.learner_name}</span> from this
              parent? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <DialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkLearner}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Unlinking...' : 'Unlink'}
            </AlertDialogAction>
          </DialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Parent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-medium">
                {selectedParent?.first_name} {selectedParent?.last_name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <DialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteParent}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </DialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}