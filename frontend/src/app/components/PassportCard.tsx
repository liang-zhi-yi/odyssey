"use client";

import type { Passport } from "@/types/passport";
import { Loading } from "./Loading";
import { EmptyState } from "./EmptyState";

interface PassportCardProps {
  passport: Passport | null;
  isLoading: boolean;
}

/**
 * Passport overview card showing user's skills, credentials, and projects.
 */
export function PassportCard({ passport, isLoading }: PassportCardProps) {
  if (isLoading) {
    return <Loading text="Loading passport..." />;
  }

  if (!passport) {
    return (
      <EmptyState
        title="暂无通行证数据"
        description="完成Quest并获得评估后，你的能力通行证将在此生成"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* User header */}
      <div className="rounded-xl border border-border bg-background p-4 text-center">
        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl">
          🧑‍🎓
        </div>
        <h3 className="font-semibold">{passport.user}</h3>
      </div>

      {/* Skills section */}
      <div className="rounded-xl border border-border bg-background p-4">
        <h4 className="text-sm font-semibold mb-3">技能</h4>
        {passport.skills.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无技能数据</p>
        ) : (
          <div className="space-y-2">
            {passport.skills.map((skill, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
              >
                <span className="text-sm font-medium">{skill.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{skill.rank}</span>
                  <span className="text-xs font-mono font-bold text-primary tabular-nums">
                    {skill.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credentials section */}
      <div className="rounded-xl border border-border bg-background p-4">
        <h4 className="text-sm font-semibold mb-3">凭证</h4>
        {passport.credentials.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无凭证</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {passport.credentials.map((cred, i) => (
              <span
                key={i}
                className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success"
              >
                🏅 {cred.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Projects section */}
      <div className="rounded-xl border border-border bg-background p-4">
        <h4 className="text-sm font-semibold mb-3">项目</h4>
        {passport.projects.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无项目</p>
        ) : (
          <div className="space-y-2">
            {passport.projects.map((proj, i) => (
              <div
                key={i}
                className="rounded-lg bg-secondary/50 px-3 py-2 text-sm"
              >
                {proj.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
