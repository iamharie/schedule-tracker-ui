import { createContext, useContext } from 'react';
import { gql, useQuery, useMutation, useApolloClient } from '@apollo/client';

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      isVerified
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id
      email
      isVerified
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export type AuthUser = { id: string; email: string; isVerified: boolean };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const apolloClient = useApolloClient();
  const { data, loading, refetch } = useQuery<{ me: AuthUser | null }>(ME_QUERY, {
    errorPolicy: 'ignore',
  });
  const [loginMutation] = useMutation<{ login: AuthUser }>(LOGIN_MUTATION);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);

  const user = data?.me ?? null;

  async function login(email: string, password: string): Promise<AuthUser> {
    const result = await loginMutation({ variables: { email, password } });
    if (!result.data?.login) throw new Error('Login failed');
    await refetch();
    return result.data.login;
  }

  async function logout(): Promise<void> {
    try {
      await logoutMutation();
    } catch {
      // Server-side logout errors are non-fatal — clear local state regardless
    }
    await apolloClient.clearStore();
    await refetch();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider');
  return ctx;
}
