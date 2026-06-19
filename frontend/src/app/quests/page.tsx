"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { questService } from "@/services/quest.service";
import { skillService } from "@/services/skill.service";
import { QuestCenterCard } from "@/app/components/QuestCenterCard";
import { QuestStatusBadge } from "@/app/components/QuestStatusBadge";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import { CIVILIZATION_GROUPS } from "@/types/world";
import type { Skill } from "@/types/skill";
import {
  DIFFICULTY_LABELS,
  type QuestListItem,
  type UserQuest,
  type CivilizationQuestGroup,
} from "@/types/quest";

type TabId = "all" | "recommended" | "civilization";

const TAB_KEYS: { id: TabId; key: string }[] = [
  { id: "all", key: "quests.allQuests" },
  { id: "recommended", key: "quests.dailyRecommendations" },
  { id: "civilization", key: "quests.civilizationQuests" },
];

export default function QuestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [civFilter, setCivFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch available skills for filter
  const { data: skills = [] } = useSWR(
    isAuthenticated ? "skills-list" : null,
    () => skillService.listSkills()
  );

  // Fetch all quests (with optional filters)
  const {
    data: quests = [],
    isLoading: questsLoading,
    error: questsError,
  } = useSWR(
    isAuthenticated && activeTab === "all"
      ? ["quests", skillFilter, difficultyFilter]
      : null,
    () =>
      questService.listQuests({
        ...(skillFilter ? { skill_id: skillFilter } : {}),
        ...(difficultyFilter ? { difficulty: difficultyFilter } : {}),
      })
  );

  // Fetch recommended quests
  const {
    data: recommendedQuests = [],
    isLoading: recommendedLoading,
    error: recommendedError,
  } = useSWR(
    isAuthenticated && activeTab === "recommended" ? "recommended-quests" : null,
    () => questService.listRecommendedQuests()
  );

  // Fetch user's quests (always needed for status badges)
  const {
    data: userQuests = [],
    isLoading: userQuestsLoading,
  } = useSWR(
    isAuthenticated ? "user-quests" : null,
    () => questService.listUserQuests()
  );

  // Fetch civilization-grouped quests
  const {
    data: civGroups = [],
    isLoading: civGroupsLoading,
    error: civGroupsError,
  } = useSWR(
    isAuthenticated && activeTab === "civilization"
      ? "quests-by-civilization"
      : null,
    () => questService.listQuestsByCivilization()
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const acceptedQuestIds = new Set(userQuests.map((uq: UserQuest) => uq.quest_id));
  const userQuestMap = new Map(
    userQuests.map((uq: UserQuest) => [uq.quest_id, uq])
  );

  // Build skill_id → domain map for client-side civilization filtering
  const skillDomainMap = new Map<string, string>(
    skills.map((s: Skill) => [s.id, s.domain])
  );

  // Build domain → civilization key map
  const domainCivMap = new Map<string, string>();
  for (const civ of CIVILIZATION_GROUPS) {
    for (const domain of civ.domains) {
      domainCivMap.set(domain, civ.key);
    }
  }

  // Client-side civilization filter helper
  const filterByCiv = (list: QuestListItem[]) => {
    if (!civFilter) return list;
    return list.filter((q) => {
      const domain = skillDomainMap.get(q.skill_id);
      if (!domain) return false;
      return domainCivMap.get(domain) === civFilter;
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 relative overflow-hidden">
      <div>
        <h1 className="text-2xl font-bold font-civ-serif text-[oklch(0.3_0.02_80)]">{t("quests.title")}</h1>
        <p className="mt-1 text-sm font-civ-serif text-[oklch(0.5_0.02_85)]">
          {t("quests.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 rounded-xl border border-[oklch(0.88_0.02_90)] bg-[oklch(0.95_0.005_90)] p-0.5 w-fit flex-wrap shadow-inner">
        {TAB_KEYS.map(({ id, key }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold font-civ-serif transition-all duration-200 btn-press ${
              activeTab === id
                ? "bg-gradient-to-b from-[oklch(0.99_0.002_95)] to-[oklch(0.96_0.005_90)] text-[oklch(0.3_0.02_80)] shadow-md border border-[oklch(0.7_0.12_85_/_0.5)] scale-102"
                : "text-[oklch(0.55_0.02_85)] hover:text-[oklch(0.35_0.02_80)] hover:bg-[oklch(0.98_0.005_95)]/50"
            }`}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {/* Filters — only for "all" tab */}
      {activeTab === "all" && (
        <>
          <div className="flex flex-wrap gap-3">
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="rounded-xl border border-[oklch(0.88_0.02_90)] bg-[oklch(0.99_0.003_95)] text-[oklch(0.3_0.02_80)] px-3 py-1.5 text-sm font-civ-serif transition-all duration-300 focus:outline-none focus:border-[oklch(0.7_0.12_85)] focus:ring-2 focus:ring-[oklch(0.7_0.12_85_/_0.15)]"
            >
              <option value="">{t("quests.filter.allSkills")}</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="rounded-xl border border-[oklch(0.88_0.02_90)] bg-[oklch(0.99_0.003_95)] text-[oklch(0.3_0.02_80)] px-3 py-1.5 text-sm font-civ-serif transition-all duration-300 focus:outline-none focus:border-[oklch(0.7_0.12_85)] focus:ring-2 focus:ring-[oklch(0.7_0.12_85_/_0.15)]"
            >
              <option value="">{t("quests.filter.allDifficulties")}</option>
              {Object.entries(DIFFICULTY_LABELS).map(([key]) => (
                <option key={key} value={key}>
                  {t(`quests.difficulty.${key}` as any)}
                </option>
              ))}
            </select>

            {(skillFilter || difficultyFilter || civFilter) && (
              <button
                onClick={() => {
                  setSkillFilter("");
                  setDifficultyFilter("");
                  setCivFilter("");
                }}
                className="rounded-lg px-3 py-1.5 text-sm font-civ-serif font-bold text-[oklch(0.5_0.02_85)] hover:text-[oklch(0.3_0.02_80)] transition-colors"
              >
                {t("quests.filter.clearFilter")}
              </button>
            )}
          </div>

          {/* Civilization type filter pills */}
          <div className="mt-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setCivFilter("")}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold font-civ-serif transition-all border ${
                  civFilter === ""
                    ? "bg-[oklch(0.72_0.12_82)] text-white border-[oklch(0.72_0.12_82)] shadow-sm"
                    : "bg-[oklch(0.95_0.005_90)] border-[oklch(0.88_0.02_90)] text-[oklch(0.5_0.02_85)] hover:bg-[oklch(0.98_0.005_95)] hover:text-[oklch(0.3_0.02_80)]"
                }`}
              >
                {t("quests.filter.all")}
              </button>
              {CIVILIZATION_GROUPS.filter((civ) =>
                skills.some((s) => civ.domains.includes(s.domain))
              ).map((civ) => {
                const isActive = civFilter === civ.key;
                return (
                  <button
                    key={civ.key}
                    onClick={() => setCivFilter(civ.key)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold font-civ-serif transition-all border ${
                      isActive
                        ? "bg-[oklch(0.72_0.12_82)] text-white border-[oklch(0.72_0.12_82)] shadow-sm"
                        : "bg-[oklch(0.95_0.005_90)] border-[oklch(0.88_0.02_90)] text-[oklch(0.5_0.02_85)] hover:bg-[oklch(0.98_0.005_95)] hover:text-[oklch(0.3_0.02_80)]"
                    }`}
                  >
                    {civ.icon} {locale === "en" ? civ.labelEn : civ.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Tab: All Quests ────────────────────────────────── */}
      {activeTab === "all" &&
        (questsLoading ? (
          <Loading variant="skeleton-cards" cardCount={6} />
        ) : questsError ? (
          <ErrorState message={t("quests.loadQuestsError")} />
        ) : (() => {
          const filteredQuests = filterByCiv(quests);
          if (filteredQuests.length === 0) {
            return (
              <EmptyState
                title={t("quests.noQuests")}
                description={
                  skillFilter || difficultyFilter || civFilter
                    ? t("quests.tryAdjustFilter")
                    : t("quests.comingSoonMore")
                }
              />
            );
          }
          return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {filteredQuests.map((quest: QuestListItem) => (
              <div key={quest.id} className="card-hover">
                <QuestCenterCard
                  quest={quest}
                  userQuest={
                    acceptedQuestIds.has(quest.id)
                      ? userQuestMap.get(quest.id)
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        );
      })())}

      {/* ── Tab: Daily Recommendations ─────────────────────── */}
      {activeTab === "recommended" && (
        <>
          <div className="rounded-2xl border border-border bg-primary/5 p-5">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <div>
                <h2 className="text-sm font-semibold">{t("quests.todayRecommendation")}</h2>
                <p className="text-xs text-muted-foreground">
                  {t("quests.dailyDesc")}
                </p>
              </div>
            </div>
          </div>

          {recommendedLoading ? (
            <Loading variant="skeleton-cards" cardCount={4} />
          ) : recommendedError ? (
            <ErrorState message={t("quests.loadRecommendedError")} />
          ) : recommendedQuests.length === 0 ? (
            <EmptyState
              title={t("quests.noRecommended")}
              description={t("quests.allAccepted")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
              {recommendedQuests.map((quest: QuestListItem) => (
                <div key={quest.id} className="card-hover">
                  <QuestCenterCard
                    quest={quest}
                    userQuest={
                      acceptedQuestIds.has(quest.id)
                        ? userQuestMap.get(quest.id)
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Civilization Quest Groups ──────────────────── */}
      {activeTab === "civilization" &&
        (civGroupsLoading ? (
          <Loading variant="skeleton-cards" cardCount={4} />
        ) : civGroupsError ? (
          <ErrorState message={t("quests.loadCivilizationError")} />
        ) : civGroups.length === 0 ? (
          <EmptyState
            title={t("quests.noCivilizationQuests")}
            description={t("quests.noCivilizationQuestsDesc")}
            actionLabel={t("quests.browseQuestList")}
            actionHref="/quests"
          />
        ) : (
          <div className="space-y-8">
            {civGroups.map((group: CivilizationQuestGroup) => (
              <CivilizationQuestSection
                key={group.civilization_type}
                group={group}
                locale={locale}
                t={t}
                acceptedQuestIds={acceptedQuestIds}
                userQuestMap={userQuestMap}
              />
            ))}
          </div>
        ))}
    </div>
  );
}

// ── Civilization Quest Section ────────────────────────────────────────
// Renders a group of quests under a civilization type header with
// building icons, skill dimension rewards, and civilization contribution.

const CIV_COLORS: Record<string, string> = {
  AI: "border-l-[#8B9D83]",
  ENGINEERING: "border-l-[#C4A77D]",
  KNOWLEDGE: "border-l-[#8B7355]",
  BUSINESS: "border-l-[#9B8B7A]",
  DESIGN: "border-l-[#A8907A]",
  SOCIAL: "border-l-[#B8A590]",
  SCIENCE: "border-l-[#7D9B8B]",
  LANGUAGE: "border-l-[#938B7D]",
  HEALTH: "border-l-[#8B9D83]",
  FINANCE: "border-l-[#C4A77D]",
};

const CIV_BG_COLORS: Record<string, string> = {
  AI: "bg-[#8B9D83]/10 border-[#8B9D83]/20",
  ENGINEERING: "bg-[#C4A77D]/10 border-[#C4A77D]/20",
  KNOWLEDGE: "bg-[#8B7355]/10 border-[#8B7355]/20",
  BUSINESS: "bg-[#9B8B7A]/10 border-[#9B8B7A]/20",
  DESIGN: "bg-[#A8907A]/10 border-[#A8907A]/20",
  SOCIAL: "bg-[#B8A590]/10 border-[#B8A590]/20",
  SCIENCE: "bg-[#7D9B8B]/10 border-[#7D9B8B]/20",
  LANGUAGE: "bg-[#938B7D]/10 border-[#938B7D]/20",
  HEALTH: "bg-[#8B9D83]/10 border-[#8B9D83]/20",
  FINANCE: "bg-[#C4A77D]/10 border-[#C4A77D]/20",
};

/** Status-aware left border color — overrides civ color when user has quest status */
const STATUS_BORDER_COLORS: Record<string, string> = {
  PASSED: "border-l-success",
  FAILED: "border-l-destructive",
  ACCEPTED: "border-l-primary",
  IN_PROGRESS: "border-l-primary",
  SUBMITTED: "border-l-warning",
  ASSESSING: "border-l-warning",
  ABANDONED: "border-l-muted-foreground/30",
};

function CivilizationQuestSection({
  group,
  locale,
  t,
  acceptedQuestIds,
  userQuestMap,
}: {
  group: CivilizationQuestGroup;
  locale: string;
  t: (key: string, vars?: Record<string, string | number> | undefined) => any;
  acceptedQuestIds: Set<string>;
  userQuestMap: Map<string, UserQuest>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayLabel =
    locale === "en" && group.label_en ? group.label_en : group.label;
  const borderColor = CIV_COLORS[group.civilization_type] ?? "border-l-[#8B9D83]";
  const bgColor = CIV_BG_COLORS[group.civilization_type] ?? "bg-[#8B9D83]/10 border-[#8B9D83]/20";
  const toggleExpanded = useCallback(() => setIsExpanded((v) => !v), []);

  // Compute stats for collapsed summary
  const questsWithStatus = group.quests.filter((q) => acceptedQuestIds.has(q.id)).length;
  const totalCivIndex = group.quests.reduce((sum, q) => sum + (q.reward_preview?.civilization_contribution ?? 0), 0);

  return (
    <div className="vintage-parchment-card rounded-2xl border border-[oklch(0.88_0.02_90)] shadow-sm overflow-hidden relative">
      {/* Decorative coordinate stamp */}
      <div className="absolute top-1 right-2 text-[8px] font-mono opacity-15 text-[oklch(0.3_0.02_80)] select-none">
        [E {20 + (group.civilization_type.charCodeAt(0) % 150)}° / N 48°]
      </div>
      {/* Civilization header — clickable to toggle collapse */}
      <button
        type="button"
        onClick={toggleExpanded}
        className={`w-full flex items-center gap-3 px-5 py-4 border-b border-[oklch(0.88_0.02_90_/_0.7)] ${bgColor} text-left cursor-pointer hover:opacity-90 transition-opacity`}
      >
        <span className="text-2xl">{group.icon}</span>
        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold font-civ-serif text-[oklch(0.3_0.02_80)]">
              {displayLabel}
            </h3>
            {/* Task count badge */}
            <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.72_0.12_82_/_0.12)] border border-[oklch(0.72_0.12_82_/_0.25)] px-2 py-0.5 text-[11px] font-bold font-civ-serif text-[oklch(0.35_0.12_85)]">
              {group.count}{" "}
              <span className="text-[oklch(0.5_0.02_85)] font-normal text-[10px]">
                {locale === "en" ? "quests" : "个任务"}
              </span>
            </span>
          </div>
          {!isExpanded && questsWithStatus > 0 && (
            <p className="text-xs text-[oklch(0.5_0.02_85)] mt-0.5 font-medium">
              {locale === "en" ? `${questsWithStatus} in progress` : `${questsWithStatus} 个进行中`}
            </p>
          )}
        </div>
        {/* Civilization contribution indicator */}
        <div className="shrink-0 rounded-full bg-[oklch(0.72_0.12_82_/_0.15)] border border-[oklch(0.72_0.12_82_/_0.4)] px-3 py-1.5 text-center shadow-inner relative z-10">
          <p className="text-[10px] text-[oklch(0.35_0.12_85)] font-bold font-civ-serif">
            {locale === "en" ? "Civ Index" : "文明指数"}
          </p>
          <p className="text-sm font-bold text-[oklch(0.3_0.12_85)] font-mono tabular-nums">
            +{totalCivIndex}
          </p>
        </div>
        {/* Collapse chevron */}
        <span className={`text-[10px] text-[oklch(0.5_0.02_85)] transition-transform duration-300 shrink-0 ${isExpanded ? "rotate-90" : ""}`}>
          ▶
        </span>
      </button>

      {/* Quest cards — collapsible */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {group.quests.map((quest) => {
            const isAccepted = acceptedQuestIds.has(quest.id);
            const uq = userQuestMap.get(quest.id);
            const reward = quest.reward_preview;

            const questTitle =
              locale === "en" && quest.title_en ? quest.title_en : quest.title;

            // Status-aware border color
            const statusBorder = isAccepted && uq
              ? (STATUS_BORDER_COLORS[uq.status] ?? borderColor)
              : borderColor;

            return (
              <a
                key={quest.id}
                href={`/quests/${quest.id}`}
                className={`block rounded-xl border border-border bg-background p-4 transition-all duration-300 hover:shadow-card-hover hover:border-primary/20 border-l-[3px] ${statusBorder}`}
              >
                {/* Building association — more prominent at top */}
                {quest.associated_building && (
                  <div className="flex items-center gap-1.5 mb-2 rounded-lg bg-[#C4A77D]/8 border border-[#C4A77D]/12 px-2 py-1.5">
                    <span className="text-base leading-none">
                      {quest.associated_building.icon || "🏛️"}
                    </span>
                    <span className="text-[11px] font-medium text-[#8B7355]">
                      {locale === "en" && quest.associated_building.name_en
                        ? quest.associated_building.name_en
                        : quest.associated_building.name}
                    </span>
                    <span className="text-[10px] text-[#8B7355]/60 tabular-nums ml-auto">
                      Lv.{quest.associated_building.current_level}
                    </span>
                  </div>
                )}

                {/* Status badge — prominent for accepted quests */}
                {isAccepted && uq && (
                  <div className="mb-2">
                    <QuestStatusBadge status={uq.status} size="sm" />
                  </div>
                )}

                {/* Title + difficulty */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                    {questTitle}
                  </h4>
                  <span
                    className={`shrink-0 text-[10px] font-medium rounded-full px-2 py-0.5 ${
                      quest.difficulty === "LEVEL_4"
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : quest.difficulty === "LEVEL_3"
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : quest.difficulty === "LEVEL_2"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-slate-50 text-slate-500 border border-slate-200"
                    }`}
                  >
                    {t(`quests.difficulty.${quest.difficulty}` as any)}
                  </span>
                </div>

                {/* Skill name */}
                {quest.skill_name && (
                  <p className="text-xs text-muted-foreground mb-2">
                    🎯 {quest.skill_name}
                  </p>
                )}

                {/* Reward preview bars */}
                {reward && (
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-border/50">
                    <div className="grid grid-cols-4 gap-1">
                      <MiniRewardBar
                        label={locale === "en" ? "KN" : "知识"}
                        value={reward.knowledge}
                        max={15}
                        color="bg-emerald-400"
                      />
                      <MiniRewardBar
                        label={locale === "en" ? "RE" : "推理"}
                        value={reward.reasoning}
                        max={15}
                        color="bg-blue-400"
                      />
                      <MiniRewardBar
                        label={locale === "en" ? "AP" : "应用"}
                        value={reward.application}
                        max={15}
                        color="bg-amber-400"
                      />
                      <MiniRewardBar
                        label={locale === "en" ? "CR" : "创造"}
                        value={reward.creation}
                        max={15}
                        color="bg-purple-400"
                      />
                    </div>
                    {/* Building EXP */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#8B9D83] font-medium">
                        🏛️ +{reward.building_exp}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-amber-600 font-medium">
                        📊 +{reward.civilization_contribution}
                      </span>
                    </div>
                  </div>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Mini Reward Bar ────────────────────────────────────────────────────

function MiniRewardBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="text-center">
      <p className="text-[9px] text-muted-foreground mb-0.5">{label}</p>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-0.5">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] font-bold tabular-nums">{value}</p>
    </div>
  );
}
