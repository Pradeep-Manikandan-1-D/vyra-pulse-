/**
 * Vyra Pulse — Customer Database Operations (Supabase with Local Fallback)
 * Provides asynchronous CRUD for Favorites, Subscriptions, and Support Tickets.
 * Ensures customer data isolation via customer_id filters and PostgreSQL RLS.
 */

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getCustomerFavorites,
  toggleCustomerFavorite,
  getCustomerSubscriptions,
  updateCustomerSubscription,
  addCustomerSubscription,
  getCustomerSupportTickets,
  createCustomerSupportTicket,
  CustomerSubscription,
  CustomerSupportTicket,
} from "./data";

// ─── FAVORITES CRUD ─────────────────────────────────────────────────────────

/**
 * Fetch customer favorites from Supabase with localStorage fallback
 */
export async function fetchCustomerFavorites(customerId: string): Promise<string[]> {
  const norm = customerId.toUpperCase().trim();
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    return getCustomerFavorites(norm);
  }

  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("product_id")
      .eq("customer_id", norm);

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map((d: any) => d.product_id);
    }
    return getCustomerFavorites(norm);
  } catch (err) {
    console.warn("Supabase fetch favorites failed, falling back to local storage:", err);
    return getCustomerFavorites(norm);
  }
}

/**
 * Toggle customer favorite in Supabase with localStorage fallback
 */
export async function toggleCustomerFavoriteDb(
  customerId: string,
  productId: string
): Promise<string[]> {
  const norm = customerId.toUpperCase().trim();
  const localFallback = toggleCustomerFavorite(norm, productId);
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    return localFallback;
  }

  try {
    const { data: existing, error: checkErr } = await supabase
      .from("favorites")
      .select("favorite_id")
      .eq("customer_id", norm)
      .eq("product_id", productId)
      .maybeSingle();

    if (checkErr) throw checkErr;

    if (existing) {
      const { error: delErr } = await supabase
        .from("favorites")
        .delete()
        .eq("favorite_id", existing.favorite_id);
      if (delErr) throw delErr;
    } else {
      const { error: insErr } = await supabase
        .from("favorites")
        .insert({ customer_id: norm, product_id: productId });
      if (insErr) throw insErr;
    }

    return await fetchCustomerFavorites(norm);
  } catch (err) {
    console.warn("Supabase toggle favorite failed, returned local state:", err);
    return localFallback;
  }
}

// ─── SUBSCRIPTIONS CRUD ─────────────────────────────────────────────────────

/**
 * Fetch customer subscriptions from Supabase with localStorage fallback
 */
export async function fetchCustomerSubscriptions(
  customerId: string
): Promise<CustomerSubscription[]> {
  const norm = customerId.toUpperCase().trim();
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    return getCustomerSubscriptions(norm);
  }

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        subscription_id,
        customer_id,
        product_id,
        quantity,
        frequency,
        status,
        price_per_delivery,
        next_delivery_date,
        created_at,
        products (product_name, flavor)
      `)
      .eq("customer_id", norm)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.subscription_id,
        customer_id: d.customer_id,
        product_id: d.product_id,
        product_name: d.products?.product_name || d.product_id,
        flavor: d.products?.flavor || "",
        quantity: Number(d.quantity) || 4,
        frequency: d.frequency || "biweekly",
        status: d.status || "active",
        price_per_delivery: Number(d.price_per_delivery) || 0,
        next_delivery_date: d.next_delivery_date || "",
        created_at: d.created_at || new Date().toISOString(),
      }));
    }
    return getCustomerSubscriptions(norm);
  } catch (err) {
    console.warn("Supabase fetch subscriptions failed, falling back to local storage:", err);
    return getCustomerSubscriptions(norm);
  }
}

/**
 * Update customer subscription in Supabase with localStorage fallback
 */
export async function updateCustomerSubscriptionDb(
  customerId: string,
  subId: string,
  status: "active" | "paused" | "cancelled"
): Promise<CustomerSubscription[]> {
  const norm = customerId.toUpperCase().trim();
  const localFallback = updateCustomerSubscription(norm, subId, status);
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    return localFallback;
  }

  try {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("subscription_id", subId)
      .eq("customer_id", norm);

    if (error) throw error;
    return await fetchCustomerSubscriptions(norm);
  } catch (err) {
    console.warn("Supabase update subscription failed, returned local state:", err);
    return localFallback;
  }
}

/**
 * Add a new subscription in Supabase with localStorage fallback
 */
export async function addCustomerSubscriptionDb(
  customerId: string,
  sub: Omit<CustomerSubscription, "id" | "customer_id" | "created_at">
): Promise<CustomerSubscription[]> {
  const norm = customerId.toUpperCase().trim();
  const localFallback = addCustomerSubscription(norm, sub);
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    return localFallback;
  }

  try {
    const { error } = await supabase.from("subscriptions").insert({
      customer_id: norm,
      product_id: sub.product_id,
      quantity: sub.quantity,
      frequency: sub.frequency,
      status: sub.status,
      price_per_delivery: sub.price_per_delivery,
      next_delivery_date: sub.next_delivery_date,
    });

    if (error) throw error;
    return await fetchCustomerSubscriptions(norm);
  } catch (err) {
    console.warn("Supabase add subscription failed, returned local state:", err);
    return localFallback;
  }
}

// ─── SUPPORT TICKETS CRUD ───────────────────────────────────────────────────

/**
 * Fetch customer support tickets from Supabase with localStorage fallback
 */
export async function fetchCustomerSupportTickets(
  customerId: string
): Promise<CustomerSupportTicket[]> {
  const norm = customerId.toUpperCase().trim();
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    return getCustomerSupportTickets(norm);
  }

  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("customer_id", norm)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) {
      return data.map((t: any) => ({
        id: t.ticket_id,
        customer_id: t.customer_id,
        subject: t.subject,
        category: t.category,
        message: t.message,
        status: t.status,
        created_at: t.created_at,
        response: t.response,
      }));
    }
    return getCustomerSupportTickets(norm);
  } catch (err) {
    console.warn("Supabase fetch support tickets failed, falling back to local storage:", err);
    return getCustomerSupportTickets(norm);
  }
}

/**
 * Create customer support ticket in Supabase with localStorage fallback
 */
export async function createCustomerSupportTicketDb(
  customerId: string,
  ticket: {
    subject: string;
    category: CustomerSupportTicket["category"];
    message: string;
  }
): Promise<CustomerSupportTicket[]> {
  const norm = customerId.toUpperCase().trim();
  const localFallback = createCustomerSupportTicket(norm, ticket);
  const supabase = createClient();
  if (!supabase || !isSupabaseConfigured()) {
    return localFallback;
  }

  try {
    const { error } = await supabase.from("support_tickets").insert({
      customer_id: norm,
      subject: ticket.subject,
      category: ticket.category,
      message: ticket.message,
      status: "open",
    });

    if (error) throw error;
    return await fetchCustomerSupportTickets(norm);
  } catch (err) {
    console.warn("Supabase create ticket failed, returned local state:", err);
    return localFallback;
  }
}

