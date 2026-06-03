/** Credential types — matching backend app/credentials/schemas.py */

export interface Credential {
  id: string;
  name: string;
  description: string | null;
  required_score: number;
}

export interface UserCredential {
  id: string;
  name: string;
  issued_at: string;
}
