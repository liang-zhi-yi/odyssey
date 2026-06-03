"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { passportService } from "@/services/passport.service";
import { skillService } from "@/services/skill.service";
import { PassportCard } from "@/app/components/PassportCard";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { computeAggregateScores } from "@/lib/scores";
import type { DimensionScores } from "@/types/assessment";

export default function PassportPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const {
    data: passport,
    isLoading: passportLoading,
    error: passportError,
  } = useSWR(isAuthenticated ? "passport" : null, () =>
    passportService.getPassport()
  );

  // Fetch user skills for radar aggregate
  const {
    data: userSkills = [],
    error: skillsError,
  } = useSWR(
    isAuthenticated ? "user-skills" : null,
    () => skillService.listUserSkills()
  );

  // Compute aggregate dimension scores for radar
  const aggregateScores: DimensionScores | null =
    userSkills.length > 0 ? computeAggregateScores(userSkills) : null;

  if (authLoading || !isAuthenticated) {
    return <Loading text="验证中..." />;
  }

  if (passportError || skillsError) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">能力通行证</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            你的技能、凭证与项目成果
          </p>
        </div>
        <ErrorState
          message="加载通行证失败"
          detail={
            passportError instanceof Error ? passportError.message : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">能力通行证</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          你的技能、凭证与项目成果
        </p>
      </div>

      <PassportCard
        passport={passport || null}
        aggregateScores={aggregateScores}
        isLoading={passportLoading}
      />
    </div>
  );
}
