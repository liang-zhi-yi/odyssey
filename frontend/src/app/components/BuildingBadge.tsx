"use client";

import useSWR from "swr";
import Link from "next/link";
import { worldService } from "@/services/world.service";
import { useLocale } from "@/hooks/useLocale";

interface BuildingBadgeProps {
  skillId: string;
  /** If provided, skip the SWR fetch and use cached world data */
  worldBuildings?: { template: { skill_id: string; name: string; name_en: string | null; icon: string } | null; level: number }[];
  className?: string;
}

/**
 * Reusable badge showing the world building associated with a skill.
 * Fetches world state via SWR (deduplicated across instances) unless
 * `worldBuildings` is passed from a parent that already has the data.
 */
export function BuildingBadge({ skillId, worldBuildings, className = "" }: BuildingBadgeProps) {
  const { locale } = useLocale();

  const { data: world } = useSWR(
    !worldBuildings ? "world" : null,
    () => worldService.getWorld().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const buildings = worldBuildings ?? world?.buildings ?? [];
  const building = buildings.find(
    (b) => b.template?.skill_id === skillId
  );

  if (!building || !building.template) return null;

  const displayName =
    locale === "en" && building.template.name_en
      ? building.template.name_en
      : building.template.name;

  return (
    <Link
      href="/world"
      className={`inline-flex items-center gap-1 rounded-md bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${className}`}
      title={`${displayName} Lv.${building.level}`}
    >
      <span className="text-xs leading-none">{building.template.icon || "🏛️"}</span>
      <span className="truncate max-w-[6rem]">{displayName}</span>
      <span className="tabular-nums text-foreground/70">Lv.{building.level}</span>
    </Link>
  );
}
