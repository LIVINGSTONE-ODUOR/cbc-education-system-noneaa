import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Send,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IncidentFormData {
  reporterName: string;
  reporterEmail: string;
  incidentType: string;
  affectedService: string;
  severity: string;
  title: string;
  description: string;
  stepsToReproduce: string;
}

const initialFormData: IncidentFormData = {
  reporterName: '',
  reporterEmail: '',
  incidentType: '',
  affectedService: '',
  severity: '',
  title: '',
  description: '',
  stepsToReproduce: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportIncidentPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<IncidentFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (field: keyof IncidentFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reporterName.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    if (!formData.reporterEmail.trim()) {
      toast.error('Please enter your email address.');
      return;
    }
    if (!formData.incidentType) {
      toast.error('Please select an incident type.');
      return;
    }
    if (!formData.affectedService) {
      toast.error('Please select the affected service.');
      return;
    }
    if (!formData.severity) {
      toast.error('Please select a severity level.');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Please provide an incident title.');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please describe the incident.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('incident_reports').insert({
        reporter_name: formData.reporterName.trim(),
        reporter_email: formData.reporterEmail.trim(),
        incident_type: formData.incidentType,
        affected_service: formData.affectedService,
        severity: formData.severity,
        title: formData.title.trim(),
        description: formData.description.trim(),
        steps_to_reproduce: formData.stepsToReproduce.trim() || null,
        status: 'open',
      });

      if (error) {
        throw new Error(error.message);
      }

      setSubmitted(true);
      toast.success('Incident reported successfully. Thank you for your feedback!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit incident report.';
      toast.error(`Submission failed: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F1E7]">
      <Header />

      {/* Hero */}
      <section className="py-16 bg-[#EFE7D6]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AlertTriangle className="w-14 h-14 text-yellow-500 mx-auto mb-5" />
            </motion.div>
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              Report an Incident
            </motion.h1>
            <motion.p
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              Help us improve platform reliability by reporting any issues you encounter.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl mx-auto">

            {/* Back to Status link */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/status')}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={16} />
                Back to System Status
              </Button>
            </motion.div>

            {submitted ? (
              /* ── Success State ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Card>
                  <CardContent className="py-12 text-center space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-foreground">Report Submitted!</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Thank you for reporting this incident. Our team will review it and take appropriate action.
                    </p>
                    <div className="flex gap-3 justify-center pt-2">
                      <Button onClick={() => navigate('/status')} variant="outline" className="gap-2">
                        <ArrowLeft size={16} />
                        Back to Status
                      </Button>
                      <Button onClick={() => { setFormData(initialFormData); setSubmitted(false); }}>
                        Report Another
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              /* ── Form ── */
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="space-y-6"
              >
                {/* Reporter Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Your Information</CardTitle>
                    <CardDescription>So we can follow up if needed.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reporterName">Full Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="reporterName"
                        name="reporterName"
                        placeholder="e.g. Jane Doe"
                        value={formData.reporterName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reporterEmail">Email Address <span className="text-red-500">*</span></Label>
                      <Input
                        id="reporterEmail"
                        name="reporterEmail"
                        type="email"
                        placeholder="jane@example.com"
                        value={formData.reporterEmail}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Incident Classification */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Incident Details</CardTitle>
                    <CardDescription>Help us categorise and prioritise the issue.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Incident Type <span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.incidentType}
                          onValueChange={handleSelectChange('incidentType')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="performance">Performance Issue</SelectItem>
                            <SelectItem value="outage">Service Outage</SelectItem>
                            <SelectItem value="data_error">Data Error</SelectItem>
                            <SelectItem value="security">Security Concern</SelectItem>
                            <SelectItem value="feature_broken">Feature Not Working</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Affected Service <span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.affectedService}
                          onValueChange={handleSelectChange('affectedService')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="api_server">API Server</SelectItem>
                            <SelectItem value="database">Database</SelectItem>
                            <SelectItem value="authentication">Authentication</SelectItem>
                            <SelectItem value="content_delivery">Content Delivery</SelectItem>
                            <SelectItem value="realtime_engine">Real-time Engine</SelectItem>
                            <SelectItem value="network">Network Connectivity</SelectItem>
                            <SelectItem value="other">Other / Not Sure</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Severity <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.severity}
                        onValueChange={handleSelectChange('severity')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">🔴 Critical – System unusable</SelectItem>
                          <SelectItem value="high">🟠 High – Major feature broken</SelectItem>
                          <SelectItem value="medium">🟡 Medium – Degraded performance</SelectItem>
                          <SelectItem value="low">🟢 Low – Minor inconvenience</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Incident Title <span className="text-red-500">*</span></Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Brief summary of the issue…"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe what happened, what you expected, and what you observed…"
                        rows={5}
                        value={formData.description}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stepsToReproduce">Steps to Reproduce <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Textarea
                        id="stepsToReproduce"
                        name="stepsToReproduce"
                        placeholder="1. Go to…&#10;2. Click on…&#10;3. Observe…"
                        rows={3}
                        value={formData.stepsToReproduce}
                        onChange={handleChange}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/status')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="gap-2 bg-[#1E3A28] hover:bg-[#173420] text-white">
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Submit Report
                      </>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
