import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type DemoCustomerCredential = {
  customer_id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
};

export type SeedCustomerAuthSummary = {
  records: number;
  created: number;
  reused: number;
  failed: number;
  errors: string[];
  reportPath: string;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeSlug(rawName: string): string {
  const normalized = rawName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (!normalized) {
    return "customer";
  }

  return normalized.replace(/\s+/g, "");
}

export function generateCustomerDemoCredentials(
  rows: Array<Record<string, string>>
): DemoCustomerCredential[] {
  const byBase = new Map<string, number>();
  const seenEmails = new Set<string>();
  const credentials: DemoCustomerCredential[] = [];

  for (const row of rows) {
    const customerId = (row.customer_id ?? "").trim();
    const firstName = (row.first_name ?? "").trim();
    const lastName = (row.last_name ?? "").trim();
    const rawName = `${firstName} ${lastName}`.trim();
    const baseName = safeSlug(rawName || `customer${customerId.replace(/\D+/g, "")}`);
    const occurrence = byBase.get(baseName) ?? 0;
    const username = occurrence === 0 ? baseName : `${baseName}${occurrence}`;
    byBase.set(baseName, occurrence + 1);

    const email = (row.email ?? "").trim() || `${username}@gmail.com`;
    if (!isValidEmail(email)) {
      throw new Error(`Invalid generated email for ${customerId}: ${email}`);
    }

    const password = (row.password ?? "").trim() || `${username}123`;
    if (seenEmails.has(email)) {
      throw new Error(`Duplicate generated email detected for ${customerId}: ${email}`);
    }
    seenEmails.add(email);

    credentials.push({
      customer_id: customerId,
      first_name: firstName,
      last_name: lastName,
      username,
      email,
      password,
    });
  }

  return credentials;
}

function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl === "https://your-project.supabase.co" ||
    serviceRoleKey.includes("your-")
  ) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function ensureCustomerProfileRow(
  supabase: SupabaseClient,
  userId: string,
  fullName: string,
  customerId: string
) {
  return supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        role: "customer",
        display_name: fullName,
      },
      { onConflict: "id" }
    );
}

export async function findExistingUserByEmail(
  supabase: SupabaseClient,
  email: string
) {
  const emailLower = email.toLowerCase().trim();
  const PAGE_SIZE = 1000;
  const MAX_PAGES = 50; // Safety guard to prevent unbounded request loops
  let page = 1;

  while (page <= MAX_PAGES) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (error) {
      throw new Error(`Failed to query Auth users (page ${page}): ${error.message}`);
    }

    if (!data?.users || data.users.length === 0) {
      return null;
    }

    const match = data.users.find((user) => user.email?.toLowerCase().trim() === emailLower);
    if (match) {
      return match;
    }

    // Terminal condition: if the current page returned fewer than 1,000 records, no more pages exist
    if (data.users.length < PAGE_SIZE) {
      return null;
    }

    page += 1;
  }

  return null;
}

export async function seedCustomerDemoAuth(
  supabase: SupabaseClient,
  credentials: DemoCustomerCredential[]
): Promise<SeedCustomerAuthSummary> {
  const summary: SeedCustomerAuthSummary = {
    records: credentials.length,
    created: 0,
    reused: 0,
    failed: 0,
    errors: [],
    reportPath: "",
  };

  const existingUsers = new Map<string, { id: string; email: string }>();
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw error;
    }

    for (const user of data.users) {
      if (user.email) {
        existingUsers.set(user.email.toLowerCase(), { id: user.id, email: user.email });
      }
    }

    if (data.users.length < 1000) break;
    page += 1;
  }

  for (let index = 0; index < credentials.length; index++) {
    const credential = credentials[index];
    try {
      const emailLower = credential.email.toLowerCase();
      const existingUser = existingUsers.get(emailLower);

      if (existingUser) {
        const { error: profileErr } = await ensureCustomerProfileRow(
          supabase,
          existingUser.id,
          `${credential.first_name} ${credential.last_name}`.trim() || credential.username,
          credential.customer_id
        );

        if (profileErr) {
          throw new Error(profileErr.message);
        }

        const { error: customerErr } = await supabase
          .from("customers")
          .update({
            user_id: existingUser.id,
            updated_at: new Date().toISOString(),
          })
          .eq("customer_id", credential.customer_id);

        if (customerErr) {
          throw new Error(customerErr.message);
        }

        summary.reused += 1;
      } else {
        const fullName = `${credential.first_name} ${credential.last_name}`.trim() || credential.username;
        const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
          email: credential.email,
          password: credential.password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: "customer",
          },
        });

        if (createError) {
          const fallbackUser = await findExistingUserByEmail(supabase, credential.email);
          if (fallbackUser) {
            existingUsers.set(credential.email.toLowerCase(), { id: fallbackUser.id, email: credential.email });
            summary.reused += 1;
          } else {
            throw new Error(createError.message);
          }
        } else if (!createdUser.user) {
          throw new Error(`No auth user returned for ${credential.email}`);
        } else {
          const { error: profileErr } = await ensureCustomerProfileRow(
            supabase,
            createdUser.user.id,
            fullName,
            credential.customer_id
          );

          if (profileErr) {
            throw new Error(profileErr.message);
          }

          const { error: customerErr } = await supabase
            .from("customers")
            .update({
              user_id: createdUser.user.id,
              updated_at: new Date().toISOString(),
            })
            .eq("customer_id", credential.customer_id);

          if (customerErr) {
            throw new Error(customerErr.message);
          }

          existingUsers.set(emailLower, { id: createdUser.user.id, email: credential.email });
          summary.created += 1;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown customer-auth seeding error";
      summary.failed += 1;
      summary.errors.push(`${credential.customer_id}: ${message}`);
    }

    // A. API REQUEST PACING
    // Introduce a 250ms delay between customer provisioning requests
    if (index + 1 < credentials.length) {
      await delay(250);

      // After every 25 customers, introduce an additional 1-second pause
      if ((index + 1) % 25 === 0) {
        await delay(1000);
      }
    }
  }

  summary.reportPath = "";
  return summary;
}

export function writeDemoCredentialsReport(_credentials: DemoCustomerCredential[]): string {
  // Plaintext credential output removed for security.
  // The authoritative Dataset/demo_customer_credentials.csv is preserved intact.
  return "";
}

export function getCustomerDemoAuthSeedSummary(
  csvRows: Array<Record<string, string>>
): { credentials: DemoCustomerCredential[]; reportPath: string } {
  const credentials = generateCustomerDemoCredentials(csvRows);
  return { credentials, reportPath: "" };
}

export function readCustomerCredentialsFromCsv(csvPath: string): DemoCustomerCredential[] {
  const csvText = fs.readFileSync(csvPath, "utf-8");
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error(`CSV is empty or missing headers: ${csvPath}`);
  }

  const headers = lines[0].split(",").map((value) => value.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index]?.trim() ?? "";
    });
    return row;
  });

  return generateCustomerDemoCredentials(rows);
}

export function filterSingleCustomerByEmail(
  credentials: DemoCustomerCredential[],
  targetEmail: string
): DemoCustomerCredential {
  const normEmail = targetEmail.trim().toLowerCase();
  const matches = credentials.filter(
    (c) => c.email.trim().toLowerCase() === normEmail
  );

  if (matches.length === 0) {
    throw new Error(`[ERROR] No customer record found matching email: "${targetEmail}"`);
  }

  if (matches.length > 1) {
    throw new Error(`[ERROR] Ambiguity detected: Found ${matches.length} customer records matching email: "${targetEmail}"`);
  }

  return matches[0];
}

export async function provisionSingleCustomer(
  supabase: SupabaseClient,
  credential: DemoCustomerCredential
): Promise<{
  success: boolean;
  customerId: string;
  email: string;
  userId: string;
  status: "created" | "reused";
}> {
  const emailLower = credential.email.toLowerCase().trim();
  const fullName = `${credential.first_name} ${credential.last_name}`.trim() || credential.username;

  // 1. Check if user already exists in auth.users
  let authUserId: string | null = null;
  let status: "created" | "reused" = "created";

  const existingUser = await findExistingUserByEmail(supabase, emailLower);
  if (existingUser) {
    authUserId = existingUser.id;
    status = "reused";
    console.log(`  • Found existing Supabase Auth account (Auth ID: ${authUserId})`);
  } else {
    // 2. Create new Supabase Auth user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: credential.email,
      password: credential.password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "customer",
      },
    });

    if (createError) {
      const fallback = await findExistingUserByEmail(supabase, emailLower);
      if (fallback) {
        authUserId = fallback.id;
        status = "reused";
      } else {
        throw new Error(`Failed to create Auth account for ${credential.email}: ${createError.message}`);
      }
    } else if (!newUser?.user) {
      throw new Error(`No user object returned from Supabase Auth for ${credential.email}`);
    } else {
      authUserId = newUser.user.id;
      status = "created";
      console.log(`  ✓ Created new Supabase Auth account (Auth ID: ${authUserId})`);
    }
  }

  // 3. Ensure profile exists in public.profiles with role = 'customer'
  const { error: profileErr } = await ensureCustomerProfileRow(
    supabase,
    authUserId,
    fullName,
    credential.customer_id
  );
  if (profileErr) {
    throw new Error(`Failed to update public.profiles: ${profileErr.message}`);
  }

  // 4. Link Auth UUID to public.customers.user_id
  const { error: customerErr } = await supabase
    .from("customers")
    .update({
      user_id: authUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("customer_id", credential.customer_id);

  if (customerErr) {
    throw new Error(`Failed to link public.customers: ${customerErr.message}`);
  }

  // 5. Post-provisioning Verification: verify linked customer record
  const { data: verifiedCustomer, error: verifyErr } = await supabase
    .from("customers")
    .select("customer_id, user_id, email, first_name, last_name")
    .eq("customer_id", credential.customer_id)
    .single();

  if (verifyErr || !verifiedCustomer) {
    throw new Error(`Verification failed: Customer ${credential.customer_id} could not be retrieved from public.customers`);
  }

  if (verifiedCustomer.user_id !== authUserId) {
    throw new Error(`Verification failed: Customer ${credential.customer_id} user_id (${verifiedCustomer.user_id}) does not match Auth UUID (${authUserId})`);
  }

  return {
    success: true,
    customerId: credential.customer_id,
    email: credential.email,
    userId: authUserId,
    status,
  };
}

export async function runCustomerDemoAuthSeedFromCsv(csvPath: string) {
  const credentials = readCustomerCredentialsFromCsv(csvPath);

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.log("[INFO] Supabase credentials not configured in .env.local. Customer credentials validated offline.");
    return {
      credentials,
      reportPath: "",
      seeded: false,
      records: credentials.length,
      created: 0,
      reused: 0,
      failed: 0,
      errors: [] as string[],
    };
  }

  const summary = await seedCustomerDemoAuth(supabase, credentials);
  return { ...summary, credentials, seeded: true };
}

async function main() {
  const defaultCustomerCsv = fs.existsSync(path.resolve(process.cwd(), "Dataset", "demo_customer_credentials.csv"))
    ? path.resolve(process.cwd(), "Dataset", "demo_customer_credentials.csv")
    : fs.existsSync(path.resolve(process.cwd(), "Datasets", "demo_customer_credentials.csv"))
    ? path.resolve(process.cwd(), "Datasets", "demo_customer_credentials.csv")
    : fs.existsSync(path.resolve(process.cwd(), "Dataset", "customers.csv"))
    ? path.resolve(process.cwd(), "Dataset", "customers.csv")
    : fs.existsSync(path.resolve(process.cwd(), "Datasets", "customers.csv"))
    ? path.resolve(process.cwd(), "Datasets", "customers.csv")
    : path.resolve(process.cwd(), "data", "customers.csv");

  let targetEmail: string | null = null;
  let csvPath = defaultCustomerCsv;
  let isBulkMode = false;

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i].trim();
    if (arg === "--email" || arg === "-e") {
      targetEmail = (process.argv[++i] || "").trim();
    } else if (arg.startsWith("--email=")) {
      targetEmail = arg.slice(8).trim();
    } else if (arg === "--all" || arg === "--bulk") {
      isBulkMode = true;
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(arg)) {
      targetEmail = arg;
    } else if (arg.endsWith(".csv")) {
      csvPath = path.resolve(process.cwd(), arg);
    }
  }

  if (!fs.existsSync(csvPath)) {
    throw new Error(`Customer CSV not found: ${csvPath}`);
  }

  // ─── SINGLE CUSTOMER MODE ───────────────────────────────────────────────────
  if (targetEmail) {
    console.log("==================================================");
    console.log("VYRA PULSE — SINGLE CUSTOMER DEMO PROVISIONING");
    console.log("==================================================");
    console.log(`Target Email: ${targetEmail}`);

    const allCredentials = readCustomerCredentialsFromCsv(csvPath);
    const targetCustomer = filterSingleCustomerByEmail(allCredentials, targetEmail);

    console.log(`Matched Customer: ${targetCustomer.customer_id} (${targetCustomer.first_name} ${targetCustomer.last_name})`);

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log("[INFO] Supabase credentials not configured in .env.local. Offline validation succeeded.");
      console.log(`[PASS] Target customer ${targetCustomer.customer_id} is verified and ready for provisioning.`);
      return;
    }

    console.log(`\nConnecting to Supabase Auth to provision customer: ${targetCustomer.email}...`);
    const result = await provisionSingleCustomer(supabase, targetCustomer);

    console.log("\n==================================================");
    console.log("[SUCCESS] SINGLE CUSTOMER PROVISIONED SUCCESSFULLY");
    console.log("==================================================");
    console.log(`Customer ID: ${result.customerId}`);
    console.log(`Email: ${result.email}`);
    console.log(`Auth UUID: ${result.userId}`);
    console.log(`Status: ${result.status === "created" ? "Created new Auth user" : "Reused existing Auth user"}`);
    console.log(`Verification: public.customers.user_id linked and verified`);
    console.log(`Portal: Customer can now sign in at /customer/login`);
    console.log("==================================================");
    return;
  }

  // ─── BULK MODE SAFETY GUARD ─────────────────────────────────────────────────
  if (!isBulkMode) {
    console.log("==================================================");
    console.log("VYRA PULSE — CUSTOMER AUTH PROVISIONING TOOL");
    console.log("==================================================");
    console.log("Usage for Single Customer Provisioning (Recommended):");
    console.log("  npx tsx scripts/customer-demo-auth.ts --email <customer-email>");
    console.log("  Example: npx tsx scripts/customer-demo-auth.ts --email ananya0001@gmail.com\n");
    console.log("Usage for Bulk 600-Customer Provisioning:");
    console.log("  npx tsx scripts/customer-demo-auth.ts --all");
    console.log("==================================================");
    return;
  }

  // ─── BULK 600-CUSTOMER PROVISIONING MODE ────────────────────────────────────
  console.log("==================================================");
  console.log("VYRA PULSE — BULK CUSTOMER AUTH PROVISIONING");
  console.log("==================================================");

  const result = await runCustomerDemoAuthSeedFromCsv(csvPath);
  const created = result.created ?? 0;
  const reused = result.reused ?? 0;
  const failed = result.failed ?? 0;

  console.log(`Read ${result.credentials.length} customer records.`);
  console.log(`Created ${created} auth accounts.`);
  console.log(`Reused ${reused} existing auth accounts.`);
  console.log(`Failed ${failed} accounts.`);
  console.log("Customer accounts processed securely without writing plaintext credential files.");

  if (failed > 0) {
    console.warn("Seed errors:");
    for (const error of result.errors ?? []) {
      console.warn(`- ${error}`);
    }
  }
}

const isDirectExecution = typeof process !== "undefined" && process.argv[1] && process.argv[1].toLowerCase().includes("customer-demo-auth");
if (isDirectExecution) {
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown seed failure";
    console.error(`Customer demo auth seed failed: ${message}`);
    process.exit(1);
  });
}
