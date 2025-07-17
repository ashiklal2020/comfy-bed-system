
export interface User {
  id: number;
  username: string;
  role: 'admin' | 'student';
  full_name: string;
  email?: string;
  contact_info?: string;
  course?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}
