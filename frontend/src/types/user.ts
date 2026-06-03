/** User types — matching backend app/auth/schemas.py UserResponse */

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
}
