/** Passport types — matching backend app/passport/schemas.py */

export interface PassportSkillEntry {
  name: string;
  rank: string;
  score: number;
}

export interface PassportCredentialEntry {
  name: string;
}

export interface PassportProjectEntry {
  title: string;
}

export interface Passport {
  user: string;
  skills: PassportSkillEntry[];
  credentials: PassportCredentialEntry[];
  projects: PassportProjectEntry[];
}
