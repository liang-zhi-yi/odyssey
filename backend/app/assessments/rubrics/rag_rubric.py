"""
RAG (Retrieval-Augmented Generation) rubric.

Per-rank, per-dimension evaluation criteria.
"""

RAG_RUBRIC = {
    "skill": "RAG",
    "dimensions": {
        "knowledge": {
            "label": "Knowledge（知道什么）",
            "description": "掌握 RAG 相关概念、术语和基础知识",
            "ranks": {
                "NOVICE": (
                    "知道什么是 Embedding、Chunk、Vector DB。"
                    "了解 RAG 的基本流程：检索 → 增强 → 生成。"
                ),
                "BEGINNER": (
                    "理解 Chunking 策略（固定长度、语义分割）。"
                    "理解 Embedding 模型的作用和选择依据。"
                    "了解常见 Vector DB（Pinecone、Weaviate、Milvus）的特点。"
                ),
                "PRACTITIONER": (
                    "理解 Rerank 机制的原理和价值。"
                    "理解不同检索策略（稀疏、稠密、混合）的优劣。"
                    "了解 Query Rewrite 和 HyDE 等高级技术。"
                ),
                "ENGINEER": (
                    "深入理解 Hybrid Search 的融合策略（RRF、加权）。"
                    "理解多级检索架构（粗排→精排→重排）。"
                    "了解 GraphRAG、Agentic RAG 等前沿方向。"
                ),
                "ARCHITECT": (
                    "对 RAG 系统有全栈方法论认知。"
                    "能评估不同 RAG 架构在企业场景的适用性。"
                    "理解 RAG 与 Fine-tuning 的互补关系。"
                ),
            },
        },
        "reasoning": {
            "label": "Reasoning（理解为什么）",
            "description": "理解 RAG 设计的底层原理和决策逻辑",
            "ranks": {
                "NOVICE": (
                    "能解释为什么检索能提升生成质量。"
                ),
                "BEGINNER": (
                    "能分析 Chunk 大小对检索效果的影响。"
                    "能解释为什么需要对文档进行预处理。"
                    "能评估不同 Embedding 模型在特定场景的适用性。"
                ),
                "PRACTITIONER": (
                    "能分析 RAG 系统失效的原因（检索遗漏、噪声、上下文过长）。"
                    "能评估 Rerank 在具体场景中的投入产出比。"
                    "能解释 Query Rewrite 何时必要、何时多余。"
                ),
                "ENGINEER": (
                    "能分析复杂 RAG 系统的检索质量和生成质量的权衡。"
                    "能评估 Hybrid Search 融合策略在不同数据集上的表现。"
                    "能设计 RAG 系统的评估指标体系。"
                ),
                "ARCHITECT": (
                    "能从信息检索理论层面分析 RAG 架构。"
                    "能设计 RAG 系统的质量评估框架。"
                    "能预判架构决策对可扩展性和维护性的影响。"
                ),
            },
        },
        "application": {
            "label": "Application（解决问题）",
            "description": "能够将 RAG 知识应用到真实场景",
            "ranks": {
                "NOVICE": (
                    "能搭建一个简单的文档 QA 演示。"
                ),
                "BEGINNER": (
                    "能设计一个简单知识库架构（文档上传→Embedding→检索→生成）。"
                    "能选择合适的 Chunking 策略处理特定文档类型。"
                ),
                "PRACTITIONER": (
                    "能设计学校文档问答系统（含文档上传、Embedding、检索、生成）。"
                    "能优化 Chunk 和 Retrieval 参数提升检索质量。"
                    "能实现基础的 Rerank 流程。"
                ),
                "ENGINEER": (
                    "能设计企业知识库系统（含权限控制、检索优化、结果排序）。"
                    "能实现 Hybrid Search + Query Rewrite 的完整方案。"
                    "能处理多源异构文档的 RAG 场景。"
                ),
                "ARCHITECT": (
                    "能设计大型企业知识管理平台的 RAG 架构。"
                    "能设计多租户、多知识库的 RAG 系统。"
                    "能实现包含缓存、预检索、流式输出的生产级 RAG。"
                ),
            },
        },
        "creation": {
            "label": "Creation（创造能力）",
            "description": "能够设计完整的 RAG 方案、架构或系统",
            "ranks": {
                "NOVICE": (
                    "能仿照教程搭建一个基础 RAG Demo。"
                ),
                "BEGINNER": (
                    "能独立设计一个单文档类型的知识库方案。"
                    "能设计简单的文档处理 Pipeline。"
                ),
                "PRACTITIONER": (
                    "能设计包含评估反馈循环的 RAG 方案。"
                    "能设计多阶段检索 Pipeline（检索→Rerank→过滤→生成）。"
                ),
                "ENGINEER": (
                    "能设计支持实时更新的 RAG 系统架构。"
                    "能设计包含缓存层、Embedding 版本管理的生产级 RAG。"
                    "能设计 RAG + Agent 的混合架构。"
                ),
                "ARCHITECT": (
                    "能设计企业级 RAG 平台架构（多模态、多语言、多知识库）。"
                    "能设计 RAG 系统的监控、告警和持续优化体系。"
                    "能从零设计一套 RAG 最佳实践框架。"
                ),
            },
        },
    },
}
