"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Skill, UserSkill } from "@/types/skill";
import type { World } from "@/types/world";
import { RANK_LABELS } from "@/types/skill";
import { masteryColor } from "@/app/components/GrowthRing";
import { useLocale } from "@/hooks/useLocale";

// ── Civilization domain grouping ──────────────────────────────────

interface CivilizationGroup {
  key: string;
  label: string;
  labelEn: string;
  icon: string;
  domains: string[];
}

const CIVILIZATION_GROUPS: CivilizationGroup[] = [
  { key: "ai", label: "AI文明", labelEn: "AI Civilization", icon: "🤖", domains: ["AI"] },
  { key: "engineering", label: "工程文明", labelEn: "Engineering", icon: "⚙️", domains: ["PROGRAMMING"] },
  { key: "knowledge", label: "知识文明", labelEn: "Knowledge", icon: "📚", domains: ["RESEARCH"] },
  { key: "business", label: "商业文明", labelEn: "Business", icon: "💼", domains: ["BUSINESS"] },
  { key: "design", label: "设计文明", labelEn: "Design", icon: "🎨", domains: ["DESIGN"] },
  { key: "language", label: "语言文明", labelEn: "Language", icon: "🗣️", domains: ["LANGUAGE"] },
  { key: "science", label: "科学文明", labelEn: "Science", icon: "🔬", domains: ["SCIENCE"] },
  { key: "health", label: "健康文明", labelEn: "Health", icon: "💪", domains: ["HEALTH"] },
  { key: "finance", label: "金融文明", labelEn: "Finance", icon: "💰", domains: ["FINANCE"] },
  { key: "society", label: "社会文明", labelEn: "Society", icon: "🌐", domains: ["MANAGEMENT", "CAREER", "MEDIA"] },
];

// ── Props ─────────────────────────────────────────────────────────

interface SkillTreeSidebarProps {
  skills: Skill[];
  userSkills: UserSkill[];
  worldData: World | null;
  selectedSkillId: string | null;
  searchQuery: string;
  expandedDomains: Set<string>;
  onSelectSkill: (skillId: string) => void;
  onToggleDomain: (domainKey: string) => void;
  onSearchChange: (query: string) => void;
}

// ── Component ─────────────────────────────────────────────────────

export function SkillTreeSidebar({
  skills,
  userSkills,
  worldData,
  selectedSkillId,
  searchQuery,
  expandedDomains,
  onSelectSkill,
  onToggleDomain,
  onSearchChange,
}: SkillTreeSidebarProps) {
  const { t, locale } = useLocale();
  const stats = worldData?.stats;

  // Build lookup maps
  const userSkillMap = useMemo(
    () => new Map(userSkills.map((us) => [us.skill_id, us])),
    [userSkills]
  );

  // Group skills by civilization domain
  const domainGroups = useMemo(() => {
    const groups = CIVILIZATION_GROUPS.map((group) => {
      const groupSkills = skills.filter((s) => group.domains.includes(s.domain));
      return { ...group, skills: groupSkills };
    }).filter((g) => g.skills.length > 0);

    // Sort: domain groups with selected skill first, then by skill count desc
    return groups.sort((a, b) => {
      const aHasSelected = a.skills.some((s) => s.id === selectedSkillId);
      const bHasSelected = b.skills.some((s) => s.id === selectedSkillId);
      if (aHasSelected && !bHasSelected) return -1;
      if (!aHasSelected && bHasSelected) return 1;
      return b.skills.length - a.skills.length;
    });
  }, [skills, selectedSkillId]);

  // Filter domains/skills by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return domainGroups;
    const q = searchQuery.toLowerCase();
    return domainGroups
      .map((group) => ({
        ...group,
        skills: group.skills.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.name_en && s.name_en.toLowerCase().includes(q))
        ),
      }))
      .filter((g) => g.skills.length > 0);
  }, [domainGroups, searchQuery]);

  // Compute the highest-level building name
  const highestBuildingName = useMemo(() => {
    if (!worldData) return null;
    const allBuildings = [
      ...(worldData.buildings ?? []),
      ...(worldData.compound_buildings ?? []),
    ];
    if (!allBuildings.length) return null;
    const highest = allBuildings.reduce((prev, curr) =>
      curr.level > prev.level ? curr : prev
    );
    const name =
      locale === "en" && (highest as any).template?.name_en
        ? (highest as any).template.name_en
        : (highest as any).template?.name;
    return name ? { name, level: highest.level } : null;
  }, [worldData, locale]);

  // Count unlocked skills (with UserSkill record)
  const unlockedCount = userSkills.length;

  // Count buildings
  const buildingCount =
    (worldData?.buildings?.length ?? 0) +
    (worldData?.compound_buildings?.length ?? 0);

  return (
    <aside className="flex flex-col h-full w-[288px] shrink-0 border-r border-border bg-background">
      {/* ── Civilization Overview ──────────────────────────── */}
      <div className="p-4 border-b border-border">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-3">
            {locale === "en" ? "Civilization" : "文明概览"}
          </h3>

          <div className="space-y-2">
            {/* Level & Index */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {locale === "en" ? "Level" : "文明等级"}
              </span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                Lv{stats?.civilization_level ?? 1}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {locale === "en" ? "Index" : "文明指数"}
              </span>
              <span className="text-sm font-bold text-accent tabular-nums">
                {((stats?.civilization_level ?? 1) * 100 + (stats?.average_level ?? 0) * 10).toLocaleString()}
              </span>
            </div>

            <div className="border-t border-border pt-2 mt-1" />

            {/* Skill & Building counts */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {locale === "en" ? "Skills Unlocked" : "已解锁技能"}
              </span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {unlockedCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {locale === "en" ? "Buildings Built" : "已建造建筑"}
              </span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {buildingCount}
              </span>
            </div>

            {/* Highest building */}
            {highestBuildingName && (
              <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {locale === "en" ? "Highest Building" : "最高建筑"}
                </span>
                <span className="text-xs font-semibold text-accent truncate max-w-[55%]">
                  {highestBuildingName.name} Lv{highestBuildingName.level}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────── */}
      <div className="px-4 py-3">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={locale === "en" ? "Search skills..." : "搜索技能..."}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Domain Tree ────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {filteredGroups.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 px-2">
            {searchQuery
              ? locale === "en"
                ? "No skills match your search"
                : "没有匹配的技能"
              : locale === "en"
                ? "No skills available"
                : "暂无技能"}
          </p>
        ) : (
          <div className="space-y-0.5">
            {filteredGroups.map((group) => {
              const isExpanded =
                searchQuery.trim().length > 0 ||
                expandedDomains.has(group.key);
              const hasSelected = group.skills.some(
                (s) => s.id === selectedSkillId
              );

              return (
                <div key={group.key}>
                  {/* Domain header */}
                  <button
                    onClick={() => onToggleDomain(group.key)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-200 group ${
                      hasSelected
                        ? "bg-primary/5 text-foreground"
                        : "text-foreground hover:bg-secondary/70"
                    }`}
                  >
                    <span
                      className={`text-xs transition-transform duration-200 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    >
                      <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="text-sm leading-none">{group.icon}</span>
                    <span className="text-xs font-semibold flex-1 truncate">
                      {group.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {group.skills.length}
                    </span>
                  </button>

                  {/* Skill items */}
                  {isExpanded && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border/60 pl-2.5">
                      {group.skills.map((skill) => {
                        const userSkill = userSkillMap.get(skill.id);
                        const isSelected = skill.id === selectedSkillId;
                        const isUnlocked = !!userSkill;

                        return (
                          <button
                            key={skill.id}
                            onClick={() => onSelectSkill(skill.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-200 ${
                              isSelected
                                ? "bg-primary/10 border border-primary/20 shadow-sm"
                                : "border border-transparent hover:bg-secondary/70"
                            }`}
                          >
                            {/* Mastery dot */}
                            {isUnlocked ? (
                              <span
                                className="h-2 w-2 flex-shrink-0 rounded-full"
                                style={{
                                  backgroundColor: masteryColor(userSkill.overall),
                                }}
                              />
                            ) : (
                              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-muted-foreground/25" />
                            )}

                            {/* Skill name */}
                            <span
                              className={`text-xs flex-1 truncate ${
                                isSelected
                                  ? "font-semibold text-primary"
                                  : isUnlocked
                                    ? "font-medium text-foreground"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {skill.name}
                            </span>

                            {/* Score or rank */}
                            {isUnlocked ? (
                              <span
                                className={`text-[10px] font-mono tabular-nums ${
                                  isSelected
                                    ? "text-primary font-semibold"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {userSkill.overall}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60">
                                {locale === "en" ? "Locked" : "未解锁"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </nav>

      {/* ── Footer link to World ───────────────────────────── */}
      <div className="px-4 py-3 border-t border-border">
        <Link
          href="/world"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all"
        >
          <span className="text-sm">🌍</span>
          <span className="flex-1">
            {locale === "en" ? "View My World" : "查看我的世界"}
          </span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </aside>
  );
}
