import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SchoolRegistrationStep1, SchoolType, LevelOffered } from '@/types/school';
import { Upload, X, ArrowRight, ArrowLeft } from 'lucide-react';

interface Props {
  initialData: SchoolRegistrationStep1;
  onSubmit: (data: SchoolRegistrationStep1) => void;
  onBack: () => void;
}

const levelOptions = [
  LevelOffered.PRE_PRIMARY,
  LevelOffered.LOWER_PRIMARY,
  LevelOffered.UPPER_PRIMARY,
  LevelOffered.JUNIOR_SECONDARY,
  LevelOffered.SENIOR_SECONDARY,
];

export default function SchoolBasicInfoStep({ initialData, onSubmit, onBack }: Props) {
  const [formData, setFormData] = useState<SchoolRegistrationStep1>(initialData);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const handleChange = <K extends keyof SchoolRegistrationStep1>(
    field: K,
    value: SchoolRegistrationStep1[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLevelToggle = (level: LevelOffered) => {
    setFormData(prev => ({
      ...prev,
      levelsOffered: prev.levelsOffered.includes(level)
        ? prev.levelsOffered.filter(l => l !== level)
        : [...prev.levelsOffered, level],
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo: undefined }));
    setLogoPreview('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isValid = 
    formData.name && 
    formData.code && 
    formData.schoolType && 
    formData.levelsOffered.length > 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* School Name */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Label htmlFor="name" className="text-base font-semibold">School Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter school name"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          required
        />
      </motion.div>

      {/* School Code */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Label htmlFor="code" className="text-base font-semibold">School Code *</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => handleChange('code', e.target.value)}
          placeholder="Enter school code"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          required
        />
      </motion.div>

      {/* School Type */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Label htmlFor="schoolType" className="text-base font-semibold">School Type *</Label>
        <Select
          value={formData.schoolType || ''}
          onValueChange={(value) => handleChange('schoolType', value as SchoolType)}
        >
          <SelectTrigger id="schoolType" className="transition-all duration-200 focus:ring-2 focus:ring-blue-500">
            <SelectValue placeholder="Select school type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SchoolType.PUBLIC}>Public School</SelectItem>
            <SelectItem value={SchoolType.PRIVATE}>Private School</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Levels Offered */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Label className="text-base font-semibold">Levels Offered *</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Select all levels that apply to your school
        </p>
        <div className="space-y-3">
          {levelOptions.map((level, index) => (
            <motion.div 
              key={level} 
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
            >
              <Checkbox
                id={level}
                checked={formData.levelsOffered.includes(level)}
                onCheckedChange={() => handleLevelToggle(level)}
              />
              <Label
                htmlFor={level}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {level}
              </Label>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Year Established */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Label htmlFor="yearEstablished" className="text-base font-semibold">Year Established (Optional)</Label>
        <Input
          id="yearEstablished"
          type="number"
          min="1900"
          max={new Date().getFullYear()}
          value={formData.yearEstablished}
          onChange={(e) => handleChange('yearEstablished', e.target.value)}
          placeholder="e.g., 1995"
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        />
      </motion.div>

      {/* School Motto */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.55 }}
      >
        <Label htmlFor="motto" className="text-base font-semibold">School Motto (Optional)</Label>
        <Textarea
          id="motto"
          value={formData.motto}
          onChange={(e) => handleChange('motto', e.target.value)}
          placeholder="Enter school motto"
          rows={3}
          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        />
      </motion.div>

      {/* School Logo */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Label htmlFor="logo" className="text-base font-semibold">School Logo (Optional)</Label>
        {logoPreview ? (
          <motion.div 
            className="relative inline-block"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={logoPreview}
              alt="Logo preview"
              className="w-32 h-32 object-contain border rounded-md shadow-md"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={removeLogo}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
            <Label
              htmlFor="logo"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-primary" />
              <span className="text-sm text-muted-foreground font-medium">
                Click to upload school logo
              </span>
              <span className="text-xs text-muted-foreground">
                PNG, JPG up to 5MB
              </span>
            </Label>
          </motion.div>
        )}
      </motion.div>

      {/* Form Actions */}
      <motion.div 
        className="flex justify-between pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-md"
        >
          Next: Location & Contact
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </form>
  );
}
