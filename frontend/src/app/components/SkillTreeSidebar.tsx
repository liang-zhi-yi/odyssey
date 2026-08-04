"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Skill, UserSkill } from "@/types/skill";
import type { World, CivilizationGroup } from "@/types/world";
import { RANK_LABELS } from "@/types/skill";
import { CIVILIZATION_GROUPS } from "@/types/world";
import { masteryColor } from "@/app/components/GrowthRing";
import { useLocale } from "@/hooks/useLocale";
import { QuestScrollIcon } from "./QuestScrollIcon";

/**
 * 文明分类图标 — 使用对应 SVG 图标（QuestScrollIcon），取消背景，
 * 仅保留悬浮高光与放大效果。
 *
 * 每个文明分类的图标映射到 QuestScrollIcon 中独特的 SVG 纹样：
 *   ai          → reasoning    (神经网络节点)
 *   engineering → application   (齿轮/应用)
 *   knowledge   → knowledge     (书本)
 *   business    → seal          (印章/天平)
 *   design      → creation      (创意螺旋)
 *   media       → creation      (创意纹样)
 *   science     → reasoning     (原子轨道)
 *   language    → scroll        (卷轴)
 *   health      → shield        (盾牌/脉搏)
 *   finance     → star          (星辰/硬币)
 *   digital     → civilization  (文明塔)
 *   society     → civilization  (社会连接)
 */
function MiniShieldIcon({ icon, groupKey }: { icon: string; groupKey: string }) {
  // 文明分类色调（仅用于图标本身的描边色，不渲染背景）
  const toneByGroup: Record<string, string> = {
    ai: "text-[oklch(0.45_0.13_270)] dark:text-[oklch(0.7_0.14_270)]",
    engineering: "text-[oklch(0.45_0.10_55)] dark:text-[oklch(0.7_0.12_55)]",
    knowledge: "text-[oklch(0.42_0.10_145)] dark:text-[oklch(0.68_0.11_145)]",
    business: "text-[oklch(0.45_0.11_40)] dark:text-[oklch(0.7_0.12_40)]",
    design: "text-[oklch(0.45_0.11_320)] dark:text-[oklch(0.7_0.12_320)]",
    media: "text-[oklch(0.45_0.11_320)] dark:text-[oklch(0.7_0.12_320)]",
    science: "text-[oklch(0.45_0.11_230)] dark:text-[oklch(0.7_0.12_230)]",
    language: "text-[oklch(0.42_0.10_90)] dark:text-[oklch(0.68_0.11_90)]",
    health: "text-[oklch(0.45_0.12_15)] dark:text-[oklch(0.7_0.13_15)]",
    finance: "text-[oklch(0.45_0.10_140)] dark:text-[oklch(0.7_0.12_140)]",
    digital: "text-[oklch(0.45_0.10_200)] dark:text-[oklch(0.7_0.11_200)]",
    society: "text-[oklch(0.45_0.09_200)] dark:text-[oklch(0.7_0.10_200)]",
  };
  const tone = toneByGroup[groupKey] ?? "text-[oklch(0.45_0.10_80)] dark:text-[oklch(0.7_0.12_80)]";

  return (
    <span
      className={`flex items-center justify-center w-6 h-6 shrink-0 transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_6px_oklch(0.7_0.12_80_/_0.45)] ${tone}`}
      aria-hidden
    >
      <QuestScrollIcon name={icon as any} size={18} strokeWidth={1.4} />
    </span>
  );
}

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

    // Sort: stable sort by skill count desc (no reordering on selection)
    return groups.sort((a, b) => b.skills.length - a.skills.length);
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

  // Count buildings (only unlocked/active, not LOCKED)
  const buildingCount =
    (worldData?.buildings?.filter(b => b.status !== "LOCKED")?.length ?? 0) +
    (worldData?.compound_buildings?.filter(b => b.status !== "LOCKED")?.length ?? 0);

  return (
    <aside className="flex flex-col h-full w-[288px] shrink-0 border-r-2 border-double border-[oklch(0.7_0.12_85_/_0.4)] bg-gradient-to-b from-[oklch(0.985_0.003_95)] to-[oklch(0.95_0.005_90)] dark:from-[oklch(0.22_0.008_85)] dark:to-[oklch(0.18_0.01_85)] relative overflow-hidden">
      {/* ── Civilization Overview ──────────────────────────── */}
      <div className="p-4 border-b border-[oklch(0.88_0.02_90_/_0.5)]">
        <div className="vintage-parchment-card rounded-xl border border-[oklch(0.88_0.02_90)] p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-1 right-2 text-[8px] font-mono opacity-20 pointer-events-none select-none text-[oklch(0.3_0.02_80)]">
            [N 35° 41' / E 139° 41']
          </div>
          <h3 className="text-xs font-bold font-civ-serif text-[oklch(0.35_0.12_85)] tracking-wide uppercase mb-3 flex items-center gap-1.5">
            <QuestScrollIcon name="scroll" size={14} className="inline-block align-middle" /> {locale === "en" ? "Civilization" : "文明概览"}
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
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[oklch(0.5_0.02_85)] pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={locale === "en" ? "Search skills..." : "搜索技能..."}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[oklch(0.88_0.02_90)] bg-[oklch(0.99_0.003_95_/_0.6)] dark:bg-[oklch(0.22_0.008_85_/_0.6)] text-[oklch(0.3_0.02_80)] placeholder:text-[oklch(0.55_0.02_85)] focus:outline-none focus:border-[oklch(0.7_0.12_85)] focus:ring-2 focus:ring-[oklch(0.7_0.12_85_/_0.15)] transition-all font-civ-serif"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full text-[oklch(0.5_0.02_85)] hover:text-[oklch(0.3_0.02_80)] transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Domain Tree ────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide">
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
                  <div className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-200 group ${
                    hasSelected
                      ? "bg-[oklch(0.72_0.12_82_/_0.08)] text-[oklch(0.3_0.02_80)]"
                      : "text-[oklch(0.35_0.02_80)] hover:bg-[oklch(0.95_0.005_90_/_0.5)] dark:hover:bg-[oklch(0.25_0.008_85_/_0.5)]"
                  }`}>
                    <button
                      onClick={() => onToggleDomain(group.key)}
                      className="flex items-center gap-2 flex-1 min-w-0"
                    >
                      <span
                        className={`text-[10px] transition-transform duration-200 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      >
                        <svg className="w-3 h-3 text-[oklch(0.5_0.02_85)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                      <MiniShieldIcon icon={group.icon} groupKey={group.key} />
                      <span className="text-xs font-bold font-civ-serif flex-1 truncate">
                        {group.label}
                      </span>
                      <span className="text-[10px] text-[oklch(0.5_0.02_85)] tabular-nums">
                        {group.skills.length}
                      </span>
                    </button>
                  </div>

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
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-200 border ${
                              isSelected
                                ? "bg-gradient-to-r from-[oklch(0.72_0.12_82_/_0.12)] to-transparent border-[oklch(0.7_0.12_85_/_0.55)] shadow-sm"
                                : "border-transparent hover:bg-[oklch(0.95_0.005_90_/_0.65)] dark:hover:bg-[oklch(0.25_0.008_85_/_0.65)]"
                            }`}
                          >
                            {/* Mastery dot */}
                            {isUnlocked ? (
                              <span
                                className="h-2 w-2 flex-shrink-0 rounded-full shadow-sm"
                                style={{
                                  backgroundColor: masteryColor(userSkill.overall),
                                }}
                              />
                            ) : (
                              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[oklch(0.55_0.02_85_/_0.35)]" />
                            )}

                            {/* Skill name */}
                            <span
                              className={`text-xs flex-1 truncate ${
                                isSelected
                                  ? "font-bold text-[oklch(0.35_0.12_85)]"
                                  : isUnlocked
                                    ? "font-semibold text-[oklch(0.3_0.02_80)]"
                                    : "text-[oklch(0.5_0.02_85)]"
                              }`}
                            >
                              {skill.name}
                            </span>

                            {/* Score or rank */}
                            {isUnlocked ? (
                              <span
                                className={`text-[10px] font-mono tabular-nums font-bold ${
                                  isSelected
                                    ? "text-[oklch(0.35_0.12_85)]"
                                    : "text-[oklch(0.4_0.02_80)]"
                                }`}
                              >
                                {userSkill.overall}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[oklch(0.55_0.02_85_/_0.75)]">
                                {locale === "en" ? "Locked" : "未解锁"}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {/* Civilization radar overview link */}
                      <Link
                        href={`/skills/civilization/${group.key}`}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-200 border border-transparent hover:bg-[oklch(0.95_0.005_90_/_0.65)] dark:hover:bg-[oklch(0.25_0.008_85_/_0.65)] mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-3 h-3 flex-shrink-0 text-[oklch(0.5_0.08_145)]" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.5">
                          <path d="M10 2 L 10 18 M 2 10 L 18 10" opacity="0.4" />
                          <circle cx="10" cy="10" r="7" />
                          <circle cx="10" cy="10" r="4" opacity="0.5" />
                          <circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" />
                        </svg>
                        <span className="text-xs flex-1 truncate font-civ-serif italic text-[oklch(0.45_0.08_145)] dark:text-[oklch(0.65_0.08_145)]">
                          {locale === "en" ? "Civilization Overview" : "文明综合能力总览"}
                        </span>
                        <svg className="w-3 h-3 text-[oklch(0.5_0.02_85)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </nav>

      {/* ── Footer link to World ───────────────────────────── */}
      <div className="px-4 py-3 border-t border-[oklch(0.88_0.02_90_/_0.5)]">
        <Link
          href="/world"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[oklch(0.5_0.02_85)] hover:text-[oklch(0.3_0.02_80)] hover:bg-[oklch(0.95_0.005_90)] dark:hover:bg-[oklch(0.25_0.008_85)] border border-transparent hover:border-[oklch(0.88_0.02_90)] transition-all font-civ-serif"
        >
          <QuestScrollIcon name="mission" size={14} />
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
