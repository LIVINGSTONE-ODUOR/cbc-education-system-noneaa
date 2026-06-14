import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SchoolRegistrationStep2 } from '@/types/school';
import { ArrowRight, ArrowLeft, MapPin, Building, Mail, Phone, Globe, MapPinned } from 'lucide-react';

interface Props {
  initialData: SchoolRegistrationStep2;
  onSubmit: (data: SchoolRegistrationStep2) => void;
  onBack: () => void;
}

export default function SchoolDetailsStep({ initialData, onSubmit, onBack }: Props) {
  const [formData, setFormData] = useState<SchoolRegistrationStep2>(initialData);

  const handleChange = (field: keyof SchoolRegistrationStep2, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isValid =
    formData.county &&
    formData.subCounty &&
    formData.ward &&
    formData.physicalAddress &&
    formData.postalAddress &&
    formData.phoneNumber &&
    formData.email;

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Section: Location */}
      <motion.div {...fadeUp(0.05)}>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Location</p>
      </motion.div>

      {/* Row: County + Sub-County */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div className="space-y-2" {...fadeUp(0.08)}>
          <Label htmlFor="county" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            County <span className="text-red-400">*</span>
          </Label>
          <Input
            id="county"
            value={formData.county}
            onChange={(e) => handleChange('county', e.target.value)}
            placeholder="e.g., Nairobi"
            className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100 transition-colors"
            required
          />
        </motion.div>

        <motion.div className="space-y-2" {...fadeUp(0.12)}>
          <Label htmlFor="subCounty" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Sub-County <span className="text-red-400">*</span>
          </Label>
          <Input
            id="subCounty"
            value={formData.subCounty}
            onChange={(e) => handleChange('subCounty', e.target.value)}
            placeholder="e.g., Westlands"
            className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100 transition-colors"
            required
          />
        </motion.div>
      </div>

      {/* Row: Ward + Physical Address */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div className="space-y-2" {...fadeUp(0.16)}>
          <Label htmlFor="ward" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <MapPinned className="w-3.5 h-3.5 text-slate-400" />
            Ward <span className="text-red-400">*</span>
          </Label>
          <Input
            id="ward"
            value={formData.ward}
            onChange={(e) => handleChange('ward', e.target.value)}
            placeholder="e.g., Parklands"
            className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100 transition-colors"
            required
          />
        </motion.div>

        <motion.div className="space-y-2" {...fadeUp(0.2)}>
          <Label htmlFor="physicalAddress" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            Physical Address <span className="text-red-400">*</span>
          </Label>
          <Input
            id="physicalAddress"
            value={formData.physicalAddress}
            onChange={(e) => handleChange('physicalAddress', e.target.value)}
            placeholder="e.g., Waiyaki Way, Westlands"
            className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100 transition-colors"
            required
          />
        </motion.div>
      </div>

      {/* Postal Address - full width */}
      <motion.div className="space-y-2" {...fadeUp(0.24)}>
        <Label htmlFor="postalAddress" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          Postal Address <span className="text-red-400">*</span>
        </Label>
        <Input
          id="postalAddress"
          value={formData.postalAddress}
          onChange={(e) => handleChange('postalAddress', e.target.value)}
          placeholder="e.g., P.O. Box 123-00100, Nairobi"
          className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100 transition-colors"
          required
        />
      </motion.div>

      {/* Divider + Section: Contact */}
      <motion.div {...fadeUp(0.28)}>
        <div className="border-t border-slate-100 pt-5 mt-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact Information</p>
        </div>
      </motion.div>

      {/* Row: Phone + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div className="space-y-2" {...fadeUp(0.32)}>
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
            className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100 transition-colors"
            required
          />
        </motion.div>

        <motion.div className="space-y-2" {...fadeUp(0.36)}>
          <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            Official Email <span className="text-red-400">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="e.g., info@school.ac.ke"
            className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100 transition-colors"
            required
          />
        </motion.div>
      </div>

      {/* Website - full width */}
      <motion.div className="space-y-2" {...fadeUp(0.4)}>
        <Label htmlFor="website" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          Website <span className="text-slate-300 text-xs font-normal">(Optional)</span>
        </Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="e.g., https://www.school.ac.ke"
          className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100 transition-colors"
        />
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex items-center justify-between pt-6 border-t border-slate-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.45 }}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 h-11 px-5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous Step
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-6 rounded-xl shadow-sm shadow-emerald-200 transition-all duration-200 disabled:opacity-40"
        >
          Next: Administrator Details
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </form>
  );
}
