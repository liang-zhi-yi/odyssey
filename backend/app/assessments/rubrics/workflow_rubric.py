"""
Workflow / AI Workflow rubric.

Per-rank, per-dimension evaluation criteria.
"""

WORKFLOW_RUBRIC = {
    "skill": "Workflow Design",
    "dimensions": {
        "knowledge": {
            "label": "Knowledge（知道什么）",
            "description": "掌握 Workflow 相关概念、术语和基础知识",
            "ranks": {
                "NOVICE": (
                    "理解 Task、Node、Step 的基本概念。"
                    "知道什么是工作流（Workflow）。"
                ),
                "BEGINNER": (
                    "理解顺序执行、条件分支、循环等控制流。"
                    "了解常见的 Workflow 模式（链式、并行、分支合并）。"
                    "理解 Input/Output 在 Node 之间的传递。"
                ),
                "PRACTITIONER": (
                    "理解状态管理在 Workflow 中的作用。"
                    "了解 Human-in-the-Loop 模式。"
                    "理解 Workflow 与 Agent 的异同。"
                ),
                "ENGINEER": (
                    "深入理解 DAG vs 循环 Workflow 的设计考量。"
                    "理解分布式 Workflow 的状态一致性问题。"
                    "了解 Workflow 编排引擎的底层原理。"
                ),
                "ARCHITECT": (
                    "对企业级 Workflow 系统有全栈理解。"
                    "能评估不同 Workflow 框架（LangGraph、Temporal、Prefect）的适用场景。"
                ),
            },
        },
        "reasoning": {
            "label": "Reasoning（理解为什么）",
            "description": "理解 Workflow 设计的底层原理和决策逻辑",
            "ranks": {
                "NOVICE": (
                    "能解释为什么某些任务需要拆分为多个步骤。"
                ),
                "BEGINNER": (
                    "能分析顺序执行 vs 并行执行的适用场景。"
                    "能解释为什么需要明确的 Input/Output Schema。"
                    "能评估不同控制流结构的优劣。"
                ),
                "PRACTITIONER": (
                    "能分析 Workflow 瓶颈（慢节点、数据依赖、资源竞争）。"
                    "能解释 Human-in-the-Loop 的引入时机和方式。"
                    "能评估状态集中管理 vs 节点间传递的权衡。"
                ),
                "ENGINEER": (
                    "能分析复杂 Workflow 的容错和重试策略。"
                    "能评估同步 vs 异步节点的选择依据。"
                    "能设计 Workflow 的可观测性方案。"
                ),
                "ARCHITECT": (
                    "能从系统层面分析 Workflow 架构的可扩展性。"
                    "能评估单体 Workflow vs 子 Workflow 组合的架构选择。"
                ),
            },
        },
        "application": {
            "label": "Application（解决问题）",
            "description": "能够将 Workflow 知识应用到真实场景",
            "ranks": {
                "NOVICE": (
                    "能设计 3-5 步的简单线性 Workflow。"
                ),
                "BEGINNER": (
                    "能设计日报生成流程（数据收集→分析→格式化→输出）。"
                    "能使用条件分支处理不同的输入情况。"
                ),
                "PRACTITIONER": (
                    "能设计文章创作工作流（Research→Outline→Writing→Review）。"
                    "能实现含 Human-in-the-Loop 的审批 Workflow。"
                    "能处理 Workflow 中的异常和回退。"
                ),
                "ENGINEER": (
                    "能设计多步骤自动审批系统（含条件路由、并行审核、自动升级）。"
                    "能实现含缓存和增量计算的优化 Workflow。"
                    "能设计与外部 API 深度集成的复杂 Workflow。"
                ),
                "ARCHITECT": (
                    "能设计企业级 Agent Workflow（多 Agent 协作、动态路由）。"
                    "能设计支持动态编排的自适应 Workflow 系统。"
                ),
            },
        },
        "creation": {
            "label": "Creation（创造能力）",
            "description": "能够设计完整的 Workflow 方案、架构或系统",
            "ranks": {
                "NOVICE": (
                    "能仿照模板设计一个简单 Workflow。"
                ),
                "BEGINNER": (
                    "能独立设计一个 5-10 节点的业务 Workflow。"
                    "能设计含错误处理的 Workflow 方案。"
                ),
                "PRACTITIONER": (
                    "能设计含并行和条件分支的复杂 Workflow 架构。"
                    "能设计 Workflow 的测试和验证方案。"
                ),
                "ENGINEER": (
                    "能设计可复用的 Workflow 组件库。"
                    "能设计 Workflow 模板系统（参数化、可配置）。"
                    "能设计 Workflow 的监控和告警体系。"
                ),
                "ARCHITECT": (
                    "能设计企业级 Workflow 平台架构。"
                    "能设计多租户、多场景的 Workflow 编排引擎。"
                    "能创建 Workflow 设计规范和治理框架。"
                ),
            },
        },
    },
}
