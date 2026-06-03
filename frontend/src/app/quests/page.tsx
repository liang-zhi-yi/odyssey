"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { questService } from "@/services/quest.service";
import { skillService } from "@/services/skill.service";
import { QuestCard } from "@/app/components/QuestCard";
import { Loading } from "@/app/components/Loading";
import { EmptyState } from "@/app/components/EmptyState";
import type { QuestListItem } from "@/types/quest";
import { DIFFICULTY_LABELS, QUEST_TYPE_LABELS } from "@/types/quest";
import type { UserQuest } from "@/types/quest";
import { SUBMISSION_STATUS_LABELS } from "@/types/quest";

export default function QuestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");

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
    isAuthenticated ? ["quests", skillFilter, difficultyFilter] : null,
    () =>
      questService.listQuests({
        ...(skillFilter ? { skill_id: skillFilter } : {}),
        ...(difficultyFilter ? { difficulty: difficultyFilter } : {}),
      })
  );

  // Fetch user's quests
  const {
    data: userQuests = [],
    isLoading: userQuestsLoading,
  } = useSWR(
    isAuthenticated && activeTab === "mine" ? "user-quests" : null,
    () => questService.listUserQuests()
  );

  if (authLoading) {
    return <Loading text="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const acceptedQuestIds = new Set(userQuests.map((uq: UserQuest) => uq.quest_id));
  const userQuestMap = new Map(
    userQuests.map((uq: UserQuest) => [uq.quest_id, uq])
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">Quest Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          选择Quest，开始你的学习之旅
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            activeTab === "all"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          全部 Quest
        </button>
        <button
          onClick={() => setActiveTab("mine")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            activeTab === "mine"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          我的 Quest
        </button>
      </div>

      {/* Filters */}
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

      {/* Quest list */}
      {activeTab === "all" ? (
        questsLoading ? (
          <Loading text="Loading quests..." />
        ) : questsError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            加载Quest失败
          </div>
        ) : quests.length === 0 ? (
          <EmptyState
            title="暂无匹配的Quest"
            description={skillFilter || difficultyFilter ? "尝试调整筛选条件" : "敬请期待更多Quest"}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {quests.map((quest: QuestListItem) => (
              <div key={quest.id} className="relative card-hover">
                {acceptedQuestIds.has(quest.id) && (
                  <span className="absolute -top-1 -right-1 z-10 rounded-full bg-success px-2 py-0.5 text-[10px] font-medium text-success-foreground shadow-sm">
                    {SUBMISSION_STATUS_LABELS[
                      userQuestMap.get(quest.id)?.status || "ACCEPTED"
                    ]}
                  </span>
                )}
                <QuestCard quest={quest} />
              </div>
            ))}
          </div>
        )
      ) : (
        /* My quests tab */
        userQuestsLoading ? (
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
        )
      )}
    </div>
  );
}
