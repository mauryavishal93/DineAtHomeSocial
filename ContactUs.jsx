import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });
  const [status, setStatus] = useState(""); // "idle" | "sending" | "success" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    document.title = "Contact Us | DineAtHome Social";
    return () => {
      document.title = "DineAtHome Social";
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setStatus("");
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus("error");
      setErrorMessage("Please fill in Name, Email, and Message.");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          message: formData.message.trim()
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data?.data?.success || data?.success)) {
        setStatus("success");
        setFormData({ name: "", phone: "", email: "", message: "" });
      } else {
        setStatus("error");
        setErrorMessage(data?.error || "Failed to send. Please try again or email us directly.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("Network error. Please try again or email dineathomesocial@gmail.com");
    }
  };

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 pb-20 sm:py-16 sm:pb-24">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          Contact Us
        </h1>
        <p className="mt-2 text-ink-700">
          Have a question or feedback? We&apos;d love to hear from you.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink-900">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-lg border border-sand-300 bg-white px-4 py-2.5 text-ink-900 placeholder-ink-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-ink-900">
            Contact Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-sand-300 bg-white px-4 py-2.5 text-ink-900 placeholder-ink-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="Your phone number"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink-900">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-lg border border-sand-300 bg-white px-4 py-2.5 text-ink-900 placeholder-ink-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-ink-900">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={formData.message}
            onChange={handleChange}
            required
            className="mt-1 block w-full resize-y rounded-lg border border-sand-300 bg-white px-4 py-2.5 text-ink-900 placeholder-ink-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="Your message..."
          />
        </div>

        {status === "success" && (
          <div className="rounded-lg bg-emerald-50 p-4 text-emerald-800">
            Thank you! Your message has been sent. We&apos;ll get back to you soon.
          </div>
        )}
        {status === "error" && (
          <div className="rounded-lg bg-red-50 p-4 text-red-800">
            {errorMessage}{" "}
            <a
              href="mailto:dineathomesocial@gmail.com"
              className="font-medium underline hover:no-underline"
            >
              Email us directly
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="shine w-full rounded-full bg-gradient-to-r from-coral-500 via-violet-500 to-sky-500 px-6 py-3 text-sm font-medium text-white shadow-soft hover:shadow-card disabled:opacity-70 sm:w-auto sm:px-8"
        >
          {status === "sending" ? "Sending..." : "Send Message"}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink-600">
        You can also reach us at{" "}
        <a
          href="mailto:dineathomesocial@gmail.com"
          className="font-medium text-ink-900 underline hover:no-underline"
        >
          dineathomesocial@gmail.com
        </a>
      </p>
    </article>
  );
}
