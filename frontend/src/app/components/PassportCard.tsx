"use client";

import { useState, useCallback } from "react";
import type { Passport } from "@/types/passport";
import type { DimensionScores } from "@/types/assessment";
import { RadarChart } from "./RadarChart";
import { Loading } from "./Loading";
import { EmptyState } from "./EmptyState";
import { QuestScrollIcon } from "./QuestScrollIcon";
import { useLocale } from "@/hooks/useLocale";
import { skillDisplayName } from "@/lib/skillNames";
import { useAuth } from "@/hooks/useAuth";
import { resolveAvatarSrc } from "@/lib/avatar";

interface PassportCardProps {
  passport: Passport | null;
  /** Optional aggregate dimension scores for radar visualization */
  aggregateScores?: DimensionScores | null;
  isLoading: boolean;
}

/**
 * Passport overview card showing user's skills, credentials, and projects.
 * Includes radar chart visualization and share-to-clipboard functionality.
 */
export function PassportCard({
  passport,
  aggregateScores,
  isLoading,
}: PassportCardProps) {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const avatarSrc = resolveAvatarSrc(user?.avatar_url ?? null);

  const handleCopy = useCallback(async () => {
    if (!passport) return;

    const lines = [
      `Odyssey Capability Passport — ${passport.user}`,
      "",
      "Skills:",
      ...passport.skills.map(
        (s) => `  • ${s.name} — ${s.rank} (Score: ${s.score})`
      ),
      "",
      "Credentials:",
      ...(passport.credentials.length > 0
        ? passport.credentials.map((c) => `  • ${c.name}`)
        : ["  • None yet"]),
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = lines.join("\n");
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [passport]);

  if (isLoading) {
    return <Loading text={t("common.loading")} />;
  }

  if (!passport) {
    return (
      <EmptyState
        title={t("passport.noPassportData")}
        description={t("passport.noPassportDesc")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* User header with share button */}
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl overflow-hidden">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={passport.user}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <QuestScrollIcon name="knowledge" size={32} />
          )}
        </div>
        <h3 className="text-lg font-bold">{passport.user}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("passport.subtitleTag")}
        </p>

        {/* Share button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-4 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-text-bottom"><path d="M20 6L9 17l-5-5" /></svg>
                {t("passport.copied")}
              </>
            ) : (
              <>
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                {t("passport.copyPassport")}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Radar overview */}
      {aggregateScores && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h4 className="text-sm font-semibold mb-3 text-center">
            {t("passport.radarChart")}
          </h4>
          <div className="flex justify-center">
            <RadarChart scores={aggregateScores} size={200} />
          </div>
        </div>
      )}

      {/* Skills section */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><rect x="7" y="13" width="3" height="5" /><rect x="12" y="9" width="3" height="9" /><rect x="17" y="5" width="3" height="13" /></svg> {t("passport.skills")} ({passport.skills.length})
        </h4>
        {passport.skills.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {t("skills.noSkills")}
          </p>
        ) : (
          <div className="space-y-2">
            {passport.skills.map((skill, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5 transition-all hover:bg-secondary"
              >
                <span className="text-sm font-medium">{skillDisplayName(skill.name, undefined, locale)}</span>
                <div className="flex items-center gap-3">
                  {/* Mini score bar */}
                  <div className="hidden sm:block h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                    {skill.rank}
                  </span>
                  <span className="text-sm font-mono font-bold text-primary tabular-nums min-w-[2rem] text-right">
                    {skill.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credentials section */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <QuestScrollIcon name="star" size={16} /> {t("passport.credentials")} ({passport.credentials.length})
        </h4>
        {passport.credentials.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {t("passport.earnCredentialsHint")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {passport.credentials.map((cred, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-all hover:bg-success/20"
              >
                <QuestScrollIcon name="star" size={12} className="inline-block align-text-bottom" /> {cred.name}
              </span>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
