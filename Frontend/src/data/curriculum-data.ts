// CBE Curriculum Data Types

export interface CurriculumCompetency {
  id: string;
  code?: string;
  name: string;
  description: string;
  level: string;
  performance_indicators?: string[];
}

export interface CurriculumSubStrand {
  id: string;
  name: string;
  code?: string;
  description?: string;
  competencies: CurriculumCompetency[];
}

export interface CurriculumStrand {
  id: string;
  name: string;
  code?: string;
  description?: string;
  subStrands: CurriculumSubStrand[];
}

export interface CurriculumLearningArea {
  id: string;
  name: string;
  code: string;
  description?: string;
  strands: CurriculumStrand[];
  is_national?: boolean;
  school_id?: string | null;
  grade_levels?: string[];
}

// API Response type for learning areas
export interface ApiLearningArea {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_national?: boolean;
  school_id?: string | null;
  grade_levels?: string[];
  strands?: ApiStrand[];
}

export interface ApiStrand {
  id: string;
  name: string;
  code?: string;
  description?: string;
  sub_strands?: ApiSubStrand[];
}

export interface ApiSubStrand {
  id: string;
  name: string;
  code?: string;
  description?: string;
  competencies?: ApiCompetency[];
}

export interface ApiCompetency {
  id: string;
  name: string;
  description?: string;
  performance_indicators?: string[];
}

// Transform API response to component format
export const transformApiToCurriculum = (apiData: {
  learning_areas?: ApiLearningArea[];
}): CurriculumLearningArea[] => {
  if (!apiData.learning_areas) return [];
  
  return apiData.learning_areas.map(la => ({
    id: la.id,
    name: la.name,
    code: la.code,
    description: la.description,
    is_national: la.is_national,
    school_id: la.school_id,
    grade_levels: la.grade_levels,
    strands: (la.strands || []).map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      description: s.description,
      subStrands: (s.sub_strands || []).map(ss => ({
        id: ss.id,
        name: ss.name,
        code: ss.code,
        description: ss.description,
        competencies: (ss.competencies || []).map(c => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          level: '',
          performance_indicators: c.performance_indicators,
        })),
      })),
    })),
  }));
};

// Helper functions
export function getTotalStrands(data: CurriculumLearningArea[]): number {
  return data.reduce((total, area) => total + area.strands.length, 0);
}

export function getTotalCompetencies(data: CurriculumLearningArea[]): number {
  let total = 0;
  data.forEach(area => {
    area.strands.forEach(strand => {
      strand.subStrands.forEach(subStrand => {
        total += subStrand.competencies.length;
      });
    });
  });
  return total;
}

// Sample curriculum data structure (fallback when API is not available)
export const curriculumData: CurriculumLearningArea[] = [
  {
    id: 'la-1',
    name: 'English Language',
    code: 'ENG',
    description: 'Development of communication skills in English',
    strands: [
      {
        id: 'strand-1',
        name: 'Listening and Speaking',
        code: 'ENG-LS',
        subStrands: [
          {
            id: 'substrand-1',
            name: 'Listening',
            code: 'ENG-LS-1',
            competencies: [
              {
                id: 'comp-1',
                code: 'ENG-LS-1-1',
                name: 'Listen attentively to oral instructions and stories',
                description: 'Listen attentively to oral instructions and stories',
                level: 'Grade 1'
              }
            ]
          }
        ]
      }
    ]
  }
];

