import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SchoolRegistrationStep2 } from '@/types/school';
import { ArrowRight, ArrowLeft } from 'lucide-react';

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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* County */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Label htmlFor="county" className="text-base font-semibold">County *</Label>
        <Input
          id="county"
          value={formData.county}
          onChange={(e) => handleChange('county', e.target.value)}
          placeholder="Enter county"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          required
        />
      </motion.div>

      {/* Sub-County */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Label htmlFor="subCounty" className="text-base font-semibold">Sub-County *</Label>
        <Input
          id="subCounty"
          value={formData.subCounty}
          onChange={(e) => handleChange('subCounty', e.target.value)}
          placeholder="Enter sub-county"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          required
        />
      </motion.div>

      {/* Ward */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Label htmlFor="ward" className="text-base font-semibold">Ward *</Label>
        <Input
          id="ward"
          value={formData.ward}
          onChange={(e) => handleChange('ward', e.target.value)}
          placeholder="Enter ward"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          required
        />
      </motion.div>

      {/* Physical Address */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Label htmlFor="physicalAddress" className="text-base font-semibold">Physical Address *</Label>
        <Input
          id="physicalAddress"
          value={formData.physicalAddress}
          onChange={(e) => handleChange('physicalAddress', e.target.value)}
          placeholder="Enter physical address"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          required
        />
      </motion.div>

      {/* Postal Address */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Label htmlFor="postalAddress" className="text-base font-semibold">Postal Address *</Label>
        <Input
          id="postalAddress"
          value={formData.postalAddress}
          onChange={(e) => handleChange('postalAddress', e.target.value)}
          placeholder="e.g., P.O. Box 123-00100, Nairobi"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          required
        />
      </motion.div>

      {/* Phone Number */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
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

      {/* Official Email */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Label htmlFor="email" className="text-base font-semibold">Official Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="e.g., info@school.ac.ke"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          required
        />
      </motion.div>

      {/* Website */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.45 }}
      >
        <Label htmlFor="website" className="text-base font-semibold">Website (Optional)</Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="e.g., https://www.school.ac.ke"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        />
      </motion.div>

      {/* Form Actions */}
      <motion.div 
        className="flex justify-between pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous Step
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-md"
        >
          Next: Administrator Details
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </form>
  );
}
