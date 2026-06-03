"""
LangGraph rubric.

Per-rank, per-dimension evaluation criteria.
"""

LANGGRAPH_RUBRIC = {
    "skill": "LangGraph",
    "dimensions": {
        "knowledge": {
            "label": "Knowledge（知道什么）",
            "description": "掌握 LangGraph 相关概念、术语和基础知识",
            "ranks": {
                "NOVICE": (
                    "了解 Node、Edge、State 的基本概念。"
                    "知道 LangGraph 是一个有状态的图编排框架。"
                ),
                "BEGINNER": (
                    "理解 StateGraph 的构建方式。"
                    "理解 Conditional Edge 和普通 Edge 的区别。"
                    "了解 Node 的函数签名和返回值规范。"
                ),
                "PRACTITIONER": (
                    "理解 Checkpointer 和状态持久化机制。"
                    "了解 Human-in-the-Loop 在 LangGraph 中的实现方式。"
                    "理解 SubGraph 和图的组合方式。"
                ),
                "ENGINEER": (
                    "深入理解 LangGraph 的状态管理和消息传递机制。"
                    "理解 ToolNode 和 Agent 的集成方式。"
                    "了解 Streaming 和中间状态输出的实现。"
                ),
                "ARCHITECT": (
                    "对 LangGraph 的底层设计和实现有深入理解。"
                    "能评估 LangGraph vs 其他编排框架的适用场景。"
                    "理解多 Agent 系统在 LangGraph 中的架构模式。"
                ),
            },
        },
        "reasoning": {
            "label": "Reasoning（理解为什么）",
            "description": "理解 LangGraph 设计的底层原理和决策逻辑",
            "ranks": {
                "NOVICE": (
                    "能解释为什么有状态的图比无状态函数链更强大。"
                ),
                "BEGINNER": (
                    "能分析何时使用 Conditional Edge vs 在 Node 内做判断。"
                    "能解释 State Schema 设计对图可维护性的影响。"
                    "能评估图的复杂度（节点数、边数、循环）与可调试性的关系。"
                ),
                "PRACTITIONER": (
                    "能分析图的循环终止条件是否完备。"
                    "能解释 Checkpointer 的选择如何影响生产部署。"
                    "能评估 Human-in-the-Loop 在不同环节插入的优劣。"
                ),
                "ENGINEER": (
                    "能分析复杂图的性能和内存瓶颈。"
                    "能评估 SubGraph 拆分策略的合理性。"
                    "能设计图的容错和回退机制。"
                ),
                "ARCHITECT": (
                    "能从系统层面分析多 Agent 图架构的设计决策。"
                    "能评估图的可组合性、可测试性和可观测性。"
                ),
            },
        },
        "application": {
            "label": "Application（解决问题）",
            "description": "能够将 LangGraph 知识应用到真实场景",
            "ranks": {
                "NOVICE": (
                    "能构建一个 3-5 节点的简单 StateGraph。"
                ),
                "BEGINNER": (
                    "能设计一个含条件分支的 Graph。"
                    "能使用 ToolNode 集成外部工具。"
                ),
                "PRACTITIONER": (
                    "能设计研究助手 Agent（Research→Summarize→Output）。"
                    "能实现含 Human-in-the-Loop 的审批图。"
                ),
                "ENGINEER": (
                    "能设计多状态 Agent（含状态管理、异常处理、循环节点）。"
                    "能实现含多个 ToolNode 和条件路由的复杂 Agent。"
                    "能使用 SubGraph 组织大型图结构。"
                ),
                "ARCHITECT": (
                    "能设计多 Agent 协作系统（Planner→Executor→Reviewer）。"
                    "能实现动态图编排（根据输入动态构建图结构）。"
                ),
            },
        },
        "creation": {
            "label": "Creation（创造能力）",
            "description": "能够设计完整的 LangGraph 方案、架构或系统",
            "ranks": {
                "NOVICE": (
                    "能仿照示例创建一个简单 StateGraph。"
                ),
                "BEGINNER": (
                    "能独立设计一个含条件路由和工具调用的图。"
                    "能设计合理的 State Schema。"
                ),
                "PRACTITIONER": (
                    "能设计含持久化和人工审批的复杂图架构。"
                    "能设计图的单元测试和集成测试方案。"
                ),
                "ENGINEER": (
                    "能设计可复用的 SubGraph 组件库。"
                    "能设计图的性能监控和调试方案。"
                    "能设计支持动态路由和插件式扩展的图架构。"
                ),
                "ARCHITECT": (
                    "能设计多 Agent 协作平台的整体图架构。"
                    "能创建 LangGraph 设计规范和组件库。"
                    "能设计支持可视化编排的图引擎。"
                ),
            },
        },
    },
}
