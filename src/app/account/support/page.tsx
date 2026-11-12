"use client";

import React, { useState, useEffect } from "react";
import {
  Headphones,
  HelpCircle,
  MessageSquare,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchCustomerSupportTickets,
  createCustomerSupportTicketDb,
  CustomerSupportTicket,
} from "@/lib/customer/data";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const FAQS = [
  {
    q: "How fast is express delivery across India?",
    a: "Orders placed before 2:00 PM are processed same-day. In metropolitan zones (Bengaluru, Chennai, Mumbai, Hyderabad, Delhi), delivery takes 24–48 hours in refrigerated temperature-controlled packs.",
  },
  {
    q: "How are loyalty reward points calculated and redeemed?",
    a: "You earn 10 points for every 330ml can purchased. Points never expire and can be redeemed in the Rewards & Loyalty tab for free merchandise, crate discounts, and exclusive seasonal releases.",
  },
  {
    q: "Can I pause or skip my auto-replenish subscription?",
    a: "Yes, you can pause, adjust delivery frequency (weekly, bi-weekly, monthly), or cancel anytime directly from the Subscriptions section with zero cancellation penalties.",
  },
  {
    q: "Are Vyra Pulse drinks 100% sugar-free?",
    a: "Yes. All 8 flavors contain zero refined sugar, 80mg of clean bio-fermented caffeine, natural adaptogens (L-Theanine, Korean Ginseng), and essential B-vitamins for a jitter-free mental state.",
  },
];

export default function SupportPage() {
  const { user, profile } = useAuth();
  const customerId = profile?.customer_id || user?.id || "CUST-0001";

  const [tickets, setTickets] = useState<CustomerSupportTicket[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<CustomerSupportTicket["category"]>("order");
  const [message, setMessage] = useState("");
  const [ticketNotice, setTicketNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCustomerSupportTickets(customerId).then((list) => {
      if (active) setTickets(list);
    });
    return () => {
      active = false;
    };
  }, [customerId]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    const updated = await createCustomerSupportTicketDb(customerId, {
      subject: subject.trim(),
      category,
      message: message.trim(),
    });

    setTickets(updated);
    setSubject("");
    setMessage("");
    setShowNewTicket(false);
    setTicketNotice("Your support request has been registered. An agent will reply shortly.");
    setTimeout(() => setTicketNotice(null), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-2">
            <Headphones className="w-3.5 h-3.5" />
            <span>24/7 Athlete Concierge Service</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Help & Customer Support
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Browse answers to common questions or submit a direct ticket to our logistics and wellness specialists.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={() => setShowNewTicket(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </Button>
      </div>

      {ticketNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{ticketNotice}</span>
        </div>
      )}

      {/* Grid: Support Form & Ticket History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Support Tickets & New Form */}
        <div className="lg:col-span-2 space-y-6">
          {showNewTicket && (
            <Card className="neu-card p-6 rounded-3xl space-y-4 border border-primary/30">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>Submit Support Request</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewTicket(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-foreground">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inquire about order delivery status"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl neu-inset text-foreground placeholder:text-muted-foreground text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl neu-inset bg-surface text-foreground text-xs focus:outline-none"
                  >
                    <option value="order">Order & Shipment</option>
                    <option value="subscription">Subscription & Billing</option>
                    <option value="delivery">Courier & Address Change</option>
                    <option value="flavor">Flavor & Nutritional Info</option>
                    <option value="account">Account & Loyalty Points</option>
                    <option value="other">General Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-foreground">Message Details</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe your issue or request in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl neu-inset text-foreground placeholder:text-muted-foreground text-xs focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="secondary" type="button" onClick={() => setShowNewTicket(false)}>
                    Close
                  </Button>
                  <Button size="sm" variant="primary" type="submit" className="gap-2">
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request</span>
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Ticket History */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>My Support Requests ({tickets.length})</span>
            </h3>

            {tickets.length === 0 ? (
              <Card className="neu-card p-6 text-center text-xs text-muted-foreground rounded-2xl">
                No active support inquiries. We are here whenever you need assistance.
              </Card>
            ) : (
              tickets.map((t) => (
                <Card key={t.id} className="neu-card p-5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-foreground">
                        {t.id}
                      </span>
                      <Badge
                        variant={
                          t.status === "resolved"
                            ? "success"
                            : t.status === "in_progress"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {t.status.replace("_", " ")}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {t.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-foreground">{t.subject}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {t.message}
                    </p>
                  </div>

                  {t.response && (
                    <div className="p-3 rounded-xl neu-inset text-xs border-l-2 border-primary space-y-0.5">
                      <p className="font-bold text-primary text-[11px]">Vyra Concierge Response:</p>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {t.response}
                      </p>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: FAQs & Direct Contact */}
        <div className="space-y-6">
          <Card className="neu-card p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span>Frequently Asked Questions</span>
            </h3>

            <div className="space-y-2">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl neu-inset p-3.5 space-y-2 cursor-pointer transition-all"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 shrink-0 text-primary" />
                      ) : (
                        <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    {isOpen && (
                      <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Contact Direct Box */}
          <Card className="neu-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-foreground">Direct Concierge Channels</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary" />
                <span>support@vyrapulse.com</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary" />
                <span>+91 80 4000 7800 (Mon–Sat 9AM–8PM)</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

