"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { questService } from "@/services/quest.service";
import { skillService } from "@/services/skill.service";
import { pathService } from "@/services/path.service";
import { submissionService } from "@/services/submission.service";
import { QuestCard } from "@/app/components/QuestCard";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import {
  SUBMISSION_STATUS_LABELS,
  DIFFICULTY_LABELS,
  QUEST_TYPE_LABELS,
  type QuestListItem,
  type UserQuest,
} from "@/types/quest";
import type { SubmissionHistoryItem } from "@/types/submission";

type TabId = "all" | "recommended" | "path-node" | "mine";

const TAB_KEYS: { id: TabId; key: string }[] = [
  { id: "all", key: "quests.allQuests" },
  { id: "recommended", key: "quests.dailyRecommendations" },
  { id: "path-node", key: "quests.pathNode" },
  { id: "mine", key: "quests.myQuests" },
];

export default function QuestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
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

  // Fetch current path (for path-node tab)
  const { data: currentPath } = useSWR(
    isAuthenticated ? "current-path" : null,
    () => pathService.getCurrentPath()
  );
  const hasActivePath = currentPath && currentPath.path_id;

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

  // Fetch path-node quests
  const {
    data: pathNodeQuests = [],
    isLoading: pathNodeLoading,
    error: pathNodeError,
  } = useSWR(
    isAuthenticated && activeTab === "path-node" ? "path-node-quests" : null,
    () => questService.listPathNodeQuests()
  );

  // Fetch path nodes for detailed view
  const { data: pathNodes } = useSWR(
    isAuthenticated && activeTab === "path-node" && hasActivePath
      ? ["path-nodes", currentPath.path_id]
      : null,
    () => pathService.getPathNodes(currentPath!.path_id)
  );

  // Fetch user's quests (always needed for status badges)
  const {
    data: userQuests = [],
    isLoading: userQuestsLoading,
  } = useSWR(
    isAuthenticated ? "user-quests" : null,
    () => questService.listUserQuests()
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const acceptedQuestIds = new Set(userQuests.map((uq: UserQuest) => uq.quest_id));
  const userQuestMap = new Map(
    userQuests.map((uq: UserQuest) => [uq.quest_id, uq])
  );

  const nextNode = pathNodes?.nodes[0] ?? null;

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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{t("quests.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("quests.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit flex-wrap">
        {TAB_KEYS.map(({ id, key }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
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
        <div className="flex flex-wrap gap-3">
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">{t("quests.filter.allDifficulties")}</option>
            {Object.entries(DIFFICULTY_LABELS).map(([key]) => (
              <option key={key} value={key}>
                {t(`quests.difficulty.${key}` as any)}
              </option>
            ))}
          </select>

          {(skillFilter || difficultyFilter) && (
            <button
              onClick={() => {
                setSkillFilter("");
                setDifficultyFilter("");
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("quests.filter.clearFilter")}
            </button>
          )}
        </div>
      )}

      {/* ── Tab: All Quests ────────────────────────────────── */}
      {activeTab === "all" &&
        (questsLoading ? (
          <Loading variant="skeleton-cards" cardCount={6} />
        ) : questsError ? (
          <ErrorState message={t("quests.loadQuestsError")} />
        ) : quests.length === 0 ? (
          <EmptyState
            title={t("quests.noQuests")}
            description={
              skillFilter || difficultyFilter
                ? t("quests.tryAdjustFilter")
                : t("quests.comingSoonMore")
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {quests.map((quest: QuestListItem) => (
              <div key={quest.id} className="relative card-hover">
                {acceptedQuestIds.has(quest.id) && (
                  <span className="absolute -top-1 -right-1 z-10 rounded-full bg-success px-2 py-0.5 text-[10px] font-medium text-success-foreground shadow-sm">
                    {SUBMISSION_STATUS_LABELS[
                      userQuestMap.get(quest.id)?.status || "ACCEPTED"
                    ] || "ACCEPTED"}
                  </span>
                )}
                <QuestCard quest={quest} />
              </div>
            ))}
          </div>
        ))}

      {/* ── Tab: Daily Recommendations ─────────────────────── */}
      {activeTab === "recommended" && (
        <>
          <div className="rounded-xl border border-border bg-primary/5 p-4">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
              {recommendedQuests.map((quest: QuestListItem) => (
                <div key={quest.id} className="relative card-hover">
                  {acceptedQuestIds.has(quest.id) && (
                    <span className="absolute -top-1 -right-1 z-10 rounded-full bg-success px-2 py-0.5 text-[10px] font-medium text-success-foreground shadow-sm">
                      {SUBMISSION_STATUS_LABELS[
                        userQuestMap.get(quest.id)?.status || "ACCEPTED"
                      ] || "ACCEPTED"}
                    </span>
                  )}
                  <QuestCard quest={quest} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Path Nodes ────────────────────────────────── */}
      {activeTab === "path-node" && (
        <>
          {!hasActivePath ? (
            <EmptyState
              title={t("quests.noPathSelected")}
              description={t("quests.noPathSelectedDesc")}
              actionLabel={t("paths.goSelectPath")}
              actionHref="/paths"
            />
          ) : (
            <>
              {/* Path node progression bar */}
              {pathNodes && pathNodes.nodes.length > 0 && (
                <div className="rounded-xl border border-border bg-background p-5">
                  <h3 className="text-sm font-semibold mb-1">
                    {locale === "en" && pathNodes.path_name_en
                      ? pathNodes.path_name_en
                      : pathNodes.path_name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {locale === "en" && pathNodes.path_description_en
                      ? pathNodes.path_description_en
                      : pathNodes.path_description}
                  </p>

                  {/* Node progression */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {pathNodes.nodes.map((node, i) => {
                      const isCurrent =
                        nextNode?.stage_order === node.stage_order;
                      const isPassed =
                        nextNode &&
                        node.stage_order < nextNode.stage_order;
                      return (
                        <div key={node.stage_order} className="flex items-center gap-2">
                          {/* Connector */}
                          {i > 0 && (
                            <svg
                              className={`h-4 w-4 flex-shrink-0 ${
                                isPassed
                                  ? "text-success"
                                  : "text-border"
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          )}

                          {/* Node badge */}
                          <div
                            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                              isCurrent
                                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                                : isPassed
                                ? "border-success/30 bg-success/5 text-success"
                                : "border-border bg-secondary/50 text-muted-foreground"
                            }`}
                          >
                            <span className="block text-[10px] opacity-60">
                              {t("quests.stage")} {node.stage_order}
                            </span>
                            <span>
                              {locale === "en" && node.skill_name_en
                                ? node.skill_name_en
                                : node.skill_name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Current node highlight */}
                  {nextNode && (
                    <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-medium text-primary">
                            {t("quests.currentStage")}：
                            {locale === "en" && nextNode.skill_name_en
                              ? nextNode.skill_name_en
                              : nextNode.skill_name}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {locale === "en" && nextNode.skill_description_en
                              ? nextNode.skill_description_en
                              : nextNode.skill_description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {t("quests.requiredScore")} ≥ {nextNode.required_score}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Path node quests */}
              {pathNodeLoading ? (
                <Loading variant="skeleton-cards" cardCount={4} />
              ) : pathNodeError ? (
                <ErrorState message={t("quests.loadPathQuestsError")} />
              ) : pathNodeQuests.length === 0 ? (
                <EmptyState
                  title={t("quests.noPathNode")}
                  description={t("quests.noPathNodeDesc")}
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
                  {pathNodeQuests.map((quest: QuestListItem) => (
                    <div key={quest.id} className="relative card-hover">
                      {acceptedQuestIds.has(quest.id) && (
                        <span className="absolute -top-1 -right-1 z-10 rounded-full bg-success px-2 py-0.5 text-[10px] font-medium text-success-foreground shadow-sm">
                          {SUBMISSION_STATUS_LABELS[
                            userQuestMap.get(quest.id)?.status || "ACCEPTED"
                          ] || "ACCEPTED"}
                        </span>
                      )}
                      <QuestCard quest={quest} />
                    </div>
                  ))}
                </div>
              )}
            </>
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
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4 transition-all hover:shadow-md hover:border-primary/30">
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
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          uq.status === "PASSED"
                            ? "bg-success/10 text-success"
                            : uq.status === "FAILED"
                            ? "bg-destructive/10 text-destructive"
                            : uq.status === "ASSESSING"
                            ? "bg-warning/10 text-warning"
                            : uq.status === "ABANDONED"
                            ? "bg-muted/30 text-muted-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {t(`quests.status.${uq.status}` as any)}
                      </span>

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

                      {/* Abandon button — pushed to far right */}
                      {canAbandon && (
                        <div className="ml-2 pl-2 border-l border-border">
                          {confirmAbandonQuestId === uq.quest_id ? (
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
                          )}
                        </div>
                      )}
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
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    item.status === "PASSED"
                                      ? "bg-success/10 text-success"
                                      : item.status === "FAILED"
                                      ? "bg-destructive/10 text-destructive"
                                      : item.status === "ASSESSING"
                                      ? "bg-warning/10 text-warning"
                                      : "bg-secondary text-muted-foreground"
                                  }`}
                                >
                                  {t(`quests.status.${item.status}` as any)}
                                </span>
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
    </div>
  );
}
