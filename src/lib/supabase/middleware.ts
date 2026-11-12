import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let authUser: { id: string; email?: string } | null = null;
  let authRole: "admin" | "customer" | null = null;

  // 1. Check if Supabase cloud is configured
  const isCloudConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://your-project.supabase.co" &&
    !supabaseAnonKey.includes("your-")
  );

  if (isCloudConfigured) {
    const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      authUser = { id: user.id, email: user.email };
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      authRole = (profile?.role as "admin" | "customer") ?? "customer";
    }
    // STRICT SECURITY POLICY:
    // In live Supabase mode (isCloudConfigured = true), NEVER fall back to unsigned client cookies (vyra_auth_session).
    // All route authorization must rely strictly on verified Supabase Auth JWT and database profiles.
    // If supabase.auth.getUser() returned null, authUser and authRole remain strictly null.
  } else {
    // 2. Check local secure session cookie
    const sessionCookie = request.cookies.get("vyra_auth_session")?.value;
    if (sessionCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionCookie));
        if (parsed && parsed.id && parsed.role) {
          authUser = { id: parsed.id, email: parsed.email };
          authRole = parsed.role;
        }
      } catch {
        // Invalid session cookie
      }
    }
  }

  // ─── RULE 1: Admin Routes Protection ──────────────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!authUser) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    if (authRole !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  // ─── RULE 2: Customer Account Routes Protection & Admin Isolation ──────────────
  // CRITICAL: Admin Must NOT Access Customer Portal as a Customer
  if (pathname.startsWith("/account")) {
    if (!authUser) {
      const url = request.nextUrl.clone();
      url.pathname = "/customer/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    if (authRole === "admin") {
      // Deny access and redirect to Admin operations center
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.searchParams.set("notice", "admin_cannot_access_customer_portal");
      return NextResponse.redirect(url);
    }
  }

  // ─── RULE 3: Prevent Logged-in Users from Getting Stuck on Login Pages ──────────
  if (authUser && pathname === "/admin/login" && authRole === "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  if (authUser && pathname === "/customer/login" && authRole === "customer") {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
