"use client";

import { useLocale } from "@/hooks/useLocale";
import { ALL_DOMAINS, type SkillDomain } from "@/types/skill";

interface DomainPickerProps {
  selected: string;
  onChange: (domain: string) => void;
}

export function DomainPicker({ selected, onChange }: DomainPickerProps) {
  const { t, locale } = useLocale();

  const domainOptions: { value: string; label: string }[] = [
    { value: "", label: t("filter.allDomains") },
    ...ALL_DOMAINS.map((d) => ({
      value: d,
      label: t(`domains.${d}`),
    })),
  ];

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {domainOptions.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
