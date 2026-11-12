/**
 * Vyra Pulse — Secure Administrator Provisioning Script
 * 
 * Safely provisions or elevates a designated administrator account in Supabase Auth and public.profiles.
 * Uses SUPABASE_SERVICE_ROLE_KEY strictly on the server-side / offline CLI.
 * 
 * Security features:
 * - Interactive hidden password entry (never echoed to terminal, never exposed in process lists or bash history).
 * - Explicit confirmation required before elevating an existing account.
 * - Minimum 8-character password enforcement.
 * - Idempotent public.profiles upsert with role='admin'.
 * 
 * Usage:
 *   npx tsx scripts/provision_admin.ts [admin-email]
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import readline from "readline";
import { createClient } from "@supabase/supabase-js";

function promptQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

function promptHidden(query: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(query);

    if (stdin.isTTY) {
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding("utf8");

      let password = "";
      const onData = (chunk: string) => {
        for (let i = 0; i < chunk.length; i++) {
          const char = chunk[i];
          if (char === "\n" || char === "\r" || char === "\u0004") {
            stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener("data", onData);
            stdout.write("\n");
            resolve(password);
            return;
          } else if (char === "\u0003") {
            stdin.setRawMode(false);
            stdout.write("\nOperation canceled.\n");
            process.exit(1);
          } else if (char === "\u007f" || char === "\b") {
            if (password.length > 0) {
              password = password.slice(0, -1);
            }
          } else {
            password += char;
          }
        }
      };

      stdin.on("data", onData);
    } else {
      // Non-interactive fallback
      const rl = readline.createInterface({
        input: stdin,
        output: stdout,
        terminal: false,
      });
      rl.question("", (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    }
  });
}

export async function provisionAdmin() {
  console.log("==================================================");
  console.log("VYRA PULSE — SECURE ADMIN PROVISIONING");
  console.log("==================================================");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl === "https://your-project.supabase.co" ||
    serviceRoleKey.includes("your-")
  ) {
    console.error("[ERROR] SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be configured in .env.local");
    process.exit(1);
  }

  // 1. Resolve email
  let email = (process.argv[2] || process.env.ADMIN_EMAIL || "").trim();
  if (!email) {
    email = await promptQuestion("Enter administrator email address: ");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("[ERROR] A valid administrator email address is required.");
    process.exit(1);
  }

  // 2. Warn if password was supplied on CLI
  if (process.argv[3]) {
    console.warn("\n[SECURITY NOTICE] Command-line password argument ignored.");
    console.warn("Passwords on the command line are disabled to prevent exposure in process listings and history.");
  }

  // 3. Prompt securely for password
  let password = (process.env.ADMIN_PASSWORD || "").trim();
  if (!password) {
    password = await promptHidden("\nEnter administrator password (hidden): ");
    if (!password) {
      console.error("[ERROR] Password cannot be empty.");
      process.exit(1);
    }

    const confirmPassword = await promptHidden("Confirm administrator password (hidden): ");
    if (password !== confirmPassword) {
      console.error("[ERROR] Passwords do not match. Provisioning aborted.");
      process.exit(1);
    }
  }

  if (password.length < 8) {
    console.error("[ERROR] Administrator password must be at least 8 characters in length for security.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`\nConnecting to Supabase Auth to verify account: ${email}...`);

  // 4. Check if user already exists in Supabase Auth
  let authUserId: string | null = null;
  const { data: usersList, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error("[ERROR] Failed to query auth users:", listErr.message);
    process.exit(1);
  }

  const existingUser = usersList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    console.log(`\n  • Found existing user account (Auth ID: ${existingUser.id})`);
    
    // Explicit confirmation required to prevent accidental elevation
    const answer = await promptQuestion(`  Elevate this existing user to Administrator and reset credentials? (yes/no): `);
    if (answer.toLowerCase() !== "yes" && answer.toLowerCase() !== "y") {
      console.log("  Provisioning canceled. No user records were modified.");
      process.exit(0);
    }

    authUserId = existingUser.id;

    // Update password, confirm email, and user metadata
    const { error: updateErr } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: {
        role: "admin",
        full_name: existingUser.user_metadata?.full_name || "Super Admin",
      },
    });

    if (updateErr) {
      console.error("[ERROR] Failed to update existing auth user:", updateErr.message);
      process.exit(1);
    }
    console.log("  ✓ Updated user credentials and confirmed email in auth.users.");
  } else {
    // Create new Supabase Auth user
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "admin",
        full_name: "Super Admin",
      },
    });

    if (createErr || !newUser.user) {
      console.error("[ERROR] Failed to create auth user:", createErr?.message || "No user returned");
      process.exit(1);
    }

    authUserId = newUser.user.id;
    console.log(`  ✓ Created new Supabase Auth user (Auth ID: ${authUserId}) with confirmed email.`);
  }

  // 5. Promote user to administrator via dedicated, trusted RPC
  console.log(`  • Promoting account to Administrator via promote_user_to_admin RPC...`);
  const { error: rpcErr } = await supabase.rpc("promote_user_to_admin", {
    p_user_id: authUserId,
  });

  if (rpcErr) {
    console.error("[ERROR] Failed to promote user to administrator via RPC:", rpcErr.message);
    process.exit(1);
  }
  console.log("  ✓ Successfully executed promote_user_to_admin RPC.");

  // 6. Explicitly verify final profile role before reporting success
  const { data: verifiedProfile, error: verifyErr } = await supabase
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", authUserId)
    .single();

  if (verifyErr || verifiedProfile?.role !== "admin") {
    console.error("[ERROR] Failed to verify administrator role in public.profiles:", verifyErr?.message || "Role is not admin");
    process.exit(1);
  }
  console.log("  ✓ Verified final role in public.profiles: 'admin'");

  console.log("\n==================================================");
  console.log("[SUCCESS] ADMINISTRATOR PROVISIONED SUCCESSFULLY");
  console.log("==================================================");
  console.log(`Admin Email: ${email}`);
  console.log("Role: admin (verified in public.profiles)");
  console.log("Portal: Sign in at /admin/login with your verified password");
  console.log("==================================================");
}

const isDirect = typeof process !== "undefined" && process.argv[1] && process.argv[1].toLowerCase().includes("provision_admin");
if (isDirect) {
  provisionAdmin().catch((err) => {
    console.error("Provisioning failed:", err);
    process.exit(1);
  });
}
