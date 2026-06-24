"use client";

import MotionReveal from "@/components/MotionReveal";
import PublicSectionHeader from "@/components/PublicSectionHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requestToast } from "@/components/ui/sonner";
import { Clock, Mail, MapPin } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { FormEvent, useState } from "react";

export default function ContactModernWorkspace() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    await requestToast.promise(Promise.resolve(), {
      loading: "Sending message...",
      success: "Message sent.",
      error: "Message could not be sent.",
    });
    setSent(true);
    setSending(false);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="harvest-theme overflow-hidden bg-background text-foreground">
      <section className="relative px-5 pb-12 pt-32 text-center sm:px-8 lg:px-10">
        <CoffeeBranchAsset className="absolute -left-20 top-10 h-72 w-72 bg-primary/[0.09]" />
        <CoffeeBranchAsset className="absolute -right-16 top-8 h-72 w-72 -scale-x-100 bg-primary/[0.09]" />
        <MotionReveal className="relative mx-auto max-w-4xl">
          <PublicSectionHeader
            align="center"
            className="max-w-4xl"
            description="Get in touch with our team"
            eyebrow="Premium B2B Coffee Supply"
            size="page"
            title="Contact Us"
          />
        </MotionReveal>
      </section>

      <section className="relative bg-card px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <CoffeeBranchAsset className="absolute -left-24 bottom-0 h-60 w-60 bg-primary/[0.07]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr]">
          <MotionReveal className="lg:pl-8" variant="left">
            <PublicSectionHeader
              className="max-w-xl"
              description="Whether you're interested in wholesale coffee supply, machine maintenance, or just want to learn more about what we offer — we'd love to hear from you."
              eyebrow="Contact"
              size="section"
              title="Get In Touch"
            />

            <div className="mt-9 max-w-md divide-y divide-border/80">
              <ContactInfo icon={MapPin} title="Address">
                The Breeches
                <br />
                Galleyhill Road
                <br />
                Waltham Abbey
                <br />
                EN9 2AQ
              </ContactInfo>
              <ContactInfo icon={Mail} title="Email">
                info@harvestcoffee.co.uk
              </ContactInfo>
              <ContactInfo icon={Clock} title="Business Hours">
                Monday – Friday: 8:00 – 17:00
                <br />
                Saturday: 9:00 – 13:00
              </ContactInfo>
            </div>
          </MotionReveal>

          <MotionReveal delay={120} variant="right">
            <Card className="rounded-lg border-border bg-background/72 p-6 shadow-2xl shadow-primary/10 backdrop-blur-sm sm:p-8">
              <h2 className="font-display text-3xl font-black text-foreground">Send a Message</h2>

              {sent ? (
                <div className="py-12 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                    <Mail className="h-8 w-8" />
                  </div>
                  <h3 className="font-display mt-6 text-2xl font-black text-foreground">Message Sent!</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-muted-foreground">
                    Thank you for reaching out. We'll get back to you shortly.
                  </p>
                  <p className="mt-4 text-xs font-semibold text-muted-foreground/70">Email delivery is mocked during the Base44 migration.</p>
                </div>
              ) : (
                <form className="mt-7 space-y-6" onSubmit={handleSubmit}>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Name *">
                      <input
                        required
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        placeholder="Your name"
                        className={fieldClassName}
                      />
                    </Field>
                    <Field label="Email *">
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        placeholder="your@email.com"
                        className={fieldClassName}
                      />
                    </Field>
                  </div>

                  <Field label="Subject *">
                    <input
                      required
                      value={form.subject}
                      onChange={(event) => setForm({ ...form, subject: event.target.value })}
                      placeholder="How can we help?"
                      className={fieldClassName}
                    />
                  </Field>

                  <Field label="Message *">
                    <textarea
                      required
                      value={form.message}
                      onChange={(event) => setForm({ ...form, message: event.target.value })}
                      placeholder="Tell us more..."
                      className={`${fieldClassName} min-h-36 resize-y py-4`}
                    />
                  </Field>

                  <Button className="h-12 w-full rounded-md text-base font-black" disabled={sending} type="submit">
                    {sending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </Card>
          </MotionReveal>
        </div>
      </section>
    </div>
  );
}

const fieldClassName =
  "h-12 w-full rounded-md border border-border bg-background/70 px-4 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/65";

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-foreground/70">{label}</span>
      {children}
    </label>
  );
}

function ContactInfo({
  children,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex gap-5 py-6 first:pt-0">
      <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/10">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-display text-xl font-black text-primary">{title}</p>
        <p className="mt-2 text-base font-medium leading-7 text-foreground/72">{children}</p>
      </div>
    </div>
  );
}

function CoffeeBranchAsset({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        maskImage: "url('/assets/coffee-branch-clean.svg')",
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskImage: "url('/assets/coffee-branch-clean.svg')",
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
