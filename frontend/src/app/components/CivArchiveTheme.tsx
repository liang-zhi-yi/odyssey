"use client";

import type { CSSProperties } from "react";

/* ═══════════════════════════════════════════════════════════════
   文明档案设计系统 — Civilization Archive Design System
   ───────────────────────────────────────────────────────────────
   统一色彩 / SVG 装饰 / 局部样式
   仅用于 Skill Detail / World / History 三个页面
   ═══════════════════════════════════════════════════════════════ */

/* ── 色彩常量 ────────────────────────────────────────────────── */
export const CIV_COLORS = {
  bgMain: "#F7F0E2",
  bgContent: "#FFF9ED",
  bgCard: "#FCF5E7",
  textPrimary: "#33291F",
  textSecondary: "#756957",
  border: "#D8C29A",
  gold: "#B58A45",
  darkRed: "#925E46",
  parchment: "#F7F0E2",
} as const;

/* ── 根据 building 名称/ID 推断 skill_id — 确保每个建筑独特图标 ── */
const ALL_SKILL_IDS = ["AI", "PROGRAMMING", "RESEARCH", "WRITING", "BUSINESS", "PRODUCT", "DESIGN", "SCIENCE", "LANGUAGE", "HEALTH", "FINANCE", "MANAGEMENT", "MEDIA", "CAREER", "FITNESS"] as const;

export function inferSkillId(name: string, id?: string): string {
  const n = name.toLowerCase();
  if (n.includes("ai") || n.includes("人工智能") || n.includes("神经")) return "AI";
  if (n.includes("编程") || n.includes("代码") || n.includes("program")) return "PROGRAMMING";
  if (n.includes("研究") || n.includes("research") || n.includes("探索")) return "RESEARCH";
  if (n.includes("写作") || n.includes("writ") || n.includes("文学")) return "WRITING";
  if (n.includes("商业") || n.includes("busin") || n.includes("贸易")) return "BUSINESS";
  if (n.includes("产品") || n.includes("product")) return "PRODUCT";
  if (n.includes("设计") || n.includes("design") || n.includes("创意")) return "DESIGN";
  if (n.includes("科学") || n.includes("scienc") || n.includes("实验")) return "SCIENCE";
  if (n.includes("语言") || n.includes("langu") || n.includes("翻译")) return "LANGUAGE";
  if (n.includes("健康") || n.includes("health") || n.includes("医疗")) return "HEALTH";
  if (n.includes("金融") || n.includes("financ") || n.includes("经济")) return "FINANCE";
  if (n.includes("管理") || n.includes("manag") || n.includes("运营")) return "MANAGEMENT";
  if (n.includes("媒体") || n.includes("media") || n.includes("传播")) return "MEDIA";
  if (n.includes("职业") || n.includes("career") || n.includes("事业")) return "CAREER";
  if (n.includes("健身") || n.includes("fitn") || n.includes("运动")) return "FITNESS";
  // Fallback: 用名称+ID 的字符 hash 分配独特图标，避免重复
  const seed = id ?? name;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return ALL_SKILL_IDS[Math.abs(hash) % ALL_SKILL_IDS.length];
}

/* ── 铜制分割线 ──────────────────────────────────────────────── */
export function CopperDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${CIV_COLORS.gold}40 50%, transparent)` }} />
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="6" stroke={CIV_COLORS.gold} strokeWidth="0.8" fill="none" opacity="0.4" />
        <circle cx="10" cy="10" r="3" stroke={CIV_COLORS.gold} strokeWidth="0.6" fill="none" opacity="0.3" />
        <path d="M 10 4 L 11 8 L 15 9 L 11 10 L 10 14 L 9 10 L 5 9 L 9 8 Z" fill={CIV_COLORS.gold} opacity="0.35" />
      </svg>
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${CIV_COLORS.gold}40 50%, transparent)` }} />
    </div>
  );
}

/* ── 印章外环 — 石刻印章环 ──────────────────────────────────── */
export function SealRing({ size = 80, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="100" cy="100" r="97" stroke={CIV_COLORS.gold} strokeWidth="0.8" opacity="0.25" />
      <circle cx="100" cy="100" r="92" stroke={CIV_COLORS.gold} strokeWidth="1.2" opacity="0.18" />
      <circle cx="100" cy="100" r="86" stroke={CIV_COLORS.gold} strokeWidth="0.5" opacity="0.12" />
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i * 22.5 * Math.PI) / 180;
        const r2 = (n: number) => Math.round(n * 100) / 100;
        const x1 = r2(100 + Math.cos(a) * 89);
        const y1 = r2(100 + Math.sin(a) * 89);
        const x2 = r2(100 + Math.cos(a) * 94);
        const y2 = r2(100 + Math.sin(a) * 94);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={CIV_COLORS.gold} strokeWidth="0.8" opacity="0.18" />
        );
      })}
    </svg>
  );
}

/* ── 时代专属 SVG 图标 — 石碑/印章风格 ────────────────────── */
export function EraStoneIcon({ era, size = 40, className = "" }: { era: string; size?: number; className?: string }) {
  const color = CIV_COLORS.gold;
  const darkColor = CIV_COLORS.darkRed;
  const stoneStyle: CSSProperties = { filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.08))" };

  switch (era) {
    case "WILDERNESS":
      // 荒野 — 原始石碑 + 帐篷符号
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={stoneStyle} className={className} aria-hidden>
          <path d="M 8 40 L 12 10 L 36 10 L 40 40 Z" stroke={darkColor} strokeWidth="1.5" fill={CIV_COLORS.bgCard} />
          <path d="M 16 40 L 20 20 L 24 28 L 28 20 L 32 40 Z" stroke={color} strokeWidth="1" fill="none" opacity="0.5" />
          <circle cx="24" cy="16" r="1.5" fill={color} opacity="0.6" />
        </svg>
      );
    case "AGRICULTURE":
      // 农耕 — 石碑 + 麦穗
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={stoneStyle} className={className} aria-hidden>
          <path d="M 8 40 L 12 10 L 36 10 L 40 40 Z" stroke={darkColor} strokeWidth="1.5" fill={CIV_COLORS.bgCard} />
          <path d="M 24 16 L 24 34" stroke={color} strokeWidth="1.5" />
          <path d="M 24 20 L 20 18 M 24 20 L 28 18" stroke={color} strokeWidth="1" />
          <path d="M 24 25 L 20 23 M 24 25 L 28 23" stroke={color} strokeWidth="1" />
          <path d="M 24 30 L 20 28 M 24 30 L 28 28" stroke={color} strokeWidth="1" />
        </svg>
      );
    case "ACADEMY":
      // 学院 — 石碑 + 卷轴
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={stoneStyle} className={className} aria-hidden>
          <path d="M 8 40 L 12 10 L 36 10 L 40 40 Z" stroke={darkColor} strokeWidth="1.5" fill={CIV_COLORS.bgCard} />
          <path d="M 16 20 L 32 20 M 16 20 L 16 30 L 32 30 L 32 20" stroke={color} strokeWidth="1.2" fill="none" />
          <path d="M 18 22 L 30 22 M 18 25 L 30 25 M 18 28 L 28 28" stroke={color} strokeWidth="0.6" opacity="0.6" />
        </svg>
      );
    case "INDUSTRY":
      // 工业 — 石碑 + 齿轮
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={stoneStyle} className={className} aria-hidden>
          <path d="M 8 40 L 12 10 L 36 10 L 40 40 Z" stroke={darkColor} strokeWidth="1.5" fill={CIV_COLORS.bgCard} />
          <circle cx="24" cy="24" r="6" stroke={color} strokeWidth="1.2" fill="none" />
          <circle cx="24" cy="24" r="2" fill={color} opacity="0.5" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * 45 * Math.PI) / 180;
            const x = 24 + Math.cos(a) * 8;
            const y = 24 + Math.sin(a) * 8;
            return <line key={i} x1={24 + Math.cos(a) * 6} y1={24 + Math.sin(a) * 6} x2={x} y2={y} stroke={color} strokeWidth="1" />;
          })}
        </svg>
      );
    case "INFORMATION":
      // 信息 — 石碑 + 电波
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={stoneStyle} className={className} aria-hidden>
          <path d="M 8 40 L 12 10 L 36 10 L 40 40 Z" stroke={darkColor} strokeWidth="1.5" fill={CIV_COLORS.bgCard} />
          <circle cx="24" cy="24" r="2" fill={color} />
          <path d="M 24 24 Q 18 18 16 24 Q 18 30 24 24" stroke={color} strokeWidth="1" fill="none" opacity="0.6" />
          <path d="M 24 24 Q 14 14 10 24 Q 14 34 24 24" stroke={color} strokeWidth="0.8" fill="none" opacity="0.4" />
        </svg>
      );
    case "AI":
      // AI — 石碑 + 神经网络
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={stoneStyle} className={className} aria-hidden>
          <path d="M 8 40 L 12 10 L 36 10 L 40 40 Z" stroke={darkColor} strokeWidth="1.5" fill={CIV_COLORS.bgCard} />
          <circle cx="18" cy="20" r="2" stroke={color} strokeWidth="1" fill="none" />
          <circle cx="30" cy="20" r="2" stroke={color} strokeWidth="1" fill="none" />
          <circle cx="24" cy="28" r="2" stroke={color} strokeWidth="1" fill="none" />
          <line x1="18" y1="20" x2="24" y2="28" stroke={color} strokeWidth="0.8" opacity="0.5" />
          <line x1="30" y1="20" x2="24" y2="28" stroke={color} strokeWidth="0.8" opacity="0.5" />
          <line x1="18" y1="20" x2="30" y2="20" stroke={color} strokeWidth="0.6" opacity="0.3" />
        </svg>
      );
    case "INTELLIGENCE":
      // 智能 — 石碑 + 大脑纹样
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={stoneStyle} className={className} aria-hidden>
          <path d="M 8 40 L 12 10 L 36 10 L 40 40 Z" stroke={darkColor} strokeWidth="1.5" fill={CIV_COLORS.bgCard} />
          <path d="M 24 16 C 20 16 18 19 18 22 C 16 22 16 26 18 27 C 18 30 20 32 24 32 C 28 32 30 30 30 27 C 32 26 32 22 30 22 C 30 19 28 16 24 16 Z" stroke={color} strokeWidth="1.2" fill="none" />
          <path d="M 24 16 L 24 32" stroke={color} strokeWidth="0.6" opacity="0.4" />
        </svg>
      );
    case "DIGITAL":
      // 数字文明 — 石碑 + 区块链
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={stoneStyle} className={className} aria-hidden>
          <path d="M 8 40 L 12 10 L 36 10 L 40 40 Z" stroke={darkColor} strokeWidth="1.5" fill={CIV_COLORS.bgCard} />
          <rect x="16" y="18" width="6" height="6" stroke={color} strokeWidth="1" fill="none" />
          <rect x="26" y="18" width="6" height="6" stroke={color} strokeWidth="1" fill="none" />
          <rect x="21" y="27" width="6" height="6" stroke={color} strokeWidth="1" fill="none" />
          <line x1="22" y1="24" x2="24" y2="27" stroke={color} strokeWidth="0.8" opacity="0.5" />
          <line x1="29" y1="24" x2="27" y2="27" stroke={color} strokeWidth="0.8" opacity="0.5" />
        </svg>
      );
    case "FUTURE":
      // 未来 — 石碑 + 星辰
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={stoneStyle} className={className} aria-hidden>
          <path d="M 8 40 L 12 10 L 36 10 L 40 40 Z" stroke={darkColor} strokeWidth="1.5" fill={CIV_COLORS.bgCard} />
          <path d="M 24 15 L 25.5 21 L 31 22 L 26 25 L 27.5 31 L 24 27.5 L 20.5 31 L 22 25 L 17 22 L 22.5 21 Z" stroke={color} strokeWidth="1" fill="none" />
          <circle cx="24" cy="24" r="1" fill={color} opacity="0.5" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={stoneStyle} className={className} aria-hidden>
          <path d="M 8 40 L 12 10 L 36 10 L 40 40 Z" stroke={darkColor} strokeWidth="1.5" fill={CIV_COLORS.bgCard} />
          <circle cx="24" cy="24" r="6" stroke={color} strokeWidth="1.2" fill="none" />
        </svg>
      );
  }
}

/* ── 文明建筑印章 SVG — 圆形印章结构 ──────────────────────── */
export function BuildingSealIcon({ type, size = 56, className = "" }: { type: string; size?: number; className?: string }) {
  const color = CIV_COLORS.gold;
  const dark = CIV_COLORS.darkRed;
  const r = size / 2 - 4;

  // 每个 skill_id 独特纹样 — 禁止重复设计，每个图标有直观语义
  const pattern = type;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      {/* 外环 */}
      <circle cx="32" cy="32" r={r} stroke={color} strokeWidth="1.5" fill={CIV_COLORS.bgCard} opacity="0.9" />
      <circle cx="32" cy="32" r={r - 3} stroke={color} strokeWidth="0.5" fill="none" opacity="0.3" />
      {/* 装饰齿纹 */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const x1 = 32 + Math.cos(a) * (r - 1);
        const y1 = 32 + Math.sin(a) * (r - 1);
        const x2 = 32 + Math.cos(a) * (r - 3);
        const y2 = 32 + Math.sin(a) * (r - 3);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.5" opacity="0.25" />;
      })}

      {/* 中心纹样 — 每个 skill_id 独特设计，禁止重复，多色语义化 */}
      {pattern === "AI" && (
        <>
          <line x1="26" y1="26" x2="38" y2="26" stroke="#7B5EA7" strokeWidth="0.8" opacity="0.5" />
          <line x1="26" y1="26" x2="32" y2="36" stroke="#7B5EA7" strokeWidth="0.8" opacity="0.5" />
          <line x1="38" y1="26" x2="32" y2="36" stroke="#7B5EA7" strokeWidth="0.8" opacity="0.5" />
          <line x1="24" y1="38" x2="32" y2="36" stroke="#7B5EA7" strokeWidth="0.6" opacity="0.35" />
          <line x1="40" y1="38" x2="32" y2="36" stroke="#7B5EA7" strokeWidth="0.6" opacity="0.35" />
          <circle cx="26" cy="26" r="2.8" fill="#7B5EA7" opacity="0.85" />
          <circle cx="38" cy="26" r="2.8" fill="#7B5EA7" opacity="0.7" />
          <circle cx="32" cy="36" r="2.8" fill="#7B5EA7" opacity="0.85" />
          <circle cx="24" cy="38" r="2" fill="#7B5EA7" opacity="0.55" />
          <circle cx="40" cy="38" r="2" fill="#7B5EA7" opacity="0.55" />
          <circle cx="32" cy="32" r="1.3" fill={color} />
        </>
      )}
      {pattern === "PROGRAMMING" && (
        <>
          <path d="M 26 24 L 20 32 L 26 40" stroke="#4A6B8A" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 38 24 L 44 32 L 38 40" stroke="#4A6B8A" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="34" y1="22" x2="30" y2="42" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
      {pattern === "RESEARCH" && (
        <>
          <circle cx="29" cy="29" r="7" stroke={dark} strokeWidth="1.4" fill="none" />
          <line x1="34" y1="34" x2="40" y2="40" stroke={dark} strokeWidth="2" strokeLinecap="round" />
          <path d="M 26 29 Q 29 26 32 29" stroke={color} strokeWidth="0.8" fill="none" opacity="0.7" />
          <circle cx="29" cy="29" r="1.2" fill={color} opacity="0.6" />
        </>
      )}
      {pattern === "WRITING" && (
        <>
          <path d="M 24 38 L 30 26 L 38 22 L 36 30 L 26 40 Z" stroke="#33291F" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
          <path d="M 30 26 L 36 30" stroke="#33291F" strokeWidth="1" />
          <circle cx="24" cy="40" r="2" fill={color} opacity="0.6" />
        </>
      )}
      {pattern === "BUSINESS" && (
        <>
          <line x1="32" y1="22" x2="32" y2="42" stroke={dark} strokeWidth="1.2" />
          <line x1="22" y1="26" x2="42" y2="26" stroke={color} strokeWidth="1.2" />
          <path d="M 18 26 L 22 30 L 18 30 Z M 18 26 L 14 30 L 18 30 Z" fill="none" stroke={dark} strokeWidth="0.9" />
          <path d="M 46 26 L 42 30 L 46 30 Z M 46 26 L 50 30 L 46 30 Z" fill="none" stroke={dark} strokeWidth="0.9" />
          <circle cx="32" cy="22" r="1.5" fill={color} />
        </>
      )}
      {pattern === "PRODUCT" && (
        <>
          <rect x="24" y="32" width="8" height="8" stroke="#B87333" strokeWidth="1.2" fill="none" />
          <rect x="32" y="32" width="8" height="8" stroke="#B87333" strokeWidth="1.2" fill="none" />
          <rect x="28" y="24" width="8" height="8" stroke={dark} strokeWidth="1.2" fill={color} fillOpacity="0.15" />
        </>
      )}
      {pattern === "DESIGN" && (
        <>
          <path d="M 22 38 Q 22 24 36 24 Q 40 24 40 28 Q 40 32 36 32 Q 30 32 30 38" stroke="#C08081" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
          <circle cx="26" cy="30" r="1.2" fill={dark} opacity="0.7" />
          <circle cx="32" cy="28" r="1" fill={color} opacity="0.7" />
          <circle cx="36" cy="30" r="1" fill="#7B5EA7" opacity="0.6" />
          <path d="M 38 36 L 44 42" stroke="#33291F" strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
      {pattern === "SCIENCE" && (
        <>
          <path d="M 28 22 L 28 32 Q 28 36 32 36 Q 36 36 36 32 L 36 22 Z" stroke="#2E8B8B" strokeWidth="1.2" fill="none" />
          <line x1="25" y1="22" x2="39" y2="22" stroke="#2E8B8B" strokeWidth="1.4" />
          <circle cx="31" cy="30" r="1" fill="#2E8B8B" opacity="0.6" />
          <circle cx="34" cy="32" r="0.8" fill="#2E8B8B" opacity="0.4" />
          <ellipse cx="32" cy="24" rx="6" ry="1.5" stroke={color} strokeWidth="0.6" fill="none" opacity="0.5" />
        </>
      )}
      {pattern === "LANGUAGE" && (
        <>
          <path d="M 24 26 L 28 38 L 32 26 L 36 38 L 40 26" stroke="#33291F" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="22" y1="40" x2="42" y2="40" stroke={color} strokeWidth="1" opacity="0.6" />
        </>
      )}
      {pattern === "HEALTH" && (
        <>
          <path d="M 24 32 Q 24 26 28 26 Q 32 26 32 30 Q 32 26 36 26 Q 40 26 40 32 Q 40 38 32 42 Q 24 38 24 32 Z" stroke={dark} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
          <line x1="29" y1="32" x2="35" y2="32" stroke={dark} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="32" y1="29" x2="32" y2="35" stroke={dark} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {pattern === "FINANCE" && (
        <>
          <ellipse cx="30" cy="26" rx="5" ry="2" stroke={color} strokeWidth="1.1" fill={color} fillOpacity="0.2" />
          <ellipse cx="30" cy="30" rx="5" ry="2" stroke={color} strokeWidth="1.1" fill={color} fillOpacity="0.3" />
          <ellipse cx="30" cy="34" rx="5" ry="2" stroke={color} strokeWidth="1.1" fill={color} fillOpacity="0.4" />
          <path d="M 36 40 L 40 36 L 44 32" stroke={dark} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M 44 32 L 40 32 M 44 32 L 44 36" stroke={dark} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {pattern === "MANAGEMENT" && (
        <>
          <circle cx="32" cy="32" r="2.5" fill="#B87333" />
          <circle cx="24" cy="26" r="2" fill="#B87333" opacity="0.75" />
          <circle cx="40" cy="26" r="2" fill="#B87333" opacity="0.75" />
          <circle cx="24" cy="38" r="2" fill="#B87333" opacity="0.75" />
          <circle cx="40" cy="38" r="2" fill="#B87333" opacity="0.75" />
          <line x1="32" y1="32" x2="24" y2="26" stroke="#B87333" strokeWidth="0.8" opacity="0.5" />
          <line x1="32" y1="32" x2="40" y2="26" stroke="#B87333" strokeWidth="0.8" opacity="0.5" />
          <line x1="32" y1="32" x2="24" y2="38" stroke="#B87333" strokeWidth="0.8" opacity="0.5" />
          <line x1="32" y1="32" x2="40" y2="38" stroke="#B87333" strokeWidth="0.8" opacity="0.5" />
        </>
      )}
      {pattern === "MEDIA" && (
        <>
          <circle cx="32" cy="32" r="9" stroke={dark} strokeWidth="1.2" fill="none" />
          <path d="M 29 27 L 37 32 L 29 37 Z" fill={dark} opacity="0.85" />
          <circle cx="24" cy="29" r="0.9" fill={color} opacity="0.6" />
          <circle cx="24" cy="35" r="0.9" fill={color} opacity="0.6" />
          <circle cx="40" cy="29" r="0.9" fill={color} opacity="0.6" />
          <circle cx="40" cy="35" r="0.9" fill={color} opacity="0.6" />
        </>
      )}
      {pattern === "CAREER" && (
        <>
          <path d="M 22 40 L 22 34 L 28 34 L 28 28 L 34 28 L 34 22 L 40 22" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M 40 22 L 44 24 L 40 26 Z" fill={dark} />
          <line x1="22" y1="40" x2="42" y2="40" stroke={dark} strokeWidth="1.2" />
        </>
      )}
      {pattern === "FITNESS" && (
        <>
          <rect x="20" y="28" width="4" height="8" rx="1" fill={dark} />
          <rect x="40" y="28" width="4" height="8" rx="1" fill={dark} />
          <rect x="24" y="30" width="3" height="4" fill={color} opacity="0.7" />
          <rect x="37" y="30" width="3" height="4" fill={color} opacity="0.7" />
          <line x1="27" y1="32" x2="37" y2="32" stroke={dark} strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {pattern === "default" && (
        <>
          <path d="M 32 22 L 34.5 29 L 42 29 L 36 33.5 L 38.5 40.5 L 32 36 L 25.5 40.5 L 28 33.5 L 22 29 L 29.5 29 Z" stroke={color} strokeWidth="1.1" fill={color} fillOpacity="0.15" strokeLinejoin="round" />
          <circle cx="32" cy="32" r="1.5" fill={dark} />
        </>
      )}
    </svg>
  );
}

/* ── 能力纹章 SVG — 替代雷达图的文明印章 ──────────────────── */
export function AbilityEmblem({
  scores,
  size = 300,
  labels,
}: {
  scores: { knowledge: number; reasoning: number; application: number; creation: number };
  size?: number;
  labels?: { knowledge: string; reasoning: string; application: string; creation: string };
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.32;
  const color = CIV_COLORS.gold;
  const dark = CIV_COLORS.darkRed;

  // 4 directions: top(knowledge), right(reasoning), bottom(application), left(creation)
  const dims = [
    { key: "knowledge", angle: -90, score: scores.knowledge, label: labels?.knowledge ?? "知识" },
    { key: "reasoning", angle: 0, score: scores.reasoning, label: labels?.reasoning ?? "推理" },
    { key: "application", angle: 90, score: scores.application, label: labels?.application ?? "应用" },
    { key: "creation", angle: 180, score: scores.creation, label: labels?.creation ?? "创造" },
  ];

  const points = dims.map((d) => {
    const rad = (d.angle * Math.PI) / 180;
    const r = (d.score / 100) * maxR;
    return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r, ...d };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 外环装饰 */}
      <circle cx={cx} cy={cy} r={maxR + 30} stroke={color} strokeWidth="0.5" opacity="0.15" fill="none" />
      <circle cx={cx} cy={cy} r={maxR + 20} stroke={color} strokeWidth="0.8" opacity="0.2" fill="none" strokeDasharray="3 3" />
      <circle cx={cx} cy={cy} r={maxR + 10} stroke={color} strokeWidth="0.5" opacity="0.12" fill="none" />

      {/* 四方向刻度线 */}
      {dims.map((d, i) => {
        const rad = (d.angle * Math.PI) / 180;
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={cx + Math.cos(rad) * (maxR + 25)}
            y2={cy + Math.sin(rad) * (maxR + 25)}
            stroke={color} strokeWidth="0.6" opacity="0.2"
          />
        );
      })}

      {/* 同心圆刻度 */}
      {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <circle key={i} cx={cx} cy={cy} r={maxR * ratio} stroke={color} strokeWidth="0.4" opacity="0.1" fill="none" strokeDasharray="2 4" />
      ))}

      {/* 能力多边形 */}
      <polygon points={polygon} fill={color} fillOpacity="0.08" stroke={dark} strokeWidth="1.5" />

      {/* 能力点 */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={CIV_COLORS.bgCard} stroke={dark} strokeWidth="1.5" />
          <circle cx={p.x} cy={p.y} r="2" fill={color} />
        </g>
      ))}

      {/* 中心标记 */}
      <circle cx={cx} cy={cy} r="12" fill={CIV_COLORS.bgCard} stroke={color} strokeWidth="1.5" />
      <path
        d={`M ${cx} ${cy - 6} L ${cx + 5} ${cy} L ${cx} ${cy + 6} L ${cx - 5} ${cy} Z`}
        fill={color} opacity="0.6"
      />

      {/* 四方向标签 */}
      {dims.map((d, i) => {
        const rad = (d.angle * Math.PI) / 180;
        const labelR = maxR + 38;
        const lx = cx + Math.cos(rad) * labelR;
        const ly = cy + Math.sin(rad) * labelR;
        return (
          <g key={i}>
            <text
              x={lx} y={ly}
              textAnchor="middle" dominantBaseline="middle"
              fill={CIV_COLORS.textPrimary}
              fontSize="12" fontWeight="bold"
              fontFamily='"Noto Serif SC","Source Han Serif SC","Songti SC",serif'
            >
              {d.label}
            </text>
            <text
              x={lx} y={ly + 14}
              textAnchor="middle" dominantBaseline="middle"
              fill={color}
              fontSize="11" fontWeight="bold"
              fontFamily="monospace"
            >
              {d.score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── 羊皮纸纹理背景 ────────────────────────────────────────── */
export function ParchmentBackground({ className = "", opacity = 1 }: { className?: string; opacity?: number }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden
      style={{
        opacity,
        backgroundImage: `
          radial-gradient(${CIV_COLORS.border}30 1px, transparent 1.5px),
          radial-gradient(${CIV_COLORS.gold}15 1px, transparent 1.5px)
        `,
        backgroundSize: "16px 16px, 24px 24px",
        backgroundPosition: "0 0, 8px 8px",
      }}
    />
  );
}

/* ── 文明档案卡 — 统一卡片样式 ─────────────────────────────── */
export function ArchiveCard({
  children,
  className = "",
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "gold" | "bronze";
}) {
  const borderColor =
    variant === "gold" ? CIV_COLORS.gold :
    variant === "bronze" ? CIV_COLORS.darkRed :
    CIV_COLORS.border;

  return (
    <div
      className={`relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg ${className}`}
      style={{
        background: CIV_COLORS.bgCard,
        border: `1.5px solid ${borderColor}`,
      }}
    >
      {children}
    </div>
  );
}

/* ── 局部样式注入 — 仅作用于 civ-archive 类 ────────────────── */
export function CivArchiveStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      .civ-archive-page {
        background-color: ${CIV_COLORS.bgMain};
        min-height: calc(100vh - 3.5rem);
      }
      .civ-archive-page * {
        box-sizing: border-box;
      }
      .civ-archive-card {
        background-color: ${CIV_COLORS.bgCard};
        border: 1.5px solid ${CIV_COLORS.border};
        border-radius: 8px;
        transition: all 250ms ease;
      }
      .civ-archive-card:hover {
        box-shadow: 0 4px 12px ${CIV_COLORS.gold}25;
        border-color: ${CIV_COLORS.gold}80;
        transform: translateY(-1px);
      }
      .civ-archive-card-gold {
        border: 2px solid ${CIV_COLORS.gold};
        background: linear-gradient(135deg, ${CIV_COLORS.bgCard} 0%, ${CIV_COLORS.bgContent} 100%);
      }
      .civ-archive-title {
        font-family: "Noto Serif SC","Source Han Serif SC","Songti SC",serif;
        color: ${CIV_COLORS.textPrimary};
        font-weight: 800;
      }
      .civ-archive-subtitle {
        font-family: "Noto Serif SC","Source Han Serif SC","Songti SC",serif;
        color: ${CIV_COLORS.textSecondary};
      }
      .civ-archive-body {
        font-family: "HarmonyOS Sans","Noto Sans SC","Source Han Sans SC",sans-serif;
        color: ${CIV_COLORS.textPrimary};
      }
      .civ-archive-label {
        font-family: "HarmonyOS Sans","Noto Sans SC","Source Han Sans SC",sans-serif;
        color: ${CIV_COLORS.textSecondary};
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
      }
      .civ-archive-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, ${CIV_COLORS.gold}50 50%, transparent);
      }
      .civ-archive-fade-in {
        animation: civArchiveFadeIn 300ms ease-out;
      }
      @keyframes civArchiveFadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .civ-archive-seal-hover {
        transition: transform 200ms ease;
      }
      .civ-archive-seal-hover:hover {
        transform: scale(1.05);
      }
    ` }} />
  );
}
