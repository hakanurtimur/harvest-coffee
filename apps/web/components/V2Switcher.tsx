"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getV2Config, setAllV2Enabled, useAllV2Enabled, useV2Enabled, v2PageConfigs } from "@/lib/v2-pages";
import { Check, Info, Layers, RotateCcw, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

export default function V2Switcher() {
  const pathname = usePathname();
  const config = useMemo(() => getV2Config(pathname), [pathname]);
  const currentPageEnabled = useV2Enabled(config.path);
  const allEnabled = useAllV2Enabled();
  const [open, setOpen] = useState(false);
  const supportedPageCount = v2PageConfigs.filter((item) => item.supported).length;

  const handleToggle = () => {
    setAllV2Enabled(!allEnabled);
    setOpen(false);
  };

  return (
    <>
      <button
        aria-label="Open V2 switcher"
        className="fixed bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full border border-white/50 bg-stone-950 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-stone-950/25 transition-transform hover:scale-[1.02] md:bottom-7 md:right-7"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Sparkles className="h-4 w-4 text-amber-300" />
        {allEnabled ? "V2 aktif" : "V2'ye geç"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-950/45 p-3 backdrop-blur-sm sm:items-center">
          <Card className="w-full max-w-2xl overflow-hidden rounded-2xl border-white/70 bg-white shadow-2xl">
            <CardHeader className="border-b border-stone-100 pr-14">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-amber-50 text-amber-900">Migration Tool</Badge>
                <Badge className={allEnabled ? "bg-emerald-50 text-emerald-800" : "bg-stone-50 text-stone-700"}>
                  {allEnabled ? "V2 enabled globally" : "V1 active globally"}
                </Badge>
                <Badge className={currentPageEnabled ? "bg-blue-50 text-blue-800" : "bg-stone-50 text-stone-700"}>
                  Current page: {currentPageEnabled ? "V2" : "V1"}
                </Badge>
              </div>
              <CardTitle className="text-2xl text-stone-950">{config.label}</CardTitle>
              <CardDescription className="text-base leading-6">
                {config.summary} Bu buton tüm hazır ekranları tek seferde V2 moduna alır; şu an {supportedPageCount} ekran hazır.
              </CardDescription>
              <button
                aria-label="Close V2 switcher"
                className="absolute right-5 top-5 rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="grid gap-5 p-6">
              <V2List icon={<Sparkles className="h-4 w-4" />} title="Bu sayfada ne değişti?" items={config.changes} />
              <V2List icon={<Info className="h-4 w-4" />} title="Fonksiyonel notlar" items={config.functionalNotes} />
              <V2List icon={<Layers className="h-4 w-4" />} title="Mobile / Expo hazırlığı" items={config.mobileNotes} />

              <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:justify-between">
                <Button className="rounded-full" onClick={() => setOpen(false)} variant="outline">
                  Kapat
                </Button>
                <Button className="rounded-full" onClick={handleToggle} variant={allEnabled ? "outline" : "dark"}>
                  {allEnabled ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  {allEnabled ? "Tüm ekranları V1'e döndür" : "Tüm ekranları V2'ye geçir"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function V2List({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <section className="rounded-2xl bg-stone-50 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-stone-500">
        {icon}
        {title}
      </h3>
      <ul className="grid gap-2 text-sm leading-6 text-stone-700">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
