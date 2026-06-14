import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
        className="space-y-1.5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <Label htmlFor="name" className="text-[13px] font-semibold text-gray-800 tracking-wide uppercase">
          School Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter school name"
          className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300"
          required
        />
      </motion.div>

      {/* School Code + Type row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <motion.div
          className="space-y-1.5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <Label htmlFor="code" className="text-[13px] font-semibold text-gray-800 tracking-wide uppercase">
            School Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="e.g., SCH-001"
            className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300"
            required
          />
        </motion.div>

        <motion.div
          className="space-y-1.5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <Label htmlFor="schoolType" className="text-[13px] font-semibold text-gray-800 tracking-wide uppercase">
            School Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.schoolType || ''}
            onValueChange={(value) => handleChange('schoolType', value as SchoolType)}
          >
            <SelectTrigger id="schoolType" className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SchoolType.PUBLIC}>Public School</SelectItem>
              <SelectItem value={SchoolType.PRIVATE}>Private School</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      </div>

      {/* Levels Offered */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        <Label className="text-[13px] font-semibold text-gray-800 tracking-wide uppercase">
          Levels Offered <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs text-gray-400 -mt-1">Select all levels that apply</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {levelOptions.map((level, index) => (
            <motion.div
              key={level}
              role="checkbox"
              aria-checked={formData.levelsOffered.includes(level)}
              tabIndex={0}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${
                formData.levelsOffered.includes(level)
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm shadow-indigo-100'
                  : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
              }`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: 0.25 + index * 0.04 }}
              onClick={() => handleLevelToggle(level)}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleLevelToggle(level); } }}
            >
              <div className={`h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center transition-colors ${
                formData.levelsOffered.includes(level)
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-300 bg-white'
              }`}>
                {formData.levelsOffered.includes(level) && (
                  <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3354 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.5553 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium cursor-pointer flex-1 text-gray-700">
                {level}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Year + Motto row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <motion.div
          className="space-y-1.5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.45 }}
        >
          <Label htmlFor="yearEstablished" className="text-[13px] font-semibold text-gray-800 tracking-wide uppercase">
            Year Established <span className="text-gray-300 text-[10px] normal-case tracking-normal">(Optional)</span>
          </Label>
          <Input
            id="yearEstablished"
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            value={formData.yearEstablished}
            onChange={(e) => handleChange('yearEstablished', e.target.value)}
            placeholder="e.g., 1995"
            className="h-12 text-base bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300"
          />
        </motion.div>

        <motion.div
          className="space-y-1.5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
        >
          <Label htmlFor="motto" className="text-[13px] font-semibold text-gray-800 tracking-wide uppercase">
            School Motto <span className="text-gray-300 text-[10px] normal-case tracking-normal">(Optional)</span>
          </Label>
          <Textarea
            id="motto"
            value={formData.motto}
            onChange={(e) => handleChange('motto', e.target.value)}
            placeholder="Enter motto or slogan"
            rows={2}
            className="bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none placeholder:text-gray-300"
          />
        </motion.div>
      </div>

      {/* Logo upload */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.55 }}
      >
        <Label className="text-[13px] font-semibold text-gray-800 tracking-wide uppercase">
          School Logo <span className="text-gray-300 text-[10px] normal-case tracking-normal">(Optional)</span>
        </Label>
        {logoPreview ? (
          <motion.div
            className="relative inline-block"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <img
              src={logoPreview}
              alt="Logo preview"
              className="w-24 h-24 object-contain border-2 border-gray-100 rounded-xl bg-white p-2"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
              onClick={removeLogo}
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group">
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
            <Label htmlFor="logo" className="cursor-pointer flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                <Upload className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Click to upload</span>
              <span className="text-xs text-gray-300">PNG, JPG up to 5MB</span>
            </Label>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex items-center justify-between pt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 h-12 px-5 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          type="submit"
          disabled={!isValid}
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 rounded-xl text-base font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-200 disabled:opacity-40 disabled:shadow-none"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </form>
  );
}
