"use client";

import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { passportService } from "@/services/passport.service";
import { PassportCard } from "@/app/components/PassportCard";
import { Loading } from "@/app/components/Loading";

export default function PassportPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const {
    data: passport,
    isLoading: passportLoading,
  } = useSWR(isAuthenticated ? "passport" : null, () =>
    passportService.getPassport()
  );

  if (authLoading) {
    return <Loading text="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">能力通行证</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          你的技能、凭证与项目成果
        </p>
      </div>

      <PassportCard passport={passport || null} isLoading={passportLoading} />
    </div>
  );
}
