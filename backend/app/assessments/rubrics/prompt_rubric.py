"""
Prompt Engineering rubric — per-rank, per-dimension evaluation criteria.

Structured as a flat mapping so the prompt builder can embed
the full rubric inline in every evaluation call.
"""

PROMPT_RUBRIC = {
    "skill": "Prompt Engineering",
    "dimensions": {
        "knowledge": {
            "label": "Knowledge（知道什么）",
            "description": "掌握 Prompt 相关概念、术语和基础知识",
            "ranks": {
                "NOVICE": (
                    "了解什么是 Prompt、Role Prompt、Few-shot。"
                    "能识别基础 Prompt 结构。"
                ),
                "BEGINNER": (
                    "理解 System Prompt vs User Prompt 的区别。"
                    "了解 Chain-of-Thought、Zero-shot vs Few-shot 的概念。"
                    "知道温度、Top-P 等常用参数的含义。"
                ),
                "PRACTITIONER": (
                    "理解 Prompt Template 的设计思路。"
                    "掌握多种 Prompt Pattern（分类、摘要、翻译、问答）。"
                    "了解 Token 限制对 Prompt 设计的影响。"
                ),
                "ENGINEER": (
                    "深入理解 Prompt 注入、上下文窗口管理。"
                    "掌握复杂 Prompt System 设计方法论。"
                    "理解 Embedding + Prompt 的混合检索策略。"
                ),
                "ARCHITECT": (
                    "对 Prompt Engineering 有系统性方法论认知。"
                    "能设计 Prompt 框架、Pattern Library。"
                    "理解多 Agent 之间的 Prompt 交互设计。"
                ),
            },
        },
        "reasoning": {
            "label": "Reasoning（理解为什么）",
            "description": "理解 Prompt 设计的底层原理、设计思路和决策逻辑",
            "ranks": {
                "NOVICE": (
                    "能解释为什么某个 Prompt 有效或无效。"
                ),
                "BEGINNER": (
                    "能分析 Few-shot 示例的选择如何影响输出质量。"
                    "能解释为什么结构化 Prompt 比自由文本效果更好。"
                    "理解上下文长度与输出质量的关系。"
                ),
                "PRACTITIONER": (
                    "能分析 Prompt 失败的根本原因（歧义、缺失约束、Token 浪费）。"
                    "能针对不同模型特性调整 Prompt 策略。"
                    "能解释 RAG 场景下 Prompt 的设计考量。"
                ),
                "ENGINEER": (
                    "能分析复杂 Prompt System 中各组件的交互影响。"
                    "能从认知负荷角度评估 Prompt 设计。"
                    "能评估 Prompt 的鲁棒性和边界条件。"
                ),
                "ARCHITECT": (
                    "能从系统层面分析 Prompt 架构的优劣。"
                    "能建立 Prompt 质量评估体系。"
                    "能预判 Prompt 设计决策对下游任务的影响。"
                ),
            },
        },
        "application": {
            "label": "Application（解决问题）",
            "description": "能够将 Prompt 知识应用到真实场景解决问题",
            "ranks": {
                "NOVICE": (
                    "能写出基础翻译、摘要 Prompt。"
                    "能使用简单的 Role Prompt 完成任务。"
                ),
                "BEGINNER": (
                    "能设计结构化 Prompt（含 Few-shot 示例、输出格式约束）。"
                    "能设计用户评论分类 Prompt。"
                    "能控制输出格式（JSON、Markdown、表格）。"
                ),
                "PRACTITIONER": (
                    "能解决真实业务问题：设计运营反馈分类系统。"
                    "能优化已有 Prompt，提升准确率和稳定性。"
                    "能发现 Prompt 缺陷并提出改进方案。"
                ),
                "ENGINEER": (
                    "能设计复杂 Prompt System（多步骤、条件分支）。"
                    "能设计客服 AI Prompt Framework（情绪安抚+FAQ+意图识别+JSON 输出）。"
                    "能处理长上下文的结构化任务。"
                ),
                "ARCHITECT": (
                    "能设计企业级 Prompt Framework。"
                    "能设计完整 Agent Prompt Layer（Planner + Executor + Reviewer + Memory）。"
                    "能形成可复用 Prompt Pattern 库。"
                ),
            },
        },
        "creation": {
            "label": "Creation（创造能力）",
            "description": "能够设计完整的 Prompt 方案、架构或系统",
            "ranks": {
                "NOVICE": (
                    "能仿照示例创建一个简单 Prompt。"
                ),
                "BEGINNER": (
                    "能独立设计一个含 Few-shot 的结构化 Prompt。"
                    "能设计简单的 Prompt Template。"
                ),
                "PRACTITIONER": (
                    "能设计完整的业务场景 Prompt 方案（含异常处理）。"
                    "能创建可复用的 Prompt 模板。"
                ),
                "ENGINEER": (
                    "能设计多层次的 Prompt System Architecture。"
                    "能设计 Prompt 版本管理和 A/B 测试方案。"
                    "能创建 Prompt 设计规范和最佳实践文档。"
                ),
                "ARCHITECT": (
                    "能设计企业级 Prompt 治理框架。"
                    "能创建跨团队、跨场景的 Prompt Pattern Library。"
                    "能从零设计一套完整的 Agent Prompt Layer。"
                ),
            },
        },
    },
}
