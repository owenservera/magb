# AI API Central Context — Standardized API Mapping

## Overview

This document centralizes the AI API call request structure, mapped to common standard AI API methods, tools, and data structures. It provides a **thin hardcoded abstraction layer** that makes it easy to plug in different AI providers via simple mapping.

---

## 1. Core AI API Request Structure

### 1.1 Client Initialization

| Provider | SDK Import | Client Creation |
|----------|-----------|-----------------|
| **Z.AI** | `from zai import ZaiClient` | `ZaiClient(api_key="...")` |
| **OpenAI** | `from openai import OpenAI` | `OpenAI(api_key="...")` |
| **Anthropic** | `from anthropic import Anthropic` | `Anthropic(api_key="...")` |

**Base Configuration Options (Common):**
```python
{
    "api_key": str,              # Required: API authentication key
    "base_url": str,             # Optional: Custom endpoint URL
    "timeout": float,            # Optional: Request timeout in seconds
    "max_retries": int,          # Optional: Number of retry attempts
    "http_client": object,       # Optional: Custom HTTP client instance
}
```

---

## 2. Chat Completions — Standard Method

### 2.1 Request Structure (Universal)

```python
# Universal chat completion request
request = {
    "model": str,                    # Model identifier (e.g., "glm-5", "gpt-4o", "claude-3-opus")
    "messages": list[Message],       # Conversation history
    "temperature": float,            # Sampling temperature (0.0 - 2.0)
    "max_tokens": int,               # Maximum tokens to generate
    "top_p": float,                  # Nucleus sampling (0.0 - 1.0)
    "stream": bool,                  # Enable streaming responses
    "tools": list[Tool],             # Function calling tools
    "tool_choice": str,              # Tool selection strategy ("auto", "none", {"type": "function", ...})
    "stop": list[str],               # Stop sequences
    "presence_penalty": float,      # Presence penalty (-2.0 to 2.0)
    "frequency_penalty": float,      # Frequency penalty (-2.0 to 2.0)
    "user": str,                    # User identifier for tracking
}
```

### 2.2 Messages Structure

```python
# Standard message format across all providers
Message = {
    "role": "system" | "user" | "assistant" | "tool",
    "content": str,
    "name": str,                    # Optional: Speaker name
    "tool_call_id": str,            # Optional: For tool role messages
}

# Example conversation
messages = [
    {"role": "system", "content": "You are a helpful AI assistant."},
    {"role": "user", "content": "What is the weather today?"},
    {"role": "assistant", "content": "Let me check that for you."},
    {"role": "user", "content": "Thank you"},
]
```

### 2.3 Provider-Specific Mapping

| Parameter | Z.AI | OpenAI | Anthropic |
|-----------|------|--------|-----------|
| Model | `glm-5`, `glm-4.7` | `gpt-4o`, `gpt-4o-mini` | `claude-3-opus`, `claude-3-sonnet` |
| Temperature | `temperature` | `temperature` | `temperature` |
| Max Tokens | `max_tokens` | `max_tokens` | `max_tokens` |
| Stream | `stream=True` | `stream=True` | `stream=True` |
| Tools | `tools=[...]` | `tools=[...]` | `tools=[...]` |

---

## 3. Streaming Responses

### 3.1 Universal Streaming Pattern

```python
# Request with streaming
response = client.chat.completions.create(
    model="glm-5",
    messages=[{"role": "user", "content": "Tell me a story"}],
    stream=True
)

# Universal streaming response iteration
for chunk in response:
    if chunk.choices[0].delta.content:
        content = chunk.choices[0].delta.content
        print(content, end="")
```

### 3.2 Stream Chunk Structure

```python
# Universal chunk structure
Chunk = {
    "id": str,                          # Unique completion ID
    "choices": [
        {
            "index": int,
            "delta": {
                "role": str | None,
                "content": str | None,
                "tool_calls": list[ToolCall] | None,
            },
            "finish_reason": str | None,
        }
    ],
    "model": str,
    "usage": Usage | None,
}
```

---

## 4. Function / Tool Calling

### 4.1 Tool Definition Structure

```python
# Universal tool definition
Tool = {
    "type": "function",
    "function": {
        "name": str,                         # Function name (unique)
        "description": str,                   # What the function does
        "parameters": {                       # JSON Schema parameters
            "type": "object",
            "properties": {
                "<param_name>": {
                    "type": "string" | "number" | "integer" | "boolean" | "array" | "object",
                    "description": str,
                    "enum": list,            # Optional: Allowed values
                    "default": any,          # Optional: Default value
                }
            },
            "required": list[str],            # Required parameters
        }
    }
}

# Example: Weather function tool
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get weather information for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City name"
                    },
                    "date": {
                        "type": "string",
                        "description": "Date in YYYY-MM-DD format"
                    }
                },
                "required": ["location"]
            }
        }
    }
]
```

### 4.2 Tool Choice Options

```python
# Automatic selection (default)
tool_choice = "auto"

# Disable function calling
tool_choice = "none"

# Force specific function
tool_choice = {
    "type": "function",
    "function": {
        "name": "get_weather"
    }
}
```

### 4.3 Handling Tool Calls (Universal)

```python
# Check if model requested a tool call
if response.choices[0].message.tool_calls:
    for tool_call in response.choices[0].message.tool_calls:
        function_name = tool_call.function.name
        function_args = json.loads(tool_call.function.arguments)
        
        # Execute the function
        if function_name == "get_weather":
            result = get_weather(**function_args)
        
        # Continue conversation with tool result
        messages.append({
            "role": "tool",
            "content": json.dumps(result),
            "tool_call_id": tool_call.id
        })
```

---

## 5. Specialized AI Capabilities

### 5.1 Web Search Tool (Z.AI Specific)

```python
# Z.AI web search tool
response = client.chat.completions.create(
    model='glm-4.7',
    messages=[
        {'role': 'user', 'content': 'What is artificial intelligence?'}
    ],
    tools=[
        {
            'type': 'web_search',
            'web_search': {
                'search_query': 'What is artificial intelligence?',
                'search_result': True,
            }
        }
    ]
)
```

### 5.2 Video Generation (Z.AI Specific)

```python
# Submit generation task
response = client.videos.generations(
    model="cogvideox-3",
    image_url=image_url,          # Provided image URL or Base64 encoding
    prompt="Make the scene come alive",
    quality="speed",              # "quality" or "speed"
    with_audio=True,
    size="1920x1080",            # Video resolution
    fps=30,                      # Frame rate (30 or 60)
)

# Retrieve result
result = client.videos.retrieve_videos_result(id=response.id)
```

---

## 6. Response Structures

### 6.1 Standard Completion Response

```python
# Universal response structure
Response = {
    "id": str,                           # Unique completion ID
    "object": "chat.completion",
    "created": int,                      # Unix timestamp
    "model": str,                        # Model used
    "choices": [
        {
            "index": int,
            "message": {
                "role": "assistant",
                "content": str | None,
                "tool_calls": list[ToolCall] | None,
            },
            "finish_reason": "stop" | "length" | "tool_calls" | "content_filter" | None,
        }
    ],
    "usage": {
        "prompt_tokens": int,
        "completion_tokens": int,
        "total_tokens": int,
    }
}
```

### 6.2 Tool Call Structure

```python
ToolCall = {
    "id": str,                           # Unique tool call ID
    "type": "function",
    "function": {
        "name": str,                     # Function name
        "arguments": str,                 # JSON string of arguments
    }
}
```

---

## 7. Error Handling

### 7.1 Universal Error Types

```python
# Z.AI SDK Errors
import zai
try:
    response = client.chat.completions.create(...)
except zai.core.APIStatusError as err:
    # Handle API status errors (4xx, 5xx)
    print(f"API status error: {err}")
except zai.core.APITimeoutError as err:
    # Handle timeout errors
    print(f"Request timeout: {err}")
except Exception as err:
    # Handle other errors
    print(f"Other error: {err}")

# OpenAI Errors
from openai import OpenAIError
try:
    response = client.chat.completions.create(...)
except OpenAIError as err:
    print(f"OpenAI error: {err}")

# Anthropic Errors
from anthropic import AnthropicError
try:
    response = client.messages.create(...)
except AnthropicError as err:
    print(f"Anthropic error: {err}")
```

---

## 8. Thin Abstraction Layer — Easy Mapping

### 8.1 Unified Interface

```python
# ai_client.py — Universal AI Client Abstraction

from abc import ABC, abstractmethod
from typing import Any, Generator
from dataclasses import dataclass
from enum import Enum


class AIProvider(Enum):
    ZAI = "zai"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"


@dataclass
class ChatMessage:
    role: str
    content: str
    name: str | None = None


@dataclass
class ChatRequest:
    model: str
    messages: list[ChatMessage]
    temperature: float = 1.0
    max_tokens: int = 1000
    stream: bool = False
    tools: list[dict] | None = None
    tool_choice: str | dict | None = None


@dataclass
class ChatResponse:
    content: str
    tool_calls: list[dict] | None = None
    usage: dict | None = None
    raw_response: Any = None


class AIClient(ABC):
    """Abstract base class for AI providers."""
    
    @abstractmethod
    def chat(self, request: ChatRequest) -> ChatResponse:
        """Execute a chat completion request."""
        pass
    
    @abstractmethod
    def stream_chat(self, request: ChatRequest) -> Generator[str, None, None]:
        """Execute a streaming chat completion."""
        pass


# Provider-specific implementations with simple mapping
class ZAIClient(AIClient):
    """Z.AI provider implementation."""
    
    def __init__(self, api_key: str, **kwargs):
        from zai import ZaiClient as ZaiSDK
        self._client = ZaiSDK(api_key=api_key, **kwargs)
    
    def chat(self, request: ChatRequest) -> ChatResponse:
        # Simple mapping: ChatRequest → Z.AI SDK format
        response = self._client.chat.completions.create(
            model=request.model,
            messages=[{"role": m.role, "content": m.content} for m in request.messages],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            tools=request.tools,
            tool_choice=request.tool_choice,
        )
        return ChatResponse(
            content=response.choices[0].message.content,
            tool_calls=response.choices[0].message.tool_calls,
            usage={"total_tokens": response.usage.total_tokens} if response.usage else None,
            raw_response=response,
        )
    
    def stream_chat(self, request: ChatRequest) -> Generator[str, None, None]:
        request.stream = True
        response = self._client.chat.completions.create(
            model=request.model,
            messages=[{"role": m.role, "content": m.content} for m in request.messages],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=True,
        )
        for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


class OpenAIClient(AIClient):
    """OpenAI provider implementation."""
    
    def __init__(self, api_key: str, **kwargs):
        from openai import OpenAI
        self._client = OpenAI(api_key=api_key, **kwargs)
    
    def chat(self, request: ChatRequest) -> ChatResponse:
        # Simple mapping: ChatRequest → OpenAI format
        response = self._client.chat.completions.create(
            model=request.model,
            messages=[{"role": m.role, "content": m.content} for m in request.messages],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            tools=request.tools,
            tool_choice=request.tool_choice,
        )
        return ChatResponse(
            content=response.choices[0].message.content,
            tool_calls=response.choices[0].message.tool_calls,
            usage=dict(response.usage) if response.usage else None,
            raw_response=response,
        )
    
    def stream_chat(self, request: ChatRequest) -> Generator[str, None, None]:
        response = self._client.chat.completions.create(
            model=request.model,
            messages=[{"role": m.role, "content": m.content} for m in request.messages],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=True,
        )
        for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


class AnthropicClient(AIClient):
    """Anthropic provider implementation."""
    
    def __init__(self, api_key: str, **kwargs):
        from anthropic import Anthropic
        self._client = Anthropic(api_key=api_key, **kwargs)
    
    def chat(self, request: ChatRequest) -> ChatResponse:
        # Anthropic uses different message format
        response = self._client.messages.create(
            model=request.model,
            messages=[{"role": m.role, "content": m.content} for m in request.messages],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            tools=request.tools,
        )
        return ChatResponse(
            content=response.content[0].text if response.content else "",
            usage={"input_tokens": response.usage.input_tokens, 
                   "output_tokens": response.usage.output_tokens},
            raw_response=response,
        )
    
    def stream_chat(self, request: ChatRequest) -> Generator[str, None, None]:
        with self._client.messages.stream(
            model=request.model,
            messages=[{"role": m.role, "content": m.content} for m in request.messages],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        ) as stream:
            for text in stream.text_stream:
                yield text


# Factory function for easy provider switching
def create_ai_client(provider: AIProvider, api_key: str, **kwargs) -> AIClient:
    """Create an AI client based on provider type."""
    clients = {
        AIProvider.ZAI: ZAIClient,
        AIProvider.OPENAI: OpenAIClient,
        AIProvider.ANTHROPIC: AnthropicClient,
    }
    return clients[provider](api_key, **kwargs)
```

### 8.2 Usage Example

```python
# Easy switching between providers
from ai_client import create_ai_client, AIProvider, ChatRequest, ChatMessage

# Use Z.AI
client = create_ai_client(AIProvider.ZAI, api_key="your-zai-key")

# Or switch to OpenAI with same interface
# client = create_ai_client(AIProvider.OPENAI, api_key="your-openai-key")

# Same API regardless of provider
request = ChatRequest(
    model="glm-5",
    messages=[
        ChatMessage(role="system", content="You are a helpful assistant."),
        ChatMessage(role="user", content="Hello!"),
    ],
    temperature=0.7,
    max_tokens=500,
)

response = client.chat(request)
print(response.content)
```

---

## 9. Configuration Mapping

### 9.1 Model Tier Configuration

```python
# config.py — Model routing configuration

from dataclasses import dataclass
from enum import Enum


class LLMProvider(Enum):
    ZAI = "zai"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"


@dataclass
class ModelTier:
    """Configuration for each model tier."""
    provider: LLMProvider
    model: str
    max_tokens: int
    cost_per_1k_input: float
    cost_per_1k_output: float
    requests_per_minute: int


# Default model configurations
MODEL_CONFIG = {
    # Z.AI Models
    "glm-5": ModelTier(
        provider=LLMProvider.ZAI,
        model="glm-5",
        max_tokens=4096,
        cost_per_1k_input=0.001,
        cost_per_1k_output=0.005,
        requests_per_minute=1000,
    ),
    "glm-4.7": ModelTier(
        provider=LLMProvider.ZAI,
        model="glm-4.7",
        max_tokens=4096,
        cost_per_1k_input=0.001,
        cost_per_1k_output=0.005,
        requests_per_minute=1000,
    ),
    
    # OpenAI Models
    "gpt-4o": ModelTier(
        provider=LLMProvider.OPENAI,
        model="gpt-4o",
        max_tokens=4096,
        cost_per_1k_input=0.005,
        cost_per_1k_output=0.015,
        requests_per_minute=500,
    ),
    "gpt-4o-mini": ModelTier(
        provider=LLMProvider.OPENAI,
        model="gpt-4o-mini",
        max_tokens=4096,
        cost_per_1k_input=0.00015,
        cost_per_1k_output=0.0006,
        requests_per_minute=500,
    ),
    
    # Anthropic Models
    "claude-3-opus": ModelTier(
        provider=LLMProvider.ANTHROPIC,
        model="claude-3-opus-20240229",
        max_tokens=4096,
        cost_per_1k_input=0.015,
        cost_per_1k_output=0.075,
        requests_per_minute=500,
    ),
    "claude-3-sonnet": ModelTier(
        provider=LLMProvider.ANTHROPIC,
        model="claude-3-sonnet-20240229",
        max_tokens=4096,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        requests_per_minute=500,
    ),
}
```

---

## 10. Quick Reference Card

### Parameter Mapping Table

| Concept | Z.AI | OpenAI | Anthropic |
|---------|------|--------|-----------|
| **Chat** | `client.chat.completions.create()` | `client.chat.completions.create()` | `client.messages.create()` |
| **Model** | `model="glm-5"` | `model="gpt-4o"` | `model="claude-3-opus"` |
| **Messages** | `messages=[...]` | `messages=[...]` | `messages=[...]` |
| **Temperature** | `temperature=0.7` | `temperature=0.7` | `temperature=0.7` |
| **Max Tokens** | `max_tokens=1000` | `max_tokens=1000` | `max_tokens=1000` |
| **Stream** | `stream=True` | `stream=True` | Use `stream()` method |
| **Tools** | `tools=[...]` | `tools=[...]` | `tools=[...]` |
| **Response** | `response.choices[0].message.content` | `response.choices[0].message.content` | `response.content[0].text` |

### Error Type Mapping

| Error Type | Z.AI | OpenAI | Anthropic |
|------------|------|--------|-----------|
| Base Error | `zai.core.APIError` | `openai.APIError` | `anthropic.APIError` |
| Status Error | `zai.core.APIStatusError` | `openai.APIStatusError` | N/A |
| Timeout | `zai.core.APITimeoutError` | `openai.APIConnectionError` | `anthropic.APITimeoutError` |
| Rate Limit | `zai.core.RateLimitError` | `openai.RateLimitError` | `anthropic.RateLimitError` |

---

## 11. File Location

This context file should be placed at:
```
/ai_api_context.md
```
Or integrated into your project structure as:
```
/src/ai_client/
├── __init__.py       # Exports
├── base.py           # Abstract base class
├── providers.py      # Provider implementations
└── config.py         # Model configurations
```

---

*Generated for magB — The Universal Blueprint Machine*
*Last Updated: 2026-03-13*
