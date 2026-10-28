import { auth } from "@/lib/auth";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const { data, error } = await auth.getSession();
  const user = data?.user;

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
