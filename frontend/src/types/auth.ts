/** Auth request / response types — matching backend app/auth/schemas.py */

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  token: string;
  user_id: string | null;
}
