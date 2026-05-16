// src/data/clients.ts
export interface Client {
  id: number;
  name: string;
  location: string;
  category: 'primary' | 'secondary' | 'international' | 'private';
  logo?: string;
  students?: number;
  since?: number;
  description?: string;
  website?: string;
}

export const clients: Client[] = [
  // Primary Schools
  {
    id: 1,
    name: 'Makini School',
    location: 'Nairobi',
    category: 'primary',
    students: 850,
    since: 2021,
    description: 'Leading primary school implementing CBE curriculum',
    website: 'https://makini.ac.ke'
  },
  {
    id: 2,
    name: 'Brookhouse School',
    location: 'Nairobi',
    category: 'primary',
    students: 720,
    since: 2022,
    description: 'Innovative CBE-focused primary education',
  },
  {
    id: 3,
    name: 'Peponi School',
    location: 'Nairobi',
    category: 'primary',
    students: 650,
    since: 2021,
  },
  {
    id: 4,
    name: 'Riara School',
    location: 'Nairobi',
    category: 'primary',
    students: 580,
    since: 2022,
  },
  {
    id: 5,
    name: 'Oshwal Academy',
    location: 'Nairobi',
    category: 'primary',
    students: 920,
    since: 2020,
  },
  {
    id: 6,
    name: 'Hillcrest International',
    location: 'Nairobi',
    category: 'primary',
    students: 700,
    since: 2021,
  },

  // Secondary Schools
  {
    id: 7,
    name: 'Alliance High School',
    location: 'Kikuyu',
    category: 'secondary',
    students: 1200,
    since: 2021,
    description: 'Premier boys secondary school adopting CBE',
  },
  {
    id: 8,
    name: 'Kenya High School',
    location: 'Nairobi',
    category: 'secondary',
    students: 1100,
    since: 2022,
    description: 'Top-tier girls secondary school',
  },
  {
    id: 9,
    name: 'Starehe Boys Centre',
    location: 'Nairobi',
    category: 'secondary',
    students: 1300,
    since: 2021,
  },
  {
    id: 10,
    name: 'Moi Girls School',
    location: 'Nairobi',
    category: 'secondary',
    students: 980,
    since: 2022,
  },
  {
    id: 11,
    name: 'Nairobi School',
    location: 'Nairobi',
    category: 'secondary',
    students: 1150,
    since: 2020,
  },
  {
    id: 12,
    name: 'Precious Blood Riruta',
    location: 'Nairobi',
    category: 'secondary',
    students: 890,
    since: 2021,
  },

  // International Schools
  {
    id: 13,
    name: 'International School of Kenya',
    location: 'Nairobi',
    category: 'international',
    students: 950,
    since: 2020,
    description: 'Leading international school with CBE integration',
  },
  {
    id: 14,
    name: 'Braeburn School',
    location: 'Nairobi',
    category: 'international',
    students: 800,
    since: 2021,
  },
  {
    id: 15,
    name: 'Rosslyn Academy',
    location: 'Nairobi',
    category: 'international',
    students: 750,
    since: 2022,
  },
  {
    id: 16,
    name: 'St. Andrews School',
    location: 'Turi',
    category: 'international',
    students: 680,
    since: 2021,
  },

  // Private Schools
  {
    id: 17,
    name: 'Braeside High School',
    location: 'Nairobi',
    category: 'private',
    students: 620,
    since: 2021,
  },
  {
    id: 18,
    name: 'Kenton College',
    location: 'Kiambu',
    category: 'private',
    students: 550,
    since: 2022,
  },
  {
    id: 19,
    name: 'Rusinga School',
    location: 'Nairobi',
    category: 'private',
    students: 780,
    since: 2020,
  },
  {
    id: 20,
    name: 'Greensteds International',
    location: 'Nakuru',
    category: 'private',
    students: 640,
    since: 2021,
  },
];

export const clientStats = {
  totalSchools: 20,
  totalStudents: 16380,
  primarySchools: 6,
  secondarySchools: 6,
  internationalSchools: 4,
  privateSchools: 4,
};
