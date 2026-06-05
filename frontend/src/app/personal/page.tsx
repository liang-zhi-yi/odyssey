"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { passportService } from "@/services/passport.service";
import { skillService } from "@/services/skill.service";
import { credentialService } from "@/services/credential.service";
import { badgeService } from "@/services/badge.service";
import { PassportCard } from "@/app/components/PassportCard";
import { SkillCard } from "@/app/components/SkillCard";
import { CredentialBadge } from "@/app/components/CredentialBadge";
import { BadgeCard } from "@/app/components/BadgeCard";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import { computeAggregateScores } from "@/lib/scores";
import type { Credential } from "@/types/credential";
import type { BadgeDefinition, UserBadge } from "@/types/badge";

type MainTab = "overview" | "skills" | "credentials" | "badges";
type SubTab = "earned" | "all";

const MAIN_TABS: { id: MainTab; emoji: string; key: string }[] = [
  { id: "overview", emoji: "\u{1F4CB}", key: "personal.overview" },
  { id: "skills", emoji: "\u{1F3AF}", key: "personal.skills" },
  { id: "credentials", emoji: "\u{1F3C6}", key: "personal.credentials" },
  { id: "badges", emoji: "\u{1F947}", key: "personal.badges" },
];

export default function PersonalPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get("tab") as MainTab | null;
  const initialTab: MainTab =
    tabFromUrl && MAIN_TABS.some((t) => t.id === tabFromUrl)
      ? tabFromUrl
      : "overview";

  const [activeTab, setActiveTab] = useState<MainTab>(initialTab);
  const [credentialSubTab, setCredentialSubTab] = useState<SubTab>("earned");
  const [badgeSubTab, setBadgeSubTab] = useState<SubTab>("earned");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // —— SWR data fetching (lazy via conditional keys) ——

  // Passport (Overview tab)
  const {
    data: passport,
    isLoading: passportLoading,
    error: passportError,
  } = useSWR(
    isAuthenticated && activeTab === "overview" ? "passport" : null,
    () => passportService.getPassport()
  );

  // User skills (Overview radar + Skills tab)
  const {
    data: userSkills = [],
    isLoading: skillsLoading,
    error: skillsError,
  } = useSWR(
    isAuthenticated &&
      (activeTab === "overview" || activeTab === "skills")
      ? "user-skills"
      : null,
    () => skillService.listUserSkills()
  );

  // User credentials (Credentials tab + Overview stats)
  const {
    data: userCredentials = [],
    isLoading: userCredsLoading,
    error: userCredsError,
  } = useSWR(
    isAuthenticated &&
      (activeTab === "credentials" || activeTab === "overview")
      ? "user-credentials"
      : null,
    () => credentialService.listUserCredentials()
  );

  // All credential definitions (Credentials tab)
  const {
    data: allCredentials = [],
    isLoading: allCredsLoading,
    error: allCredsError,
  } = useSWR(
    isAuthenticated && activeTab === "credentials" ? "credentials" : null,
    () => credentialService.listCredentials()
  );

  // All badge definitions (Badges tab)
  const {
    data: allBadges = [],
    isLoading: allBadgesLoading,
    error: allBadgesError,
  } = useSWR(
    isAuthenticated && activeTab === "badges" ? "badges-catalog" : null,
    () => badgeService.listBadges()
  );

  // User badges (Badges tab + Overview stats)
  const {
    data: userBadges = [],
    isLoading: userBadgesLoading,
    error: userBadgesError,
  } = useSWR(
    isAuthenticated &&
      (activeTab === "badges" || activeTab === "overview")
      ? "user-badges"
      : null,
    () => badgeService.listUserBadges()
  );

  // —— Computed values ——

  const aggregateScores = useMemo(
    () => (userSkills.length > 0 ? computeAggregateScores(userSkills) : null),
    [userSkills]
  );

  const userBadgeMap = useMemo(
    () => new Map<string, UserBadge>(userBadges.map((ub) => [ub.badge_id, ub])),
    [userBadges]
  );

  const earnedBadges = useMemo(
    () => allBadges.filter((b) => userBadgeMap.get(b.id)?.earned),
    [allBadges, userBadgeMap]
  );

  const earnedCredentialIds = useMemo(
    () => new Set(userCredentials.map((c) => c.id)),
    [userCredentials]
  );

  // —— Auth guard ——

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  // —— Render ——

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">{t("personal.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("personal.subtitle")}
        </p>
      </div>

      {/* Main tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-secondary p-1 w-fit">
        {MAIN_TABS.map(({ id, emoji, key }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="mr-1.5">{emoji}</span>
            {t(key)}
          </button>
        ))}
      </div>

      {/* ===== Overview tab ===== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-background p-4 text-center">
              <p className="text-2xl font-bold text-primary tabular-nums">
                {userSkills.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("personal.skills")}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 text-center">
              <p className="text-2xl font-bold text-primary tabular-nums">
                {userCredentials.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("personal.credentials")}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 text-center">
              <p className="text-2xl font-bold text-primary tabular-nums">
                {earnedBadges.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("personal.badges")}</p>
            </div>
          </div>

          {/* Passport Card */}
          {passportError ? (
            <ErrorState message={t("passport.loadError")} />
          ) : (
            <PassportCard
              passport={passport || null}
              aggregateScores={aggregateScores}
              isLoading={passportLoading}
            />
          )}
        </div>
      )}

      {/* ===== Skills tab ===== */}
      {activeTab === "skills" && (
        <>
          {skillsLoading ? (
            <Loading variant="skeleton-cards" cardCount={4} />
          ) : skillsError ? (
            <ErrorState message={t("skills.loadError")} />
          ) : userSkills.length === 0 ? (
            <EmptyState
              title={t("personal.noSkills")}
              description={t("skills.noSkillDesc")}
              actionLabel={t("skills.browseQuests")}
              actionHref="/quests"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {userSkills.map((skill) => (
                <SkillCard key={skill.skill_id} skill={skill} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== Credentials tab ===== */}
      {activeTab === "credentials" && (
        <>
          {/* Sub-tabs */}
          <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
            <button
              onClick={() => setCredentialSubTab("earned")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                credentialSubTab === "earned"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("personal.earned")}
              {userCredentials.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  {userCredentials.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setCredentialSubTab("all")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                credentialSubTab === "all"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("personal.all")}
            </button>
          </div>

          {/* Earned credentials */}
          {credentialSubTab === "earned" && (
            <>
              {userCredsLoading ? (
                <Loading variant="skeleton-cards" cardCount={4} />
              ) : userCredsError ? (
                <ErrorState message={t("credentials.loadCredentialsError")} />
              ) : userCredentials.length === 0 ? (
                <EmptyState
                  title={t("personal.noCredentials")}
                  description={t("credentials.noCredentialsDesc")}
                  actionLabel={t("credentials.browseQuests")}
                  actionHref="/quests"
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {userCredentials.map((cred) => (
                    <CredentialBadge key={cred.id} credential={cred} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* All credentials */}
          {credentialSubTab === "all" && (
            <>
              {allCredsLoading ? (
                <Loading variant="skeleton-cards" cardCount={6} />
              ) : allCredsError ? (
                <ErrorState message={t("credentials.loadCredentialsCatalogError")} />
              ) : allCredentials.length === 0 ? (
                <EmptyState
                  title={t("credentials.noCredentialsDefined")}
                  description={t("credentials.comingSoonCredentials")}
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {allCredentials.map((credential: Credential) => {
                    const earned = earnedCredentialIds.has(credential.id);
                    return (
                      <div
                        key={credential.id}
                        className={`rounded-xl border p-4 transition-all ${
                          earned
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-background opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                              earned ? "bg-primary/10" : "bg-secondary"
                            }`}
                          >
                            {earned ? "\u{1F3C5}" : "\u{1F512}"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {credential.name}
                            </p>
                            {credential.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {credential.description}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Required Score: {credential.required_score}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ===== Badges tab ===== */}
      {activeTab === "badges" && (
        <>
          {/* Sub-tabs */}
          <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
            <button
              onClick={() => setBadgeSubTab("earned")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                badgeSubTab === "earned"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("personal.earned")}
              {earnedBadges.length > 0 && (
                <span className="ml-1.5 tabular-nums text-xs">
                  ({earnedBadges.length})
                </span>
              )}
            </button>
            <button
              onClick={() => setBadgeSubTab("all")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                badgeSubTab === "all"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("personal.all")}
            </button>
          </div>

          {/* Content */}
          {allBadgesLoading || userBadgesLoading ? (
            <Loading variant="skeleton-cards" cardCount={3} />
          ) : allBadgesError || userBadgesError ? (
            <ErrorState message={t("common.error")} />
          ) : badgeSubTab === "earned" && earnedBadges.length === 0 ? (
            <EmptyState
              title={t("personal.noBadges")}
              description={t("badges.noBadgesDesc")}
              actionLabel={t("badges.browseQuests")}
              actionHref="/quests"
            />
          ) : badgeSubTab === "all" && allBadges.length === 0 ? (
            <EmptyState
              title={t("badges.noBadges")}
              description={t("badges.comingSoon")}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(badgeSubTab === "earned" ? earnedBadges : allBadges).map(
                (badge: BadgeDefinition) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    userBadge={userBadgeMap.get(badge.id)}
                  />
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
