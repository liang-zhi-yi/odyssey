/**
 * 技能名中英映射 — 后端技能 name/name_en 均为英文，中文界面下需显示中文名。
 * 集中在此维护，避免各组件各自硬编码。
 */

/** 英文技能名 → 中文名 */
const SKILL_NAME_ZH: Record<string, string> = {
  Reading: "阅读",
  Research: "调研",
  Learning: "学习方法",
  Memory: "记忆术",
  "Info Retrieval": "信息检索",
  "Prompt Engineering": "提示词工程",
  RAG: "RAG 检索增强",
  Agent: "智能体",
  LangGraph: "LangGraph 图编排",
  "Workflow Design": "工作流设计",
  Python: "Python 编程",
  Frontend: "前端开发",
  Backend: "后端开发",
  Architecture: "架构设计",
  Automation: "自动化",
  Marketing: "市场营销",
  "Product Strategy": "产品策略",
  Business: "商业思维",
  Sales: "销售",
  "UI Design": "UI 设计",
  "UX Design": "UX 设计",
  Branding: "品牌设计",
  Design: "设计基础",
  Creativity: "创造力",
  Writing: "写作",
  Video: "视频制作",
  Editing: "剪辑",
  Mathematics: "数学",
  Statistics: "统计学",
  Physics: "物理",
  "Research Methodology": "研究方法论",
  English: "英语",
  Translation: "翻译",
  Communication: "沟通表达",
  Health: "健康管理",
  Exercise: "运动健身",
  Nutrition: "营养学",
  Finance: "金融理财",
  Economics: "经济学",
  Investment: "投资",
  Coding: "编程能力",
  Database: "数据库",
  Cloud: "云计算",
  "System Design": "系统设计",
  Leadership: "领导力",
  Management: "管理",
  Organization: "组织能力",
  "Data Analysis": "数据分析",
  "User Research": "用户研究",
  "Design Systems": "设计系统",
  JavaScript: "JavaScript 编程",
  Algorithms: "算法",
  "Technical Writing": "技术写作",
  "Career Planning": "职业规划",
  "Risk Analysis": "风险分析",
  "Public Speaking": "公众演讲",
  "Opportunity Detection": "机会洞察",
};

/**
 * 根据语言返回技能显示名。
 * - 中文模式下优先返回映射的中文名。
 * - 英文模式返回 name_en（若存在）否则 name。
 */
export function skillDisplayName(
  name: string | null | undefined,
  nameEn?: string | null,
  locale?: string
): string {
  const base = name || "";
  if (locale !== "en") {
    return SKILL_NAME_ZH[base] ?? base;
  }
  return nameEn || base;
}