import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import ReportCardView from './ReportCardView';

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '';

export default function StudentReportPortal() {
  const { user } = useAuth();
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    resolveLearnerId();
  }, [user]);

  async function resolveLearnerId() {
    if (!user?.email) {
      setLoading(false);
      setError('No user account found');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // For student users, the backend automatically scopes the /api/v1/learners
      // endpoint to return only the student's own record (based on JWT email).
      // No query parameter is needed — the backend extracts the admission number
      // from the JWT email automatically (see learner.controller.js).
      const token = localStorage.getItem('cbe_access_token');
      const res = await fetch(`${API_BASE}/api/v1/learners`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to find learner record');
      }

      const learners = Array.isArray(data.data) ? data.data : [];
      if (learners.length === 0) {
        throw new Error('Learner record not found. Please contact your school.');
      }

      setLearnerId(learners[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to load your profile');
      toast.error(err.message || 'Failed to load your profile');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Unable to Load Reports</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button onClick={resolveLearnerId}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  if (!learnerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Learner Profile</h2>
        <p className="text-muted-foreground max-w-md">
          Your account could not be linked to a learner profile. Please contact your school for assistance.
        </p>
      </div>
    );
  }

  return <ReportCardView learnerId={learnerId} />;
}
