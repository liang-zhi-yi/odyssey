/** Path types — matching backend app/paths/schemas.py */

export interface GrowthPath {
  id: string;
  name: string;
  description: string | null;
  difficulty: number;
  is_official: boolean;
}

export interface SelectPathRequest {
  path_id: string;
}

export interface SelectPathResponse {
  status: string;
}

export interface UserPath {
  path_id: string;
  name: string;
  progress: number;
}
