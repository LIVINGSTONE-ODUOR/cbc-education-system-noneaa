import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SchoolRegistrationStep3, AdministratorRole } from '@/types/school';
import { ArrowLeft, Loader2, Eye, EyeOff, User, BadgeCheck, Briefcase, Phone, Mail, CreditCard, AtSign, KeyRound, ShieldCheck } from 'lucide-react';

interface Props {
  initialData: SchoolRegistrationStep3;
  onSubmit: (data: SchoolRegistrationStep3) => void;
  onBack: () => void;
  isLoading: boolean;
}

export default function AdminDetailsStep({ initialData, onSubmit, onBack, isLoading }: Props) {
  const [formData, setFormData] = useState<SchoolRegistrationStep3>(initialData);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = <K extends keyof SchoolRegistrationStep3>(
    field: K,
    value: SchoolRegistrationStep3[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isValid =
    formData.fullName &&
    formData.tscNo &&
    formData.role &&
    formData.phoneNumber &&
    formData.email &&
    formData.username &&
    formData.password;

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Info banner */}
      <motion.div
        className="flex items-start gap-3 p-4 rounded-xl bg-violet-50 border border-violet-100"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <ShieldCheck className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-violet-700 font-medium leading-relaxed">
          This user will become the Super Admin for the school with full access to manage the school account.
        </p>
      </motion.div>

      {/* Section: Personal Details */}
      <motion.div {...fadeUp(0.05)}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Personal Details</p>
      </motion.div>

      {/* Row: Full Name + TSC No */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div className="space-y-2" {...fadeUp(0.08)}>
          <Label htmlFor="fullName" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Full Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="e.g., John Kamau"
            className="h-11 border-slate-200 focus:border-violet-400 focus:ring-violet-100 transition-colors"
            required
          />
        </motion.div>

        <motion.div className="space-y-2" {...fadeUp(0.12)}>
          <Label htmlFor="tscNo" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <BadgeCheck className="w-3.5 h-3.5 text-slate-400" />
            TSC No. <span className="text-red-400">*</span>
          </Label>
          <Input
            id="tscNo"
            value={formData.tscNo}
            onChange={(e) => handleChange('tscNo', e.target.value)}
            placeholder="e.g., TSC/12345"
            className="h-11 border-slate-200 focus:border-violet-400 focus:ring-violet-100 transition-colors"
            required
          />
        </motion.div>
      </div>

      {/* Row: Role + National ID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div className="space-y-2" {...fadeUp(0.16)}>
          <Label htmlFor="role" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            Role <span className="text-red-400">*</span>
          </Label>
          <Select
            value={formData.role || ''}
            onValueChange={(value) => handleChange('role', value as AdministratorRole)}
          >
            <SelectTrigger id="role" className="h-11 border-slate-200 focus:border-violet-400 focus:ring-violet-100 transition-colors">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AdministratorRole.HEADTEACHER}>Headteacher</SelectItem>
              <SelectItem value={AdministratorRole.PRINCIPAL}>Principal</SelectItem>
              <SelectItem value={AdministratorRole.DIRECTOR}>Director</SelectItem>
              <SelectItem value={AdministratorRole.ADMINISTRATOR}>Administrator</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div className="space-y-2" {...fadeUp(0.2)}>
          <Label htmlFor="nationalIdOrPassport" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            National ID / Passport <span className="text-slate-300 text-xs font-normal">(Optional)</span>
          </Label>
          <Input
            id="nationalIdOrPassport"
            value={formData.nationalIdOrPassport}
            onChange={(e) => handleChange('nationalIdOrPassport', e.target.value)}
            placeholder="e.g., 12345678"
            className="h-11 border-slate-200 focus:border-violet-400 focus:ring-violet-100 transition-colors"
          />
        </motion.div>
      </div>

      {/* Row: Phone + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div className="space-y-2" {...fadeUp(0.24)}>
          <Label htmlFor="phoneNumber" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            Phone Number <span className="text-red-400">*</span>
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            placeholder="e.g., +254 712 345 678"
            className="h-11 border-slate-200 focus:border-violet-400 focus:ring-violet-100 transition-colors"
            required
          />
        </motion.div>

        <motion.div className="space-y-2" {...fadeUp(0.28)}>
          <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            Email Address <span className="text-red-400">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="e.g., admin@school.ac.ke"
            className="h-11 border-slate-200 focus:border-violet-400 focus:ring-violet-100 transition-colors"
            required
          />
        </motion.div>
      </div>

      {/* Divider + Section: Account Credentials */}
      <motion.div {...fadeUp(0.32)}>
        <div className="border-t border-slate-100 pt-5 mt-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account Credentials</p>
        </div>
      </motion.div>

      {/* Row: Username + Password */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div className="space-y-2" {...fadeUp(0.36)}>
          <Label htmlFor="username" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <AtSign className="w-3.5 h-3.5 text-slate-400" />
            Username <span className="text-red-400">*</span>
          </Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="Choose a username"
            className="h-11 border-slate-200 focus:border-violet-400 focus:ring-violet-100 transition-colors"
            required
          />
        </motion.div>

        <motion.div className="space-y-2" {...fadeUp(0.4)}>
          <Label htmlFor="password" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            Password <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Create a strong password"
              className="h-11 border-slate-200 focus:border-violet-400 focus:ring-violet-100 transition-colors pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Min 8 characters with uppercase, lowercase, number & special character
          </p>
        </motion.div>
      </div>

      {/* Two-Factor Auth */}
      <motion.div
        className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.44 }}
        onClick={() => handleChange('twoFactorAuth', !formData.twoFactorAuth)}
      >
        <Checkbox
          id="twoFactorAuth"
          checked={formData.twoFactorAuth}
          onCheckedChange={(checked) => handleChange('twoFactorAuth', checked === true)}
          className="data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
        />
        <Label
          htmlFor="twoFactorAuth"
          className="text-sm font-normal cursor-pointer flex-1 text-slate-600"
        >
          Enable Two-Factor Authentication <span className="text-slate-400">(Optional but recommended)</span>
        </Label>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex items-center justify-between pt-6 border-t border-slate-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.48 }}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isLoading}
          className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 h-11 px-5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous Step
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isLoading}
          className="bg-violet-600 hover:bg-violet-700 text-white h-11 px-6 rounded-xl shadow-sm shadow-violet-200 transition-all duration-200 disabled:opacity-40"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Registering School...
            </>
          ) : (
            'Complete Registration'
          )}
        </Button>
      </motion.div>
    </form>
  );
}
