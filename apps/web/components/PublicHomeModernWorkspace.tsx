"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PublicSectionHeader from "@/components/PublicSectionHeader";
import type { Product } from "@/lib/domain";
import { ArrowRight, Coffee, Flame, Handshake, Plus, ShoppingBag, ShoppingCart, Sprout, Trophy } from "lucide-react";
import Link from "next/link";
import MotionReveal from "./MotionReveal";

type PublicHomeModernWorkspaceProps = {
  isAuthenticated: boolean;
  featuredProduct?: Product;
  products: Product[];
  mostOrderedProducts: Product[];
  cartQuantity: number;
  onQuickAdd: (productId: string) => void;
};

const heroImage = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=85";
const roastingImage = "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=85";
const cafeImage = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=85";

export default function PublicHomeModernWorkspace({
  isAuthenticated,
  featuredProduct,
  products,
  mostOrderedProducts,
  cartQuantity,
  onQuickAdd,
}: PublicHomeModernWorkspaceProps) {
  return (
    <div className="harvest-theme bg-background text-foreground">
      <section className="relative min-h-screen overflow-hidden bg-sidebar">
        <img alt="Coffee cups" className="motion-hero-image absolute inset-0 h-full w-full object-cover object-center" src={heroImage} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,8,4,0.94)_0%,rgba(16,8,4,0.72)_34%,rgba(16,8,4,0.28)_68%,rgba(16,8,4,0.62)_100%)]" />
        <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center px-5 pb-20 pt-32 sm:px-8 lg:px-10">
          <div className="max-w-[620px]">
            <MotionReveal delay={80}>
              <p className="mb-7 text-xs font-black uppercase tracking-[0.34em] text-sidebar-primary">Our Philosophy · Exceptional Quality</p>
            </MotionReveal>
            <MotionReveal delay={170}>
            <h1 className="font-display max-w-xl text-5xl font-black leading-[0.94] tracking-normal text-sidebar-foreground sm:text-6xl lg:text-7xl">
              It all began with a modest concept: Create <span className="text-sidebar-primary">amazing</span> coffee
            </h1>
            </MotionReveal>
            <MotionReveal delay={260}>
              <p className="mt-7 max-w-md text-base leading-8 text-sidebar-foreground/85">
                Coffee is our craft, our ritual, our passion and we want to share it with you.
              </p>
            </MotionReveal>
            <MotionReveal className="mt-8 flex flex-col gap-3 sm:flex-row" delay={350}>
              <Button asChildShim className="h-12 rounded-md bg-sidebar-primary px-6 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20 transition-transform duration-300 hover:-translate-y-0.5 hover:bg-sidebar-primary/90" variant="default">
                <Link href="/products">
                  Discover Products
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChildShim className="h-12 rounded-md border-sidebar-foreground/60 bg-sidebar-foreground/5 px-6 text-sidebar-foreground transition-transform duration-300 hover:-translate-y-0.5 hover:bg-sidebar-foreground/15" variant="outline">
                <Link href="/about">Learn More</Link>
              </Button>
            </MotionReveal>
          </div>

          <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 items-center gap-6 lg:flex">
            <p className="rotate-90 text-[11px] font-bold uppercase tracking-[0.28em] text-sidebar-foreground/75">Small Batch · Since 2008</p>
            <span className="block h-28 w-px bg-sidebar-foreground/55" />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-card px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <CoffeeBranchAsset className="absolute -left-28 top-16 h-80 w-80 bg-primary/[0.055]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <MotionReveal className="lg:pl-10" variant="left">
            <PublicSectionHeader
              className="max-w-md"
              description="Everything we do is a matter of heart, body and soul. Our mission is to provide sustainably sourced, hand-picked, micro-roasted quality coffee. Great coffee is our passion and we want to share it with you."
              eyebrow="Because We Love Coffee"
              size="section"
              title={<>Our <span className="text-primary">Mission</span></>}
            />
            <Button asChildShim className="mt-8 h-11 rounded-md border-primary/25 bg-transparent px-6 text-primary hover:bg-background" variant="outline">
              <Link href="/about">
                Learn More
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </MotionReveal>

          <MotionReveal className="relative" delay={130} variant="right">
            <div className="overflow-hidden rounded-lg shadow-2xl shadow-primary/10">
              <img alt="Coffee beans" className="motion-image h-[330px] w-full object-cover" src={roastingImage} />
            </div>
            <Card className="absolute -bottom-7 left-5 w-44 rounded-lg border-sidebar-border bg-sidebar p-6 text-sidebar-foreground shadow-2xl shadow-sidebar/25 sm:left-[-40px]">
              <Trophy className="mb-4 h-7 w-7 text-sidebar-primary" />
              <p className="font-display text-4xl font-black text-sidebar-primary">15+</p>
              <p className="text-sm text-sidebar-foreground/85">Years of Excellence</p>
            </Card>
          </MotionReveal>
        </div>
      </section>

      <section className="border-y border-border bg-background px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-3">
          {[
            { icon: Sprout, title: "Sustainably Sourced", desc: "Fairtrade certified beans from ethical farms" },
            { icon: Flame, title: "Micro-Roasted", desc: "Hand-crafted roasting for peak flavour" },
            { icon: Handshake, title: "B2B Excellence", desc: "Tailored wholesale programs for your business" },
          ].map((item, index) => (
            <MotionReveal delay={index * 90} key={item.title} variant="scale">
              <Card className="motion-card rounded-lg border-border bg-card/70 p-6 shadow-none hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10">
              <div className="flex items-center gap-5">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-display font-black text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            </Card>
            </MotionReveal>
          ))}
        </div>
      </section>

      <section className="relative grid overflow-hidden bg-card lg:grid-cols-[1.05fr_0.95fr]">
        <div className="min-h-[420px] overflow-hidden">
          <img alt="Cafe counter" className="motion-image h-full min-h-[420px] w-full object-cover" src={cafeImage} />
        </div>
        <div className="relative flex items-center px-5 py-14 sm:px-8 lg:px-10">
          <MotionReveal className="w-full max-w-xl lg:-ml-20" variant="right">
          <Card className="motion-card relative -ml-0 w-full rounded-lg border-border bg-card p-8 shadow-2xl shadow-primary/10 hover:shadow-primary/15">
            <CoffeeBranchAsset className="absolute bottom-5 right-5 h-36 w-36 bg-primary/[0.055]" />
            <div className="relative">
              <PublicSectionHeader
                className="max-w-md"
                description="Personalised to your specific needs. We help build coffee programs to grow your business."
                eyebrow="Become a Partner"
                size="section"
                title={<>Explore <span className="text-primary">Wholesale</span></>}
              />
              <Button asChildShim className="mt-8 h-12 rounded-md px-7" variant="default">
                <Link href={isAuthenticated ? "/products" : "/login?next=%2Fproducts"}>
                  {isAuthenticated ? "Order Now" : "Get in Touch"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
          </MotionReveal>
        </div>
      </section>

      {featuredProduct && (
        <section className="relative overflow-hidden bg-card px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <MotionReveal className="relative" variant="left">
              <div className="overflow-hidden rounded-lg shadow-xl shadow-primary/10">
                {featuredProduct.imageUrl ? (
                  <img alt={featuredProduct.name} className="motion-image h-[390px] w-full object-cover" src={featuredProduct.imageUrl} />
                ) : (
                  <div className="flex h-[390px] items-center justify-center bg-secondary text-primary">
                    <Coffee className="h-20 w-20" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-8 -left-4 hidden h-24 w-24 rounded-full border border-primary/20 bg-card/85 text-center text-[8.5px] font-black uppercase leading-[1.45] tracking-[0.14em] text-primary shadow-lg shadow-primary/5 backdrop-blur-sm sm:flex sm:items-center sm:justify-center">
                <span>
                  Single Origin
                  <br />
                  Roast Coffee
                </span>
              </div>
            </MotionReveal>

            <MotionReveal delay={120} variant="right">
              <PublicSectionHeader
                className="max-w-xl"
                eyebrow="Staff Favourite · Featured Coffee"
                size="section"
                title={featuredProduct.name}
              />
              <Badge className="mt-4 border-primary/10 bg-secondary text-secondary-foreground">{featuredProduct.category}</Badge>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">{featuredProduct.description}</p>
              {isAuthenticated && <p className="font-display mt-6 text-3xl font-black text-primary">£{featuredProduct.price.toFixed(2)}</p>}
              <Button asChildShim className="mt-6 h-12 rounded-md px-7" variant="default">
                <Link href="/products">
                  Discover Products
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </MotionReveal>
          </div>
        </section>
      )}

      {isAuthenticated && mostOrderedProducts.length > 0 && (
        <section className="bg-background px-5 py-14 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <MotionReveal className="mb-8 text-center">
              <PublicSectionHeader
                align="center"
                description="Your most frequently ordered products — one click to reorder"
                eyebrow="Dealer Favourites"
                size="compact"
                title={<span className="inline-flex items-center justify-center gap-2"><ShoppingBag className="h-6 w-6 text-primary" />Quick Order</span>}
              />
            </MotionReveal>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {mostOrderedProducts.map((product, index) => (
                <MotionReveal delay={index * 75} key={product.id} variant="scale">
                <Card className="motion-card flex h-full flex-col overflow-hidden rounded-lg border-border bg-card p-2 shadow-sm shadow-primary/5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10">
                  <div className="overflow-hidden rounded-md bg-secondary">
                    {product.imageUrl ? (
                      <img alt={product.name} className="motion-image aspect-[4/3] w-full object-cover" src={product.imageUrl} />
                    ) : (
                      <div className="grid aspect-[4/3] w-full place-items-center text-primary">
                        <Coffee className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <CardContent className="flex flex-1 flex-col p-3">
                    <div className="min-h-[52px]">
                      <h3 className="line-clamp-2 text-sm font-extrabold leading-5 text-foreground">{product.name}</h3>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        {product.category}
                        {product.weight ? ` · ${product.weight}` : ""}
                      </p>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                      <strong className="font-display whitespace-nowrap text-lg font-black text-primary">£{product.price.toFixed(2)}</strong>
                      <Badge className="shrink-0 border-primary/10 bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">Popular</Badge>
                    </div>
                    <Button className="mt-3 h-9 w-full min-w-0 rounded-md text-xs" onClick={() => onQuickAdd(product.id)} variant="default">
                      <Plus className="h-3.5 w-3.5" />
                      Quick Add
                    </Button>
                  </CardContent>
                </Card>
                </MotionReveal>
              ))}
            </div>

            {cartQuantity > 0 && (
              <div className="mt-6 flex justify-center">
                <Button asChildShim className="rounded-md" variant="default">
                  <Link href="/products">
                    <ShoppingCart className="h-4 w-4" />
                    {cartQuantity} items added
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      )}
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
