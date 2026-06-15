"use client";

import { useV2Enabled } from "@/lib/v2-pages";
import { Award, Coffee, Leaf, Users } from "lucide-react";
import AboutV2Workspace from "./AboutV2Workspace";

export default function AboutWorkspace() {
  const v2Enabled = useV2Enabled("/about");

  if (v2Enabled) {
    return <AboutV2Workspace />;
  }

  return (
    <div className="space-y-16">
      <div className="text-center py-12">
        <h1 className="text-5xl font-bold text-amber-900 mb-6" style={{ fontFamily: "Georgia, serif" }}>
          About Harvest Coffee
        </h1>
        <p className="text-xl text-amber-700 max-w-3xl mx-auto leading-relaxed">
          We are a premium B2B coffee supplier based in Waltham Abbey, Essex, dedicated to bringing the finest coffees from around
          the world to businesses across the UK.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold text-amber-900 mb-4" style={{ fontFamily: "Georgia, serif" }}>
            Our Story
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Harvest Coffee was founded with a simple mission: to connect businesses with exceptional coffee. We source our beans
            directly from trusted farms and cooperatives, ensuring quality at every step of the supply chain.
          </p>
          <p className="text-gray-700 leading-relaxed">
            From our base at The Breeches, Galleyhill Road, Waltham Abbey, we supply cafés, restaurants, offices, and hospitality
            businesses throughout the United Kingdom with carefully curated coffee selections and professional machine maintenance
            services.
          </p>
        </div>
        <div>
          <img
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80"
            alt="Coffee roasting"
            className="rounded-2xl shadow-xl w-full object-cover h-80"
          />
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-amber-900 text-center mb-10" style={{ fontFamily: "Georgia, serif" }}>
          Our Values
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Coffee, title: "Quality First", desc: "Every bean is carefully selected and roasted to perfection." },
            { icon: Leaf, title: "Sustainability", desc: "We partner with farms committed to ethical and sustainable practices." },
            { icon: Award, title: "Excellence", desc: "Award-winning blends and single origins from the world's best regions." },
            { icon: Users, title: "Partnership", desc: "We build long-term relationships with our wholesale clients." },
          ].map(({ icon: Icon, title, desc }) => (
            <article key={title} className="border border-amber-100 text-center h-full rounded-xl bg-white">
              <div className="p-6">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-amber-900" />
                </div>
                <h3 className="font-bold text-amber-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
