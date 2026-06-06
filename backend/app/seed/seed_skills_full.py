"""
Seed comprehensive skill catalog — ~55 skills across 12 civilization categories.

Matches the design doc at docs/world design.md section 4 (核心技能体系).
Idempotent — checks for existing skills before inserting.
Replaces seed_skills.py + seed_skills_extended.py with a unified catalog.
"""
from sqlalchemy.orm import Session

from app.skills.models import Skill

# All skills organized by civilization type domain
SEED_SKILLS_FULL = [
    # ── 知识文明 (Knowledge) ─────────────────────────────────────────
    {
        "name": "Reading",
        "name_en": "Reading",
        "description": "深度阅读与信息提取能力，高效获取知识并构建个人知识体系。",
        "description_en": "Deep reading and information extraction to efficiently acquire knowledge and build a personal knowledge system.",
        "category": "Knowledge",
        "domain": "RESEARCH",
        "max_score": 100,
    },
    {
        "name": "Research",
        "name_en": "Research",
        "description": "系统性研究方法论，包括文献调研、实验设计和数据分析。",
        "description_en": "Systematic research methodology including literature review, experiment design, and data analysis.",
        "category": "Knowledge",
        "domain": "RESEARCH",
        "max_score": 100,
    },
    {
        "name": "Learning",
        "name_en": "Learning",
        "description": "高效学习方法与元认知能力，掌握费曼技巧、间隔重复等学习策略。",
        "description_en": "Effective learning methods and meta-cognition, mastering Feynman technique, spaced repetition, and other strategies.",
        "category": "Knowledge",
        "domain": "RESEARCH",
        "max_score": 100,
    },
    {
        "name": "Memory",
        "name_en": "Memory",
        "description": "记忆力训练与知识管理系统，构建第二大脑。",
        "description_en": "Memory training and knowledge management systems to build a second brain.",
        "category": "Knowledge",
        "domain": "RESEARCH",
        "max_score": 100,
    },
    {
        "name": "Info Retrieval",
        "name_en": "Info Retrieval",
        "description": "信息检索与筛选能力，在信息洪流中精准定位所需知识。",
        "description_en": "Information retrieval and filtering to precisely locate needed knowledge in the information flood.",
        "category": "Knowledge",
        "domain": "RESEARCH",
        "max_score": 100,
    },
    # ── AI文明 ──────────────────────────────────────────────────────
    {
        "name": "Prompt Engineering",
        "name_en": "Prompt Engineering",
        "description": "设计高质量提示词驱动大语言模型完成复杂任务。",
        "description_en": "Design high-quality prompts to drive LLM task completion.",
        "category": "AI",
        "domain": "AI",
        "max_score": 100,
    },
    {
        "name": "RAG",
        "name_en": "RAG",
        "description": "构建检索增强生成系统，融合向量搜索与知识图谱。",
        "description_en": "Build retrieval-augmented generation systems with chunking, embedding, and vector search.",
        "category": "AI",
        "domain": "AI",
        "max_score": 100,
    },
    {
        "name": "Agent",
        "name_en": "Agent",
        "description": "构建自主智能体系统，实现工具调用、任务规划与自主决策。",
        "description_en": "Build autonomous agent systems with tool calling, task planning, and independent decision-making.",
        "category": "AI",
        "domain": "AI",
        "max_score": 100,
    },
    {
        "name": "LangGraph",
        "name_en": "LangGraph",
        "description": "构建状态驱动的智能体系统，实现自主决策与多Agent协作。",
        "description_en": "Build state-driven agent systems with nodes, edges, and conditional routing.",
        "category": "AI",
        "domain": "AI",
        "max_score": 100,
    },
    {
        "name": "Workflow Design",
        "name_en": "Workflow Design",
        "description": "设计多步骤任务执行工作流，实现复杂流程自动化与Agent编排。",
        "description_en": "Design complex multi-step task execution workflows for automation and agent orchestration.",
        "category": "AI",
        "domain": "AI",
        "max_score": 100,
    },
    # ── 工程文明 (Engineering) ───────────────────────────────────────
    {
        "name": "Python",
        "name_en": "Python",
        "description": "精通Python编程，从基础语法到异步编程与生态系统。",
        "description_en": "Master Python programming from fundamentals to advanced features including async, typing, and ecosystem libraries.",
        "category": "Engineering",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    {
        "name": "Frontend",
        "name_en": "Frontend",
        "description": "构建现代前端应用，掌握React/TypeScript/Tailwind技术栈。",
        "description_en": "Build modern frontend applications with React, TypeScript, and Tailwind CSS.",
        "category": "Engineering",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    {
        "name": "Backend",
        "name_en": "Backend",
        "description": "构建可扩展的后端系统，掌握API设计、数据库和系统架构。",
        "description_en": "Build scalable backend systems with API design, databases, and system architecture.",
        "category": "Engineering",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    {
        "name": "Architecture",
        "name_en": "Architecture",
        "description": "系统架构设计能力，涵盖微服务、分布式系统和云原生架构。",
        "description_en": "System architecture design covering microservices, distributed systems, and cloud-native architecture.",
        "category": "Engineering",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    {
        "name": "Automation",
        "name_en": "Automation",
        "description": "自动化工作流设计与实现，包括CI/CD、脚本化和流程编排。",
        "description_en": "Automation workflow design and implementation including CI/CD, scripting, and process orchestration.",
        "category": "Engineering",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    # ── 商业文明 (Business) ──────────────────────────────────────────
    {
        "name": "Marketing",
        "name_en": "Marketing",
        "description": "市场营销策略，涵盖数字营销、品牌建设和增长黑客。",
        "description_en": "Marketing strategy covering digital marketing, brand building, and growth hacking.",
        "category": "Business",
        "domain": "BUSINESS",
        "max_score": 100,
    },
    {
        "name": "Product Strategy",
        "name_en": "Product Strategy",
        "description": "产品战略与路线图规划，掌握优先级框架和产品市场契合分析。",
        "description_en": "Define product vision, strategy, and roadmap with prioritization frameworks and product-market fit analysis.",
        "category": "Business",
        "domain": "BUSINESS",
        "max_score": 100,
    },
    {
        "name": "Business",
        "name_en": "Business",
        "description": "商业思维与商业模式设计，理解价值创造、捕获和交付的核心逻辑。",
        "description_en": "Business thinking and business model design, understanding the core logic of value creation, capture, and delivery.",
        "category": "Business",
        "domain": "BUSINESS",
        "max_score": 100,
    },
    {
        "name": "Sales",
        "name_en": "Sales",
        "description": "销售能力与客户关系管理，掌握解决方案销售和谈判技巧。",
        "description_en": "Sales skills and customer relationship management, mastering solution selling and negotiation techniques.",
        "category": "Business",
        "domain": "BUSINESS",
        "max_score": 100,
    },
    # ── 设计文明 (Design) ────────────────────────────────────────────
    {
        "name": "UI Design",
        "name_en": "UI Design",
        "description": "创建直观、无障碍、视觉精美的用户界面与设计系统。",
        "description_en": "Create intuitive, accessible, and visually polished user interfaces with design systems.",
        "category": "Design",
        "domain": "DESIGN",
        "max_score": 100,
    },
    {
        "name": "UX Design",
        "name_en": "UX Design",
        "description": "用户体验设计，包括用户研究、信息架构和交互设计。",
        "description_en": "User experience design including user research, information architecture, and interaction design.",
        "category": "Design",
        "domain": "DESIGN",
        "max_score": 100,
    },
    {
        "name": "Branding",
        "name_en": "Branding",
        "description": "品牌战略与视觉识别设计，构建有影响力的品牌体系。",
        "description_en": "Brand strategy and visual identity design to build influential brand systems.",
        "category": "Design",
        "domain": "DESIGN",
        "max_score": 100,
    },
    {
        "name": "Design",
        "name_en": "Design",
        "description": "通用设计思维与方法论，包括设计原则、色彩理论和排版。",
        "description_en": "General design thinking and methodology including design principles, color theory, and typography.",
        "category": "Design",
        "domain": "DESIGN",
        "max_score": 100,
    },
    {
        "name": "Creativity",
        "name_en": "Creativity",
        "description": "创造性思维与创新方法论，包括设计思维和头脑风暴技巧。",
        "description_en": "Creative thinking and innovation methodology including design thinking and brainstorming techniques.",
        "category": "Design",
        "domain": "DESIGN",
        "max_score": 100,
    },
    # ── 媒体文明 (Media) ─────────────────────────────────────────────
    {
        "name": "Writing",
        "name_en": "Writing",
        "description": "写作与内容创作能力，包括技术写作、创意写作和商业写作。",
        "description_en": "Writing and content creation including technical writing, creative writing, and business writing.",
        "category": "Media",
        "domain": "MEDIA",
        "max_score": 100,
    },
    {
        "name": "Video",
        "name_en": "Video",
        "description": "视频制作与编辑能力，包括脚本撰写、拍摄和后期制作。",
        "description_en": "Video production and editing including scripting, filming, and post-production.",
        "category": "Media",
        "domain": "MEDIA",
        "max_score": 100,
    },
    {
        "name": "Editing",
        "name_en": "Editing",
        "description": "内容编辑与审校能力，确保内容质量和一致性。",
        "description_en": "Content editing and proofreading to ensure content quality and consistency.",
        "category": "Media",
        "domain": "MEDIA",
        "max_score": 100,
    },
    # ── 科学文明 (Science) ───────────────────────────────────────────
    {
        "name": "Mathematics",
        "name_en": "Mathematics",
        "description": "数学基础能力，包括线性代数、概率论和优化理论。",
        "description_en": "Foundational mathematics including linear algebra, probability theory, and optimization.",
        "category": "Science",
        "domain": "SCIENCE",
        "max_score": 100,
    },
    {
        "name": "Statistics",
        "name_en": "Statistics",
        "description": "统计分析与数据推理，掌握假设检验、回归分析和贝叶斯方法。",
        "description_en": "Statistical analysis and data inference, mastering hypothesis testing, regression analysis, and Bayesian methods.",
        "category": "Science",
        "domain": "SCIENCE",
        "max_score": 100,
    },
    {
        "name": "Physics",
        "name_en": "Physics",
        "description": "物理学基础与工程物理，理解力学、电磁学和量子力学核心概念。",
        "description_en": "Foundations of physics and engineering physics, understanding core concepts of mechanics, electromagnetism, and quantum mechanics.",
        "category": "Science",
        "domain": "SCIENCE",
        "max_score": 100,
    },
    {
        "name": "Research Methodology",
        "name_en": "Research Methodology",
        "description": "科学研究方法论，包括实验设计、数据收集和学术写作。",
        "description_en": "Scientific research methodology including experiment design, data collection, and academic writing.",
        "category": "Science",
        "domain": "SCIENCE",
        "max_score": 100,
    },
    # ── 语言文明 (Language) ──────────────────────────────────────────
    {
        "name": "English",
        "name_en": "English",
        "description": "英语综合能力，包括听说读写和专业英语应用。",
        "description_en": "Comprehensive English ability including listening, speaking, reading, writing, and professional English.",
        "category": "Language",
        "domain": "LANGUAGE",
        "max_score": 100,
    },
    {
        "name": "Translation",
        "name_en": "Translation",
        "description": "翻译与跨语言沟通能力，涵盖专业翻译和本地化。",
        "description_en": "Translation and cross-language communication covering professional translation and localization.",
        "category": "Language",
        "domain": "LANGUAGE",
        "max_score": 100,
    },
    {
        "name": "Communication",
        "name_en": "Communication",
        "description": "沟通与表达能力，包括演讲、谈判和跨文化沟通。",
        "description_en": "Communication and expression skills including public speaking, negotiation, and cross-cultural communication.",
        "category": "Language",
        "domain": "LANGUAGE",
        "max_score": 100,
    },
    # ── 健康文明 (Health) ────────────────────────────────────────────
    {
        "name": "Health",
        "name_en": "Health",
        "description": "健康管理与生活方式优化，包括营养学、睡眠科学和压力管理。",
        "description_en": "Health management and lifestyle optimization including nutrition, sleep science, and stress management.",
        "category": "Health",
        "domain": "HEALTH",
        "max_score": 100,
    },
    {
        "name": "Exercise",
        "name_en": "Exercise",
        "description": "运动科学与体能训练，制定科学的运动和恢复计划。",
        "description_en": "Exercise science and physical training to develop scientific exercise and recovery plans.",
        "category": "Health",
        "domain": "HEALTH",
        "max_score": 100,
    },
    {
        "name": "Nutrition",
        "name_en": "Nutrition",
        "description": "营养学知识与饮食规划，理解宏量和微量营养素的核心作用。",
        "description_en": "Nutrition knowledge and diet planning, understanding the core roles of macro and micronutrients.",
        "category": "Health",
        "domain": "HEALTH",
        "max_score": 100,
    },
    # ── 金融文明 (Finance) ───────────────────────────────────────────
    {
        "name": "Finance",
        "name_en": "Finance",
        "description": "金融学基础与投资理论，包括资产定价、风险管理和投资组合。",
        "description_en": "Finance fundamentals and investment theory including asset pricing, risk management, and portfolio construction.",
        "category": "Finance",
        "domain": "FINANCE",
        "max_score": 100,
    },
    {
        "name": "Economics",
        "name_en": "Economics",
        "description": "经济学思维与分析，理解宏观经济学和微观经济学的核心原理。",
        "description_en": "Economic thinking and analysis, understanding core principles of macro and micro economics.",
        "category": "Finance",
        "domain": "FINANCE",
        "max_score": 100,
    },
    {
        "name": "Investment",
        "name_en": "Investment",
        "description": "投资分析与决策，掌握价值投资、量化分析和风险对冲策略。",
        "description_en": "Investment analysis and decision-making, mastering value investing, quantitative analysis, and risk hedging strategies.",
        "category": "Finance",
        "domain": "FINANCE",
        "max_score": 100,
    },
    # ── 数字文明 (Digital) ───────────────────────────────────────────
    {
        "name": "Coding",
        "name_en": "Coding",
        "description": "编程与软件开发综合能力，包括算法、数据结构和软件工程实践。",
        "description_en": "Comprehensive programming and software development including algorithms, data structures, and software engineering practices.",
        "category": "Digital",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    {
        "name": "Database",
        "name_en": "Database",
        "description": "数据库设计与优化，涵盖SQL、NoSQL和数据建模。",
        "description_en": "Database design and optimization covering SQL, NoSQL, and data modeling.",
        "category": "Digital",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    {
        "name": "Cloud",
        "name_en": "Cloud",
        "description": "云计算与DevOps，包括容器化、Kubernetes和云服务架构。",
        "description_en": "Cloud computing and DevOps including containerization, Kubernetes, and cloud service architecture.",
        "category": "Digital",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    {
        "name": "System Design",
        "name_en": "System Design",
        "description": "设计可扩展的分布式系统，包括负载均衡、缓存和数据库分片。",
        "description_en": "Design scalable distributed systems with load balancing, caching, and database sharding.",
        "category": "Digital",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    # ── 社会文明 (Society) ───────────────────────────────────────────
    {
        "name": "Leadership",
        "name_en": "Leadership",
        "description": "领导力与团队管理，包括辅导、授权、冲突解决和战略沟通。",
        "description_en": "Leadership and team management including mentoring, delegation, conflict resolution, and strategic communication.",
        "category": "Society",
        "domain": "MANAGEMENT",
        "max_score": 100,
    },
    {
        "name": "Management",
        "name_en": "Management",
        "description": "项目管理与组织协调能力，掌握敏捷、Scrum和OKR方法论。",
        "description_en": "Project management and organizational coordination, mastering Agile, Scrum, and OKR methodologies.",
        "category": "Society",
        "domain": "MANAGEMENT",
        "max_score": 100,
    },
    {
        "name": "Organization",
        "name_en": "Organization",
        "description": "组织设计与制度建设，构建高效协作的团队和组织结构。",
        "description_en": "Organizational design and institution building to construct efficient collaborative team structures.",
        "category": "Society",
        "domain": "MANAGEMENT",
        "max_score": 100,
    },
    # ── Additional cross-domain skills ────────────────────────────────
    {
        "name": "Data Analysis",
        "name_en": "Data Analysis",
        "description": "数据分析与洞察挖掘，掌握统计分析、可视化和探索性分析。",
        "description_en": "Analyze data with statistical methods, visualization, and exploratory analysis to extract actionable insights.",
        "category": "Science",
        "domain": "SCIENCE",
        "max_score": 100,
    },
    {
        "name": "User Research",
        "name_en": "User Research",
        "description": "用户研究与需求分析，通过访谈、测试和数据驱动研究为产品决策提供依据。",
        "description_en": "Conduct user interviews, usability testing, and data-driven research to inform product decisions.",
        "category": "Design",
        "domain": "DESIGN",
        "max_score": 100,
    },
    {
        "name": "Design Systems",
        "name_en": "Design Systems",
        "description": "构建和维护可扩展的设计系统，包括设计Token、组件库和文档。",
        "description_en": "Build and maintain scalable design systems with tokens, components, patterns, and documentation.",
        "category": "Design",
        "domain": "DESIGN",
        "max_score": 100,
    },
    {
        "name": "JavaScript",
        "name_en": "JavaScript",
        "description": "现代JavaScript开发，ES6+、异步模式和模块系统。",
        "description_en": "Build modern JavaScript applications with ES6+, async patterns, and module systems.",
        "category": "Engineering",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    {
        "name": "Algorithms",
        "name_en": "Algorithms",
        "description": "算法分析与实现，包括数据结构和复杂度分析。",
        "description_en": "Analyze and implement fundamental algorithms and data structures with complexity analysis.",
        "category": "Digital",
        "domain": "PROGRAMMING",
        "max_score": 100,
    },
    {
        "name": "Technical Writing",
        "name_en": "Technical Writing",
        "description": "技术文档写作能力，编写清晰的API文档、工程指南和技术博客。",
        "description_en": "Write clear, concise, and well-structured technical documentation, API references, and engineering guides.",
        "category": "Media",
        "domain": "MEDIA",
        "max_score": 100,
    },
    {
        "name": "Career Planning",
        "name_en": "Career Planning",
        "description": "职业规划与发展策略，包括技能映射、机会评估和个人品牌建设。",
        "description_en": "Design and execute a strategic career path with skill mapping, opportunity assessment, and personal brand building.",
        "category": "Society",
        "domain": "CAREER",
        "max_score": 100,
    },
    {
        "name": "Risk Analysis",
        "name_en": "Risk Analysis",
        "description": "风险分析与决策科学，包括金融风险、项目风险和安全风险评估。",
        "description_en": "Risk analysis and decision science including financial risk, project risk, and security risk assessment.",
        "category": "Finance",
        "domain": "FINANCE",
        "max_score": 100,
    },
    {
        "name": "Public Speaking",
        "name_en": "Public Speaking",
        "description": "公众演讲与表达艺术，掌握叙事结构、舞台表现和受众互动技巧。",
        "description_en": "Public speaking and presentation arts, mastering narrative structure, stage presence, and audience engagement.",
        "category": "Language",
        "domain": "LANGUAGE",
        "max_score": 100,
    },
]


def run(db: Session) -> dict[str, str]:
    """Insert all skills. Idempotent — skips existing by name.

    Returns:
        Mapping of skill name → UUID string.
    """
    mapping: dict[str, str] = {}
    for data in SEED_SKILLS_FULL:
        existing = db.query(Skill).filter(Skill.name == data["name"]).first()
        if existing:
            # Update domain if the existing skill was seeded before domain column existed
            if existing.domain == "AI" and data["domain"] != "AI":
                existing.domain = data["domain"]
            if existing.category == "AI" and data["category"] != "AI":
                existing.category = data["category"]
            mapping[data["name"]] = str(existing.id)
            continue
        skill = Skill(**data)
        db.add(skill)
        mapping[data["name"]] = str(skill.id)
    db.commit()
    print(f"  🎓  Seeded {len(mapping)} skills (full catalog)")
    return mapping


__all__ = ["run", "SEED_SKILLS_FULL"]
