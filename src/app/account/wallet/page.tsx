"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  Zap,
  ArrowRight,
  ShieldCheck,
  Gift,
  Clock,
  Sparkles,
  CheckCircle2,
  Lock,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface LoyaltyTx {
  id: string;
  order_id?: string | null;
  transaction_type: "earned" | "redeemed" | "adjusted";
  points: number;
  description: string;
  created_at: string;
}

export default function CustomerWalletPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [balance, setBalance] = useState<number>(140);
  const [lifetimeEarned, setLifetimeEarned] = useState<number>(140);
  const [transactions, setTransactions] = useState<LoyaltyTx[]>([]);
  const [claimedPerk, setClaimedPerk] = useState<string | null>(null);

  useEffect(() => {
    async function loadWallet() {
      const supabase = createClient();

      if (supabase && isSupabaseConfigured() && user) {
        try {
          const { data: walletData } = await supabase
            .from("loyalty_wallets")
            .select("*")
            .eq("customer_id", user.id)
            .single();

          if (walletData) {
            setBalance(walletData.balance || 0);
            setLifetimeEarned(walletData.lifetime_earned || 0);

            const { data: txData } = await supabase
              .from("loyalty_transactions")
              .select("*")
              .eq("wallet_id", walletData.id)
              .order("created_at", { ascending: false });

            if (txData && txData.length > 0) {
              setTransactions(
                txData.map((t) => ({
                  id: t.id,
                  order_id: t.order_id,
                  transaction_type: t.transaction_type,
                  points: t.points,
                  description: t.description || "Pulse Points",
                  created_at: t.created_at,
                }))
              );
              return;
            }
          }
        } catch (err) {
          console.warn("Error fetching wallet from Supabase:", err);
        }
      }

      // Check localStorage for demo wallet updates
      try {
        const stored = localStorage.getItem("vyra_demo_wallet");
        if (stored) {
          const parsed = JSON.parse(stored);
          setBalance(parsed.balance || 140);
          setLifetimeEarned(parsed.lifetime || 140);
          if (parsed.history && parsed.history.length > 0) {
            setTransactions(parsed.history);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not read demo wallet:", err);
      }

      // Default sample ledger
      setTransactions([
        {
          id: "tx-1",
          transaction_type: "earned",
          points: 40,
          description: "Order ORD-VP-7821 points reward (4 cans)",
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: "tx-0",
          transaction_type: "earned",
          points: 100,
          description: "Vyra Pulse Athlete Welcome Bonus",
          created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        },
      ]);
    }

    if (!authLoading) {
      loadWallet();
    }
  }, [user, authLoading]);

  // Tier thresholds
  const HOODIE_THRESHOLD = 400;
  const DRINK_THRESHOLD = 800;
  const VIP_THRESHOLD = 1200;

  const hoodieProgress = Math.min(100, (balance / HOODIE_THRESHOLD) * 100);
  const drinkProgress = Math.min(100, (balance / DRINK_THRESHOLD) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="default" className="text-[11px]">Pulse Rewards Ledger</Badge>
            {user ? (
              <span className="text-xs text-[#00FF66] font-mono">{user.email}</span>
            ) : (
              <span className="text-xs text-muted-foreground font-mono">Demo Athlete Session</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Pulse Rewards Wallet
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Every 330ml can fuels your energy and earns 10 Pulse Points. Redeem points for exclusive streetwear drops and free drinks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/account/orders">
            <Button variant="secondary" size="sm" className="gap-2 text-xs">
              View Order History
            </Button>
          </Link>
          <Link href="/shop">
            <Button size="sm" className="gap-2 text-xs">
              <ShoppingBag className="w-3.5 h-3.5" />
              Earn More Points
            </Button>
          </Link>
        </div>
      </div>

      {/* Wallet Balance Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-3 border-[#00FF66]/40 bg-gradient-to-br from-[#00FF66]/10 via-background to-background relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Balance
            </span>
            <div className="w-8 h-8 rounded-full bg-[#00FF66]/20 text-[#00FF66] flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-black text-[#00FF66] tracking-tight">{balance} <span className="text-sm font-bold text-foreground">PTS</span></p>
            <p className="text-[11px] text-muted-foreground">
              Equivalent to ₹{(balance * 0.25).toFixed(0)} store purchasing credit
            </p>
          </div>
        </Card>

        <Card className="p-6 space-y-3 border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lifetime Earned
            </span>
            <div className="w-8 h-8 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-black text-foreground tracking-tight">{lifetimeEarned} <span className="text-sm font-bold text-muted-foreground">PTS</span></p>
            <p className="text-[11px] text-muted-foreground">
              Calculated across all historical checked-out orders
            </p>
          </div>
        </Card>

        <Card className="p-6 space-y-3 border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Earning Rate
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-foreground tracking-tight">10 PTS / Can</p>
            <p className="text-[11px] text-muted-foreground">
              Automatically credited upon order confirmation
            </p>
          </div>
        </Card>
      </div>

      {/* Rewards Catalog & Tier Milestones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#00FF66]" />
            Redeemable Rewards & Streetwear Drops
          </h2>
          <span className="text-xs text-muted-foreground">Unlock rewards automatically</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Perk 1: Streetwear Hoodie */}
          <Card className="p-5 space-y-4 border-white/10 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={balance >= HOODIE_THRESHOLD ? "default" : "outline"} className="text-[10px]">
                  {balance >= HOODIE_THRESHOLD ? "Unlocked!" : "400 Points"}
                </Badge>
                {balance >= HOODIE_THRESHOLD ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00FF66]" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-bold text-base text-foreground">Vyra Oversized Streetwear Hoodie</h3>
              <p className="text-xs text-muted-foreground">
                Heavyweight 450 GSM French terry hoodie with neon reflective cyber graphics. Free worldwide shipping.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-mono text-foreground font-bold">{Math.round(hoodieProgress)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-[#00FF66] transition-all duration-500"
                    style={{ width: `${hoodieProgress}%` }}
                  />
                </div>
              </div>

              {balance >= HOODIE_THRESHOLD ? (
                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setClaimedPerk("HOODIE-DROP-CLAIMED")}
                >
                  {claimedPerk === "HOODIE-DROP-CLAIMED" ? "Claim Voucher: VYRA-HOODIE-2026" : "Claim Hoodie Drop"}
                </Button>
              ) : (
                <p className="text-[10px] text-center text-muted-foreground">
                  Need {HOODIE_THRESHOLD - balance} more points to unlock
                </p>
              )}
            </div>
          </Card>

          {/* Perk 2: Free Drink Voucher */}
          <Card className="p-5 space-y-4 border-white/10 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={balance >= DRINK_THRESHOLD ? "default" : "outline"} className="text-[10px]">
                  {balance >= DRINK_THRESHOLD ? "Unlocked!" : "800 Points"}
                </Badge>
                {balance >= DRINK_THRESHOLD ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00FF66]" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-bold text-base text-foreground">Free Can Voucher (Up to ₹200)</h3>
              <p className="text-xs text-muted-foreground">
                Redeem a completely free 330ml can of any flavor on your next store checkout with free zero-cost delivery.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-mono text-foreground font-bold">{Math.round(drinkProgress)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-all duration-500"
                    style={{ width: `${drinkProgress}%` }}
                  />
                </div>
              </div>

              {balance >= DRINK_THRESHOLD ? (
                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setClaimedPerk("FREE-CAN-CLAIMED")}
                >
                  {claimedPerk === "FREE-CAN-CLAIMED" ? "Code: FREECAN200" : "Redeem Drink"}
                </Button>
              ) : (
                <p className="text-[10px] text-center text-muted-foreground">
                  Need {DRINK_THRESHOLD - balance} more points to unlock
                </p>
              )}
            </div>
          </Card>

          {/* Perk 3: Black Card Access */}
          <Card className="p-5 space-y-4 border-white/10 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
                  1,200 Points
                </Badge>
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-base text-foreground">VIP Black Card Membership</h3>
              <p className="text-xs text-muted-foreground">
                Exclusive early access to limited batch flavor drops, private athlete discord, and automatic free shipping on all orders forever.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-mono text-foreground font-bold">
                    {Math.round(Math.min(100, (balance / VIP_THRESHOLD) * 100))}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, (balance / VIP_THRESHOLD) * 100)}%` }}
                  />
                </div>
              </div>

              <p className="text-[10px] text-center text-muted-foreground">
                Need {Math.max(0, VIP_THRESHOLD - balance)} more points to unlock
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Pulse Points Activity Ledger
        </h2>

        <Card className="overflow-hidden border-border/40">
          <div className="divide-y divide-border/20">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#00FF66]/10 text-[#00FF66] flex items-center justify-center font-bold text-xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{tx.description}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-[#00FF66]">
                    +{tx.points} PTS
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
