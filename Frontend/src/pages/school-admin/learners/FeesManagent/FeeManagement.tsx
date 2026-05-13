import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Download, Wallet, TrendingUp, AlertCircle, Plus
} from 'lucide-react';
import { toast } from 'sonner';

// Import tab components from separate files
import PaymentsTab from './PaymentRecord';
import FeeStructuresTab from './FeeStructure';
import DefaultersTab from './Defaulters';
import AnalyticsTab from './Analytics';

export interface FeeManagementProps {
  onBack?: () => void;
}

const FeeManagement: React.FC<FeeManagementProps> = ({ onBack }) => {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    studentAdmNo: '', amount: '', method: 'M-Pesa', remarks: '',
  });

  const handleRecordPayment = () => {
    toast.success(`Payment of KES ${Number(paymentForm.amount).toLocaleString()} recorded successfully`);
    setPaymentDialogOpen(false);
    setPaymentForm({ studentAdmNo: '', amount: '', method: 'M-Pesa', remarks: '' });
  };

  return (
    <div className="min-h-screen">
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-green-100">
                  <Wallet className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                  <p className="text-2xl font-bold text-green-600">KES 1.97M</p>
                  <p className="text-xs text-muted-foreground">Term 1 2025</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-amber-100">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold text-amber-600">KES 410K</p>
                  <p className="text-xs text-muted-foreground">4 defaulters</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-blue-100">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Collection Rate</p>
                  <p className="text-2xl font-bold">82%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Collection</p>
                  <p className="text-2xl font-bold">KES 45K</p>
                  <p className="text-xs text-muted-foreground">3 payments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payments" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="structures">Fee Structures</TabsTrigger>
              <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Fee Payment</DialogTitle>
                    <DialogDescription>Enter payment details below</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div>
                      <Label>Student Admission No.</Label>
                      <Input 
                        placeholder="CBC/2024/001" 
                        value={paymentForm.studentAdmNo} 
                        onChange={e => setPaymentForm({ ...paymentForm, studentAdmNo: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label>Amount (KES)</Label>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        value={paymentForm.amount} 
                        onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select 
                        value={paymentForm.method} 
                        onValueChange={v => setPaymentForm({ ...paymentForm, method: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                          <SelectItem value="Bank">Bank Transfer</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Remarks</Label>
                      <Input 
                        placeholder="Optional remarks" 
                        value={paymentForm.remarks} 
                        onChange={e => setPaymentForm({ ...paymentForm, remarks: e.target.value })} 
                      />
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleRecordPayment} 
                        disabled={!paymentForm.studentAdmNo || !paymentForm.amount}
                      >
                        Record Payment
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Payments Tab - imported from PaymentRecord.tsx */}
          <TabsContent value="payments">
            <PaymentsTab />
          </TabsContent>

          {/* Fee Structures Tab - imported from FeeStructure.tsx */}
          <TabsContent value="structures">
            <FeeStructuresTab />
          </TabsContent>

          {/* Defaulters Tab - imported from Defaulters.tsx */}
          <TabsContent value="defaulters">
            <DefaultersTab />
          </TabsContent>

          {/* Analytics Tab - imported from Analytics.tsx */}
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FeeManagement;

