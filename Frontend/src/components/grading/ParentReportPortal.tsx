import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/sonner';
import { Loader2, Users, User, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ReportCardView from './ReportCardView';

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '';

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('cbe_access_token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Request failed');
  return data;
}

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_name?: string;
  photo_url?: string;
}

export default function ParentReportPortal() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChildren();
  }, []);

  async function loadChildren() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch('/api/v1/parents/me/children');
      const childrenData = data.data?.children || data.data || [];
      setChildren(childrenData);
      if (childrenData.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenData[0].id);
      }
    } catch (err: any) {
      setError('Failed to load children. Please ensure you are linked as a parent.');
      toast.error('Failed to load children');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading your children...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Unable to Load Children</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button onClick={loadChildren}><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Children Linked</h2>
        <p className="text-muted-foreground max-w-md">
          You don't have any children linked to your account yet. Please contact your child's school to link your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">My Children's Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View report cards and assessment progress for your children
          </p>
        </div>
      </div>

      {/* Child Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {children.map(child => (
          <Card
            key={child.id}
            className={`shrink-0 cursor-pointer transition-all hover:border-primary/50 min-w-[160px] ${
              selectedChildId === child.id
                ? 'border-primary ring-2 ring-primary/20 shadow-md'
                : 'hover:shadow-sm'
            }`}
            onClick={() => setSelectedChildId(child.id)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={child.photo_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {child.first_name?.[0]}{child.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{child.first_name} {child.last_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {child.class_name || child.admission_number}
                </p>
              </div>
              {selectedChildId === child.id && (
                <ChevronRight className="w-4 h-4 text-primary shrink-0" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Cards */}
      {selectedChildId && <ReportCardView learnerId={selectedChildId} />}
    </div>
  );
}
