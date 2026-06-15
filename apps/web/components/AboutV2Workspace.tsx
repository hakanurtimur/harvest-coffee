"use client";

import MotionReveal from "@/components/MotionReveal";
import { Card } from "@/components/ui/card";
import { Award, Coffee, Handshake, Sprout } from "lucide-react";

const storyImage = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=85";

export default function AboutV2Workspace() {
  const values = [
    { icon: Coffee, title: "Quality First", desc: "Every bean is carefully selected and roasted to perfection." },
    { icon: Sprout, title: "Sustainability", desc: "We partner with farms committed to ethical and sustainable practices." },
    { icon: Award, title: "Excellence", desc: "Award-winning blends and single origins from the world's best regions." },
    { icon: Handshake, title: "Partnership", desc: "We build long-term relationships with our wholesale clients." },
  ];

  return (
    <div className="harvest-theme overflow-hidden bg-background text-foreground">
      <section className="relative px-5 pb-12 pt-32 text-center sm:px-8 lg:px-10">
        <CoffeeBranchAsset className="absolute -left-20 top-12 h-72 w-72 bg-primary/[0.09]" />
        <CoffeeBranchAsset className="absolute -right-16 top-10 h-72 w-72 -scale-x-100 bg-primary/[0.09]" />
        <MotionReveal className="relative mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-primary">Premium B2B Coffee Supply</p>
          <div className="mx-auto mt-4 h-px w-32 bg-primary/30" />
          <h1 className="font-display mt-7 text-5xl font-black leading-tight text-foreground sm:text-6xl">About Harvest Coffee</h1>
          <p className="mx-auto mt-6 max-w-3xl text-base font-medium leading-8 text-muted-foreground sm:text-lg">
            We are a premium B2B coffee supplier based in Waltham Abbey, Essex, dedicated to bringing the finest coffees from around
            the world to businesses across the UK.
          </p>
        </MotionReveal>
      </section>

      <section className="relative bg-card px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <CoffeeBranchAsset className="absolute -left-24 bottom-0 h-56 w-56 bg-primary/[0.07]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <MotionReveal className="lg:pl-10" variant="left">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.34em] text-primary">Our Story</p>
            <h2 className="font-display text-4xl font-black leading-tight text-foreground">Our Story</h2>
            <div className="mt-7 space-y-5 text-sm font-medium leading-8 text-muted-foreground sm:text-base">
              <p>
                Harvest Coffee was founded with a simple mission: to connect businesses with exceptional coffee. We source our beans
                directly from trusted farms and cooperatives, ensuring quality at every step of the supply chain.
              </p>
              <p>
                From our base at The Breeches, Galleyhill Road, Waltham Abbey, we supply cafés, restaurants, offices, and hospitality
                businesses throughout the United Kingdom with carefully curated coffee selections and professional machine maintenance
                services.
              </p>
            </div>
          </MotionReveal>

          <MotionReveal delay={120} variant="right">
            <div className="overflow-hidden rounded-lg shadow-2xl shadow-primary/10">
              <img alt="Coffee cups" className="motion-image h-[360px] w-full object-cover sm:h-[430px]" src={storyImage} />
            </div>
          </MotionReveal>
        </div>
      </section>

      <section className="bg-background px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <MotionReveal className="mb-10 text-center">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-primary">Our Values</p>
            <h2 className="font-display mt-3 text-4xl font-black text-foreground">What Drives Us</h2>
          </MotionReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((item, index) => (
              <MotionReveal delay={index * 80} key={item.title} variant="scale">
                <Card className="motion-card flex min-h-60 flex-col items-center justify-between rounded-lg border-border bg-card/70 p-8 text-center shadow-none hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10">
                  <div>
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                      <item.icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-display mt-6 text-xl font-black text-foreground">{item.title}</h3>
                    <p className="mt-4 text-sm font-medium leading-6 text-muted-foreground">{item.desc}</p>
                  </div>
                  <div className="mt-7 h-px w-14 bg-primary/35" />
                </Card>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>
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
