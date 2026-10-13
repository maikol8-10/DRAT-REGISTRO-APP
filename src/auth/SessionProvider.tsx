import { useMemo, useState, type PropsWithChildren } from 'react';

import { login } from '@/services/api';
import { SessionContext, type Session } from './SessionContext';

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);

  const value = useMemo(() => ({
    session,
    signIn: async (email: string, password: string) => setSession(await login(email, password)),
    signOut: () => setSession(null),
  }), [session]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
