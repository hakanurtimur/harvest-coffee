import LoginWorkspace from "@/components/LoginWorkspace";
import PublicShell from "@/components/PublicShell";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <PublicShell>
      <Suspense fallback={null}>
        <LoginWorkspace />
      </Suspense>
    </PublicShell>
  );
}
