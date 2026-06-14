import { useState } from 'react';
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
import { Upload, X, ArrowRight, ArrowLeft, Building2, Hash, BookOpen, Calendar, Quote, ImageIcon } from 'lucide-react';

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

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Row: School Name + School Code */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div className="space-y-2" {...fadeUp(0.05)}>
          <Label htmlFor="name" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            School Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Sunrise Academy"
            className="h-11 border-slate-200 focus:border-indigo-400 focus:ring-indigo-100 transition-colors"
            required
          />
        </motion.div>

        <motion.div className="space-y-2" {...fadeUp(0.1)}>
          <Label htmlFor="code" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            School Code <span className="text-red-400">*</span>
          </Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="e.g., SCH-001"
            className="h-11 border-slate-200 focus:border-indigo-400 focus:ring-indigo-100 transition-colors"
            required
          />
        </motion.div>
      </div>

      {/* Row: School Type + Year Established */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div className="space-y-2" {...fadeUp(0.15)}>
          <Label htmlFor="schoolType" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            School Type <span className="text-red-400">*</span>
          </Label>
          <Select
            value={formData.schoolType || ''}
            onValueChange={(value) => handleChange('schoolType', value as SchoolType)}
          >
            <SelectTrigger id="schoolType" className="h-11 border-slate-200 focus:border-indigo-400 focus:ring-indigo-100 transition-colors">
              <SelectValue placeholder="Select school type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SchoolType.PUBLIC}>Public School</SelectItem>
              <SelectItem value={SchoolType.PRIVATE}>Private School</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div className="space-y-2" {...fadeUp(0.2)}>
          <Label htmlFor="yearEstablished" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Year Established <span className="text-slate-300 text-xs font-normal">(Optional)</span>
          </Label>
          <Input
            id="yearEstablished"
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            value={formData.yearEstablished}
            onChange={(e) => handleChange('yearEstablished', e.target.value)}
            placeholder="e.g., 1995"
            className="h-11 border-slate-200 focus:border-indigo-400 focus:ring-indigo-100 transition-colors"
          />
        </motion.div>
      </div>

      {/* Levels Offered */}
      <motion.div className="space-y-3" {...fadeUp(0.25)}>
        <Label className="text-sm font-medium text-slate-700">
          Levels Offered <span className="text-red-400">*</span>
        </Label>
        <p className="text-xs text-slate-400">
          Select all education levels your school provides
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {levelOptions.map((level, index) => (
            <motion.div
              key={level}
              className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                formData.levelsOffered.includes(level)
                  ? 'border-indigo-200 bg-indigo-50/50'
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
              }`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: 0.3 + index * 0.04 }}
              onClick={() => handleLevelToggle(level)}
            >
              <Checkbox
                id={level}
                checked={formData.levelsOffered.includes(level)}
                onCheckedChange={() => handleLevelToggle(level)}
                className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
              />
              <Label
                htmlFor={level}
                className="text-sm font-normal cursor-pointer flex-1 text-slate-600"
              >
                {level}
              </Label>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* School Motto */}
      <motion.div className="space-y-2" {...fadeUp(0.5)}>
        <Label htmlFor="motto" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <Quote className="w-3.5 h-3.5 text-slate-400" />
          School Motto <span className="text-slate-300 text-xs font-normal">(Optional)</span>
        </Label>
        <Textarea
          id="motto"
          value={formData.motto}
          onChange={(e) => handleChange('motto', e.target.value)}
          placeholder="Enter your school's motto or slogan"
          rows={2}
          className="border-slate-200 focus:border-indigo-400 focus:ring-indigo-100 transition-colors resize-none"
        />
      </motion.div>

      {/* School Logo */}
      <motion.div className="space-y-2" {...fadeUp(0.55)}>
        <Label htmlFor="logo" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
          School Logo <span className="text-slate-300 text-xs font-normal">(Optional)</span>
        </Label>
        {logoPreview ? (
          <motion.div
            className="relative inline-block"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <img
              src={logoPreview}
              alt="Logo preview"
              className="w-28 h-28 object-contain border border-slate-200 rounded-xl bg-white p-2"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-sm"
              onClick={removeLogo}
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-200 cursor-pointer">
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
            <Label
              htmlFor="logo"
              className="cursor-pointer flex flex-col items-center gap-1.5"
            >
              <Upload className="w-7 h-7 text-slate-300" />
              <span className="text-sm text-slate-500 font-medium">
                Click to upload school logo
              </span>
              <span className="text-xs text-slate-300">
                PNG, JPG up to 5MB
              </span>
            </Label>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex items-center justify-between pt-6 border-t border-slate-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 h-11 px-5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-6 rounded-xl shadow-sm shadow-indigo-200 transition-all duration-200 disabled:opacity-40"
        >
          Next: Location & Contact
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </form>
  );
}
