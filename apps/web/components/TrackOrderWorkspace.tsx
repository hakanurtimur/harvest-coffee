"use client";

import TrackOrderModernWorkspace from "./TrackOrderModernWorkspace";

export default function TrackOrderWorkspace({ variant = "public" }: { variant?: "public" | "app" }) {
  return <TrackOrderModernWorkspace variant={variant} />;
}
