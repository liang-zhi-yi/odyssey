/** User types — matching backend app/auth/schemas.py UserResponse */

export interface User {
  id: string;
  username: string;
  email: string;
  nickname: string | null;
  github_username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface UpdateProfileRequest {
  nickname?: string;
  bio?: string;
  avatar_url?: string;
  github_username?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
