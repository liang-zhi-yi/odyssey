"use client";

import { useEffect, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillService } from "@/services/skill.service";
import { worldService } from "@/services/world.service";
import { badgeService } from "@/services/badge.service";
import { credentialService } from "@/services/credential.service";
import { questService } from "@/services/quest.service";
import { computeAggregateScores } from "@/lib/scores";
import { resolveAvatarSrc } from "@/lib/avatar";
import { RadarChart } from "@/app/components/RadarChart";
import { BadgeCard } from "@/app/components/BadgeCard";
import { CredentialBadge } from "@/app/components/CredentialBadge";
import { GrowthTimeline } from "@/app/components/GrowthTimeline";
import { Loading } from "@/app/components/Loading";
import { masteryColor } from "@/app/components/GrowthRing";
import {
  ERA_LABELS,
  CIVILIZATION_TIER_LABELS,
  type UserBuilding,
  type UserCompoundBuilding,
} from "@/types/world";
import type { Skill, UserSkill } from "@/types/skill";
import type { BadgeDefinition, UserBadge } from "@/types/badge";
import type { UserCredential } from "@/types/credential";
import type { DimensionScores } from "@/types/assessment";

// ── Civilization domain groups ──────────────────────────────────

const DOMAIN_GROUPS: { key: string; label: string; labelEn: string; icon: string; domains: string[] }[] = [
  { key: "ai", label: "AI文明", labelEn: "AI", icon: "🤖", domains: ["AI"] },
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

// ── Page Component ──────────────────────────────────────────────

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
    () => userQuests.filter((q: any) => q.status === "PASSED").length,
    [userQuests]
  );

  // Domain overview
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
    return { name, level: highest.level, icon: tpl?.icon ?? "🏛️", id: highest.id };
  }, [worldData, locale]);

  const eraLabel = worldData?.era ? ERA_LABELS[worldData.era] : null;
  const tierLabel = worldData?.tier ? CIVILIZATION_TIER_LABELS[worldData.tier] : null;
  const stats = worldData?.stats;
  const displayName = user?.nickname || user?.username || "Odyssey Explorer";
  const avatarSrc = resolveAvatarSrc(user?.avatar_url ?? null);

  // Passport ID
  const passportId = useMemo(() => {
    if (!user) return "#ODS-0000-0000";
    const short = user.id.replace(/-/g, "").slice(0, 8).toUpperCase();
    return `#ODS-${short.slice(0, 4)}-${short.slice(4, 8)}`;
  }, [user]);

  // ── Auth guard render ─────────────────────────────────────────

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 py-6 animate-fade-in">
      {/* ═══ HERO PROFILE HEADER ════════════════════════════════ */}
      <section className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left: Identity */}
          <div className="flex-1 p-6 sm:p-8">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-4xl overflow-hidden ring-2 ring-border">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <span>🧑‍🎓</span>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">{displayName}</h1>
                {user?.title && (
                  <p className="text-sm text-accent font-medium mt-0.5">{user.title}</p>
                )}
                {tierLabel && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {tierLabel.icon} {locale === "en" ? tierLabel.en : tierLabel.zh}
                    {eraLabel && <>{` · `}{eraLabel.icon} {locale === "en" ? eraLabel.en : eraLabel.zh}</>}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  {stats && (
                    <span>
                      {locale === "en" ? "Index" : "文明指数"}{" "}
                      <strong className="text-accent font-semibold tabular-nums">
                        {(stats.civilization_level * 100 + (stats.average_level ?? 0) * 10).toLocaleString()}
                      </strong>
                    </span>
                  )}
                  <span>
                    {locale === "en" ? "Skills" : "已掌握"}{" "}
                    <strong className="text-foreground font-semibold tabular-nums">{userSkills.length}</strong>{" "}
                    {locale === "en" ? "abilities" : "项能力"}
                  </span>
                  {stats && (
                    <span>
                      {locale === "en" ? "Buildings" : "已建造"}{" "}
                      <strong className="text-foreground font-semibold tabular-nums">
                        {stats.active_buildings ?? stats.total_buildings ?? 0}
                      </strong>{" "}
                      {locale === "en" ? "buildings" : "座建筑"}
                    </span>
                  )}
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-3 py-1 text-[10px] font-mono text-muted-foreground">
                  <span className="text-xs">🛂</span>
                  {locale === "en" ? "Capability Passport" : "能力通行证"}{" "}
                  <span className="font-semibold text-foreground">{passportId}</span>
                </div>
                {user?.bio && (
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">{user.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Recent badges */}
          {earnedBadges.length > 0 && (
            <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-border p-6 flex flex-col">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {locale === "en" ? "Recent Badges" : "最近获得徽章"}
              </h3>
              <div className="flex-1 space-y-2">
                {earnedBadges.slice(0, 4).map(({ badge, userBadge }) => (
                  <div key={badge.id} className="flex items-center gap-2.5 rounded-lg bg-secondary/40 px-3 py-2">
                    <span className="text-lg shrink-0">{badge.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {locale === "en" && badge.name_en ? badge.name_en : badge.name}
                      </p>
                      {userBadge.earned_at && (
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(userBadge.earned_at).toLocaleDateString(
                            locale === "en" ? "en-US" : "zh-CN",
                            { year: "numeric", month: "short", day: "numeric" }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {earnedBadges.length > 4 && (
                <Link href="/badges" className="mt-3 text-xs text-primary hover:underline self-end">
                  {locale === "en" ? `+${earnedBadges.length - 4} more` : `还有 ${earnedBadges.length - 4} 个`} →
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══ DUAL COLUMN: Analysis + Archive ═══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Capability Analysis */}
        <section className="space-y-6">
          {/* Radar */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {locale === "en" ? "Capability Radar" : "综合能力雷达"}
            </h3>
            <div className="flex justify-center">
              <RadarChart scores={aggregateScores} size={200} showLabels />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {(["knowledge", "reasoning", "application", "creation"] as (keyof DimensionScores)[]).map((dim) => (
                <div key={dim} className="text-center">
                  <div className="text-lg font-bold text-foreground tabular-nums">{aggregateScores[dim]}</div>
                  <div className="text-[10px] text-muted-foreground">{t(`skills.dimensions.${dim}`) || dim}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Domain Overview */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {locale === "en" ? "Civilization Domains" : "文明领域概览"}
            </h3>
            <div className="space-y-2.5">
              {domainOverview.map((d) => (
                <div key={d.key} className="flex items-center gap-3">
                  <span className="text-base w-7 text-center shrink-0">{d.icon}</span>
                  <span className="text-xs font-medium text-foreground w-20 shrink-0 truncate">{d.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, (d.avgScore / 100) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-12 text-right tabular-nums shrink-0">Lv{d.level}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right: Civilization Archive */}
        <section>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card h-full">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🏛️</span>
              <h3 className="text-sm font-semibold text-foreground">
                {locale === "en" ? "Civilization Archive" : "文明档案"}
              </h3>
            </div>
            <div className="mb-4 pb-4 border-b border-border">
              <p className="text-lg font-bold text-foreground">
                {displayName}{" "}
                <span className="text-sm font-normal text-muted-foreground">{locale === "en" ? "Civilization" : "文明"}</span>
              </p>
            </div>
            <div className="space-y-3">
              <ArchiveRow icon="⏳" label={locale === "en" ? "Current Era" : "当前时代"} value={eraLabel ? (locale === "en" ? eraLabel.en : eraLabel.zh) : "—"} />
              <ArchiveRow icon="📊" label={locale === "en" ? "Civ Index" : "文明指数"} value={stats ? ((stats.civilization_level * 100 + (stats.average_level ?? 0) * 10).toLocaleString()) : "—"} />
              <ArchiveRow icon="🗺️" label={locale === "en" ? "Exploration" : "探索率"} value={worldData ? `${worldData.exploration_progress}%` : "—"} />
              <ArchiveRow icon="🏗️" label={locale === "en" ? "Buildings" : "建筑"} value={stats ? String(stats.active_buildings ?? stats.total_buildings ?? 0) : "—"} />
              <ArchiveRow icon="🎯" label={locale === "en" ? "Skills Unlocked" : "已解锁技能"} value={String(userSkills.length)} />
              <ArchiveRow icon="✅" label={locale === "en" ? "Quests Done" : "任务完成"} value={String(questCompletionCount)} />
              {highestBuilding && (
                <ArchiveRow icon="🏛️" label={locale === "en" ? "Highest Building" : "最高建筑"} value={`${highestBuilding.name} Lv${highestBuilding.level}`} href={`/world?building=${highestBuilding.id}`} />
              )}
              {civDirection?.active_paths?.[0] && (
                <ArchiveRow icon="📖" label={locale === "en" ? "Learning Path" : "当前学习路径"} value={civDirection.active_paths[0].path_title} href={`/paths/${civDirection.active_paths[0].path_id}`} />
              )}
            </div>
            {tierLabel && worldData?.next_tier_at != null && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{tierLabel.icon}</span>
                  <span className="font-medium text-foreground">{locale === "en" ? tierLabel.en : tierLabel.zh}</span>
                  <span>— {locale === "en" ? "Next tier at" : "下一等级需"} <strong className="text-accent tabular-nums">{worldData.next_tier_at}</strong></span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ═══ REPRESENTATIVE ACHIEVEMENTS ═══════════════════════ */}
      <section className="space-y-6">
        {/* Row 1: Badges + Credentials */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard
            icon="🏅"
            title={locale === "en" ? "Recent Badges" : "最近获得徽章"}
            viewAllHref="/badges"
            viewAllLabel={locale === "en" ? "View All" : "查看全部"}
            emptyText={locale === "en" ? "No badges earned yet" : "尚未获得徽章"}
            isEmpty={earnedBadges.length === 0}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {earnedBadges.slice(0, 6).map(({ badge, userBadge }) => (
                <BadgeCard key={badge.id} badge={badge} userBadge={userBadge} />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            icon="🏆"
            title={locale === "en" ? "Recent Credentials" : "最近获得证书"}
            viewAllHref="/credentials"
            viewAllLabel={locale === "en" ? "View All" : "查看全部"}
            emptyText={locale === "en" ? "No credentials earned yet" : "尚未获得证书"}
            isEmpty={userCredentials.length === 0}
          >
            <div className="space-y-2.5">
              {userCredentials.slice(0, 3).map((cred) => (
                <CredentialBadge key={cred.id} credential={cred} />
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Row 2: Core Skills + Buildings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard
            icon="🎯"
            title={locale === "en" ? "Core Skills" : "核心技能"}
            viewAllHref="/skills"
            viewAllLabel={locale === "en" ? "View All" : "查看全部"}
            emptyText={locale === "en" ? "No skills unlocked yet" : "尚未解锁技能"}
            isEmpty={topSkills.length === 0}
          >
            <div className="flex flex-wrap gap-2">
              {topSkills.map((us) => {
                const skillDef = skillMap.get(us.skill_id);
                return (
                  <Link
                    key={us.skill_id}
                    href={`/skills/${us.skill_id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: masteryColor(us.overall) }} />
                    {skillDef?.name || us.skill_name || us.skill_id}
                    <span className="text-muted-foreground tabular-nums">{us.overall}</span>
                  </Link>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            icon="🏛️"
            title={locale === "en" ? "Top Buildings" : "代表建筑"}
            viewAllHref="/world"
            viewAllLabel={locale === "en" ? "View All" : "查看全部"}
            emptyText={locale === "en" ? "No buildings yet" : "尚未建造建筑"}
            isEmpty={topBuildings.length === 0}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {topBuildings.map((building) => {
                const tpl = (building as any).template;
                const name = locale === "en" && tpl?.name_en ? tpl.name_en : tpl?.name ?? building.id;
                return (
                  <Link
                    key={building.id}
                    href={`/world?building=${building.id}`}
                    className="flex items-center gap-2 rounded-xl border border-border bg-background p-2.5 transition-all hover:shadow-card hover:border-primary/20 group"
                  >
                    <span className="text-xl transition-transform group-hover:scale-110">{tpl?.icon ?? "🏛️"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-foreground truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground">Lv.{building.level}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </section>

      {/* ═══ GROWTH TIMELINE ══════════════════════════════════ */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {locale === "en" ? "Growth Timeline" : "成长时间轴"}
        </h3>
        <GrowthTimeline
          events={worldData?.recent_events}
          unlockedCount={stats?.milestones_unlocked}
          totalCount={stats?.total_milestones}
        />
      </section>

      {/* ═══ RECENT ACTIVITY ══════════════════════════════════ */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {locale === "en" ? "Quick Access" : "快捷入口"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickLink
            icon="🧠"
            title={locale === "en" ? "Skill Center" : "技能中心"}
            desc={locale === "en" ? `Manage ${userSkills.length} skills` : `管理 ${userSkills.length} 项技能`}
            href="/skills"
          />
          <QuickLink
            icon="📋"
            title={locale === "en" ? "Quest Board" : "任务面板"}
            desc={locale === "en" ? `${questCompletionCount} quests completed` : `已完成 ${questCompletionCount} 个任务`}
            href="/quests"
          />
          <QuickLink
            icon="🌍"
            title={locale === "en" ? "My World" : "我的世界"}
            desc={
              stats
                ? locale === "en"
                  ? `${stats.active_buildings ?? stats.total_buildings ?? 0} buildings, Era ${worldData?.era ?? "?"}`
                  : `${stats.active_buildings ?? stats.total_buildings ?? 0} 座建筑, ${eraLabel?.zh ?? "?"}时代`
                : ""
            }
            href="/world"
          />
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function ArchiveRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground flex items-center gap-2">
        <span className="text-sm w-5 text-center">{icon}</span>
        {label}
      </span>
      <span className={`text-xs font-semibold truncate max-w-[60%] text-right ${href ? "text-primary" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
  if (href) {
    return <Link href={href} className="block hover:bg-secondary/30 rounded -mx-1 px-1 transition-colors">{inner}</Link>;
  }
  return inner;
}

function SectionCard({
  icon, title, viewAllHref, viewAllLabel, emptyText, isEmpty, children,
}: {
  icon: string; title: string; viewAllHref: string; viewAllLabel: string;
  emptyText: string; isEmpty: boolean; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span>{icon}</span> {title}
        </h3>
        <Link href={viewAllHref} className="text-xs text-primary hover:underline transition-colors">
          {viewAllLabel} →
        </Link>
      </div>
      {isEmpty ? (
        <p className="text-xs text-muted-foreground text-center py-8">{emptyText}</p>
      ) : (
        children
      )}
    </div>
  );
}

function QuickLink({ icon, title, desc, href }: { icon: string; title: string; desc: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 transition-all hover:shadow-card hover:border-primary/20 group"
    >
      <span className="text-2xl shrink-0 transition-transform group-hover:scale-110">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0 self-center transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}
