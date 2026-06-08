"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { questService } from "@/services/quest.service";
import { skillService } from "@/services/skill.service";
import { submissionService } from "@/services/submission.service";
import { QuestCenterCard } from "@/app/components/QuestCenterCard";
import { QuestStatusBadge } from "@/app/components/QuestStatusBadge";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import { DomainPicker } from "@/app/components/DomainPicker";
import type { Skill } from "@/types/skill";
import {
  DIFFICULTY_LABELS,
  type QuestListItem,
  type UserQuest,
  type CivilizationQuestGroup,
} from "@/types/quest";
import type { SubmissionHistoryItem } from "@/types/submission";

type TabId = "all" | "recommended" | "mine" | "civilization";

const TAB_KEYS: { id: TabId; key: string }[] = [
  { id: "all", key: "quests.allQuests" },
  { id: "recommended", key: "quests.dailyRecommendations" },
  { id: "mine", key: "quests.myQuests" },
  { id: "civilization", key: "quests.civilizationQuests" },
];

export default function QuestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [domainFilter, setDomainFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("all");

  // My Quests management state
  const [abandoningQuestId, setAbandoningQuestId] = useState<string | null>(null);
  const [confirmAbandonQuestId, setConfirmAbandonQuestId] = useState<string | null>(null);
  const [expandedHistoryQuestId, setExpandedHistoryQuestId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<Record<string, SubmissionHistoryItem[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null);

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

  // Build skill_id → domain map for client-side domain filtering
  const skillDomainMap = new Map<string, string>(
    skills.map((s: Skill) => [s.id, s.domain])
  );

  // Client-side domain filter helper
  const filterByDomain = (list: QuestListItem[]) => {
    if (!domainFilter) return list;
    return list.filter((q) => skillDomainMap.get(q.skill_id) === domainFilter);
  };

  // ── Handlers for My Quests management ──────────────────
  const handleAbandon = async (questId: string) => {
    setAbandoningQuestId(questId);
    try {
      await questService.abandonQuest(questId);
      await Promise.all([
        mutate("user-quests"),
        mutate("recommended-quests"),
      ]);
      setConfirmAbandonQuestId(null);
    } finally {
      setAbandoningQuestId(null);
    }
  };

  const handleToggleHistory = async (questId: string) => {
    if (expandedHistoryQuestId === questId) {
      setExpandedHistoryQuestId(null);
      return;
    }
    setExpandedHistoryQuestId(questId);
    if (!historyData[questId]) {
      setLoadingHistory(questId);
      try {
        const data = await submissionService.getSubmissionHistory(questId);
        setHistoryData((prev) => ({ ...prev, [questId]: data }));
      } finally {
        setLoadingHistory(null);
      }
    }
  };

  // Resolve display name based on locale
  const resolveLocalizedTitle = (uq: UserQuest) =>
    locale === "en" && uq.quest_title_en ? uq.quest_title_en : uq.quest_title;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("quests.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("quests.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-secondary p-1 w-fit flex-wrap">
        {TAB_KEYS.map(({ id, key }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
              activeTab === id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
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
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">{t("quests.filter.allDifficulties")}</option>
              {Object.entries(DIFFICULTY_LABELS).map(([key]) => (
                <option key={key} value={key}>
                  {t(`quests.difficulty.${key}` as any)}
                </option>
              ))}
            </select>

            {(skillFilter || difficultyFilter || domainFilter) && (
              <button
                onClick={() => {
                  setSkillFilter("");
                  setDifficultyFilter("");
                  setDomainFilter("");
                }}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("quests.filter.clearFilter")}
              </button>
            )}
          </div>

          {/* Domain filter pills */}
          <div className="mt-2">
            <DomainPicker selected={domainFilter} onChange={setDomainFilter} />
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
          const filteredQuests = filterByDomain(quests);
          if (filteredQuests.length === 0) {
            return (
              <EmptyState
                title={t("quests.noQuests")}
                description={
                  skillFilter || difficultyFilter || domainFilter
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

      {/* ── Tab: My Quests ─────────────────────────────────── */}
      {activeTab === "mine" &&
        (userQuestsLoading ? (
          <Loading text={t("common.loading")} />
        ) : userQuests.length === 0 ? (
          <EmptyState
            title={t("quests.noMyQuests")}
            description={t("quests.browseQuestList")}
            actionLabel={t("dashboard.browseQuests")}
            actionHref="/quests"
          />
        ) : (
          <div className="space-y-2">
            {userQuests.map((uq: UserQuest) => {
              const canAbandon =
                uq.status === "ACCEPTED" || uq.status === "IN_PROGRESS";
              const isExpanded = expandedHistoryQuestId === uq.quest_id;
              const questHistory = historyData[uq.quest_id];

              return (
                <div key={uq.quest_id}>
                  <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/20">
                    {/* Quest title + link */}
                    <a
                      href={`/quests/${uq.quest_id}`}
                      className="flex-1 min-w-0 mr-4"
                    >
                      <h4 className="font-semibold text-sm truncate">
                        {resolveLocalizedTitle(uq)}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {t("quests.attempt", { count: uq.submission_count })}
                      </span>
                    </a>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Status badge */}
                      <QuestStatusBadge status={uq.status} size="sm" />

                      {/* History button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleHistory(uq.quest_id);
                        }}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title={t("quests.submissionHistory")}
                      >
                        {t("quests.viewHistory")}
                      </button>

                      {/* Abandon button — always visible to the right of history */}
                      <div className="ml-2 pl-2 border-l border-border">
                        {canAbandon ? (
                          confirmAbandonQuestId === uq.quest_id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAbandon(uq.quest_id);
                                }}
                                disabled={abandoningQuestId === uq.quest_id}
                                className="rounded-lg bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                              >
                                {abandoningQuestId === uq.quest_id
                                  ? t("settings.saving")
                                  : t("common.confirm")}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setConfirmAbandonQuestId(null);
                                }}
                                className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
                              >
                                {t("common.cancel")}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setConfirmAbandonQuestId(uq.quest_id);
                              }}
                              className="rounded-lg border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors"
                            >
                              {t("quests.abandon")}
                            </button>
                          )
                        ) : (
                          <button
                            disabled
                            className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground/40 cursor-not-allowed"
                            title={t("quests.cannotAbandon")}
                          >
                            {t("quests.abandon")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable submission history */}
                  {isExpanded && (
                    <div className="mt-2 ml-4 border-l-2 border-border pl-4 py-2 space-y-3">
                      {loadingHistory === uq.quest_id ? (
                        <Loading text={t("common.loading")} />
                      ) : questHistory && questHistory.length > 0 ? (
                        questHistory.map((item, idx) => (
                          <div
                            key={item.submission_id}
                            className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2"
                          >
                            {/* Header: attempt number + status + date */}
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold">
                                {t("quests.attempt", {
                                  count: questHistory.length - idx,
                                })}
                              </p>
                              <div className="flex items-center gap-2">
                                {item.submitted_at && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(item.submitted_at).toLocaleDateString()}
                                  </span>
                                )}
                                <QuestStatusBadge
                                  status={item.status as any}
                                  size="sm"
                                />
                              </div>
                            </div>

                            {/* Submission content */}
                            {item.content && (
                              <div>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                  {t("quests.content")}
                                </p>
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap bg-background rounded-md p-2 border border-border">
                                  {item.content}
                                </p>
                              </div>
                            )}

                            {/* Assessment results */}
                            {item.assessment && (
                              <div className="rounded-md bg-background border border-border p-2.5 space-y-2">
                                <p className="text-[10px] font-medium text-primary uppercase tracking-wider">
                                  {t("assessment.title")}
                                </p>
                                {/* Scores */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                  {[
                                    { label: t("skills.dimensions.knowledge"), score: item.assessment.knowledge_score },
                                    { label: t("skills.dimensions.reasoning"), score: item.assessment.reasoning_score },
                                    { label: t("skills.dimensions.application"), score: item.assessment.application_score },
                                    { label: t("skills.dimensions.creation"), score: item.assessment.creation_score },
                                    { label: t("assessment.overall"), score: item.assessment.overall_score },
                                  ].map((dim) => (
                                    <div
                                      key={dim.label}
                                      className="rounded bg-secondary/50 px-2 py-1 text-center"
                                    >
                                      <p className="text-[9px] text-muted-foreground truncate" title={dim.label}>
                                        {dim.label}
                                      </p>
                                      <p className="text-xs font-bold tabular-nums">
                                        {dim.score ?? "—"}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                {/* Feedback */}
                                {item.assessment.feedback && (
                                  <div>
                                    <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                                      {t("assessment.feedback")}
                                    </p>
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                      {item.assessment.feedback}
                                    </p>
                                  </div>
                                )}
                                {/* Improvement suggestions */}
                                {item.assessment.improvement_suggestions && (
                                  <div>
                                    <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                                      {t("assessment.suggestions")}
                                    </p>
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                      {item.assessment.improvement_suggestions}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground py-2">
                          {t("quests.noHistory")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

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
  const displayLabel =
    locale === "en" && group.label_en ? group.label_en : group.label;
  const borderColor = CIV_COLORS[group.civilization_type] ?? "border-l-[#8B9D83]";
  const bgColor = CIV_BG_COLORS[group.civilization_type] ?? "bg-[#8B9D83]/10 border-[#8B9D83]/20";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      {/* Civilization header */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b border-border ${bgColor}`}>
        <span className="text-2xl">{group.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground">
            {displayLabel}
          </h3>
          <p className="text-xs text-muted-foreground">
            {group.count}{" "}
            {locale === "en" ? "quests available" : "个任务"}
          </p>
        </div>
        {/* Civilization contribution indicator */}
        <div className="shrink-0 rounded-full bg-amber-50/60 border border-amber-200/50 px-3 py-1.5 text-center">
          <p className="text-[10px] text-amber-700 font-medium">
            {locale === "en" ? "Civ Index" : "文明指数"}
          </p>
          <p className="text-sm font-bold text-amber-800 tabular-nums">
            +{group.quests.reduce((sum, q) => sum + (q.reward_preview?.civilization_contribution ?? 0), 0)}
          </p>
        </div>
      </div>

      {/* Quest cards */}
      <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {group.quests.map((quest) => {
          const isAccepted = acceptedQuestIds.has(quest.id);
          const uq = userQuestMap.get(quest.id);
          const reward = quest.reward_preview;

          const questTitle =
            locale === "en" && quest.title_en ? quest.title_en : quest.title;

          return (
            <a
              key={quest.id}
              href={`/quests/${quest.id}`}
              className={`block rounded-xl border border-border bg-background p-4 transition-all duration-300 hover:shadow-card-hover hover:border-primary/20 border-l-[3px] ${borderColor}`}
            >
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

              {/* Building association */}
              {quest.associated_building && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">
                    {quest.associated_building.icon}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {locale === "en" && quest.associated_building.name_en
                      ? quest.associated_building.name_en
                      : quest.associated_building.name}{" "}
                    Lv.{quest.associated_building.current_level}
                  </span>
                </div>
              )}

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

              {/* Accepted badge */}
              {isAccepted && uq && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <QuestStatusBadge status={uq.status} size="sm" />
                </div>
              )}
            </a>
          );
        })}
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
