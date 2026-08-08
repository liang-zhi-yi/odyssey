"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillDisplayName } from "@/lib/skillNames";
import { skillService } from "@/services/skill.service";
import { worldService } from "@/services/world.service";
import { badgeService } from "@/services/badge.service";
import { credentialService } from "@/services/credential.service";
import { questService } from "@/services/quest.service";
import { computeAggregateScores } from "@/lib/scores";
import { resolveAvatarSrc } from "@/lib/avatar";
import { Loading } from "@/app/components/Loading";
import { QuestScrollIcon } from "@/app/components/QuestScrollIcon";
import type { ScrollIconName } from "@/app/components/QuestScrollIcon";
import { CivIcon } from "@/app/components/CivIcon";
import {
  AbilityEmblem,
  BuildingSealIcon,
  CopperDivider,
  EraStoneIcon,
  SealRing,
  ParchmentBackground,
  CIV_COLORS,
  inferSkillId,
} from "@/app/components/CivArchiveTheme";
import {
  ERA_LABELS,
  CIVILIZATION_TIER_LABELS,
  EVENT_TYPE_LABELS,
  type UserBuilding,
  type UserCompoundBuilding,
} from "@/types/world";
import type { Skill, UserSkill } from "@/types/skill";
import type { BadgeDefinition, UserBadge } from "@/types/badge";
import type { UserCredential } from "@/types/credential";
import type { DimensionScores } from "@/types/assessment";

// ── Civilization domain groups ──────────────────────────────────

const DOMAIN_GROUPS: { key: string; label: string; labelEn: string; icon: string; domains: string[] }[] = [
  { key: "ai", label: "AI文明", labelEn: "AI", icon: "robot", domains: ["AI"] },
  { key: "engineering", label: "工程文明", labelEn: "Engineering", icon: "application", domains: ["PROGRAMMING"] },
  { key: "knowledge", label: "知识文明", labelEn: "Knowledge", icon: "knowledge", domains: ["RESEARCH"] },
  { key: "business", label: "商业文明", labelEn: "Business", icon: "business", domains: ["BUSINESS"] },
  { key: "design", label: "设计文明", labelEn: "Design", icon: "creation", domains: ["DESIGN"] },
  { key: "language", label: "语言文明", labelEn: "Language", icon: "language", domains: ["LANGUAGE"] },
  { key: "science", label: "科学文明", labelEn: "Science", icon: "science", domains: ["SCIENCE"] },
  { key: "health", label: "健康文明", labelEn: "Health", icon: "health", domains: ["HEALTH"] },
  { key: "finance", label: "金融文明", labelEn: "Finance", icon: "finance", domains: ["FINANCE"] },
  { key: "society", label: "社会文明", labelEn: "Society", icon: "civilization", domains: ["MANAGEMENT", "CAREER", "MEDIA"] },
];

// ── Page Component ──────────────────────────────────────────────

/** Map a skill's domain to its civilization group key (for the civ-type icon). */
function civKeyForDomain(domain: string | undefined): string | null {
  if (!domain) return null;
  const group = DOMAIN_GROUPS.find((g) => g.domains.includes(domain));
  return group ? group.key : null;
}

export default function PersonalPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // ── Data fetching ─────────────────────────────────────────────

  const { data: worldData } = useSWR(
    isAuthenticated ? "world" : null,
    () => worldService.getWorld().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const { data: allSkills = [] } = useSWR(
    isAuthenticated ? "all-skills" : null,
    () => skillService.listSkills().catch(() => [] as Skill[]),
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const { data: userSkills = [] } = useSWR(
    isAuthenticated ? "user-skills" : null,
    () => skillService.listUserSkills().catch(() => [] as UserSkill[]),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  const { data: allBadges = [] } = useSWR(
    isAuthenticated ? "badges-catalog" : null,
    () => badgeService.listBadges().catch(() => [] as BadgeDefinition[]),
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const { data: userBadges = [] } = useSWR(
    isAuthenticated ? "user-badges" : null,
    () => badgeService.listUserBadges().catch(() => [] as UserBadge[]),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  const { data: userCredentials = [] } = useSWR(
    isAuthenticated ? "user-credentials" : null,
    () => credentialService.listUserCredentials().catch(() => [] as UserCredential[]),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  const { data: userQuests = [] } = useSWR(
    isAuthenticated ? "user-quests" : null,
    () => questService.listUserQuests().catch(() => []),
    { revalidateOnFocus: false, dedupingInterval: 120000 }
  );

  const { data: civDirection } = useSWR(
    isAuthenticated ? "world-civ-direction" : null,
    () => worldService.getCivilizationDirection().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // ── Derived data ──────────────────────────────────────────────

  const aggregateScores: DimensionScores = useMemo(
    () => computeAggregateScores(userSkills),
    [userSkills]
  );

  const skillMap = useMemo(
    () => new Map(allSkills.map((s) => [s.id, s])),
    [allSkills]
  );

  // Earned badges sorted by date desc
  const earnedBadges = useMemo(() => {
    const badgeMap = new Map(userBadges.map((ub) => [ub.badge_id, ub]));
    return allBadges
      .filter((b) => badgeMap.get(b.id)?.earned)
      .map((b) => ({ badge: b, userBadge: badgeMap.get(b.id)! }))
      .sort(
        (a, b) =>
          new Date(b.userBadge.earned_at ?? 0).getTime() -
          new Date(a.userBadge.earned_at ?? 0).getTime()
      );
  }, [allBadges, userBadges]);

  // Top 6 skills
  const topSkills = useMemo(
    () => [...userSkills].sort((a, b) => b.overall - a.overall).slice(0, 6),
    [userSkills]
  );

  // Top 6 buildings
  const topBuildings = useMemo(() => {
    if (!worldData) return [];
    const all: (UserBuilding | UserCompoundBuilding)[] = [
      ...(worldData.buildings ?? []),
      ...(worldData.compound_buildings ?? []),
    ];
    return all.sort((a, b) => b.level - a.level).slice(0, 6);
  }, [worldData]);

  const questCompletionCount = useMemo(
    () => userQuests.filter((q) => q.status === "PASSED").length,
    [userQuests]
  );

  // Domain overview (文明大陆 nodes)
  const domainOverview = useMemo(() => {
    return DOMAIN_GROUPS.map((group) => {
      const domainSkillIds = new Set(
        allSkills.filter((s) => group.domains.includes(s.domain)).map((s) => s.id)
      );
      const domainUserSkills = userSkills.filter((us) => domainSkillIds.has(us.skill_id));
      const avgScore =
        domainUserSkills.length > 0
          ? Math.round(domainUserSkills.reduce((s, us) => s + us.overall, 0) / domainUserSkills.length)
          : 0;
      const level = avgScore <= 20 ? 1 : avgScore <= 40 ? 2 : avgScore <= 60 ? 3 : avgScore <= 80 ? 4 : 5;
      return { ...group, skillCount: domainUserSkills.length, totalSkills: domainSkillIds.size, avgScore, level };
    }).filter((g) => g.totalSkills > 0);
  }, [allSkills, userSkills]);

  // Highest building
  const highestBuilding = useMemo(() => {
    if (!worldData) return null;
    const all = [...(worldData.buildings ?? []), ...(worldData.compound_buildings ?? [])];
    if (!all.length) return null;
    const highest = all.reduce((a, b) => (b.level > a.level ? b : a));
    const tpl = (highest as any).template;
    const name = locale === "en" && tpl?.name_en ? tpl.name_en : tpl?.name ?? "";
    return { name, level: highest.level, icon: tpl?.icon ?? "building", id: highest.id };
  }, [worldData, locale]);

  // Unified civilization event log: world events + badges + credentials + passed quests
  const eventLog = useMemo(() => {
    const entries: LogEntry[] = [];

    for (const ev of worldData?.recent_events ?? []) {
      entries.push({
        id: `ev-${ev.id}`,
        kind: "event",
        title: locale === "en" && ev.title_en ? ev.title_en : ev.title,
        desc: locale === "en" && ev.description_en ? ev.description_en : ev.description,
        date: ev.created_at,
        icon: <EventGlyph type={ev.event_type} size={13} />,
        tag: EVENT_TYPE_LABELS[ev.event_type] ? (locale === "en" ? EVENT_TYPE_LABELS[ev.event_type].en : EVENT_TYPE_LABELS[ev.event_type].zh) : null,
      });
    }

    for (const { badge, userBadge } of earnedBadges) {
      entries.push({
        id: `bdg-${badge.id}`,
        kind: "badge",
        title: locale === "en" && badge.name_en ? badge.name_en : badge.name,
        date: userBadge.earned_at ?? null,
        icon: <span className="text-[13px] leading-none">{badge.icon || "\u{1F3C6}"}</span>,
        tag: locale === "en" ? "Badge" : "徽章",
      });
    }

    for (const cred of userCredentials) {
      entries.push({
        id: `cred-${cred.id}`,
        kind: "credential",
        title: cred.name,
        date: cred.issued_at ?? null,
        icon: <QuestScrollIcon name="star" size={13} />,
        tag: locale === "en" ? "Credential" : "证书",
      });
    }

    for (const q of userQuests as any[]) {
      if (q?.status !== "PASSED") continue;
      entries.push({
        id: `q-${q.quest_id}`,
        kind: "quest",
        title: (locale === "en" && q.quest_title_en) ? q.quest_title_en : q.quest_title,
        date: null,
        icon: <QuestScrollIcon name="quest" size={13} />,
        tag: locale === "en" ? "Quest" : "远征",
      });
    }

    // Sort by date desc, timeless entries last
    entries.sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : -Infinity;
      const tb = b.date ? new Date(b.date).getTime() : -Infinity;
      return tb - ta;
    });

    return entries.slice(0, 14);
  }, [worldData, earnedBadges, userCredentials, userQuests, locale]);

  const eraLabel = worldData?.era ? ERA_LABELS[worldData.era] : null;
  const tierLabel = worldData?.tier ? CIVILIZATION_TIER_LABELS[worldData.tier] : null;
  const stats = worldData?.stats;
  const displayName = user?.nickname || user?.username || "Odyssey Explorer";
  const avatarSrc = resolveAvatarSrc(user?.avatar_url ?? null);
  const displayTitle = user?.title || (locale === "en" ? "No title set" : "尚未设置头衔");
  const displayBio = user?.bio || (locale === "en" ? "Nothing here yet~" : "这里还什么都没有~");
  const civIndex = stats
    ? (stats.civilization_level * 100 + (stats.average_level ?? 0) * 10).toLocaleString()
    : "0";
  const activeDirection = civDirection?.active_paths?.[0] ?? null;

  // ── Auth guard render ─────────────────────────────────────────

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 animate-fade-in">
      {/* Parchment backdrop */}
      <ParchmentBackground opacity={0.5} />

      <div className="relative grid grid-cols-1 lg:grid-cols-[48px_1fr] gap-0">
        {/* Chronicle spine (desktop) */}
        <div className="hidden lg:flex flex-col items-center pt-2">
          <div className="w-px flex-1" style={{ background: `linear-gradient(180deg, ${CIV_COLORS.gold}55, ${CIV_COLORS.gold}22)` }} />
        </div>

        <div className="min-w-0">
          {/* ═══ 探索者铭牌 ═══════════════════════════════ */}
          <ExplorerNameplate
            avatarSrc={avatarSrc}
            displayName={displayName}
            displayTitle={displayTitle}
            displayBio={displayBio}
            eraLabel={eraLabel}
            tierLabel={tierLabel}
            civIndex={civIndex}
            userSkillCount={userSkills.length}
            buildingCount={stats?.active_buildings ?? stats?.total_buildings ?? 0}
            questCount={questCompletionCount}
            explorationProgress={worldData?.exploration_progress ?? 0}
            activeDirection={activeDirection ? { title: activeDirection.path_title, href: `/paths/${activeDirection.path_id}` } : null}
            locale={locale}
          />

          <CopperDivider className="my-8" />

          {/* ═══ 文明能力星图 ═══════════════════════════════ */}
          <ArchiveSection
            seal="star"
            title={locale === "en" ? "Ability Star Map" : "文明能力星图"}
            subtitle={locale === "en" ? "Four facets of your civilization" : "构筑你文明的四大能力维度"}
          >
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="shrink-0">
                <AbilityEmblem
                  scores={{
                    knowledge: aggregateScores.knowledge,
                    reasoning: aggregateScores.reasoning,
                    application: aggregateScores.application,
                    creation: aggregateScores.creation,
                  }}
                  size={300}
                  labels={{
                    knowledge: t("skills.dimensions.knowledge") || "知识",
                    reasoning: t("skills.dimensions.reasoning") || "推理",
                    application: t("skills.dimensions.application") || "应用",
                    creation: t("skills.dimensions.creation") || "创造",
                  }}
                />
              </div>
              <div className="w-full md:w-auto flex-1 grid grid-cols-2 gap-x-6 gap-y-4">
                {([
                  ["knowledge", "knowledge"],
                  ["reasoning", "reasoning"],
                  ["application", "application"],
                  ["creation", "creation"],
                ] as [keyof DimensionScores, ScrollIconName][]).map(([dim, icon]) => (
                  <div key={dim} className="relative pl-4">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border" style={{ borderColor: `${CIV_COLORS.gold}66`, background: `${CIV_COLORS.gold}22` }} />
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: CIV_COLORS.textSecondary }}>
                      <QuestScrollIcon name={icon} size={12} />
                      {t(`skills.dimensions.${dim}`) || dim}
                    </div>
                    <div className="text-xl font-bold font-mono" style={{ color: CIV_COLORS.textPrimary }}>
                      {aggregateScores[dim]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ArchiveSection>

          <CopperDivider className="my-8" />

          {/* ═══ 文明纪年 ═══════════════════════════════════ */}
          <ArchiveSection
            seal="hourglass"
            title={locale === "en" ? "Civilization Chronicle" : "文明纪年"}
            subtitle={locale === "en" ? "The annals of your realm" : "你文明王国的编年实录"}
          >
            {worldData?.era && (
              <div className="flex items-center gap-4 mb-5">
                <CivIcon
                  type="era"
                  name={worldData.era}
                  size={56}
                  fallback={<EraStoneIcon era={worldData.era} size={56} />}
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: CIV_COLORS.textSecondary }}>
                    {locale === "en" ? "Current Era" : "当前时代"}
                  </p>
                  <p className="text-lg font-bold font-civ-serif" style={{ color: CIV_COLORS.textPrimary }}>
                    {locale === "en" ? eraLabel?.en : eraLabel?.zh}
                  </p>
                  {tierLabel && (
                    <p className="text-xs" style={{ color: CIV_COLORS.textSecondary }}>
                      {locale === "en" ? tierLabel.en : tierLabel.zh}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="border-t" style={{ borderColor: `${CIV_COLORS.border}60` }}>
              <ChronicleRow icon={<QuestScrollIcon name="star" size={13} />} label={locale === "en" ? "Civilization Level" : "文明等级"} value={String(stats?.civilization_level ?? 0)} />
              <ChronicleRow icon={<QuestScrollIcon name="world-core" size={13} />} label={locale === "en" ? "Civilization Index" : "文明指数"} value={civIndex} />
              <ChronicleRow icon={<QuestScrollIcon name="map" size={13} />} label={locale === "en" ? "Exploration Areas" : "探索区域"} value={`${worldData?.regions?.length ?? 0}`} />
              <ChronicleRow icon={<QuestScrollIcon name="building" size={13} />} label={locale === "en" ? "Buildings" : "建筑"} value={String(stats?.active_buildings ?? stats?.total_buildings ?? 0)} />
              <ChronicleRow icon={<QuestScrollIcon name="mission" size={13} />} label={locale === "en" ? "Achievements" : "成果"} value={stats ? `${stats.milestones_unlocked}/${stats.total_milestones}` : "0/0"} />
              <ChronicleRow icon={<QuestScrollIcon name="quest" size={13} />} label={locale === "en" ? "Quests Completed" : "已完成远征"} value={String(questCompletionCount)} />
              {highestBuilding && (
                <ChronicleRow
                  icon={<QuestScrollIcon name="building-emblem" size={13} />}
                  label={locale === "en" ? "Highest Building" : "最高建筑"}
                  value={`${highestBuilding.name} Lv.${highestBuilding.level}`}
                  href={`/world?building=${highestBuilding.id}`}
                />
              )}
            </div>
          </ArchiveSection>

          <CopperDivider className="my-8" />

          {/* ═══ 文明大陆 ═══════════════════════════════════ */}
          <ArchiveSection
            seal="map"
            title={locale === "en" ? "Civilization Continent" : "文明大陆"}
            subtitle={locale === "en" ? "Territories of your exploration" : "你已踏足的探索疆域"}
          >
            {domainOverview.length === 0 ? (
              <p className="text-sm italic py-6 text-center" style={{ color: CIV_COLORS.textSecondary }}>
                {locale === "en" ? "No territories explored yet" : "尚未开辟任何探索疆域"}
              </p>
            ) : (
              <div className="relative">
                {/* connective gold line */}
                <div className="hidden md:block absolute top-6 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg, transparent, ${CIV_COLORS.gold}50, transparent)` }} />
                <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {domainOverview.map((d) => (
                    <ContinentNode key={d.key} civKey={d.key} label={d.label} labelEn={d.labelEn} level={d.level} avgScore={d.avgScore} locale={locale} />
                  ))}
                </div>
              </div>
            )}
          </ArchiveSection>

          <CopperDivider className="my-8" />

          {/* ═══ 文明事件日志 ═══════════════════════════════ */}
          <ArchiveSection
            seal="scroll"
            title={locale === "en" ? "Civilization Event Log" : "文明事件日志"}
            subtitle={locale === "en" ? "Chronicle of your deeds" : "记录你文明旅途中的每一桩事迹"}
          >
            {eventLog.length === 0 ? (
              <p className="text-sm italic py-6 text-center" style={{ color: CIV_COLORS.textSecondary }}>
                {locale === "en" ? "No recorded deeds yet" : "尚无记录的事迹"}
              </p>
            ) : (
              <div className="space-y-0">
                {eventLog.map((entry, idx) => (
                  <EventLogRow key={entry.id} entry={entry} isLast={idx === eventLog.length - 1} locale={locale} />
                ))}
              </div>
            )}
          </ArchiveSection>

          <CopperDivider className="my-8" />

          {/* ═══ 能力印记 ═══════════════════════════════════ */}
          <ArchiveSection
            seal="seal"
            title={locale === "en" ? "Ability Seals" : "能力印记"}
            subtitle={locale === "en" ? "Runes of your mastery" : "你所凝聚的符文印记"}
            viewAllHref="/skills"
            viewAllLabel={locale === "en" ? "View All" : "查看全部"}
            isEmpty={topSkills.length === 0}
            emptyText={locale === "en" ? "No skills unlocked yet" : "尚未凝聚任何能力印记"}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-5">
              {topSkills.map((us) => {
                const skillDef = skillMap.get(us.skill_id);
                const name = skillDef
                  ? skillDisplayName(skillDef.name, skillDef.name_en, locale)
                  : skillDisplayName(us.skill_name, undefined, locale) || us.skill_id;
                const civKey = skillDef ? civKeyForDomain(skillDef.domain) : null;
                return (
                  <Link key={us.skill_id} href={`/skills?skill=${us.skill_id}`} className="group flex flex-col items-center gap-2">
                    <span className="relative transition-transform duration-300 group-hover:scale-110" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.08))" }}>
                      <CivIcon
                        type="type"
                        name={civKey}
                        size={56}
                        alt={name}
                        fallback={<BuildingSealIcon type={inferSkillId(name, us.skill_id)} size={56} />}
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold font-mono" style={{ borderColor: CIV_COLORS.gold, background: "#FBF4E4", color: CIV_COLORS.darkRed }}>
                        {us.overall}
                      </span>
                    </span>
                    <span className="text-[11px] font-bold font-civ-serif text-center leading-tight max-w-[84px] truncate" style={{ color: CIV_COLORS.textPrimary }}>
                      {name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </ArchiveSection>

          <CopperDivider className="my-8" />

          {/* ═══ 文明入口 ═══════════════════════════════════ */}
          <ArchiveSection
            seal="compass"
            title={locale === "en" ? "Civilization Entrances" : "文明入口"}
            subtitle={locale === "en" ? "Gateways to continue your journey" : "通往下一段征途的入口"}
          >
            <div className="border-t" style={{ borderColor: `${CIV_COLORS.border}60` }}>
              <EntranceRow
                iconName="reasoning"
                title={locale === "en" ? "Skill Center" : "技能中心"}
                desc={locale === "en" ? `Manage ${userSkills.length} skills` : `管理 ${userSkills.length} 项技能`}
                href="/skills"
              />
              <EntranceRow
                iconName="checklist"
                title={locale === "en" ? "Quest Board" : "任务面板"}
                desc={locale === "en" ? `${questCompletionCount} quests completed` : `已完成 ${questCompletionCount} 个远征`}
                href="/quests"
              />
              <EntranceRow
                iconName="civilization"
                title={locale === "en" ? "My World" : "我的世界"}
                desc={
                  stats
                    ? locale === "en"
                      ? `${stats.active_buildings ?? stats.total_buildings ?? 0} buildings, ${eraLabel?.en ?? "?"} era`
                      : `${stats.active_buildings ?? stats.total_buildings ?? 0} 座建筑, ${eraLabel?.zh ?? "?"}时代`
                    : ""
                }
                href="/world"
              />
            </div>
          </ArchiveSection>
        </div>
      </div>
    </div>
  );
}

// ── Types ───────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  kind: "event" | "badge" | "credential" | "quest";
  title: string;
  desc?: string | null;
  date?: string | null;
  tag?: string | null;
  icon: ReactNode;
}

// ── Sub-components ──────────────────────────────────────────────

/** Section header with a compass/seal mark + ruled lines, no card. */
function ArchiveSection({
  seal,
  title,
  subtitle,
  children,
  viewAllHref,
  viewAllLabel,
  isEmpty = false,
  emptyText,
}: {
  seal: ScrollIconName;
  title: string;
  subtitle?: string;
  children: ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  isEmpty?: boolean;
  emptyText?: string;
}) {
  return (
    <section className="relative">
      {/* corner accents */}
      <span className="absolute -top-1 -left-1 h-4 w-4 border-l border-t" style={{ borderColor: `${CIV_COLORS.gold}66` }} />
      <span className="absolute -bottom-1 -right-1 h-4 w-4 border-b border-r" style={{ borderColor: `${CIV_COLORS.gold}66` }} />

      <div className="flex items-center gap-3 mb-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border" style={{ borderColor: `${CIV_COLORS.gold}60`, background: `${CIV_COLORS.gold}14` }}>
          <QuestScrollIcon name={seal} size={16} />
        </span>
        <h2 className="text-base font-bold font-civ-serif tracking-wide" style={{ color: CIV_COLORS.textPrimary }}>
          {title}
        </h2>
        {subtitle && (
          <span className="hidden sm:inline text-[11px] italic ml-1" style={{ color: CIV_COLORS.textSecondary }}>
            — {subtitle}
          </span>
        )}
        {viewAllHref && (
          <Link href={viewAllHref} className="ml-auto text-xs font-bold font-civ-serif italic transition-colors hover:opacity-70" style={{ color: CIV_COLORS.gold }}>
            {viewAllLabel || "View All"} →
          </Link>
        )}
      </div>
      <div className="h-px w-full mb-6" style={{ background: `linear-gradient(90deg, ${CIV_COLORS.gold}66, transparent)` }} />

      {isEmpty ? (
        <p className="text-sm italic py-8 text-center" style={{ color: CIV_COLORS.textSecondary }}>{emptyText}</p>
      ) : (
        children
      )}
    </section>
  );
}

/** Explorer nameplate — identity + stage + points + direction, no card. */
function ExplorerNameplate({
  avatarSrc, displayName, displayTitle, displayBio, eraLabel, tierLabel,
  civIndex, userSkillCount, buildingCount, questCount, explorationProgress, activeDirection, locale,
}: {
  avatarSrc: string | null;
  displayName: string;
  displayTitle: string;
  displayBio: string;
  eraLabel: { zh: string; en: string; icon: string } | null;
  tierLabel: { zh: string; en: string; icon: string } | null;
  civIndex: string;
  userSkillCount: number;
  buildingCount: number;
  questCount: number;
  explorationProgress: number;
  activeDirection: { title: string; href: string } | null;
  locale: string;
}) {
  return (
    <section className="relative">
      <span className="absolute -top-2 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${CIV_COLORS.gold}80, transparent)` }} />
      <span className="absolute -top-2 left-0 h-5 w-5 border-l border-t" style={{ borderColor: CIV_COLORS.gold }} />
      <span className="absolute -top-2 right-0 h-5 w-5 border-r border-t" style={{ borderColor: CIV_COLORS.gold }} />

      <div className="relative flex flex-col md:flex-row items-start gap-6 pt-6 pb-4">
        {/* Identity */}
        <div className="flex items-center gap-5 flex-1 min-w-0">
          <div className="relative shrink-0">
            <SealRing size={92} />
            <div className="absolute inset-[9px] flex items-center justify-center overflow-hidden rounded-full border bg-[#FBF4E4] dark:bg-[#241d14]" style={{ borderColor: `${CIV_COLORS.gold}55` }}>
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <QuestScrollIcon name="compass" size={34} />
              )}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: CIV_COLORS.gold }}>
              {locale === "en" ? "Explorer's Nameplate" : "探索者铭牌"}
            </p>
            <h1 className="text-2xl font-bold font-civ-serif mt-0.5 truncate" style={{ color: CIV_COLORS.textPrimary }}>
              {displayName}
            </h1>
            <p className="text-xs font-bold font-civ-serif mt-0.5 italic" style={{ color: CIV_COLORS.darkRed }}>
              <QuestScrollIcon name="star" size={12} className="inline-block align-text-bottom" /> {displayTitle}
            </p>
            {displayBio && (
              <p className="mt-2 text-xs leading-relaxed italic max-w-sm line-clamp-2" style={{ color: CIV_COLORS.textSecondary }}>
                "{displayBio}"
              </p>
            )}
          </div>
        </div>

        {/* Stage + Points + Direction */}
        <div className="w-full md:w-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 border-t md:border-t-0 pt-4 md:pt-0 relative">
          <span className="absolute top-0 md:top-2 md:bottom-2 left-0 hidden md:block w-px" style={{ background: `linear-gradient(180deg, transparent, ${CIV_COLORS.gold}66, transparent)` }} />

          <NameplateStat
            icon={<QuestScrollIcon name="sparkle" size={15} />}
            label={locale === "en" ? "Civilization Stage" : "文明阶段"}
            value={tierLabel ? (locale === "en" ? tierLabel.en : tierLabel.zh) : "—"}
            sub={eraLabel ? (locale === "en" ? eraLabel.en : eraLabel.zh) : undefined}
          />
          <NameplateStat
            icon={<QuestScrollIcon name="world-core" size={15} />}
            label={locale === "en" ? "Civilization Points" : "文明点"}
            value={civIndex}
            sub={`${locale === "en" ? "Index" : "指数"}`}
          />
          <NameplateStat
            icon={<QuestScrollIcon name="compass" size={15} />}
            label={locale === "en" ? "Exploration Rate" : "探索率"}
            value={`${explorationProgress}%`}
            sub={`${userSkillCount} ${locale === "en" ? "abilities" : "项能力"}`}
          />
          <div className="col-span-2 sm:col-span-1 relative">
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: CIV_COLORS.textSecondary }}>
              <QuestScrollIcon name="path" size={13} />
              {locale === "en" ? "Current Direction" : "当前探索方向"}
            </div>
            {activeDirection ? (
              <Link href={activeDirection.href} className="text-sm font-bold font-civ-serif italic leading-tight transition-colors hover:opacity-70" style={{ color: CIV_COLORS.gold }}>
                {activeDirection.title}
              </Link>
            ) : (
              <p className="text-sm italic" style={{ color: CIV_COLORS.textSecondary }}>
                {locale === "en" ? "No direction set" : "尚未设定"}
              </p>
            )}
            <p className="text-[10px] mt-0.5" style={{ color: CIV_COLORS.textSecondary }}>
              {buildingCount} {locale === "en" ? "buildings" : "建筑"} · {questCount} {locale === "en" ? "quests" : "远征"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function NameplateStat({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: CIV_COLORS.textSecondary }}>
        {icon}
        {label}
      </div>
      <div className="font-mono text-xl font-bold" style={{ color: CIV_COLORS.textPrimary }}>
        {value}
      </div>
      {sub && <div className="text-[10px]" style={{ color: CIV_COLORS.textSecondary }}>{sub}</div>}
    </div>
  );
}

function ChronicleRow({ icon, label, value, href }: { icon: ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs" style={{ color: CIV_COLORS.textSecondary }}>
        <span className="inline-flex items-center gap-2">
          <span className="w-4 flex items-center justify-center">{icon}</span>
          <span className="font-medium">{label}</span>
        </span>
      </span>
      <span className="text-xs font-bold font-civ-serif text-right max-w-[55%] truncate" style={{ color: href ? CIV_COLORS.gold : CIV_COLORS.textPrimary }}>
        {value}
      </span>
    </div>
  );
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: `${CIV_COLORS.border}40` }}>
      {href ? <Link href={href} className="block transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">{inner}</Link> : inner}
    </div>
  );
}

function ContinentNode({ civKey, label, labelEn, level, avgScore, locale }: {
  civKey: string; label: string; labelEn: string; level: number; avgScore: number; locale: string;
}) {
  const size = 34 + level * 4;
  return (
    <div className="relative flex flex-col items-center gap-2 py-1">
      <div className="relative flex items-center justify-center rounded-full border transition-transform duration-300 hover:scale-110"
        style={{ width: size, height: size, borderColor: `${CIV_COLORS.gold}66`, background: `${CIV_COLORS.gold}14` }}>
        <CivIcon type="type" name={civKey} size={Math.round(size * 0.5)} alt={label} />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-[8px] font-bold font-mono"
          style={{ borderColor: CIV_COLORS.gold, background: "#FBF4E4", color: CIV_COLORS.darkRed }}>
          {level}
        </span>
      </div>
      <span className="text-[10px] font-bold font-civ-serif text-center leading-tight" style={{ color: CIV_COLORS.textPrimary }}>
        {locale === "en" ? labelEn : label}
      </span>
      <span className="text-[9px] font-mono" style={{ color: CIV_COLORS.textSecondary }}>{avgScore}</span>
    </div>
  );
}

function EventLogRow({ entry, isLast, locale }: { entry: LogEntry; isLast: boolean; locale: string }) {
  const timeLabel = entry.date ? formatDate(entry.date, locale) : locale === "en" ? "completed" : "已通关";
  return (
    <div className="relative flex gap-3 pb-4 pl-5">
      {!isLast && (
        <div className="absolute left-[8px] top-5 bottom-0 w-px" style={{ background: `${CIV_COLORS.gold}35` }} />
      )}
      <div className="absolute left-0 top-1 flex h-[17px] w-[17px] items-center justify-center rounded-full border"
        style={{ borderColor: `${CIV_COLORS.gold}60`, background: "#FBF4E4" }}>
        {entry.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {entry.tag && (
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: CIV_COLORS.textSecondary }}>{entry.tag}</span>
          )}
          <span className="text-[10px] font-mono" style={{ color: CIV_COLORS.textSecondary }}>{timeLabel}</span>
        </div>
        <p className="text-sm font-bold font-civ-serif truncate" style={{ color: CIV_COLORS.textPrimary }}>{entry.title}</p>
        {entry.desc && (
          <p className="text-xs leading-snug line-clamp-2" style={{ color: CIV_COLORS.textSecondary }}>{entry.desc}</p>
        )}
      </div>
    </div>
  );
}

function EntranceRow({ iconName, title, desc, href }: { iconName: ScrollIconName; title: string; desc: string; href: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 py-3.5 border-b last:border-b-0 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]" style={{ borderColor: `${CIV_COLORS.border}40` }}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-110" style={{ borderColor: `${CIV_COLORS.gold}60`, background: `${CIV_COLORS.gold}14` }}>
        <QuestScrollIcon name={iconName} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold font-civ-serif italic transition-colors group-hover:opacity-70" style={{ color: CIV_COLORS.textPrimary }}>{title}</p>
        {desc && <p className="text-[11px] mt-0.5" style={{ color: CIV_COLORS.textSecondary }}>{desc}</p>}
      </div>
      <span className="text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" style={{ color: CIV_COLORS.gold }}>
        <QuestScrollIcon name="arrow-right" size={16} />
      </span>
    </Link>
  );
}

/** Map a world event type to a small glyph. */
function EventGlyph({ type, size = 13 }: { type: string; size?: number }) {
  switch (type) {
    case "BUILDING_UPGRADE":
    case "COMPOUND_UPGRADE":
      return <QuestScrollIcon name="building-emblem" size={size} />;
    case "MILESTONE_REACHED":
    case "PATH_MILESTONE_COMPLETED":
      return <QuestScrollIcon name="mission" size={size} />;
    case "TIER_ADVANCE":
      return <QuestScrollIcon name="star" size={size} />;
    case "ERA_ADVANCE":
      return <QuestScrollIcon name="sparkle" size={size} />;
    case "REGION_UNLOCK":
    case "EXPLORATION_UNLOCK":
      return <QuestScrollIcon name="map" size={size} />;
    case "COMPOUND_UNLOCK":
      return <QuestScrollIcon name="lock" size={size} />;
    default:
      return <QuestScrollIcon name="seal" size={size} />;
  }
}

function formatDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", { year: "numeric", month: "short", day: "numeric" });
}