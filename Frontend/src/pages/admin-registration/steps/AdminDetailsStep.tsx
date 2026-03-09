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
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <motion.div 
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
          This user will become the Super Admin for the school with full access to manage the school account.
        </p>
      </motion.div>

      {/* Full Name */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Label htmlFor="fullName" className="text-base font-semibold">Full Name *</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          placeholder="Enter full name"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          required
        />
      </motion.div>

      {/* TSC No. */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Label htmlFor="tscNo" className="text-base font-semibold">TSC No. *</Label>
        <Input
          id="tscNo"
          value={formData.tscNo}
          onChange={(e) => handleChange('tscNo', e.target.value)}
          placeholder="Enter TSC number"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          required
        />
      </motion.div>

      {/* Role */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Label htmlFor="role" className="text-base font-semibold">Role *</Label>
        <Select
          value={formData.role || ''}
          onValueChange={(value) => handleChange('role', value as AdministratorRole)}
        >
          <SelectTrigger id="role" className="transition-all duration-200 focus:ring-2 focus:ring-blue-500">
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

      {/* Phone Number */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Label htmlFor="phoneNumber" className="text-base font-semibold">Phone Number *</Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => handleChange('phoneNumber', e.target.value)}
          placeholder="e.g., +254 712 345 678"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          required
        />
      </motion.div>

      {/* Email Address */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Label htmlFor="email" className="text-base font-semibold">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="e.g., admin@school.ac.ke"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          required
        />
      </motion.div>

      {/* National ID / Passport */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
      >
        <Label htmlFor="nationalIdOrPassport" className="text-base font-semibold">National ID / Passport (Optional)</Label>
        <Input
          id="nationalIdOrPassport"
          value={formData.nationalIdOrPassport}
          onChange={(e) => handleChange('nationalIdOrPassport', e.target.value)}
          placeholder="Enter National ID or Passport number"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        />
      </motion.div>

      {/* Username */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Label htmlFor="username" className="text-base font-semibold">Username *</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => handleChange('username', e.target.value)}
          placeholder="Choose a username"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          required
        />
      </motion.div>

      {/* Password */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.45 }}
      >
        <Label htmlFor="password" className="text-base font-semibold">Password *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="Create a strong password"
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 pr-10"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Password must be at least 8 characters with uppercase, lowercase, number, and special character
        </p>
      </motion.div>

      {/* Two-Factor Authentication */}
      <motion.div 
        className="flex items-center space-x-2 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Checkbox
          id="twoFactorAuth"
          checked={formData.twoFactorAuth}
          onCheckedChange={(checked) => handleChange('twoFactorAuth', checked === true)}
        />
        <Label
          htmlFor="twoFactorAuth"
          className="text-sm font-normal cursor-pointer flex-1"
        >
          Enable Two-Factor Authentication (Optional but recommended)
        </Label>
      </motion.div>

      {/* Form Actions */}
      <motion.div 
        className="flex justify-between pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.55 }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous Step
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
