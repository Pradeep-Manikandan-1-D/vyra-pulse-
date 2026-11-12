"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { clearCurrentCustomerSession } from "@/lib/customer/data";

export interface UserProfile {
  id: string;
  role: "admin" | "customer";
  display_name: string | null;
  avatar_url?: string | null;
  customer_id?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: "admin" | "customer" | null;
  isAdmin: boolean;
  isCustomer: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  login: (userData: User, profileData: UserProfile) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    const supabase = createClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, display_name, avatar_url")
        .eq("id", userId)
        .single();

      if (!error && data) {
        let customerId: string | undefined = undefined;

        if (data.role === "customer") {
          // Look up linked customer record using user_id
          const { data: custRecord } = await supabase
            .from("customers")
            .select("customer_id")
            .eq("user_id", userId)
            .maybeSingle();

          if (custRecord) {
            customerId = custRecord.customer_id;
          } else if (userEmail) {
            // Safe fallback: match by email and self-link if user_id was unset
            const { data: emailMatch } = await supabase
              .from("customers")
              .select("customer_id")
              .eq("email", userEmail)
              .maybeSingle();

            if (emailMatch) {
              customerId = emailMatch.customer_id;
              await supabase
                .from("customers")
                .update({ user_id: userId, updated_at: new Date().toISOString() })
                .eq("customer_id", emailMatch.customer_id);
            }
          }
        }

        const fullProfile: UserProfile = {
          ...(data as UserProfile),
          customer_id: customerId,
        };

        setProfile(fullProfile);

        // Synchronize active session cookie for middleware route protection
        const sessionPayload = {
          id: userId,
          email: userEmail,
          role: fullProfile.role,
          display_name: fullProfile.display_name,
          customer_id: fullProfile.customer_id,
        };
        try {
          localStorage.setItem("vyra_auth_session", JSON.stringify(sessionPayload));
          setCookie("vyra_auth_session", JSON.stringify(sessionPayload));
        } catch {
          // Ignore
        }
      }
    } catch {
      // Ignore network errors during local setup
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      if (isConfigured) {
        await fetchProfile(user.id, user.email);
      } else {
        // Read active session
        try {
          const session = localStorage.getItem("vyra_auth_session");
          if (session) {
            const parsed = JSON.parse(session);
            setUser({ id: parsed.id, email: parsed.email } as User);
            setProfile({
              id: parsed.id,
              role: parsed.role,
              display_name: parsed.display_name,
              customer_id: parsed.customer_id,
            });
          }
        } catch {
          // Ignore
        }
      }
    }
  }, [user, isConfigured, fetchProfile]);

  // Synchronous, immediate login function for zero-latency username updates
  const login = useCallback((userData: User, profileData: UserProfile) => {
    setUser(userData);
    setProfile(profileData);
    setIsLoading(false);

    const sessionPayload = {
      id: userData.id,
      email: userData.email,
      role: profileData.role,
      display_name: profileData.display_name,
      customer_id: profileData.customer_id || (profileData.role === "customer" ? userData.id : undefined),
    };

    try {
      localStorage.setItem("vyra_auth_session", JSON.stringify(sessionPayload));
      setCookie("vyra_auth_session", JSON.stringify(sessionPayload));
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    if (!supabase || !isConfigured) {
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("vyra_auth_session") : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser({ id: parsed.id, email: parsed.email } as User);
          setProfile({
            id: parsed.id,
            role: parsed.role,
            display_name: parsed.display_name,
            customer_id: parsed.customer_id,
          });
          setCookie("vyra_auth_session", stored);
        } else {
          // Check cookie fallback
          const cookieVal = getCookie("vyra_auth_session");
          if (cookieVal) {
            const parsed = JSON.parse(cookieVal);
            setUser({ id: parsed.id, email: parsed.email } as User);
            setProfile({
              id: parsed.id,
              role: parsed.role,
              display_name: parsed.display_name,
              customer_id: parsed.customer_id,
            });
            localStorage.setItem("vyra_auth_session", cookieVal);
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
      return;
    }

    // 1. Get initial session from Supabase
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchProfile(user.id, user.email);
      }
      setIsLoading(false);
    });

    // 2. Listen to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    // Multi-tab sync for local demo mode (cloud mode is synced via supabase.auth.onAuthStateChange)
    const handleStorageChange = (e: StorageEvent) => {
      if (!isConfigured && e.key === "vyra_auth_session") {
        if (!e.newValue) {
          setUser(null);
          setProfile(null);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            setUser({ id: parsed.id, email: parsed.email } as User);
            setProfile({
              id: parsed.id,
              role: parsed.role,
              display_name: parsed.display_name,
              customer_id: parsed.customer_id,
            });
          } catch {
            // Ignore
          }
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isConfigured, fetchProfile]);

  const signOut = async () => {
    setIsLoading(true);
    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore
      }
    }
    try {
      localStorage.removeItem("vyra_auth_session");
      deleteCookie("vyra_auth_session");
      clearCurrentCustomerSession();
    } catch {
      // Ignore
    }
    setUser(null);
    setProfile(null);
    setIsLoading(false);
  };

  const role = profile?.role ?? null;
  const isAdmin = role === "admin";
  const isCustomer = role === "customer";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        isCustomer,
        isLoading,
        isConfigured,
        login,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
