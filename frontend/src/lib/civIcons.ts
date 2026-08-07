/**
 * 文明图标映射 — 将建筑中文名 / 时代 key / 文明类型 key 映射到
 * public/civ-icons/ 下的透明背景 PNG 图标资产。
 *
 * 资产来源：美术资产/透明背景图标/（已复制并去除 "1" 后缀）。
 * 找不到时返回 null，调用方回退到原有 SVG 图标。
 */

/* ── 文明建筑（55 座）—— 按中文名映射 ─────────────────────── */
const BUILDING_ICONS: Record<string, string> = {
  // 知识文明
  "阅读之塔": "/civ-icons/阅读之塔.png",
  "研究殿堂": "/civ-icons/研究殿堂.png",
  "学习圣殿": "/civ-icons/学习圣殿.png",
  "记忆宫殿": "/civ-icons/记忆宫殿.png",
  "信息灯塔": "/civ-icons/信息灯塔.png",
  // AI文明
  "语言学院": "/civ-icons/语言学院.png",
  "知识殿堂": "/civ-icons/知识殿堂.png",
  "智能体中心": "/civ-icons/智能体中心.png",
  "智能体工坊": "/civ-icons/智能体工坊.png",
  "自动化工坊": "/civ-icons/自动化工坊.png",
  // 工程文明
  "Python工坊": "/civ-icons/Python工坊.png",
  "前端工坊": "/civ-icons/前端工坊.png",
  "后端工坊": "/civ-icons/后端工坊.png",
  "架构圣殿": "/civ-icons/架构圣殿.png",
  "自动化中心": "/civ-icons/自动化中心.png",
  "JavaScript工坊": "/civ-icons/JavaScript工坊.png",
  // 商业文明
  "市场中心": "/civ-icons/市场中心.png",
  "产品中心": "/civ-icons/产品中心.png",
  "商业中心": "/civ-icons/商业中心.png",
  "销售中心": "/civ-icons/销售中心.png",
  // 设计文明
  "UI设计院": "/civ-icons/UI设计院.png",
  "UX研究院": "/civ-icons/UX研究院.png",
  "品牌实验室": "/civ-icons/品牌实验室.png",
  "设计学院": "/civ-icons/设计学院.png",
  "创意中心": "/civ-icons/创意中心.png",
  "用户研究院": "/civ-icons/用户研究院.png",
  "设计系统工坊": "/civ-icons/设计系统工坊.png",
  // 媒体文明
  "写作中心": "/civ-icons/写作中心.png",
  "视频中心": "/civ-icons/视频中心.png",
  "编辑中心": "/civ-icons/编辑中心.png",
  "技术写作中心": "/civ-icons/技术写作中心.png",
  // 科学文明
  "数学圣殿": "/civ-icons/数学圣殿.png",
  "统计中心": "/civ-icons/统计中心.png",
  "物理研究院": "/civ-icons/物理研究院.png",
  "方法论中心": "/civ-icons/方法论中心.png",
  "数据分析中心": "/civ-icons/数据分析中心.png",
  // 语言文明
  "英语学院": "/civ-icons/英语学院.png",
  "翻译中心": "/civ-icons/翻译中心.png",
  "沟通中心": "/civ-icons/沟通中心.png",
  "演讲厅": "/civ-icons/演讲厅.png",
  // 健康文明
  "健康中心": "/civ-icons/健康中心.png",
  "训练中心": "/civ-icons/训练中心.png",
  "营养中心": "/civ-icons/营养中心.png",
  // 金融文明
  "金融中心": "/civ-icons/金融中心.png",
  "经济研究院": "/civ-icons/经济研究院.png",
  "投资中心": "/civ-icons/投资中心.png",
  "风控中心": "/civ-icons/风控中心.png",
  // 数字文明
  "编码中心": "/civ-icons/编码中心.png",
  "数据库中心": "/civ-icons/数据库中心.png",
  "云端中心": "/civ-icons/云端中心.png",
  "系统设计中心": "/civ-icons/系统设计中心.png",
  "算法研究院": "/civ-icons/算法研究院.png",
  // 社会文明
  "领导力中心": "/civ-icons/领导力中心.png",
  "管理中心": "/civ-icons/管理中心.png",
  "组织中心": "/civ-icons/组织中心.png",
  "职业发展中心": "/civ-icons/职业发展中心.png",
};

/* ── 文明时代（9 个）—— 按时代 key 映射 ───────────────────── */
const ERA_ICONS: Record<string, string> = {
  WILDERNESS: "/civ-icons/荒野时代.png",
  AGRICULTURE: "/civ-icons/农耕时代.png",
  ACADEMY: "/civ-icons/学院时代.png",
  INDUSTRY: "/civ-icons/工业时代.png",
  INFORMATION: "/civ-icons/信息时代.png",
  AI: "/civ-icons/AI时代.png",
  INTELLIGENCE: "/civ-icons/智能时代.png",
  DIGITAL: "/civ-icons/数字文明时代.png",
  FUTURE: "/civ-icons/未来文明时代.png",
};

/* ── 文明类型（12 种）—— 按类型 key 映射 ──────────────────── */
const TYPE_ICONS: Record<string, string> = {
  KNOWLEDGE: "/civ-icons/知识文明.png",
  ENGINEERING: "/civ-icons/工程文明.png",
  AI: "/civ-icons/AI文明.png",
  BUSINESS: "/civ-icons/商业文明.png",
  DESIGN: "/civ-icons/设计文明.png",
  MEDIA: "/civ-icons/媒体文明.png",
  SCIENCE: "/civ-icons/科学文明.png",
  LANGUAGE: "/civ-icons/语言文明.png",
  HEALTH: "/civ-icons/健康文明.png",
  FINANCE: "/civ-icons/金融文明.png",
  DIGITAL: "/civ-icons/数字文明.png",
  SOCIETY: "/civ-icons/社会文明.png",
};

/* 文明分组 key（skills/civilization/[key] 路由）→ 类型 key 别名 */
const TYPE_KEY_ALIASES: Record<string, string> = {
  ai: "AI",
  engineering: "ENGINEERING",
  knowledge: "KNOWLEDGE",
  business: "BUSINESS",
  design: "DESIGN",
  media: "MEDIA",
  science: "SCIENCE",
  language: "LANGUAGE",
  health: "HEALTH",
  finance: "FINANCE",
  digital: "DIGITAL",
  society: "SOCIETY",
};

export type CivIconType = "building" | "era" | "type";

/** 解析任意图标类型 + key 到 PNG 路径；找不到返回 null。 */
export function getCivIconPath(
  type: CivIconType,
  key?: string | null
): string | null {
  if (!key) return null;
  switch (type) {
    case "building":
      return BUILDING_ICONS[key] ?? null;
    case "era":
      return ERA_ICONS[key] ?? null;
    case "type": {
      const resolved = TYPE_KEY_ALIASES[key] ?? key;
      return TYPE_ICONS[resolved] ?? null;
    }
    default:
      return null;
  }
}