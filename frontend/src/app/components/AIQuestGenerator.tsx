"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import useSWR from "swr";
import { useLocale } from "@/hooks/useLocale";
import { useAgent } from "@/hooks/useAgent";
import { skillService } from "@/services/skill.service";
import { worldService } from "@/services/world.service";
import { questService } from "@/services/quest.service";
import { BuildingSealIcon, inferSkillId } from "./CivArchiveTheme";
import { QuestHallCard } from "./QuestHallCard";
import { QuestScrollIcon } from "./QuestScrollIcon";
import { CivIcon } from "./CivIcon";
import { CIVILIZATION_TYPE_LABELS } from "@/types/world";
import type { Skill } from "@/types/skill";
import type { TechTreeData, TechTreeNode } from "@/types/world";
import type {
  QuestListItem,
  QuestDifficulty,
  QuestType,
  DeliverableType,
} from "@/types/quest";

/* ═══════════════════════════════════════════════════════════════
   AIQuestGenerator — AI 生成今日推荐任务
   ───────────────────────────────────────────────────────────────
   - 调用智能体模型（sendMessageRaw, skip_history=true）生成结构化任务 JSON
   - 将 AI 返回的任务通过 POST /quests 持久化到后端数据库
   - 使用标准 QuestHallCard 展示，点击可跳转到标准任务详情页
   - 不在智能体面板中留下对话记录
   ═══════════════════════════════════════════════════════════════ */

const COUNT_OPTIONS = [1, 2, 3, 4, 5, 6];
const STORAGE_KEY = "odyssey-ai-generated-quest-ids";

const DIFFICULTY_POOL: QuestDifficulty[] = ["LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4"];
const QUEST_TYPE_POOL: QuestType[] = ["KNOWLEDGE", "APPLICATION", "PROJECT", "MASTERY"];
const DELIVERABLE_POOL: DeliverableType[] = ["PROMPT", "ARCHITECTURE", "WORKFLOW", "CODE", "REPORT"];

/** 从智能体返回的文本中提取 JSON 数组 */
function extractQuestJson(raw: string): any[] {
  if (!raw) return [];
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : raw;

  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return [];

  const jsonStr = candidate.slice(start, end + 1);
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeQuestItem).filter(Boolean);
  } catch {
    return [];
  }
}

/** 规范化 LLM 返回的字段，补齐缺失值 */
function normalizeQuestItem(raw: any, idx: number): any | null {
  if (!raw || typeof raw !== "object") return null;

  const difficulty: QuestDifficulty = DIFFICULTY_POOL.includes(raw.difficulty)
    ? raw.difficulty
    : DIFFICULTY_POOL[idx % DIFFICULTY_POOL.length];

  const questType: QuestType = QUEST_TYPE_POOL.includes(raw.quest_type)
    ? raw.quest_type
    : QUEST_TYPE_POOL[idx % QUEST_TYPE_POOL.length];

  const deliverable: DeliverableType = DELIVERABLE_POOL.includes(raw.expected_deliverable)
    ? raw.expected_deliverable
    : DELIVERABLE_POOL[idx % DELIVERABLE_POOL.length];

  const title = String(raw.title || raw.title_zh || "").trim();
  if (!title) return null;

  return {
    title,
    title_en: raw.title_en ? String(raw.title_en) : null,
    description: raw.description ? String(raw.description) : null,
    description_en: raw.description_en ? String(raw.description_en) : null,
    skill_id: String(raw.skill_id ?? ""),
    skill_name: raw.skill_name ? String(raw.skill_name) : null,
    difficulty,
    quest_type: questType,
    expected_deliverable: deliverable,
    associated_building: raw.associated_building ?? null,
    reward_preview: raw.reward_preview ?? null,
  };
}

interface DropdownOption {
  value: string;
  label: string;
}

/** 自定义下拉组件 — 菜单固定向下展开（原生 select 无法控制弹出方向） */
function CivDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  embedIcon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder: string;
  disabled?: boolean;
  embedIcon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={rootRef}>
      <div className="flex items-center gap-2">
        {embedIcon}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="flex-1 rounded-lg border border-[oklch(0.72_0.06_80_/_0.20)] bg-[oklch(0.99_0.003_95_/_0.6)] dark:bg-[oklch(0.22_0.008_85_/_0.6)] px-2.5 py-1.5 text-xs font-civ-serif text-left text-[oklch(0.35_0.02_70)] dark:text-[oklch(0.85_0.04_80)] focus:outline-none focus:border-[oklch(0.7_0.12_85)] focus:ring-2 focus:ring-[oklch(0.7_0.12_85_/_0.15)] disabled:opacity-50 flex items-center justify-between gap-2"
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-[oklch(0.5_0.03_75)] transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6l6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 max-h-52 overflow-y-auto rounded-lg border border-[oklch(0.72_0.06_80_/_0.20)] bg-[oklch(0.995_0.004_95)] dark:bg-[oklch(0.24_0.01_85)] shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`block w-full px-2.5 py-1.5 text-left text-xs font-civ-serif transition-colors ${
                o.value === value
                  ? "bg-[oklch(0.60_0.08_145_/_0.12)] text-[oklch(0.40_0.08_145)] dark:text-[oklch(0.72_0.09_145)]"
                  : "text-[oklch(0.35_0.02_70)] dark:text-[oklch(0.85_0.04_80)] hover:bg-[oklch(0.92_0.02_80_/_0.4)] dark:hover:bg-[oklch(0.22_0.012_78_/_0.35)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AIQuestGenerator() {
  const { locale } = useLocale();
  const { sendMessageRaw } = useAgent();
  const [count, setCount] = useState(3);
  const [civType, setCivType] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [createdQuests, setCreatedQuests] = useState<QuestListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        if (Array.isArray(ids) && ids.length > 0) {
          // Fetch the created quests by their IDs
          Promise.all(
            ids.map((id) => questService.getQuestDetail(id).catch(() => null))
          ).then((details) => {
            const valid = details.filter(Boolean) as QuestListItem[];
            if (valid.length > 0) {
              setCreatedQuests(valid);
              setHasGenerated(true);
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Data fetching
  const { data: allSkills = [] } = useSWR<Skill[]>(
    "ai-gen-skills",
    () => skillService.listSkills().catch(() => [] as Skill[]),
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const { data: techTreeData } = useSWR<TechTreeData | null>(
    "ai-gen-tech-tree",
    () => worldService.getTechTree().catch(() => null),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Building options from tech tree (all civilization buildings, same as world tech tree page)
  const buildingOptions = useMemo(() => {
    if (!techTreeData) return [];
    const all: TechTreeNode[] = [
      ...(techTreeData.regular_nodes ?? []),
      ...(techTreeData.compound_nodes ?? []),
    ];
    return all
      .filter((n) => n.name)
      .map((n) => ({
        id: n.id ?? "",
        name: n.name ?? "",
        name_en: n.name_en ?? null,
        icon: n.icon ?? "🏛",
        node_type: n.node_type,
        status: n.status,
      }));
  }, [techTreeData]);

  // Selected building info for icon display
  const selectedBuilding = useMemo(() => {
    if (!buildingFilter) return null;
    return buildingOptions.find((b) => b.id === buildingFilter) ?? null;
  }, [buildingFilter, buildingOptions]);

  const selectedBuildingSkillId = useMemo(() => {
    if (!selectedBuilding) return null;
    return inferSkillId(selectedBuilding.name, selectedBuilding.id);
  }, [selectedBuilding]);

  const filteredSkills = useMemo(() => {
    if (!civType) return allSkills;
    return allSkills;
  }, [allSkills, civType]);

  // Generate quests
  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setHasGenerated(true);

    try {
      const civLabel = civType
        ? (locale === "en"
            ? CIVILIZATION_TYPE_LABELS[civType as keyof typeof CIVILIZATION_TYPE_LABELS]?.en
            : CIVILIZATION_TYPE_LABELS[civType as keyof typeof CIVILIZATION_TYPE_LABELS]?.zh) ?? civType
        : (locale === "zh" ? "不限" : "Any");

      const buildingLabel = buildingFilter
        ? buildingOptions.find((b) => b.id === buildingFilter)?.name ?? buildingFilter
        : (locale === "zh" ? "不限" : "Any");

      const skillLabel = skillFilter
        ? allSkills.find((s) => s.id === skillFilter)?.name ?? skillFilter
        : (locale === "zh" ? "不限" : "Any");

      const prompt = locale === "zh"
        ? `请为奥德赛文明成长平台生成 ${count} 个今日推荐任务。要求：
1. 文明类型：${civLabel}
2. 关联文明建筑：${buildingLabel}
3. 关联技能：${skillLabel}
4. 任务内容要贴合所选文明类型与技能方向，具有真实可执行性
5. 每个任务必须包含完整字段：title, title_en, description, description_en, skill_id, skill_name, difficulty(LEVEL_1~LEVEL_4), quest_type(KNOWLEDGE/APPLICATION/PROJECT/MASTERY), expected_deliverable(PROMPT/ARCHITECTURE/WORKFLOW/CODE/REPORT), associated_building(含 id,name,name_en,icon,current_level), reward_preview(含 knowledge,reasoning,application,creation,building_exp,civilization_contribution)
6. 奖励数值合理，难度递进
7. skill_id 必须是真实的技能UUID，如果不确定则留空字符串
请仅返回 JSON 数组，不要包含任何解释文字，使用 \`\`\`json 代码块包裹。`
        : `Generate ${count} today's recommended quests for the Odyssey civilization growth platform. Requirements:
1. Civilization type: ${civLabel}
2. Related building: ${buildingLabel}
3. Related skill: ${skillLabel}
4. Quests should fit the selected civilization and skill direction, practically actionable
5. Each quest must include full fields: title, title_en, description, description_en, skill_id, skill_name, difficulty(LEVEL_1~LEVEL_4), quest_type(KNOWLEDGE/APPLICATION/PROJECT/MASTERY), expected_deliverable(PROMPT/ARCHITECTURE/WORKFLOW/CODE/REPORT), associated_building(id,name,name_en,icon,current_level), reward_preview(knowledge,reasoning,application,creation,building_exp,civilization_contribution)
6. Reasonable reward values, progressive difficulty
7. skill_id must be a real skill UUID, leave empty string if unsure
Return ONLY a JSON array, no explanation, wrapped in a \`\`\`json code block.`;

      // Use sendMessageRaw — does NOT create a conversation in the agent sidebar
      const content = await sendMessageRaw(prompt, locale);
      const rawQuests = extractQuestJson(content);

      if (rawQuests.length === 0) {
        setError(locale === "zh"
          ? "AI 未能生成有效任务，请重试或调整参数"
          : "AI failed to generate valid quests, please retry or adjust parameters");
        setCreatedQuests([]);
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        // Resolve skill_id: if AI didn't provide one, use the selected skill or a default
        const fallbackSkillId = skillFilter || (allSkills[0]?.id ?? "");

        // Create each quest in the backend
        const createResults = await Promise.all(
          rawQuests.map(async (rq) => {
            try {
              const sid = rq.skill_id || fallbackSkillId;
              if (!sid) return null;

              const detail = await questService.createQuest({
                title: rq.title,
                title_en: rq.title_en,
                description: rq.description,
                description_en: rq.description_en,
                skill_id: sid,
                difficulty: rq.difficulty,
                quest_type: rq.quest_type,
                expected_deliverable: rq.expected_deliverable,
              });

              return {
                id: detail.id,
                title: detail.title,
                title_en: detail.title_en,
                skill_id: detail.skill_id,
                skill_name: detail.skill_name,
                difficulty: detail.difficulty,
                quest_type: detail.quest_type,
                expected_deliverable: detail.expected_deliverable,
                description: detail.description,
                description_en: detail.description_en,
                associated_building: detail.associated_building,
                reward_preview: detail.reward_preview,
              } as QuestListItem;
            } catch {
              return null;
            }
          })
        );

        const validQuests = createResults.filter(Boolean) as QuestListItem[];
        if (validQuests.length > 0) {
          setCreatedQuests(validQuests);
          // Save quest IDs to sessionStorage for persistence
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(validQuests.map((q) => q.id)));
        } else {
          setError(locale === "zh" ? "任务创建失败，请重试" : "Quest creation failed, please retry");
          setCreatedQuests([]);
        }
      }
    } catch (err: any) {
      setError(err?.message || (locale === "zh" ? "生成失败，请稍后重试" : "Generation failed, please retry"));
      setCreatedQuests([]);
      sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, count, civType, buildingFilter, skillFilter, buildingOptions, allSkills, locale, sendMessageRaw]);

  const handleClear = useCallback(() => {
    setCreatedQuests([]);
    setHasGenerated(false);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const canGenerate = !isGenerating;

  return (
    <div className="space-y-4">
      {/* AI Generation Config Panel */}
      <div className="relative z-10 rounded-xl scroll-fuse ornamental-border overflow-visible">
        <div className="absolute inset-0 parchment-texture pointer-events-none opacity-40" />
        <div className="relative z-10 p-5 space-y-4">
          {/* Title */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-full border border-[oklch(0.65_0.07_75_/_0.30)] bg-gradient-to-br from-[oklch(0.99_0.003_95)] to-[oklch(0.95_0.025_80_/_0.5)] dark:from-[oklch(0.22_0.015_78)] dark:to-[oklch(0.2_0.012_78)] shadow-sm flex-shrink-0">
              <QuestScrollIcon name="sparkle" size={18} className="text-[oklch(0.5_0.10_280)] dark:text-[oklch(0.7_0.12_280)]" strokeWidth={1.4} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-civ-serif text-base font-bold text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.88_0.04_80)] tracking-wide">
                {locale === "zh" ? "AI 生成今日推荐" : "AI Generate Today's Recommendations"}
              </h3>
              <p className="font-civ-serif text-[11px] text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] italic mt-0.5">
                {locale === "zh"
                  ? "由奥德赛智能体按你的偏好即时生成任务卷轴"
                  : "Quest scrolls generated on demand by the Odyssey agent"}
              </p>
            </div>
          </div>

          {/* Config options — overflow-visible to allow dropdown to expand downward */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-visible">
            {/* Count */}
            <div>
              <label className="block text-[10px] font-bold text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.65_0.035_80)] uppercase tracking-wider mb-1.5 font-civ-serif">
                {locale === "zh" ? "生成数量" : "Count"}
              </label>
              <div className="flex gap-1 flex-wrap">
                {COUNT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    disabled={isGenerating}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold font-civ-serif tabular-nums transition-all border disabled:opacity-50 ${
                      count === n
                        ? "border-[oklch(0.60_0.08_145_/_0.35)] bg-[oklch(0.60_0.08_145_/_0.12)] text-[oklch(0.40_0.08_145)] dark:text-[oklch(0.72_0.09_145)]"
                        : "border-[oklch(0.72_0.06_80_/_0.20)] text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] hover:bg-[oklch(0.92_0.02_80_/_0.40)] dark:hover:bg-[oklch(0.22_0.012_78_/_0.35)]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Civilization Type */}
            <div>
              <label className="block text-[10px] font-bold text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.65_0.035_80)] uppercase tracking-wider mb-1.5 font-civ-serif">
                {locale === "zh" ? "文明类型" : "Civilization"}
              </label>
              <select
                value={civType}
                onChange={(e) => setCivType(e.target.value)}
                disabled={isGenerating}
                className="w-full rounded-lg border border-[oklch(0.72_0.06_80_/_0.20)] bg-[oklch(0.99_0.003_95_/_0.6)] dark:bg-[oklch(0.22_0.008_85_/_0.6)] px-2.5 py-1.5 text-xs font-civ-serif text-[oklch(0.35_0.02_70)] dark:text-[oklch(0.85_0.04_80)] focus:outline-none focus:border-[oklch(0.7_0.12_85)] focus:ring-2 focus:ring-[oklch(0.7_0.12_85_/_0.15)] disabled:opacity-50"
              >
                <option value="">{locale === "zh" ? "不限文明" : "Any Civilization"}</option>
                {(Object.entries(CIVILIZATION_TYPE_LABELS) as [string, { zh: string; en: string }][]).map(
                  ([key, label]) => (
                    <option key={key} value={key}>
                      {locale === "en" ? label.en : label.zh}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Associated Building — with SVG icon preview */}
            <div>
              <label className="block text-[10px] font-bold text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.65_0.035_80)] uppercase tracking-wider mb-1.5 font-civ-serif">
                {locale === "zh" ? "关联建筑" : "Building"}
              </label>
              <CivDropdown
                value={buildingFilter}
                onChange={setBuildingFilter}
                disabled={isGenerating || buildingOptions.length === 0}
                placeholder={locale === "zh" ? "不限建筑" : "Any Building"}
                embedIcon={
                  selectedBuilding && selectedBuildingSkillId ? (
                    <div className="flex-shrink-0">
                      <CivIcon
                        type="building"
                        name={selectedBuilding.name}
                        size={28}
                        alt={selectedBuilding.name}
                        fallback={<BuildingSealIcon type={selectedBuildingSkillId} size={28} />}
                      />
                    </div>
                  ) : undefined
                }
                options={[
                  { value: "", label: locale === "zh" ? "不限建筑" : "Any Building" },
                  ...buildingOptions.map((b) => ({
                    value: b.id,
                    label:
                      (locale === "en" && b.name_en ? b.name_en : b.name) +
                      " (" +
                      (b.node_type === "compound"
                        ? locale === "zh"
                          ? "复合"
                          : "Compound"
                        : locale === "zh"
                          ? "基础"
                          : "Basic") +
                      ")",
                  })),
                ]}
              />
            </div>

            {/* Associated Skill */}
            <div>
              <label className="block text-[10px] font-bold text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.65_0.035_80)] uppercase tracking-wider mb-1.5 font-civ-serif">
                {locale === "zh" ? "关联技能" : "Skill"}
              </label>
              <CivDropdown
                value={skillFilter}
                onChange={setSkillFilter}
                disabled={isGenerating || filteredSkills.length === 0}
                placeholder={locale === "zh" ? "不限技能" : "Any Skill"}
                options={[
                  { value: "", label: locale === "zh" ? "不限技能" : "Any Skill" },
                  ...filteredSkills.map((s) => ({
                    value: s.id,
                    label: locale === "en" && s.name_en ? s.name_en : s.name,
                  })),
                ]}
              />
            </div>
          </div>

          {/* 文明智能核心启动入口 — 悬浮式智能核心 */}
          <div className="relative pb-2 pt-1">
            {/* 文明遗迹装饰线 */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 flex items-center gap-2 w-2/3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C9A45C]/40 to-transparent" />
              <span className="w-1 h-1 rotate-45 bg-[#C9A45C]/60 flex-shrink-0" />
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C9A45C]/40 to-transparent" />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              aria-label={locale === "zh" ? "开启今日探索" : "Begin Today's Exploration"}
              className={`group relative mx-auto flex flex-col items-center gap-3 overflow-visible py-4 transition-all duration-300 ${
                canGenerate ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              }`}
            >
              {/* ── 光晕层：缓慢扩散 ── */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none core-halo" />
              {/* 内层能量环 */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full pointer-events-none core-halo-inner" />

              {/* ── 核心主体：玻璃质感 + 细金边框 ── */}
              <div className="relative w-20 h-20 rounded-full border border-[#C9A45C]/60 bg-white/40 dark:bg-white/5 backdrop-blur-md shadow-[0_0_24px_rgba(201,164,92,0.15),inset_0_0_18px_rgba(201,164,92,0.08)] flex items-center justify-center transition-all duration-300 group-hover:bg-white/55 dark:group-hover:bg-white/10 group-hover:shadow-[0_0_40px_rgba(201,164,92,0.35),inset_0_0_26px_rgba(201,164,92,0.18)] group-hover:scale-105">
                {/* 旋转符文环 */}
                <svg className="absolute inset-0 w-full h-full text-[#C9A45C]/50 animate-[spin_20s_linear_infinite]" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 5" />
                  <circle cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 4" opacity="0.6" />
                </svg>
                {/* 核心闪烁图标 — 祭坛火种 */}
                <span className="relative text-[#C9A45C]">
                  {isGenerating ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C9A45C] border-t-transparent" />
                  ) : (
                    <svg width={30} height={30} viewBox="0 0 24 24" fill="none" className="core-flame">
                      {/* 外焰 */}
                      <path className="core-flame-outer" d="M12 2 C 8 6 6 10 8 14 C 9 16 11 17 12 17 C 13 17 15 16 16 14 C 18 10 16 6 12 2 Z"
                        fill="rgba(201,164,92,0.35)" stroke="#C9A45C" strokeWidth="0.9" strokeLinejoin="round" />
                      {/* 内焰 */}
                      <path className="core-flame-inner" d="M12 8 C 10 10 10 12 11 14 C 11.5 15 12.5 15 13 14 C 14 12 14 10 12 8 Z"
                        fill="#E8C87A" stroke="none" />
                      {/* 火星点缀 */}
                      <circle className="core-ember" cx="7" cy="13" r="0.7" fill="#E8C87A" />
                      <circle className="core-ember" cx="17" cy="12" r="0.6" fill="#E8C87A" />
                      <circle className="core-ember" cx="15" cy="16" r="0.5" fill="#E8C87A" />
                    </svg>
                  )}
                </span>
              </div>

              {/* 文案 */}
              <span className={`flex flex-col items-center gap-0.5 transition-colors duration-300 ${canGenerate ? "group-hover:text-[#B8943F]" : ""}`}>
                <span className="font-civ-serif text-base font-bold text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.88_0.04_80)] italic tracking-wide">
                  {isGenerating
                    ? (locale === "zh" ? "智能推演中..." : "Conjuring...")
                    : (locale === "zh" ? "点燃今日灵感" : "Ignite Today's Insight")}
                </span>
                <span className="font-civ-serif text-[10px] text-[#8C7655] dark:text-[oklch(0.62_0.04_80)] italic tracking-wider">
                  {locale === "zh" ? "火种跃动 · 星火燎原" : "Flame dances · sparks spread"}
                </span>
              </span>
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-xs text-destructive font-civ-serif italic">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Generated quest cards — using standard QuestHallCard */}
      {hasGenerated && !isGenerating && createdQuests.length > 0 && (
        <div className="space-y-4 animate-stagger">
          {/* AI imprint divider */}
          <div className="flex items-center gap-3 px-1">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[oklch(0.55_0.10_280_/_0.3)] to-transparent" />
            <button
              onClick={handleClear}
              className="font-civ-serif text-[10px] font-bold tracking-[0.2em] text-[oklch(0.50_0.10_280)] uppercase hover:text-[oklch(0.40_0.10_280)] transition-colors flex items-center gap-1"
            >
              {locale === "zh" ? `AI 即时生成 · ${createdQuests.length} 个任务 · 清除` : `AI Generated · ${createdQuests.length} Quests · Clear`}
            </button>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[oklch(0.55_0.10_280_/_0.3)] to-transparent" />
          </div>

          {/* Quest cards grid — standard QuestHallCard with Link to detail page */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {createdQuests.map((quest) => (
              <QuestHallCard
                key={quest.id}
                quest={quest}
                civType={civType || undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state after generation */}
      {hasGenerated && !isGenerating && createdQuests.length === 0 && !error && (
        <div className="relative z-10 rounded-xl scroll-fuse ornamental-border overflow-hidden">
          <div className="px-6 py-10 text-center">
            <p className="font-civ-serif text-sm text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] italic">
              {locale === "zh" ? "暂无生成结果" : "No generated results"}
            </p>
          </div>
        </div>
      )}

      {/* Initial empty state */}
      {!hasGenerated && (
        <div className="relative z-10 rounded-xl scroll-fuse ornamental-border overflow-hidden">
          <div className="px-6 py-12 sm:py-14 text-center">
            <h3 className="font-civ-serif text-base font-bold text-[oklch(0.30_0.025_70)] dark:text-[oklch(0.88_0.04_80)] mb-2 tracking-wide">
              {locale === "zh" ? "今日卷轴由你召唤" : "Summon Today's Scrolls"}
            </h3>
            <p className="font-civ-serif text-xs text-[oklch(0.50_0.03_75)] dark:text-[oklch(0.62_0.04_80)] italic max-w-sm mx-auto leading-relaxed">
              {locale === "zh"
                ? "配置上方参数，让奥德赛智能体为你即时生成符合文明成长路径的任务卷轴。生成的任务可接受、提交、AI评估。"
                : "Configure the options above and let the Odyssey agent conjure quest scrolls tailored to your civilization's growth. Generated quests can be accepted, submitted, and AI-assessed."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
