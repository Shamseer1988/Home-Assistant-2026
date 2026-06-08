"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, login as loginRequest, logout as logoutRequest } from "./auth";

export function useAuth() {
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 60_000,
  });

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      loginRequest(username, password),
    onSuccess: (u) => qc.setQueryData(["me"], u),
  });

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => qc.setQueryData(["me"], null),
  });

  return {
    user: user ?? null,
    isLoading,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error as Error | null,
    loggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
  };
}
