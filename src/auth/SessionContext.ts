import { createContext, useContext } from 'react';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMINISTRADOR' | 'GUARDA';
};

export type Session = { token: string; user: SessionUser };

type SessionContextValue = {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession debe utilizarse dentro de SessionProvider');
  return value;
}
