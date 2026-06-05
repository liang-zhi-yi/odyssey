/** User types — matching backend app/auth/schemas.py UserResponse */

export interface SocialLink {
  platform: string;
  url: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  nickname: string | null;
  github_username: string | null;
  avatar_url: string | null;
  bio: string | null;
  title: string | null;
  location: string | null;
  website: string | null;
  social_links: SocialLink[] | null;
}

export interface UpdateProfileRequest {
  nickname?: string;
  bio?: string;
  avatar_url?: string;
  github_username?: string;
  title?: string;
  location?: string;
  website?: string;
  social_links?: SocialLink[];
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
