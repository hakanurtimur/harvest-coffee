"use client";

import { useV2Enabled } from "@/lib/v2-pages";
import { Clock, Mail, MapPin } from "lucide-react";
import { FormEvent, useState } from "react";
import ContactV2Workspace from "./ContactV2Workspace";

export default function ContactWorkspace() {
  const v2Enabled = useV2Enabled("/contact");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (v2Enabled) {
    return <ContactV2Workspace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    await Promise.resolve();
    setSent(true);
    setSending(false);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="space-y-12">
      <div className="text-center py-8">
        <h1 className="text-5xl font-bold text-amber-900 mb-4" style={{ fontFamily: "Georgia, serif" }}>
          Contact Us
        </h1>
        <p className="text-xl text-amber-700">Get in touch with our team</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-amber-900" style={{ fontFamily: "Georgia, serif" }}>
            Get In Touch
          </h2>
          <p className="text-gray-700">
            Whether you're interested in wholesale coffee supply, machine maintenance, or just want to learn more about what we offer
            — we'd love to hear from you.
          </p>

          <div className="space-y-4">
            <ContactLine icon={<MapPin className="w-5 h-5 text-amber-900" />} title="Address">
              The Breeches
              <br />
              Galleyhill Road
              <br />
              Waltham Abbey
              <br />
              EN9 2AQ
            </ContactLine>
            <ContactLine icon={<Mail className="w-5 h-5 text-amber-900" />} title="Email">
              info@harvestcoffee.co.uk
            </ContactLine>
            <ContactLine icon={<Clock className="w-5 h-5 text-amber-900" />} title="Business Hours">
              Monday – Friday: 8:00 – 17:00
              <br />
              Saturday: 9:00 – 13:00
            </ContactLine>
          </div>
        </div>

        <div className="border border-amber-100 rounded-xl bg-white overflow-hidden">
          <div className="border-b bg-amber-50 px-6 py-4">
            <h2 className="text-amber-900 font-semibold text-lg">Send a Message</h2>
          </div>
          <div className="p-6">
            {sent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
                <p className="text-gray-600">Thank you for reaching out. We'll get back to you shortly.</p>
                <p className="text-xs text-gray-400 mt-3">Email delivery is mocked during the Base44 migration.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label>
                    <span className="text-sm font-medium text-gray-700 mb-1 block">Name *</span>
                    <input
                      required
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      placeholder="Your name"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
                    />
                  </label>
                  <label>
                    <span className="text-sm font-medium text-gray-700 mb-1 block">Email *</span>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      placeholder="your@email.com"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-1 block">Subject *</span>
                  <input
                    required
                    value={form.subject}
                    onChange={(event) => setForm({ ...form, subject: event.target.value })}
                    placeholder="How can we help?"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-1 block">Message *</span>
                  <textarea
                    required
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                    placeholder="Tell us more..."
                    className="min-h-32 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
                  />
                </label>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-md bg-amber-900 hover:bg-amber-800 disabled:opacity-60 text-white px-4 py-2 font-semibold transition-colors"
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactLine({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <p className="font-semibold text-amber-900">{title}</p>
        <p className="text-gray-600">{children}</p>
      </div>
    </div>
  );
}
