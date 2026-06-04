"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import { skillService } from "@/services/skill.service";
import { progressService } from "@/services/progress.service";
import { ProgressTimeline } from "@/app/components/ProgressTimeline";
import { Loading } from "@/app/components/Loading";
import { ErrorState } from "@/app/components/ErrorState";
import { EmptyState } from "@/app/components/EmptyState";
import type { UserSkill } from "@/types/skill";
import type { TimelineEvent } from "@/types/progress";

export default function HistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  // Filters
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch user skills for dropdown
  const { data: userSkills = [] } = useSWR(
    isAuthenticated ? "user-skills" : null,
    () => skillService.listUserSkills()
  );

  // Fetch timeline with filters
  const {
    data: timeline,
    isLoading: timelineLoading,
    error: timelineError,
  } = useSWR(
    isAuthenticated
      ? JSON.stringify(["timeline", skillFilter, startDate, endDate])
      : null,
    () =>
      progressService.getTimeline({
        skill_id: skillFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: 100,
      })
  );

  if (authLoading || !isAuthenticated) {
    return <Loading text={t("auth.validating")} />;
  }

  // Transform to chart dataset (ascending by date for chart)
  const chartDatasets =
    timeline?.events && timeline.events.length > 0
      ? [
          {
            name: t("history.timelineChart"),
            points: [...timeline.events]
              .reverse()
              .map((e: TimelineEvent) => ({ date: e.date, score: e.new_score })),
          },
        ]
      : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">{t("history.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("history.subtitle")}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Skill filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("history.filterSkill")}
            </label>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[160px]"
            >
              <option value="">{t("quests.filter.allSkills")}</option>
              {userSkills.map((skill: UserSkill) => (
                <option key={skill.skill_id} value={skill.skill_id}>
                  {skill.skill_name || skill.skill_id}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("history.filterDateRange")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder={t("history.startDate")}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder={t("history.endDate")}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Clear filters */}
          {(skillFilter || startDate || endDate) && (
            <button
              onClick={() => {
                setSkillFilter("");
                setStartDate("");
                setEndDate("");
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {t("quests.filter.clearFilter")}
            </button>
          )}
        </div>
      </div>

      {/* Timeline Chart */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          {t("history.timelineChart")}
        </h2>
        <div className="rounded-xl border border-border bg-background p-4">
          <ProgressTimeline
            datasets={chartDatasets}
            isLoading={timelineLoading}
          />
        </div>
      </section>

      {/* Event List */}
      <section>
        <h2 className="text-lg font-semibold mb-3">
          {t("history.eventList")}
        </h2>
        <div className="rounded-xl border border-border bg-background p-4">
          {timelineLoading ? (
            <Loading variant="skeleton-cards" cardCount={3} />
          ) : timelineError ? (
            <ErrorState message={t("common.error")} />
          ) : !timeline || timeline.events.length === 0 ? (
            <EmptyState
              title={t("history.noEvents")}
              description={t("history.noEventsDesc")}
              actionLabel={t("dashboard.browseQuests")}
              actionHref="/quests"
            />
          ) : (
            <TimelineEventList events={timeline.events} />
          )}
        </div>
      </section>
    </div>
  );
}

/** Internal vertical timeline list component */
function TimelineEventList({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-0 h-full w-px bg-border" />

      <div className="space-y-0">
        {events.map((event, i) => {
          const isPositive = event.delta > 0;
          return (
            <div
              key={`${event.date}-${event.skill_name}-${i}`}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {/* Dot */}
              <div className="relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center">
                <div
                  className={`h-3 w-3 rounded-full border-2 ${
                    isPositive
                      ? "border-green-500 bg-green-500"
                      : "border-muted-foreground/40 bg-muted-foreground/40"
                  }`}
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {event.skill_name}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      isPositive
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {event.delta}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {event.reason}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  {event.date}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
