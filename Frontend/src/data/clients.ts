export interface Client {
  id: string | number;
  name: string;
  location: string;
  description?: string;
  students?: number;
  since?: string;
  category?: string;
}

export const clients: Client[] = [];

export const clientStats = {
  totalSchools: 0,
  primarySchools: 0,
  secondarySchools: 0,
  internationalSchools: 0,
  privateSchools: 0,
  totalStudents: 0,
};
