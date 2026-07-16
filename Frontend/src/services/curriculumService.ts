// Curriculum Service - handles data operations for the CBC Curriculum system

export interface LearningArea {
  code: string;
  name: string;
  desc: string;
  strands: number;
  subStrands: number;
  competencies: number;
  optional: boolean;
  strandList: Strand[];
  competencyList: string[];
}

export interface Strand {
  name: string;
  subStrands: string[];
}

export interface CurriculumLevel {
  id: string;
  level: string;
  grades: string;
  areas: LearningArea[];
}

export interface CurriculumStats {
  total: number;
  byLevel: Record<string, number>;
  strands: number;
  subStrands: number;
  competencies: number;
}

export interface FilterOptions {
  search: string;
  level: string;
  type: string;
  minStrands: string;
  minComp: string;
}

// ── Full curriculum data with nested strands ─────────────────────────────────
export const CURRICULUM_DATA: CurriculumLevel[] = [
  {
    id: "pp", level: "Pre-Primary", grades: "PP1 – PP2",
    areas: [
      {
        code: "PPLANG", name: "Language Activities",
        desc: "Development of pre-reading and pre-writing skills",
        strands: 2, subStrands: 4, competencies: 5, optional: false,
        strandList: [
          { name: "Listening and Speaking", subStrands: ["Listening Comprehension", "Vocabulary Development"] },
          { name: "Reading Readiness", subStrands: ["Print Awareness", "Phonemic Awareness"] },
        ],
        competencyList: ["Listen to stories and respond", "Follow simple instructions", "Use new words", "Handle books", "Identify rhyming words"],
      },
      {
        code: "PPMATH", name: "Mathematical Activities",
        desc: "Foundational numeracy skills",
        strands: 3, subStrands: 3, competencies: 3, optional: false,
        strandList: [
          { name: "Classification", subStrands: ["Sorting and Grouping"] },
          { name: "Number Concepts", subStrands: ["Counting 1–5 / 1–20"] },
          { name: "Measurement", subStrands: ["Mass (Heavy and Light)"] },
        ],
        competencyList: ["Sort objects by color, size and shape", "Count forwards and backwards", "Compare heavy and light objects"],
      },
      {
        code: "PPENV",  name: "Environmental Activities",
        desc: "Awareness of self and environment",
        strands: 1, subStrands: 2, competencies: 2, optional: false,
        strandList: [{ name: "Our Environment", subStrands: ["Living Things", "Non-living Things"] }],
        competencyList: ["Identify living things", "Describe the immediate environment"],
      },
      {
        code: "PPPSY",  name: "Psychomotor & Creative Activities",
        desc: "Physical development and creativity",
        strands: 1, subStrands: 1, competencies: 2, optional: false,
        strandList: [{ name: "Creative Expression", subStrands: ["Arts and Crafts"] }],
        competencyList: ["Demonstrate basic motor skills", "Create simple art pieces"],
      },
      {
        code: "PPRE",   name: "Religious Education Activities",
        desc: "Moral and spiritual development",
        strands: 1, subStrands: 1, competencies: 1, optional: false,
        strandList: [{ name: "Moral Values", subStrands: ["Honesty and Respect"] }],
        competencyList: ["Demonstrate basic moral values"],
      },
    ],
  },
  {
    id: "lp", level: "Lower Primary", grades: "Grade 1 – 3",
    areas: [
      { code: "LPLIT",  name: "Literacy Activities",            desc: "Reading and writing foundation",    strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Reading", subStrands: ["Reading Fluency"] }], competencyList: ["Read simple words and sentences"] },
      { code: "LPENG",  name: "English Language Activities",    desc: "English language skills",           strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Oral Skills", subStrands: ["Speaking and Listening"] }], competencyList: ["Communicate effectively in English"] },
      { code: "LPKIS",  name: "Kiswahili Language Activities",  desc: "Kiswahili language skills",         strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Stadi za Mdomo", subStrands: ["Kusikiliza na Kuzungumza"] }], competencyList: ["Communicate effectively in Kiswahili"] },
      { code: "LPIND",  name: "Indigenous Language Activities", desc: "Mother tongue development",         strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Mother Tongue", subStrands: ["Basic Vocabulary"] }], competencyList: ["Use mother tongue effectively"] },
      { code: "LPMATH", name: "Mathematical Activities",        desc: "Numeracy skills",                   strands: 1, subStrands: 2, competencies: 2, optional: false, strandList: [{ name: "Numbers", subStrands: ["Number Concepts 1–100", "Addition and Subtraction"] }], competencyList: ["Count and write numbers 1–100", "Perform addition up to 50"] },
      { code: "LPHYG",  name: "Hygiene & Nutrition Activities", desc: "Health and nutrition",              strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Personal Hygiene", subStrands: ["Cleanliness Practices"] }], competencyList: ["Practise good hygiene habits"] },
      { code: "LPRE",   name: "Religious Education Activities", desc: "Moral education",                   strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Values", subStrands: ["Moral Values"] }], competencyList: ["Demonstrate moral values"] },
      { code: "LPMOVE", name: "Movement & Creative Activities", desc: "Physical and creative expression",  strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Movement", subStrands: ["Basic Movement Skills"] }], competencyList: ["Perform basic movement skills"] },
    ],
  },
  {
    id: "up", level: "Upper Primary", grades: "Grade 4 – 6",
    areas: [
      { code: "UPENG",  name: "English",                      desc: "English language and literature",   strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Grammar", subStrands: ["Sentence Structure"] }], competencyList: ["Construct different sentence types"] },
      { code: "UPKIS",  name: "Kiswahili",                    desc: "Kiswahili language",                strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Sarufi", subStrands: ["Sentensi"] }], competencyList: ["Construct Kiswahili sentences"] },
      { code: "UPHSC",  name: "Home Science",                 desc: "Practical home management skills", strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Food and Nutrition", subStrands: ["Balanced Diet"] }], competencyList: ["Plan balanced meals"] },
      { code: "UPAGR",  name: "Agriculture",                  desc: "Farming and food production",      strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Crop Production", subStrands: ["Growing Crops"] }], competencyList: ["Practice basic crop cultivation"] },
      { code: "UPSCI",  name: "Science & Technology",         desc: "Scientific inquiry and technology", strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Living Things", subStrands: ["Plants"] }], competencyList: ["Investigate plant growth requirements"] },
      { code: "UPMATH", name: "Mathematics",                  desc: "Advanced numeracy",                strands: 2, subStrands: 2, competencies: 2, optional: false, strandList: [{ name: "Numbers", subStrands: ["Whole Number Operations"] }, { name: "Fractions", subStrands: ["Common Fractions"] }], competencyList: ["Multiply and divide whole numbers", "Add and subtract fractions"] },
      { code: "UPRE",   name: "Religious Education",          desc: "Religious and moral education",    strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Faith and Values", subStrands: ["Moral Teachings"] }], competencyList: ["Apply religious values in daily life"] },
      { code: "UPCRT",  name: "Creative Arts",                desc: "Art, music and creative expression", strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Visual Arts", subStrands: ["Drawing and Painting"] }], competencyList: ["Create basic artworks"] },
      { code: "UPPE",   name: "Physical & Health Education",  desc: "Physical fitness and health",      strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Fitness", subStrands: ["Physical Exercises"] }], competencyList: ["Demonstrate physical fitness"] },
      { code: "UPSS",   name: "Social Studies",               desc: "History, geography and citizenship", strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Our Community", subStrands: ["Community Resources"] }], competencyList: ["Identify community services"] },
    ],
  },
  {
    id: "js", level: "Junior Secondary", grades: "Grade 7 – 9",
    areas: [
      { code: "JSENG",  name: "English",               desc: "Advanced English language and literature",   strands: 2, subStrands: 2, competencies: 2, optional: false, strandList: [{ name: "Grammar in Use", subStrands: ["Verb Tenses"] }, { name: "Composition Writing", subStrands: ["Essay Writing"] }], competencyList: ["Use appropriate tenses", "Write narrative compositions"] },
      { code: "JSKIS",  name: "Kiswahili",              desc: "Advanced Kiswahili language",                strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Uandishi", subStrands: ["Insha"] }], competencyList: ["Write Kiswahili essays"] },
      { code: "JSMATH", name: "Mathematics",            desc: "Advanced mathematical concepts",             strands: 3, subStrands: 3, competencies: 3, optional: false, strandList: [{ name: "Numbers", subStrands: ["Integers"] }, { name: "Algebra", subStrands: ["Algebraic Expressions"] }, { name: "Geometry", subStrands: ["Angles"] }], competencyList: ["Perform operations with integers", "Simplify algebraic expressions", "Calculate angle relationships"] },
      { code: "JSSCI",  name: "Integrated Science",    desc: "Combined scientific disciplines",            strands: 3, subStrands: 3, competencies: 3, optional: false, strandList: [{ name: "Living Things", subStrands: ["Cells and Organisms"] }, { name: "Matter", subStrands: ["States of Matter"] }, { name: "Energy", subStrands: ["Forms of Energy"] }], competencyList: ["Identify cell structures", "Investigate states of matter", "Demonstrate energy transformations"] },
      { code: "JSHLT",  name: "Health Education",      desc: "Personal and community health",              strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Nutrition", subStrands: ["Balanced Diet"] }], competencyList: ["Plan balanced meals"] },
      { code: "JSPTE",  name: "Pre-Technical Edu",     desc: "Foundational technical and career skills",   strands: 2, subStrands: 2, competencies: 2, optional: false, strandList: [{ name: "Materials", subStrands: ["Properties of Materials"] }, { name: "Technical Drawing", subStrands: ["Basic Drawing"] }], competencyList: ["Identify material properties", "Create basic technical sketches"] },
      { code: "JSSS",   name: "Social Studies",        desc: "History, geography and citizenship",         strands: 2, subStrands: 2, competencies: 2, optional: false, strandList: [{ name: "History", subStrands: ["History of Kenya"] }, { name: "Geography", subStrands: ["Map Work"] }], competencyList: ["Trace origin of Kenyan communities", "Read and interpret maps"] },
      { code: "JSRE",   name: "Religious Education",   desc: "CRE / IRE / HRE",                            strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Faith", subStrands: ["Religious Teachings"] }], competencyList: ["Apply religious teachings"] },
      { code: "JSBUS",  name: "Business Studies",      desc: "Basic business concepts",                    strands: 2, subStrands: 2, competencies: 2, optional: false, strandList: [{ name: "Introduction", subStrands: ["Needs and Wants"] }, { name: "Enterprise", subStrands: ["Entrepreneurship"] }], competencyList: ["Differentiate needs and wants", "Develop entrepreneurial skills"] },
      { code: "JSAGR",  name: "Agriculture",           desc: "Farming and food production",                strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Crop Production", subStrands: ["Growing Crops"] }], competencyList: ["Practice crop cultivation"] },
      { code: "JSLSK",  name: "Life Skills Education", desc: "Personal and interpersonal skills",          strands: 2, subStrands: 2, competencies: 2, optional: false, strandList: [{ name: "Self-Awareness", subStrands: ["Self-Esteem"] }, { name: "Social Skills", subStrands: ["Effective Communication"] }], competencyList: ["Build and maintain self-esteem", "Demonstrate effective communication"] },
      { code: "JSSPT",  name: "Sports & PE",           desc: "Physical fitness and sports skills",         strands: 1, subStrands: 1, competencies: 1, optional: false, strandList: [{ name: "Games", subStrands: ["Ball Games"] }], competencyList: ["Demonstrate ball game skills"] },
      { code: "JSVIS",  name: "Visual Arts",           desc: "Optional visual arts subject",               strands: 1, subStrands: 1, competencies: 1, optional: true, strandList: [{ name: "Visual Arts", subStrands: ["Drawing and Design"] }], competencyList: ["Create visual artworks"] },
      { code: "JSPER",  name: "Performing Arts",       desc: "Optional performing arts subject",           strands: 1, subStrands: 1, competencies: 1, optional: true, strandList: [{ name: "Performance", subStrands: ["Drama and Music"] }], competencyList: ["Perform in drama or music"] },
      { code: "JSCSC",  name: "Computer Science",      desc: "Optional computer science subject",          strands: 1, subStrands: 1, competencies: 1, optional: true, strandList: [{ name: "Computer Basics", subStrands: ["Computer Hardware"] }], competencyList: ["Identify computer hardware components"] },
    ],
  },
];

// ── Level Configuration ───────────────────────────────────────────────────────
export const LEVEL_CONFIG: Record<string, {
  label: string;
  badge: string;
  icon: string;
  dot: string;
  gradient: string;
}> = {
  pp: { label: "Pre-Primary", badge: "bg-blue-50 text-blue-700 border-blue-200",   icon: "bg-blue-100 text-blue-600",   dot: "bg-blue-500",    gradient: "from-blue-600 to-blue-400" },
  lp: { label: "Lower Primary", badge: "bg-sky-50 text-sky-700 border-sky-200",     icon: "bg-sky-100 text-sky-600",     dot: "bg-sky-500",     gradient: "from-sky-600 to-sky-400" },
  up: { label: "Upper Primary", badge: "bg-violet-50 text-violet-700 border-violet-200", icon: "bg-violet-100 text-violet-600", dot: "bg-violet-500", gradient: "from-violet-600 to-violet-400" },
  js: { label: "Junior Secondary", badge: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: "bg-indigo-100 text-indigo-600", dot: "bg-indigo-500", gradient: "from-indigo-600 to-indigo-400" },
};

// ── Service Functions ─────────────────────────────────────────────────────────

/**
 * Get all learning areas flattened with level information
 */
export const getAllLearningAreas = () => {
  return CURRICULUM_DATA.flatMap(g => 
    g.areas.map(a => ({ ...a, levelId: g.id, level: g.level, grades: g.grades }))
  );
};

/**
 * Calculate curriculum statistics
 */
export const getCurriculumStats = () => {
  const allRows = getAllLearningAreas();
  const total = allRows.length;
  const byLevel = Object.fromEntries(
    CURRICULUM_DATA.map(g => [g.id, g.areas.length])
  ) as Record<string, number>;
  
  return {
    total,
    byLevel,
    strands: allRows.reduce((s, r) => s + r.strands, 0),
    subStrands: allRows.reduce((s, r) => s + r.subStrands, 0),
    competencies: allRows.reduce((s, r) => s + r.competencies, 0),
  };
};

/**
 * Filter learning areas based on filter options
 */
export const filterLearningAreas = (
  areas: ReturnType<typeof getAllLearningAreas>,
  filters: FilterOptions,
  kpiFilter: string | null
) => {
  const filtered = areas.filter(r => {
    const lvl = kpiFilter || filters.level;
    if (lvl !== "all" && lvl !== null && r.levelId !== lvl) return false;
    if (filters.type !== "all" && (filters.type === "optional" ? !r.optional : r.optional)) return false;
    if (filters.minStrands && r.strands < parseInt(filters.minStrands)) return false;
    if (filters.minComp && r.competencies < parseInt(filters.minComp)) return false;
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !r.code.toLowerCase().includes(q) && !r.level.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  
  return filtered;
};

/**
 * Get level cards for quick filtering
 */
export const getLevelCards = (stats: CurriculumStats) => [
  { id: "all", title: "All Levels", value: stats.total, sub: "Total areas", gradient: "from-slate-600 to-slate-500" },
  { id: "pp", title: "Pre-Primary", value: stats.byLevel.pp, sub: "PP1 – PP2", gradient: "from-blue-600 to-blue-400" },
  { id: "lp", title: "Lower Primary", value: stats.byLevel.lp, sub: "Grade 1 – 3", gradient: "from-emerald-600 to-emerald-400" },
  { id: "up", title: "Upper Primary", value: stats.byLevel.up, sub: "Grade 4 – 6", gradient: "from-violet-600 to-violet-400" },
  { id: "js", title: "Junior Secondary", value: stats.byLevel.js, sub: "Grade 7 – 9", gradient: "from-orange-500 to-orange-400" },
];

export default {
  CURRICULUM_DATA,
  LEVEL_CONFIG,
  getAllLearningAreas,
  getCurriculumStats,
  filterLearningAreas,
  getLevelCards,
};

