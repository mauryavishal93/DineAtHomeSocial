"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/http";
import { getAccessToken, getRole } from "@/lib/session";

type PaymentItem = {
  paymentId: string;
  bookingId: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  amount: number;
  status: string;
  paymentMethod: string;
  paidAt: string;
  refundedAt?: string;
  refundAmount?: number;
  invoiceUrl?: string;
};

export default function PaymentsPage() {
  const router = useRouter();
  const token = getAccessToken();
  const role = getRole();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "REFUNDED" | "PENDING">("ALL");

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }
    loadPayments();
  }, [token, router, filter]);

  const loadPayments = async () => {
    if (!token) return;
    
    setLoading(true);
    const res = await apiFetch<{ payments: PaymentItem[] }>("/api/payments", {
      headers: { authorization: `Bearer ${token}` }
    });
    
    if (res.ok && res.data) {
      let filtered = res.data.payments;
      if (filter !== "ALL") {
        filtered = filtered.filter(p => {
          if (filter === "PAID") return p.status === "PAID";
          if (filter === "REFUNDED") return p.status === "REFUNDED";
          if (filter === "PENDING") return p.status === "PENDING";
          return true;
        });
      }
      setPayments(filtered);
    }
    setLoading(false);
  };

  const formatCurrency = (paise: number) => {
    return `₹${(paise / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const downloadInvoice = async (paymentId: string) => {
    // TODO: Implement invoice download
    alert("Invoice download feature coming soon!");
  };

  if (loading) {
    return (
      <main className="py-10">
        <Container>
          <div className="text-center text-ink-700">Loading payment history...</div>
        </Container>
      </main>
    );
  }

  return (
    <main className="py-10">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Payment History
            </h1>
            <p className="mt-2 text-ink-700">View all your transactions and invoices</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            variant={filter === "ALL" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("ALL")}
          >
            All
          </Button>
          <Button
            variant={filter === "PAID" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("PAID")}
          >
            Paid
          </Button>
          <Button
            variant={filter === "PENDING" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("PENDING")}
          >
            Pending
          </Button>
          <Button
            variant={filter === "REFUNDED" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("REFUNDED")}
          >
            Refunded
          </Button>
        </div>

        {/* Payments List */}
        {payments.length === 0 ? (
          <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-12 text-center shadow-colorful">
            <div className="text-6xl mb-4">💳</div>
            <h2 className="font-display text-2xl text-ink-900 mb-2">No payments found</h2>
            <p className="text-ink-700 mb-6">
              {filter === "ALL" 
                ? "You haven't made any payments yet."
                : `No ${filter.toLowerCase()} payments found.`}
            </p>
            {filter !== "ALL" && (
              <Button variant="outline" onClick={() => setFilter("ALL")}>
                View All Payments
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.paymentId}
                className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-6 shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-display text-lg text-ink-900 mb-1">{payment.eventName}</h3>
                    <div className="text-sm text-ink-600">
                      {formatDate(payment.eventDate)} • {payment.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-ink-900 mb-1">
                      {formatCurrency(payment.amount)}
                    </div>
                    <Badge
                      tone={
                        payment.status === "PAID"
                          ? "success"
                          : payment.status === "REFUNDED"
                          ? "ink"
                          : "warning"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-violet-200">
                  <div className="text-sm text-ink-600">
                    Paid: {formatDate(payment.paidAt)}
                    {payment.refundedAt && (
                      <span className="ml-2 text-orange-600">
                        • Refunded: {formatDate(payment.refundedAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadInvoice(payment.paymentId)}
                    >
                      📄 Invoice
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/events/${payment.eventId}`}>View Event</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
