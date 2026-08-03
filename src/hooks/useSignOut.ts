import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Ordered sign-out: cancel queries, clear cache, end session, replace history. */
export function useSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }, [navigate, queryClient]);
}
