"""
Agent module — Odyssey AI growth companion.

Provides:
- Conversation history persistence
- Agent persona and system prompt construction
- Context builder aggregating user data (skills, progress, world, memory)
- Intent routing (progress/skill/world/quest/path queries)
- LLM-powered chat responses via app.core.llm

Architecture: models → schemas → persona → service → router
"""
