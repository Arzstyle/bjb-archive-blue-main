import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "./menus";

export interface AuthProfile {
  userId: string;
  username: string;
  role: Role;
  email: string;
}

export function useAuthProfile() {
  return useQuery<AuthProfile | null>({
    queryKey: ["auth-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, username")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        userId: user.id,
        username: data.username,
        role: data.role as Role,
        email: user.email ?? "",
      };
    },
    staleTime: 60_000,
  });
}