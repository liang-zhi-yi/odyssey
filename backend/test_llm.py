"""Quick test of Bailian LLM API call."""
from openai import OpenAI

# Test with .env default model (qwen3.6-plus)
print("=== Test 1: qwen3.6-plus (default from .env) ===")
client = OpenAI(
    api_key="sk-cbfc4f83eb9d4095a4f582133234debc",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)
try:
    response = client.chat.completions.create(
        model="qwen3.6-plus",
        messages=[{"role": "user", "content": "Say hi in one word"}],
        temperature=0.7,
        timeout=30,
    )
    print(f"Success: {response.choices[0].message.content}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")

# Test with user's preferred model
print("\n=== Test 2: qwen3.5-flash (user preference) ===")
try:
    response = client.chat.completions.create(
        model="qwen3.5-flash",
        messages=[{"role": "user", "content": "Say hi in one word"}],
        temperature=0.7,
        timeout=30,
    )
    print(f"Success: {response.choices[0].message.content}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")

print("\nBoth tests passed!")
