"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { questService } from "@/services/quest.service";
import { skillService } from "@/services/skill.service";
import { pathService } from "@/services/path.service";
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

type TabId = "all" | "recommended" | "path-node" | "mine";

export default function QuestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
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
    return <Loading text="验证中..." />;
  }

  const acceptedQuestIds = new Set(userQuests.map((uq: UserQuest) => uq.quest_id));
  const userQuestMap = new Map(
    userQuests.map((uq: UserQuest) => [uq.quest_id, uq])
  );

  // Determine the current (first incomplete) node for path progression display
  // Simply highlight the first node — the backend determines which node is current
  const nextNode = pathNodes?.nodes[0] ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">Quest Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          选择Quest，证明你的真实能力
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit flex-wrap">
        {([
          ["all", "全部 Quest"],
          ["recommended", "每日推荐"],
          ["path-node", "路径关卡"],
          ["mine", "我的 Quest"],
        ] as [TabId, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
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
            <option value="">全部技能</option>
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
            <option value="">全部难度</option>
            {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
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
              清除筛选
            </button>
          )}
        </div>
      )}

      {/* ── Tab: 全部 Quest ────────────────────────────────── */}
      {activeTab === "all" &&
        (questsLoading ? (
          <Loading variant="skeleton-cards" cardCount={6} />
        ) : questsError ? (
          <ErrorState message="加载Quest失败" />
        ) : quests.length === 0 ? (
          <EmptyState
            title="暂无匹配的Quest"
            description={
              skillFilter || difficultyFilter
                ? "尝试调整筛选条件"
                : "敬请期待更多Quest"
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

      {/* ── Tab: 每日推荐 ──────────────────────────────────── */}
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
                <h2 className="text-sm font-semibold">今日推荐</h2>
                <p className="text-xs text-muted-foreground">
                  基于你的能力水平，每天推荐适合的Quest。每日更新。
                </p>
              </div>
            </div>
          </div>

          {recommendedLoading ? (
            <Loading variant="skeleton-cards" cardCount={4} />
          ) : recommendedError ? (
            <ErrorState message="加载推荐失败" />
          ) : recommendedQuests.length === 0 ? (
            <EmptyState
              title="今日暂无推荐"
              description="你已经接受了所有Quest，太棒了！明天再来看看吧。"
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

      {/* ── Tab: 路径关卡 ──────────────────────────────────── */}
      {activeTab === "path-node" && (
        <>
          {!hasActivePath ? (
            <EmptyState
              title="未选择成长路径"
              description="选择一个成长路径后，系统会按照路径节点为你推送对应的Quest，帮助你逐步完成路径中的每个技能关卡。"
              actionLabel="去选择路径"
              actionHref="/paths"
            />
          ) : (
            <>
              {/* Path node progression bar */}
              {pathNodes && pathNodes.nodes.length > 0 && (
                <div className="rounded-xl border border-border bg-background p-5">
                  <h3 className="text-sm font-semibold mb-1">
                    {pathNodes.path_name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {pathNodes.path_description}
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
                              关卡 {node.stage_order}
                            </span>
                            <span>{node.skill_name}</span>
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
                            当前关卡：{nextNode.skill_name}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {nextNode.skill_description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          要求分数 ≥ {nextNode.required_score}
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
                <ErrorState message="加载路径Quest失败" />
              ) : pathNodeQuests.length === 0 ? (
                <EmptyState
                  title="当前关卡暂无Quest"
                  description="该技能节点暂时没有可用的Quest，请先探索其他关卡。"
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

      {/* ── Tab: 我的 Quest ────────────────────────────────── */}
      {activeTab === "mine" &&
        (userQuestsLoading ? (
          <Loading text="Loading your quests..." />
        ) : userQuests.length === 0 ? (
          <EmptyState
            title="你还没有接受任何Quest"
            description="浏览Quest列表，选择感兴趣的Quest开始学习"
            actionLabel="浏览 Quests"
            actionHref="/quests"
          />
        ) : (
          <div className="space-y-2">
            {userQuests.map((uq: UserQuest) => (
              <a
                key={uq.quest_id}
                href={`/quests/${uq.quest_id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-background p-4 transition-all hover:shadow-md hover:border-primary/30"
              >
                <div>
                  <h4 className="font-semibold text-sm">{uq.quest_title}</h4>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    uq.status === "PASSED"
                      ? "bg-success/10 text-success"
                      : uq.status === "FAILED"
                      ? "bg-destructive/10 text-destructive"
                      : uq.status === "ASSESSING"
                      ? "bg-warning/10 text-warning"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {SUBMISSION_STATUS_LABELS[uq.status] || uq.status}
                </span>
              </a>
            ))}
          </div>
        ))}
    </div>
  );
}
