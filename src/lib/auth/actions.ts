"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseServerConfigured } from "@/lib/supabase/server";

export interface AuthActionResult {
  error?: string;
  success?: boolean;
}

export async function signInAdminAction(formData: FormData): Promise<AuthActionResult | void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter both administrator email and password." };
  }

  if (!isSupabaseServerConfigured()) {
    return {
      error:
        "Supabase cloud credentials not yet configured in .env.local. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live authentication.",
    };
  }

  const supabase = createClient();
  if (!supabase) {
    return { error: "Unable to initialize Supabase server client." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Authentication failed. No user found." };
  }

  // Verify server-side role from public.profiles
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileErr || profile?.role !== "admin") {
    // Force sign out immediately if not an admin
    await supabase.auth.signOut();
    return {
      error:
        "Access Denied: This account is authenticated but does not possess Super Admin privileges.",
    };
  }

  redirect("/admin");
}

export async function signInCustomerAction(formData: FormData): Promise<AuthActionResult | void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const returnUrl = (formData.get("returnUrl") as string) || "/shop";

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  if (!isSupabaseServerConfigured()) {
    return {
      error:
        "Supabase cloud credentials not yet configured in .env.local. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live authentication.",
    };
  }

  const supabase = createClient();
  if (!supabase) {
    return { error: "Unable to initialize Supabase server client." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(returnUrl);
}

export async function signUpCustomerAction(formData: FormData): Promise<AuthActionResult | void> {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!fullName || !email || !password) {
    return { error: "All fields are required for registration." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters in length." };
  }

  if (!isSupabaseServerConfigured()) {
    return {
      error:
        "Supabase cloud credentials not yet configured in .env.local. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live authentication.",
    };
  }

  const supabase = createClient();
  if (!supabase) {
    return { error: "Unable to initialize Supabase server client." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "customer",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    // Automatically signed in
    redirect("/shop");
  } else {
    return {
      success: true,
      error: "Account created! If email confirmation is enabled on your Supabase project, please check your inbox.",
    };
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/");
}
