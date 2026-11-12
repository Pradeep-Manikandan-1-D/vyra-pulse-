"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { CustomerSidebar } from "@/components/layout/CustomerSidebar";
import { Loader2 } from "lucide-react";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/customer/login");
      return;
    }

    if (isAdmin) {
      // Critical Requirement: Admin must not access the customer portal as a customer
      router.replace("/admin?notice=admin_cannot_access_customer_portal");
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row transition-colors">
      <CustomerSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full overflow-hidden">
        {children}
      </main>
    </div>
  );
}
