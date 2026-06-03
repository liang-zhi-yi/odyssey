"use client";

import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { passportService } from "@/services/passport.service";
import { skillService } from "@/services/skill.service";
import { PassportCard } from "@/app/components/PassportCard";
import { Loading } from "@/app/components/Loading";
import type { DimensionScores } from "@/types/assessment";

export default function PassportPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const {
    data: passport,
    isLoading: passportLoading,
  } = useSWR(isAuthenticated ? "passport" : null, () =>
    passportService.getPassport()
  );

  // Fetch user skills for radar aggregate
  const { data: userSkills = [] } = useSWR(
    isAuthenticated ? "user-skills" : null,
    () => skillService.listUserSkills()
  );

  // Compute aggregate dimension scores for radar
  const aggregateScores: DimensionScores | null =
    userSkills.length > 0
      ? {
          knowledge: Math.round(
            userSkills.reduce((s, us) => s + us.knowledge, 0) / userSkills.length
          ),
          reasoning: Math.round(
            userSkills.reduce((s, us) => s + us.reasoning, 0) / userSkills.length
          ),
          application: Math.round(
            userSkills.reduce((s, us) => s + us.application, 0) / userSkills.length
          ),
          creation: Math.round(
            userSkills.reduce((s, us) => s + us.creation, 0) / userSkills.length
          ),
        }
      : null;

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

      <PassportCard
        passport={passport || null}
        aggregateScores={aggregateScores}
        isLoading={passportLoading}
      />
    </div>
  );
}
