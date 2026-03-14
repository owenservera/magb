# Z.ai SDK Setup for magB POC

## Quick Setup

### 1. Install the Z.ai SDK

```bash
pip install zai-sdk
```

### 2. Set Environment Variable

```bash
# Linux/macOS
export ZAI_API_KEY="your-api-key-here"

# Windows (Command Prompt)
set ZAI_API_KEY=your-api-key-here

# Windows (PowerShell)
$env:ZAI_API_KEY="your-api-key-here"
```

Or create a `.env` file in the project root:

```bash
# .env file
ZAI_API_KEY=562a13161ad24059a38448a8ef16a9b2.uZ1yG7EriYKtpcmH
```

### 3. Test the Connection

```python
#!/usr/bin/env python3
"""Test Z.ai SDK connection."""

import os
from zai import ZaiClient

def test_connection():
    # Initialize with API key from environment
    api_key = os.getenv("ZAI_API_KEY")
    
    if not api_key:
        print("ERROR: ZAI_API_KEY not set!")
        print("Run: export ZAI_API_KEY='your-key-here'")
        return False
    
    client = ZaiClient(api_key=api_key)
    
    # Test with glm-4.7-flash
    response = client.chat.completions.create(
        model="glm-4.7-flash",
        messages=[
            {"role": "user", "content": "Say 'Hello from Z.ai!' in exactly 3 words."}
        ],
        max_tokens=50
    )
    
    print(f"✅ Connection successful!")
    print(f"Model: glm-4.7-flash")
    print(f"Response: {response.choices[0].message.content}")
    
    if response.usage:
        print(f"Tokens used: {response.usage.total_tokens}")
    
    return True

if __name__ == "__main__":
    test_connection()
```

## Available Models

| Model | Description | Best For |
|-------|-------------|----------|
| `glm-4.7-flash` | Fast, efficient (30B MoE) | POC, high-volume tasks |
| `glm-4.7` | Standard GLM-4.7 | Balanced performance |
| `glm-4.5-air` | Lightweight | Simple tasks |
| `glm-5` | Latest flagship | Complex reasoning |

## magB POC Integration

### Direct Usage in Code

```python
from zai import ZaiClient
import os

# Initialize for magB POC
class MagB_LLM:
    def __init__(self):
        self.api_key = os.getenv("ZAI_API_KEY")
        self.client = ZaiClient(api_key=self.api_key)
        self.model = "glm-4.7-flash"  # Fast for POC
    
    def generate(self, prompt: str, system_prompt: str = None) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=4096
        )
        
        return response.choices[0].message.content
    
    def generate_json(self, prompt: str, schema: dict = None) -> dict:
        """Generate JSON output matching a schema."""
        import json
        
        messages = [
            {"role": "user", "content": f"{prompt}\n\nRespond with valid JSON only."}
        ]
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.3,
            max_tokens=4096,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)


# Usage
llm = MagB_LLM()

# Simple text generation
result = llm.generate(
    prompt="Explain what a Python list comprehension is in one sentence.",
    system_prompt="You are a programming expert."
)
print(result)

# JSON generation
json_result = llm.generate_json(
    prompt="List 3 Python data structures with one-line descriptions."
)
print(json_result)
```

### Configuration in config/poc.yaml

```yaml
llm:
  provider: "zai"
  api_key: "${ZAI_API_KEY}"
  model: "glm-4.7-flash"
  
  # Rate limiting
  rate_limit:
    requests_per_minute: 60
    tokens_per_minute: 150000
  
  # Budget
  budget:
    max_total_usd: 100.00
    warn_at_usd: 75.00
```

## Error Handling

```python
import zai
from zai import ZaiClient

def robust_llm_call(prompt: str):
    """Error handling example."""
    client = ZaiClient(api_key=os.getenv("ZAI_API_KEY"))
    
    try:
        response = client.chat.completions.create(
            model="glm-4.7-flash",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
        
    except zai.core.APIStatusError as e:
        print(f"API Error ({e.status_code}): {e.message}")
        return None
    except zai.core.APITimeoutError as e:
        print(f"Timeout: {e}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None
```

## Streaming (for progress feedback)

```python
from zai import ZaiClient

client = ZaiClient(api_key=os.getenv("ZAI_API_KEY"))

response = client.chat.completions.create(
    model="glm-4.7-flash",
    messages=[{"role": "user", "content": "Write a short poem about code."}],
    stream=True
)

print("Streaming response:")
for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
print()
```

## Troubleshooting

### Common Issues

1. **"API key not valid"**
   - Check your API key at https://z.ai/model-api
   - Ensure the key has not expired

2. **"Model not found"**
   - Verify model name: `glm-4.7-flash` (not `glm-4-flash`)
   - Check available models in your plan

3. **"Rate limit exceeded"**
   - Wait before retrying
   - Check your plan's rate limits

4. **"Insufficient quota"**
   - Check your GLM Coding Plan balance
   - Top up at https://z.ai/billing
