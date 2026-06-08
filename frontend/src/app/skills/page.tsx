"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillService } from "@/services/skill.service";
import { worldService } from "@/services/world.service";
import { progressService } from "@/services/progress.service";
import { questService } from "@/services/quest.service";
import { SkillTreeSidebar } from "@/app/components/SkillTreeSidebar";
import { SkillDetailPanel } from "@/app/components/SkillDetailPanel";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import type { Skill, UserSkill } from "@/types/skill";
import type { SkillGrowthPoint, ProgressLog } from "@/types/progress";
import type { QuestListItem, UserQuest } from "@/types/quest";

/**
 * Skills page — redesigned as a dual-column layout:
 *   Left:  SkillTreeSidebar (civilization stats + domain tree + search)
 *   Right: SkillDetailPanel (selected skill detail / welcome state)
 *
 * No infinite card grid. One skill at a time, focus on depth.
 */
export default function SkillsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Default: all domains collapsed
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(
    new Set()
  );

  // ── Auth guard ─────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // ── Data fetching ──────────────────────────────────────────────

  // All defined skills (skill tree)
  const { data: allSkills = [], error: skillsError } = useSWR(
    isAuthenticated ? "all-skills" : null,
    () => skillService.listSkills(),
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  // User's skill states
  const { data: userSkills = [], isLoading: userSkillsLoading } = useSWR(
    isAuthenticated ? "user-skills" : null,
    () => skillService.listUserSkills(),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  // World state (for civilization stats + building info)
  const { data: worldData } = useSWR(
    isAuthenticated ? "world" : null,
    () => worldService.getWorld().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // ── Conditional fetches (only when a skill is selected) ─────────

  const selectedSkill = useMemo(
    () => allSkills.find((s: Skill) => s.id === selectedSkillId) ?? null,
    [allSkills, selectedSkillId]
  );

  const selectedUserSkill = useMemo(
    () =>
      selectedSkillId
        ? userSkills.find((us: UserSkill) => us.skill_id === selectedSkillId) ?? null
        : null,
    [userSkills, selectedSkillId]
  );

  // Growth curve for selected skill
  const { data: growthPoints = [] } = useSWR(
    isAuthenticated && selectedSkillId
      ? `skill-growth-${selectedSkillId}`
      : null,
    () => progressService.getSkillGrowth(selectedSkillId!),
    { revalidateOnFocus: false }
  );

  // 30-day trend for selected skill
  const { data: trendPoints = [] } = useSWR(
    isAuthenticated && selectedSkillId
      ? `skill-trend-${selectedSkillId}`
      : null,
    () => skillService.getSkillTrend(selectedSkillId!, 30).catch(() => [] as SkillGrowthPoint[]),
    { revalidateOnFocus: false }
  );

  // Recent progress logs for selected skill
  const { data: recentLogs = [] } = useSWR(
    isAuthenticated && selectedSkillId
      ? `progress-logs-${selectedSkillId}`
      : null,
    () =>
      progressService
        .listProgressLogs({ skill_id: selectedSkillId!, limit: 10 })
        .catch(() => [] as ProgressLog[]),
    { revalidateOnFocus: false }
  );

  // Quests for selected skill
  const { data: skillQuests = [] } = useSWR(
    isAuthenticated && selectedSkillId
      ? `quests-skill-${selectedSkillId}`
      : null,
    () =>
      questService
        .listQuests({ skill_id: selectedSkillId! })
        .catch(() => [] as QuestListItem[]),
    { revalidateOnFocus: false }
  );

  // User's completed quests (global, filtered later)
  const { data: userQuests = [] } = useSWR(
    isAuthenticated ? "user-quests" : null,
    () => questService.listUserQuests().catch(() => [] as UserQuest[]),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // ── Derived data ───────────────────────────────────────────────

  // Related skills in the same domain
  const relatedSkills = useMemo(() => {
    if (!selectedSkill) return [];
    const domain = selectedSkill.domain;
    return allSkills
      .filter((s: Skill) => s.domain === domain)
      .map((s: Skill) => ({
        skill: s,
        userSkill: userSkills.find((us: UserSkill) => us.skill_id === s.id),
      }));
  }, [allSkills, userSkills, selectedSkill]);

  // Completed quests for the selected skill
  const completedQuests = useMemo(() => {
    if (!selectedSkillId) return [];
    return userQuests.filter(
      (q: UserQuest) =>
        q.status === "PASSED" || q.status === "SUBMITTED"
    );
  }, [userQuests, selectedSkillId]);

  // ── Callbacks ──────────────────────────────────────────────────

  const handleSelectSkill = (skillId: string) => {
    setSelectedSkillId(skillId);
    // Auto-expand the domain containing this skill
    const skill = allSkills.find((s: Skill) => s.id === skillId);
    if (skill) {
      const domainKey = getDomainKey(skill.domain);
      if (domainKey) {
        setExpandedDomains((prev) => new Set(prev).add(domainKey));
      }
    }
  };

  const handleToggleDomain = (domainKey: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domainKey)) {
        next.delete(domainKey);
      } else {
        next.add(domainKey);
      }
      return next;
    });
  };

  // ── Loading / Error states ─────────────────────────────────────

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  if (skillsError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <ErrorState message={t("skills.loadError")} />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left: Skill Tree Sidebar */}
      <SkillTreeSidebar
        skills={allSkills}
        userSkills={userSkills}
        worldData={worldData ?? null}
        selectedSkillId={selectedSkillId}
        searchQuery={searchQuery}
        expandedDomains={expandedDomains}
        onSelectSkill={handleSelectSkill}
        onToggleDomain={handleToggleDomain}
        onSearchChange={setSearchQuery}
      />

      {/* Right: Skill Detail Panel */}
      <SkillDetailPanel
        selectedSkill={selectedSkill}
        selectedUserSkill={selectedUserSkill}
        growthPoints={growthPoints}
        trendPoints={trendPoints}
        worldData={worldData ?? null}
        recentLogs={recentLogs}
        relatedSkills={relatedSkills}
        completedQuests={completedQuests}
        recommendedQuests={skillQuests}
        allUserSkills={userSkills}
        onSelectSkill={handleSelectSkill}
      />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

/** Map Skill domain to civilization group key */
function getDomainKey(domain: string): string | null {
  const mapping: Record<string, string> = {
    AI: "ai",
    PROGRAMMING: "engineering",
    RESEARCH: "knowledge",
    BUSINESS: "business",
    DESIGN: "design",
    LANGUAGE: "language",
    SCIENCE: "science",
    HEALTH: "health",
    FINANCE: "finance",
    MANAGEMENT: "society",
    CAREER: "society",
    MEDIA: "society",
  };
  return mapping[domain] ?? null;
}
