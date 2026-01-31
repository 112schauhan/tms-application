import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useMutation, useQuery, useApolloClient } from '@apollo/client/react';
import { LOGIN, REGISTER, LOGOUT, GET_ME } from '../graphql/operations';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'EMPLOYEE';
  isActive: boolean;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const client = useApolloClient();

  const { data: meData, loading: meLoading } = useQuery<{ me: User }>(GET_ME, {
    skip: !localStorage.getItem('accessToken'),
    fetchPolicy: 'network-only',
  });

  const [loginMutation] = useMutation<{ login: AuthResponse }>(LOGIN);
  const [registerMutation] = useMutation<{ register: AuthResponse }>(REGISTER);
  const [logoutMutation] = useMutation(LOGOUT);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      setLoading(false);
    } else if (!meLoading) {
      if (meData?.me) {
        setUser(meData.me);
      } else {
        // Token might be invalid
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      setLoading(false);
    }
  }, [meData, meLoading]);

  const login = async (email: string, password: string) => {
    const { data } = await loginMutation({
      variables: { input: { email, password } },
    });

    if (data?.login) {
      localStorage.setItem('accessToken', data.login.accessToken);
      localStorage.setItem('refreshToken', data.login.refreshToken);
      setUser(data.login.user);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const { data } = await registerMutation({
      variables: { input: { email, password, firstName, lastName } },
    });

    if (data?.register) {
      localStorage.setItem('accessToken', data.register.accessToken);
      localStorage.setItem('refreshToken', data.register.refreshToken);
      setUser(data.register.user);
    }
  };

  const logout = async () => {
    try {
      await logoutMutation();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      await client.clearStore();
    }
  };

  const value: AuthContextType = {
    user,
    loading: loading || meLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
