"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const faqCategories = [
  {
    title: "Getting Started",
    questions: [
      {
        q: "How do I create an account?",
        a: "Click on 'Register' in the top right corner. Choose whether you want to join as a Guest or Host, fill in your details, and verify your email."
      },
      {
        q: "Do I need to verify my identity?",
        a: "Yes, all users need to verify their identity using government ID (Aadhaar/PAN). This ensures safety and trust for everyone on the platform."
      },
      {
        q: "What's the difference between Guest and Host?",
        a: "Guests book and attend dining events. Hosts create and host events in their homes. You can be both!"
      }
    ]
  },
  {
    title: "Booking Events",
    questions: [
      {
        q: "How do I book an event?",
        a: "Browse events, click on one you like, select number of seats, add guest details, and complete payment. You'll receive a confirmation."
      },
      {
        q: "Can I cancel my booking?",
        a: "Yes, cancellation policies vary by host. Check the event details for the specific cancellation policy. Refunds are processed according to the policy."
      },
      {
        q: "What if an event is full?",
        a: "You can join the waitlist! If seats become available, you'll be notified and can book immediately."
      }
    ]
  },
  {
    title: "Hosting Events",
    questions: [
      {
        q: "How do I become a host?",
        a: "Click 'Become a Host', complete your host profile, verify your identity, set up your venue, and create your first event!"
      },
      {
        q: "How much can I earn?",
        a: "You set your own pricing! The platform takes a 20% commission on bookings. You can also charge registration fees."
      },
      {
        q: "What if a guest doesn't show up?",
        a: "Guests are charged when booking. If they don't show up, you still receive payment. You can rate guests to help the community."
      }
    ]
  },
  {
    title: "Safety & Trust",
    questions: [
      {
        q: "How do you ensure safety?",
        a: "All users are ID verified. Hosts undergo background checks. We have 24/7 support and an SOS button during events. Every event is insured."
      },
      {
        q: "What if I have a problem during an event?",
        a: "Use the SOS button in the app or contact our 24/7 support team immediately. We take safety seriously."
      },
      {
        q: "Can I report inappropriate behavior?",
        a: "Yes! Use the 'Report' button on any user profile or contact support. We investigate all reports promptly."
      }
    ]
  },
  {
    title: "Payments & Refunds",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit/debit cards, UPI, net banking, and digital wallets through Razorpay."
      },
      {
        q: "When will I get my refund?",
        a: "Refunds are processed within 5-7 business days after approval, depending on your bank."
      },
      {
        q: "How do I request a refund?",
        a: "Go to your booking details, click 'Request Refund', and provide a reason. The host will review your request."
      }
    ]
  }
];

export default function SupportPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [showContactForm, setShowContactForm] = useState(false);

  const filteredFAQs = faqCategories.flatMap(category => 
    category.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ).map(q => ({ ...q, category: category.title }))
  );

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    alert("Thank you for contacting us! We'll get back to you within 24 hours.");
    setContactForm({ name: "", email: "", subject: "", message: "" });
    setShowContactForm(false);
  };

  return (
    <main className="py-10">
      <Container>
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Help & Support
          </h1>
          <p className="mt-2 text-ink-700">We're here to help! Find answers or contact our support team</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <Input
            label="Search for help"
            placeholder="Type your question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/30 to-violet-50/30 p-6 shadow-colorful text-center">
            <div className="text-4xl mb-3">📞</div>
            <h3 className="font-display text-lg text-ink-900 mb-2">24/7 Support</h3>
            <p className="text-sm text-ink-700 mb-4">Emergency support available anytime</p>
            <Button variant="outline" size="sm" onClick={() => setShowContactForm(true)}>
              Contact Us
            </Button>
          </div>
          <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/30 p-6 shadow-colorful text-center">
            <div className="text-4xl mb-3">🆘</div>
            <h3 className="font-display text-lg text-ink-900 mb-2">SOS Button</h3>
            <p className="text-sm text-ink-700 mb-4">Emergency help during events</p>
            <Button variant="outline" size="sm" className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100">
              Emergency Help
            </Button>
          </div>
          <div className="rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-white via-sky-50/30 to-mint-50/30 p-6 shadow-colorful text-center">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-display text-lg text-ink-900 mb-2">Live Chat</h3>
            <p className="text-sm text-ink-700 mb-4">Chat with our support team</p>
            <Button variant="outline" size="sm">
              Start Chat
            </Button>
          </div>
        </div>

        {/* FAQ Categories */}
        {!searchQuery && (
          <div className="mb-8">
            <h2 className="font-display text-2xl text-ink-900 mb-4">Browse by Category</h2>
            <div className="flex flex-wrap gap-3">
              {faqCategories.map((category) => (
                <Button
                  key={category.title}
                  variant={selectedCategory === category.title ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.title ? null : category.title
                  )}
                >
                  {category.title}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* FAQ List */}
        <div className="space-y-6">
          {(searchQuery ? filteredFAQs : selectedCategory 
            ? faqCategories.find(c => c.title === selectedCategory)?.questions || []
            : faqCategories.flatMap(c => c.questions)
          ).map((faq, idx) => (
            <div
              key={idx}
              className="rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-white via-pink-50/20 to-violet-50/20 p-6 shadow-lg"
            >
              <h3 className="font-display text-lg text-ink-900 mb-2">{faq.q}</h3>
              <p className="text-ink-700">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-3xl border-2 border-violet-200 bg-white p-8 shadow-glow">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl text-ink-900">Contact Support</h2>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-ink-600 hover:text-ink-900"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmitContact} className="space-y-4">
                <Input
                  label="Your Name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
                <Input
                  label="Subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  required
                />
                <div>
                  <label className="text-sm font-semibold text-ink-800 mb-1 block">Message</label>
                  <textarea
                    className="w-full rounded-xl border-2 border-violet-200 px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400"
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit">Send Message</Button>
                  <Button type="button" variant="outline" onClick={() => setShowContactForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Still Need Help */}
        <div className="mt-12 rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/30 p-8 shadow-colorful text-center">
          <h2 className="font-display text-2xl text-ink-900 mb-2">Still Need Help?</h2>
          <p className="text-ink-700 mb-6">Our support team is available 24/7 to assist you</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setShowContactForm(true)}>Contact Support</Button>
            <Button variant="outline" asChild>
              <Link href="/about">Learn More About Us</Link>
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}
