"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { questService } from "@/services/quest.service";
import { CivilizationArchiveChapter } from "@/app/components/CivilizationArchiveChapter";
import { CivilizationBadge } from "@/app/components/CivilizationBadge";
import { AIQuestGenerator } from "@/app/components/AIQuestGenerator";
import { QuestScrollIcon } from "@/app/components/QuestScrollIcon";
import { Loading } from "@/app/components/Loading";
import type { UserQuest } from "@/types/quest";

type TabKey = "recommended" | "myQuests";

/** Tab icon — SVG geometric (replaces emoji) */
function TabIcon({ type, className = "" }: { type: "scroll" | "shield"; className?: string }) {
  if (type === "scroll") {
    return (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
        <path d="M4 4 L 14 4 C 15 4 16 5 16 6 L 16 15 C 16 16 15 17 14 17 L 6 17 C 5 17 4 16 4 15 Z" />
        <path d="M7 8 L 13 8 M 7 11 L 13 11 M 7 14 L 11 14" strokeWidth="1" opacity="0.6" />
        <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M10 2 L 16 4 L 16 10 C 16 14 13 17 10 18 C 7 17 4 14 4 10 L 4 4 Z" />
      <path d="M8 10 L 10 12 L 13 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function QuestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("recommended");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch all global quests grouped by civilization
  // (kept for potential fallback, but "今日推荐" tab now uses AI generation)
  const {
    data: civQuestGroups = [],
    isLoading: recommendedLoading,
    error: recommendedError,
  } = useSWR(
    isAuthenticated ? "quests-by-civ" : null,
    () => questService.listQuestsByCivilization()
  );

  // Fetch user's quests (for filtering accepted + status badges)
  const {
    data: userQuests = [],
  } = useSWR(
    isAuthenticated ? "user-quests" : null,
    () => questService.listUserQuests()
  );

  // Fetch user's own quests grouped by civilization (for "My Tasks" tab)
  const {
    data: userQuestGroups = [],
    isLoading: myQuestsLoading,
  } = useSWR(
    isAuthenticated && activeTab === "myQuests" ? "user-quests-by-civ" : null,
    () => questService.listUserQuestsByCivilization()
  );

  const totalUserQuests = userQuestGroups.reduce((sum, g) => sum + g.count, 0);

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  const acceptedQuestIds = new Set(userQuests.map((uq: UserQuest) => uq.quest_id));
  const userQuestMap = new Map(
    userQuests.map((uq: UserQuest) => [uq.quest_id, uq])
  );

  // "今日推荐" tab 改为 AI 即时生成，不再展示预设任务；
  // totalRecommended 仅用于 tab 角标提示（保持 0，避免误导）。
  const totalRecommended = 0;
  // 抑制未使用变量告警（保留以备未来扩展）
  void civQuestGroups; void recommendedLoading; void recommendedError;
  void acceptedQuestIds; void userQuestMap;

  const tabs: { key: TabKey; label: string; icon: "scroll" | "shield" }[] = [
    { key: "recommended", label: t("quests.todayRecommendation"), icon: "scroll" },
    { key: "myQuests", label: locale === "zh" ? "我的任务" : "My Tasks", icon: "shield" },
  ];

  return (
    <div className="quest-scroll-page px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Page Header — 文明任务档案馆 ─────────────────── */}
      <div className="relative z-10 page-enter">
        <div className="flex items-center gap-3 mb-2">
          {/* Hall emblem — world-core icon */}
          <div className="flex-shrink-0 text-[oklch(0.50_0.08_150)] dark:text-[oklch(0.62_0.08_150)]">
            <QuestScrollIcon name="world-core" size={30} strokeWidth={1.2} />
          </div>
          <h1 className="text-2xl font-bold font-civ-serif text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.88_0.04_80)] tracking-wide">
            {t("quests.title")}
          </h1>
        </div>
        <p className="text-sm font-civ-serif text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.65_0.035_82)] ml-11 italic tracking-[0.08em]">
          {locale === "zh" ? "探索文明，解锁能力" : "Explore civilizations, unlock abilities"}
        </p>
      </div>

      {/* ── Tab Switcher — 文明档案馆分页 ───────────────── */}
      <div className="relative z-10 flex rounded-xl scroll-fuse ornamental-border p-1 overflow-hidden">
        <div className="absolute inset-0 parchment-texture pointer-events-none opacity-40" />
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-civ-serif font-semibold tracking-wide transition-all ${
              activeTab === tab.key
                ? "bg-[oklch(0.92_0.025_80_/_0.60)] dark:bg-[oklch(0.22_0.015_78_/_0.60)] text-[oklch(0.35_0.05_70)] dark:text-[oklch(0.82_0.06_145)] border border-[oklch(0.60_0.06_80_/_0.30)] shadow-sm"
                : "text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.58_0.03_80)] hover:text-[oklch(0.35_0.025_70)] dark:hover:text-[oklch(0.82_0.04_80)] hover:bg-[oklch(0.92_0.02_80_/_0.30)] dark:hover:bg-[oklch(0.22_0.012_78_/_0.30)] border border-transparent"
            }`}
          >
            <TabIcon type={tab.icon} className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.key === "myQuests" && totalUserQuests > 0 && (
              <span className="ml-1 rounded-full bg-[oklch(0.60_0.08_145_/_0.18)] px-1.5 py-0.5 text-[10px] font-bold text-[oklch(0.40_0.08_145)] dark:text-[oklch(0.72_0.09_145)] tabular-nums">
                {totalUserQuests}
              </span>
            )}
            {tab.key === "recommended" && totalRecommended > 0 && (
              <span className="ml-1 rounded-full bg-[oklch(0.65_0.07_75_/_0.18)] px-1.5 py-0.5 text-[10px] font-bold text-[oklch(0.40_0.06_70)] dark:text-[oklch(0.72_0.08_80)] tabular-nums">
                {totalRecommended}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────── */}
      {activeTab === "recommended" && (
        <div className="relative z-10 space-y-4">
          {/* "今日推荐" tab 改为 AI 即时生成 — 删除所有预设任务 */}
          <AIQuestGenerator />
        </div>
      )}

      {activeTab === "myQuests" && (
        <div className="relative z-10 space-y-4">
          {myQuestsLoading ? (
            <Loading variant="skeleton-cards" cardCount={4} />
          ) : totalUserQuests === 0 ? (
            <ArchiveEmptyState
              isZh={locale === "zh"}
              onExplore={() => setActiveTab("recommended")}
            />
          ) : (
            <div className="space-y-4 animate-stagger">
              {userQuestGroups.map((group, idx) => (
                <CivilizationArchiveChapter
                  key={group.civilization_type}
                  group={group}
                  defaultExpanded={userQuestGroups.length === 1 || idx === 0}
                />
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

/** 个人档案空状态 — 文明探索卷轴卡 */
function ArchiveEmptyState({
  isZh,
  onExplore,
}: {
  isZh: boolean;
  onExplore: () => void;
}) {
  return (
    <div className="relative z-10 rounded-xl scroll-fuse ornamental-border overflow-hidden">
      <div className="px-6 py-12 sm:py-16 text-center relative">
        {/* 文明印章 */}
        <div className="mb-5 flex justify-center">
          <div className="relative">
            <CivilizationBadge type="KNOWLEDGE" size={56} glow />
            {/* 印章环 */}
            <div className="absolute inset-0 rounded-full border border-[oklch(0.65_0.06_80_/_0.25)] animate-[spin_60s_linear_infinite]" />
          </div>
        </div>

        <h3 className="font-civ-serif text-lg font-bold text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.88_0.04_80)] mb-2 tracking-wide">
          {isZh ? "探索档案尚未开启" : "Archive Unopened"}
        </h3>
        <p className="font-civ-serif text-xs text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] italic max-w-sm mx-auto leading-relaxed">
          {isZh
            ? "创建学习路径后，路径中的试炼会自动记录于你的文明档案。"
            : "After creating a learning path, its trials will be recorded in your archive."}
        </p>

        <button
          onClick={onExplore}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[oklch(0.60_0.06_80_/_0.30)] bg-[oklch(0.92_0.025_80_/_0.50)] dark:bg-[oklch(0.22_0.015_78_/_0.50)] px-5 py-2.5 text-xs font-bold font-civ-serif tracking-[0.12em] text-[oklch(0.35_0.04_70)] dark:text-[oklch(0.82_0.04_80)] hover:bg-[oklch(0.88_0.03_80_/_0.60)] dark:hover:bg-[oklch(0.26_0.018_78_/_0.60)] hover:border-[oklch(0.55_0.07_75_/_0.45)] transition-all btn-press"
        >
          <QuestScrollIcon name="scroll" size={14} strokeWidth={1.5} />
          {isZh ? "前往今日探索" : "Begin Exploration"}
        </button>
      </div>
    </div>
  );
}
