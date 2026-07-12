// Fee structure templates — a starting point the admin can apply to a
// grade and then customize. Amounts are realistic per-term figures for
// each school type (KES), based on typical Kenyan CBC fee structures:
// public day schools are near-free under FDSE, public boarding schools
// follow the Ministry of Education's boarding fee caps, and private/
// international figures reflect commonly published ranges.
//
// Categories are restricted to the 8 the backend accepts:
// tuition, activity, uniform, transport, meals, examination, registration, other.

export type TemplateFrequency = 'per_term' | 'per_year' | 'once_off' | 'monthly';

export interface TemplateItem {
  category: 'tuition' | 'activity' | 'uniform' | 'transport' | 'meals' | 'examination' | 'registration' | 'other';
  label: string;
  amount: number;
  frequency: TemplateFrequency;
  is_mandatory: boolean;
  note?: string;
}

export interface FeeStructureTemplate {
  id: string;
  name: string;
  tag: string;
  description: string;
  items: TemplateItem[];
}

export const FEE_STRUCTURE_TEMPLATES: FeeStructureTemplate[] = [
  {
    id: 'public-day',
    name: 'Public day school (FDSE)',
    tag: 'Public · Day',
    description: 'Tuition-free under the Free Day Secondary Education programme — parents cover only incidental costs.',
    items: [
      { category: 'tuition', label: 'Tuition (government funded — FDSE)', amount: 0, frequency: 'per_term', is_mandatory: true, note: 'Covered by government capitation' },
      { category: 'registration', label: 'Admission fee', amount: 500, frequency: 'once_off', is_mandatory: true },
      { category: 'activity', label: 'Co-curricular activity levy', amount: 300, frequency: 'per_term', is_mandatory: true },
      { category: 'uniform', label: 'School uniform', amount: 3500, frequency: 'once_off', is_mandatory: true },
      { category: 'transport', label: 'Transport (optional)', amount: 1500, frequency: 'per_term', is_mandatory: false },
      { category: 'meals', label: 'Lunch programme', amount: 2000, frequency: 'per_term', is_mandatory: false },
      { category: 'examination', label: 'Internal exam fee', amount: 300, frequency: 'per_term', is_mandatory: true },
      { category: 'other', label: 'Stationery & activity levy', amount: 500, frequency: 'per_term', is_mandatory: true },
    ],
  },
  {
    id: 'public-boarding',
    name: 'Public boarding school',
    tag: 'Public · Boarding',
    description: 'Follows the Ministry of Education boarding fee cap for urban public boarding schools.',
    items: [
      { category: 'tuition', label: 'Tuition (government funded — FDSE)', amount: 0, frequency: 'per_term', is_mandatory: true, note: 'Covered by government capitation' },
      { category: 'registration', label: 'Admission fee', amount: 1000, frequency: 'once_off', is_mandatory: true },
      { category: 'meals', label: 'Boarding & meals', amount: 17850, frequency: 'per_term', is_mandatory: true, note: '≈ KES 53,554/year, the MoE urban boarding cap' },
      { category: 'uniform', label: 'School uniform', amount: 4500, frequency: 'once_off', is_mandatory: true },
      { category: 'activity', label: 'Co-curricular activity levy', amount: 500, frequency: 'per_term', is_mandatory: true },
      { category: 'examination', label: 'Internal exam fee', amount: 400, frequency: 'per_term', is_mandatory: true },
      { category: 'other', label: 'Boarding equipment & stores', amount: 1000, frequency: 'per_term', is_mandatory: true },
    ],
  },
  {
    id: 'private-day-budget',
    name: 'Private day school — budget',
    tag: 'Private · Day',
    description: 'Entry-level private CBC day school, roughly KES 50,000–80,000 per year.',
    items: [
      { category: 'tuition', label: 'Tuition', amount: 15000, frequency: 'per_term', is_mandatory: true },
      { category: 'registration', label: 'Admission fee', amount: 5000, frequency: 'once_off', is_mandatory: true },
      { category: 'uniform', label: 'School uniform', amount: 4000, frequency: 'once_off', is_mandatory: true },
      { category: 'activity', label: 'Co-curricular activities', amount: 1500, frequency: 'per_term', is_mandatory: true },
      { category: 'transport', label: 'Transport (optional)', amount: 3000, frequency: 'per_term', is_mandatory: false },
      { category: 'meals', label: 'Lunch programme', amount: 3500, frequency: 'per_term', is_mandatory: false },
      { category: 'examination', label: 'Exam fee', amount: 800, frequency: 'per_term', is_mandatory: true },
      { category: 'other', label: 'Books & stationery', amount: 1200, frequency: 'per_term', is_mandatory: true },
    ],
  },
  {
    id: 'private-day-standard',
    name: 'Private day school — standard',
    tag: 'Private · Day',
    description: 'Mid-range private CBC day school, roughly KES 80,000–150,000 per year.',
    items: [
      { category: 'tuition', label: 'Tuition', amount: 28000, frequency: 'per_term', is_mandatory: true },
      { category: 'registration', label: 'Admission fee', amount: 8000, frequency: 'once_off', is_mandatory: true },
      { category: 'uniform', label: 'School uniform', amount: 5500, frequency: 'once_off', is_mandatory: true },
      { category: 'activity', label: 'Co-curricular activities', amount: 2500, frequency: 'per_term', is_mandatory: true },
      { category: 'transport', label: 'Transport (optional)', amount: 4500, frequency: 'per_term', is_mandatory: false },
      { category: 'meals', label: 'Lunch programme', amount: 5000, frequency: 'per_term', is_mandatory: false },
      { category: 'examination', label: 'Exam fee', amount: 1200, frequency: 'per_term', is_mandatory: true },
      { category: 'other', label: 'Books, stationery & ICT levy', amount: 2000, frequency: 'per_term', is_mandatory: true },
    ],
  },
  {
    id: 'private-boarding-midtier',
    name: 'Private boarding school — mid-tier',
    tag: 'Private · Boarding',
    description: 'Established private boarding school, roughly KES 150,000–300,000 per year.',
    items: [
      { category: 'tuition', label: 'Tuition', amount: 40000, frequency: 'per_term', is_mandatory: true },
      { category: 'registration', label: 'Admission fee', amount: 10000, frequency: 'once_off', is_mandatory: true },
      { category: 'meals', label: 'Boarding & meals', amount: 15000, frequency: 'per_term', is_mandatory: true },
      { category: 'uniform', label: 'School uniform', amount: 6500, frequency: 'once_off', is_mandatory: true },
      { category: 'activity', label: 'Co-curricular activities', amount: 3000, frequency: 'per_term', is_mandatory: true },
      { category: 'examination', label: 'Exam fee', amount: 1500, frequency: 'per_term', is_mandatory: true },
      { category: 'other', label: 'Boarding equipment & stores', amount: 2500, frequency: 'per_term', is_mandatory: true },
    ],
  },
  {
    id: 'premium-international',
    name: 'Premium / international school',
    tag: 'International',
    description: 'International curriculum school with Cambridge/IB fees, roughly KES 800,000–1,500,000 per year.',
    items: [
      { category: 'tuition', label: 'Tuition', amount: 220000, frequency: 'per_term', is_mandatory: true },
      { category: 'registration', label: 'Admission fee', amount: 50000, frequency: 'once_off', is_mandatory: true },
      { category: 'uniform', label: 'School uniform', amount: 12000, frequency: 'once_off', is_mandatory: true },
      { category: 'activity', label: 'Co-curricular activities & trips', amount: 15000, frequency: 'per_term', is_mandatory: true },
      { category: 'transport', label: 'Transport (optional)', amount: 12000, frequency: 'per_term', is_mandatory: false },
      { category: 'meals', label: 'Meals programme', amount: 18000, frequency: 'per_term', is_mandatory: true },
      { category: 'examination', label: 'Cambridge/IB examination fee', amount: 8000, frequency: 'per_term', is_mandatory: true },
      { category: 'other', label: 'Technology & laptop levy', amount: 10000, frequency: 'per_term', is_mandatory: true },
    ],
  },
  {
    id: 'faith-based-private',
    name: 'Faith-based private school',
    tag: 'Private · Faith-based',
    description: 'Standard private day school with religious studies materials included, roughly KES 60,000–120,000 per year.',
    items: [
      { category: 'tuition', label: 'Tuition', amount: 18000, frequency: 'per_term', is_mandatory: true },
      { category: 'registration', label: 'Admission fee', amount: 4000, frequency: 'once_off', is_mandatory: true },
      { category: 'uniform', label: 'School uniform', amount: 4000, frequency: 'once_off', is_mandatory: true },
      { category: 'activity', label: 'Co-curricular activities', amount: 1200, frequency: 'per_term', is_mandatory: true },
      { category: 'transport', label: 'Transport (optional)', amount: 3000, frequency: 'per_term', is_mandatory: false },
      { category: 'meals', label: 'Lunch programme', amount: 3000, frequency: 'per_term', is_mandatory: false },
      { category: 'examination', label: 'Exam fee', amount: 700, frequency: 'per_term', is_mandatory: true },
      { category: 'other', label: 'Religious studies materials', amount: 1500, frequency: 'per_term', is_mandatory: true },
    ],
  },
  {
    id: 'ecde-pre-primary',
    name: 'ECDE / pre-primary (PP1–PP2)',
    tag: 'Early years',
    description: 'Specialist pre-primary programme, roughly KES 40,000–90,000 per year — no formal exam fee at this level.',
    items: [
      { category: 'tuition', label: 'Tuition', amount: 10000, frequency: 'per_term', is_mandatory: true },
      { category: 'registration', label: 'Admission fee', amount: 3000, frequency: 'once_off', is_mandatory: true },
      { category: 'uniform', label: 'School uniform', amount: 2500, frequency: 'once_off', is_mandatory: true },
      { category: 'activity', label: 'Play-based learning materials', amount: 1000, frequency: 'per_term', is_mandatory: true },
      { category: 'transport', label: 'Transport (optional)', amount: 2500, frequency: 'per_term', is_mandatory: false },
      { category: 'meals', label: 'Snacks & lunch', amount: 3000, frequency: 'per_term', is_mandatory: true },
      { category: 'other', label: 'Learning materials & toys levy', amount: 1500, frequency: 'per_term', is_mandatory: true },
    ],
  },
];

// Rough annual total for display on the template card — per-term items
// are multiplied by 3 terms, once_off/per_year items counted once.
export const estimateAnnualTotal = (items: TemplateItem[]): number =>
  items.reduce((sum, item) => {
    if (item.frequency === 'per_term') return sum + item.amount * 3;
    if (item.frequency === 'monthly') return sum + item.amount * 12;
    return sum + item.amount;
  }, 0);
