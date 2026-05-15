export type User = {
  id: number;
  username?: string;
  name: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  phone_number?: string | null;
  role?: string;
  roles?: string[];
  permissions?: string[];
  avatar?: string;
  email_verified_at: string | null;
  two_factor_enabled?: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
};

export type Auth = {
  user: User;
};
