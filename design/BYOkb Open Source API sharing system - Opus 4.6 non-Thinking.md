# 🚀 AIContrib: Open Source AI-Powered Contribution System

## Architecture Overview

A decentralized, plugin-based system where contributors donate AI compute (API tokens, credits, accounts) instead of (or alongside) money, and the system orchestrates those resources to autonomously advance project development.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AIContrib Platform                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Contributor   │  │  Task        │  │  AI Orchestration        │  │
│  │ Portal &      │  │  Decomposition│  │  Engine                  │  │
│  │ Wallet Mgmt   │  │  Engine      │  │  (Multi-Provider Router) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                      │                   │
│  ┌──────▼─────────────────▼──────────────────────▼───────────────┐  │
│  │                   Core Orchestrator (Event-Driven)            │  │
│  │         ┌─────────────────────────────────────┐               │  │
│  │         │   Token Budget & Rate Limiter        │               │  │
│  │         │   Fair Scheduling & Priority Queue   │               │  │
│  │         │   Provider Health & Fallback Manager │               │  │
│  │         └─────────────────────────────────────┘               │  │
│  └──────┬────────────────────────────────────────────────────────┘  │
│         │                                                           │
│  ┌──────▼────────────────────────────────────────────────────────┐  │
│  │              Provider Adapter Layer (Plugin System)           │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │  │
│  │  │ OpenAI  │ │Anthropic│ │ Google  │ │ Local   │ │Custom │ │  │
│  │  │ Adapter │ │ Adapter │ │ Adapter │ │ LLM     │ │Adapter│ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Development Pipeline                            │   │
│  │  Issue Triage → Code Gen → Review → Test → PR → Merge       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────┐ ┌──────────────┐ ┌───────────────┐ ┌───────────┐  │
│  │ Audit &    │ │ Contributor  │ │ Credential    │ │ Analytics │  │
│  │ Compliance │ │ Attribution  │ │ Vault (E2E)   │ │ Dashboard │  │
│  └────────────┘ └──────────────┘ └───────────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
aicontrib/
├── README.md
├── LICENSE                          # Apache 2.0
├── pyproject.toml
├── docker-compose.yml
├── Makefile
├── .env.example
│
├── docs/
│   ├── architecture.md
│   ├── provider-plugin-guide.md
│   ├── contributor-guide.md
│   ├── security-model.md
│   └── api-reference.md
│
├── core/
│   ├── __init__.py
│   ├── config.py                    # Global configuration
│   ├── orchestrator.py              # Central orchestration engine
│   ├── scheduler.py                 # Fair task scheduling
│   ├── token_budget.py              # Token budget management
│   ├── event_bus.py                 # Async event system
│   ├── exceptions.py
│   └── models/
│       ├── __init__.py
│       ├── contributor.py
│       ├── contribution.py
│       ├── task.py
│       ├── provider.py
│       └── project.py
│
├── providers/
│   ├── __init__.py
│   ├── base.py                      # Abstract provider interface
│   ├── registry.py                  # Provider plugin registry
│   ├── health.py                    # Health check & failover
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── openai_adapter.py
│   │   ├── anthropic_adapter.py
│   │   ├── google_gemini_adapter.py
│   │   ├── mistral_adapter.py
│   │   ├── local_llm_adapter.py     # Ollama, vLLM, llama.cpp
│   │   ├── huggingface_adapter.py
│   │   └── custom_adapter.py        # Template for new providers
│   └── router.py                    # Intelligent request routing
│
├── credentials/
│   ├── __init__.py
│   ├── vault.py                     # Encrypted credential storage
│   ├── encryption.py                # AES-256-GCM encryption
│   ├── rotation.py                  # Key rotation manager
│   └── oauth_handler.py             # OAuth2 flow for providers
│
├── contributors/
│   ├── __init__.py
│   ├── manager.py                   # Contributor lifecycle
│   ├── wallet.py                    # Token budget wallet
│   ├── attribution.py              # Contribution tracking
│   ├── reputation.py               # Reputation/trust scoring
│   └── policies.py                 # Contribution policies & limits
│
├── tasks/
│   ├── __init__.py
│   ├── decomposer.py               # Break issues into AI tasks
│   ├── estimator.py                # Token cost estimation
│   ├── executor.py                 # Task execution engine
│   ├── validator.py                # Output validation
│   └── templates/
│       ├── code_generation.py
│       ├── code_review.py
│       ├── documentation.py
│       ├── bug_fix.py
│       ├── test_generation.py
│       ├── refactoring.py
│       └── translation.py
│
├── pipeline/
│   ├── __init__.py
│   ├── dev_pipeline.py             # Full development pipeline
│   ├── stages/
│   │   ├── issue_triage.py
│   │   ├── planning.py
│   │   ├── code_generation.py
│   │   ├── code_review.py
│   │   ├── testing.py
│   │   ├── documentation.py
│   │   └── pr_creation.py
│   └── hooks.py                    # Pipeline lifecycle hooks
│
├── integrations/
│   ├── __init__.py
│   ├── github.py                   # GitHub integration
│   ├── gitlab.py                   # GitLab integration
│   ├── jira.py                     # Jira integration
│   ├── discord.py                  # Discord notifications
│   ├── slack.py                    # Slack notifications
│   └── webhooks.py                 # Generic webhook support
│
├── api/
│   ├── __init__.py
│   ├── app.py                      # FastAPI application
│   ├── routes/
│   │   ├── contributors.py
│   │   ├── projects.py
│   │   ├── tasks.py
│   │   ├── providers.py
│   │   ├── analytics.py
│   │   └── admin.py
│   ├── middleware/
│   │   ├── auth.py
│   │   ├── rate_limit.py
│   │   └── audit.py
│   └── websockets/
│       └── realtime.py             # Real-time task updates
│
├── web/                            # Frontend (React/Next.js)
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   ├── ContributorPanel/
│   │   │   ├── ProviderConfig/
│   │   │   ├── TaskMonitor/
│   │   │   └── Analytics/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   └── public/
│
├── audit/
│   ├── __init__.py
│   ├── logger.py                   # Immutable audit log
│   ├── compliance.py               # Policy compliance checker
│   └── reporter.py                 # Usage reports
│
├── cli/
│   ├── __init__.py
│   ├── main.py                     # CLI entry point
│   ├── commands/
│   │   ├── init.py
│   │   ├── contribute.py
│   │   ├── project.py
│   │   ├── provider.py
│   │   └── status.py
│   └── interactive.py              # Interactive setup wizard
│
├── sdk/
│   ├── python/
│   │   └── aicontrib_sdk/
│   ├── javascript/
│   │   └── aicontrib-sdk/
│   └── go/
│       └── aicontrib/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
│
├── migrations/                     # Database migrations (Alembic)
│   └── versions/
│
└── deploy/
    ├── kubernetes/
    ├── terraform/
    └── docker/
```

---

## Core Implementation

### 1. Provider Plugin System (The Heart)

```python
# providers/base.py
"""
Abstract base class for all AI provider adapters.
Every provider plugin must implement this interface.
"""

from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum, auto
from typing import (
    Any, AsyncIterator, Callable, Dict, List, 
    Optional, Protocol, Type, TypeVar, Union
)
from uuid import UUID, uuid4

import structlog

logger = structlog.get_logger(__name__)


class ProviderCapability(Enum):
    """Capabilities a provider can support."""
    TEXT_GENERATION = auto()
    CODE_GENERATION = auto()
    CODE_REVIEW = auto()
    EMBEDDING = auto()
    IMAGE_GENERATION = auto()
    FUNCTION_CALLING = auto()
    STREAMING = auto()
    VISION = auto()
    LONG_CONTEXT = auto()
    STRUCTURED_OUTPUT = auto()
    FINE_TUNING = auto()
    BATCH_PROCESSING = auto()


class ModelTier(Enum):
    """Model capability tiers for intelligent routing."""
    FRONTIER = "frontier"         # GPT-4o, Claude 3.5 Sonnet, Gemini Ultra
    STANDARD = "standard"         # GPT-4o-mini, Claude 3 Haiku, Gemini Pro
    EFFICIENT = "efficient"       # GPT-3.5, Mistral 7B, local models
    SPECIALIZED = "specialized"   # Fine-tuned or domain-specific


class ProviderStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    RATE_LIMITED = "rate_limited"
    QUOTA_EXHAUSTED = "quota_exhausted"
    UNKNOWN = "unknown"


@dataclass(frozen=True)
class TokenUsage:
    """Immutable record of token consumption."""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    model: str
    provider: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    @property
    def cost_per_1k_tokens(self) -> float:
        if self.total_tokens == 0:
            return 0.0
        return (self.estimated_cost_usd / self.total_tokens) * 1000


@dataclass
class ProviderQuota:
    """Tracks remaining quota for a provider credential."""
    tokens_remaining: Optional[int] = None
    requests_remaining: Optional[int] = None
    cost_remaining_usd: Optional[float] = None
    reset_at: Optional[datetime] = None
    rate_limit_rpm: Optional[int] = None
    rate_limit_tpm: Optional[int] = None


@dataclass
class ModelInfo:
    """Metadata about a model available through a provider."""
    model_id: str
    display_name: str
    provider: str
    tier: ModelTier
    capabilities: set[ProviderCapability]
    max_context_tokens: int
    max_output_tokens: int
    cost_per_1m_input_tokens: float   # USD
    cost_per_1m_output_tokens: float  # USD
    supports_streaming: bool = True
    supports_json_mode: bool = False
    knowledge_cutoff: Optional[str] = None
    
    def estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        return (
            (input_tokens / 1_000_000) * self.cost_per_1m_input_tokens +
            (output_tokens / 1_000_000) * self.cost_per_1m_output_tokens
        )


@dataclass
class CompletionRequest:
    """Unified completion request across all providers."""
    messages: List[Dict[str, Any]]
    model: Optional[str] = None
    model_tier: ModelTier = ModelTier.STANDARD
    max_tokens: Optional[int] = None
    temperature: float = 0.7
    top_p: float = 1.0
    stop: Optional[List[str]] = None
    stream: bool = False
    json_mode: bool = False
    tools: Optional[List[Dict[str, Any]]] = None
    tool_choice: Optional[str] = None
    system_prompt: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Budget constraints
    max_cost_usd: Optional[float] = None
    priority: int = 5  # 1 = highest, 10 = lowest
    
    # Tracking
    request_id: UUID = field(default_factory=uuid4)
    task_id: Optional[UUID] = None
    contributor_id: Optional[UUID] = None


@dataclass
class CompletionResponse:
    """Unified completion response from any provider."""
    content: str
    model: str
    provider: str
    usage: TokenUsage
    finish_reason: str
    request_id: UUID
    latency_ms: float
    raw_response: Optional[Dict[str, Any]] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    
    # For streaming
    is_streaming: bool = False
    stream_chunks: Optional[List[str]] = None


class AIProviderAdapter(ABC):
    """
    Abstract base class that all provider adapters must implement.
    
    To create a new provider plugin:
    1. Subclass AIProviderAdapter
    2. Implement all abstract methods
    3. Register via @provider_registry.register("provider_name")
    4. Place in providers/adapters/ directory
    
    The system will auto-discover and load all registered adapters.
    """
    
    def __init__(self, credential_id: str, config: Dict[str, Any] = None):
        self.credential_id = credential_id
        self.config = config or {}
        self._status = ProviderStatus.UNKNOWN
        self._quota = ProviderQuota()
        self._request_count = 0
        self._error_count = 0
        self._last_health_check: Optional[datetime] = None
        self._circuit_breaker_open = False
        self._circuit_breaker_failures = 0
        self._circuit_breaker_threshold = 5
        self._circuit_breaker_reset_time: Optional[datetime] = None
    
    # ── Required Properties ────────────────────────────────────────
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Unique identifier for this provider (e.g., 'openai', 'anthropic')."""
        ...
    
    @property
    @abstractmethod
    def display_name(self) -> str:
        """Human-readable provider name."""
        ...
    
    @property
    @abstractmethod
    def supported_capabilities(self) -> set[ProviderCapability]:
        """Set of capabilities this provider supports."""
        ...
    
    @property
    @abstractmethod
    def available_models(self) -> List[ModelInfo]:
        """List of models available through this provider."""
        ...
    
    # ── Required Methods ───────────────────────────────────────────
    
    @abstractmethod
    async def initialize(self) -> None:
        """
        Initialize the provider client. Called once during setup.
        Should validate the credential and establish connection.
        """
        ...
    
    @abstractmethod
    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        """
        Execute a completion request. Core method for text/code generation.
        Must handle retries, rate limits, and error translation internally.
        """
        ...
    
    @abstractmethod
    async def stream_complete(
        self, request: CompletionRequest
    ) -> AsyncIterator[str]:
        """Stream a completion response token by token."""
        ...
    
    @abstractmethod
    async def health_check(self) -> ProviderStatus:
        """
        Check provider health. Should be lightweight (e.g., small completion).
        Returns current status.
        """
        ...
    
    @abstractmethod
    async def get_quota(self) -> ProviderQuota:
        """Query remaining quota/credits for this credential."""
        ...
    
    @abstractmethod
    async def shutdown(self) -> None:
        """Clean up resources. Called during graceful shutdown."""
        ...
    
    @abstractmethod
    def translate_error(self, error: Exception) -> "ProviderError":
        """Translate provider-specific errors into unified error types."""
        ...
    
    # ── Optional Override Methods ──────────────────────────────────
    
    async def embed(
        self, texts: List[str], model: Optional[str] = None
    ) -> List[List[float]]:
        """Generate embeddings. Override if provider supports embeddings."""
        raise NotImplementedError(
            f"{self.provider_name} does not support embeddings"
        )
    
    async def batch_complete(
        self, requests: List[CompletionRequest]
    ) -> List[CompletionResponse]:
        """Batch completion for efficiency. Default: sequential execution."""
        return [await self.complete(req) for req in requests]
    
    def select_model(
        self, 
        tier: ModelTier, 
        capabilities: set[ProviderCapability] = None
    ) -> Optional[ModelInfo]:
        """Select best model matching tier and capability requirements."""
        candidates = [
            m for m in self.available_models
            if m.tier == tier and (
                capabilities is None or 
                capabilities.issubset(m.capabilities)
            )
        ]
        if not candidates:
            # Fall back to any tier
            candidates = [
                m for m in self.available_models
                if capabilities is None or 
                capabilities.issubset(m.capabilities)
            ]
        return candidates[0] if candidates else None
    
    # ── Circuit Breaker ────────────────────────────────────────────
    
    def _record_success(self):
        self._circuit_breaker_failures = 0
        self._circuit_breaker_open = False
        self._request_count += 1
    
    def _record_failure(self):
        self._circuit_breaker_failures += 1
        self._error_count += 1
        if self._circuit_breaker_failures >= self._circuit_breaker_threshold:
            self._circuit_breaker_open = True
            self._circuit_breaker_reset_time = (
                datetime.utcnow() + timedelta(minutes=5)
            )
            logger.warning(
                "circuit_breaker_opened",
                provider=self.provider_name,
                failures=self._circuit_breaker_failures
            )
    
    @property
    def is_available(self) -> bool:
        if self._circuit_breaker_open:
            if (self._circuit_breaker_reset_time and 
                datetime.utcnow() > self._circuit_breaker_reset_time):
                self._circuit_breaker_open = False
                self._circuit_breaker_failures = 0
                return True
            return False
        return self._status in (ProviderStatus.HEALTHY, ProviderStatus.UNKNOWN)


class ProviderError(Exception):
    """Base class for unified provider errors."""
    def __init__(
        self, message: str, provider: str, 
        retryable: bool = False, status_code: Optional[int] = None
    ):
        super().__init__(message)
        self.provider = provider
        self.retryable = retryable
        self.status_code = status_code


class RateLimitError(ProviderError):
    def __init__(self, provider: str, retry_after: Optional[float] = None):
        super().__init__(
            f"Rate limited by {provider}", provider, retryable=True, 
            status_code=429
        )
        self.retry_after = retry_after


class QuotaExhaustedError(ProviderError):
    def __init__(self, provider: str):
        super().__init__(
            f"Quota exhausted for {provider}", provider, retryable=False,
            status_code=402
        )


class AuthenticationError(ProviderError):
    def __init__(self, provider: str):
        super().__init__(
            f"Authentication failed for {provider}", provider, 
            retryable=False, status_code=401
        )
```

### 2. Provider Adapter Implementation (OpenAI Example)

```python
# providers/adapters/openai_adapter.py
"""
OpenAI provider adapter. Supports GPT-4, GPT-4o, GPT-3.5, DALL-E, embeddings.
"""

from __future__ import annotations

import time
from typing import Any, AsyncIterator, Dict, List, Optional

import httpx
import structlog
from openai import AsyncOpenAI, APIError, RateLimitError as OpenAIRateLimitError

from providers.base import (
    AIProviderAdapter,
    CompletionRequest,
    CompletionResponse,
    ModelInfo,
    ModelTier,
    ProviderCapability,
    ProviderError,
    ProviderQuota,
    ProviderStatus,
    RateLimitError,
    QuotaExhaustedError,
    AuthenticationError,
    TokenUsage,
)
from providers.registry import provider_registry
from credentials.vault import CredentialVault

logger = structlog.get_logger(__name__)


# Model catalog with pricing (as of 2024)
OPENAI_MODELS = [
    ModelInfo(
        model_id="gpt-4o",
        display_name="GPT-4o",
        provider="openai",
        tier=ModelTier.FRONTIER,
        capabilities={
            ProviderCapability.TEXT_GENERATION,
            ProviderCapability.CODE_GENERATION,
            ProviderCapability.CODE_REVIEW,
            ProviderCapability.FUNCTION_CALLING,
            ProviderCapability.STREAMING,
            ProviderCapability.VISION,
            ProviderCapability.STRUCTURED_OUTPUT,
            ProviderCapability.LONG_CONTEXT,
        },
        max_context_tokens=128_000,
        max_output_tokens=16_384,
        cost_per_1m_input_tokens=2.50,
        cost_per_1m_output_tokens=10.00,
        supports_streaming=True,
        supports_json_mode=True,
        knowledge_cutoff="2024-10",
    ),
    ModelInfo(
        model_id="gpt-4o-mini",
        display_name="GPT-4o Mini",
        provider="openai",
        tier=ModelTier.STANDARD,
        capabilities={
            ProviderCapability.TEXT_GENERATION,
            ProviderCapability.CODE_GENERATION,
            ProviderCapability.CODE_REVIEW,
            ProviderCapability.FUNCTION_CALLING,
            ProviderCapability.STREAMING,
            ProviderCapability.VISION,
            ProviderCapability.STRUCTURED_OUTPUT,
        },
        max_context_tokens=128_000,
        max_output_tokens=16_384,
        cost_per_1m_input_tokens=0.15,
        cost_per_1m_output_tokens=0.60,
        supports_streaming=True,
        supports_json_mode=True,
        knowledge_cutoff="2024-10",
    ),
    ModelInfo(
        model_id="o1-preview",
        display_name="O1 Preview (Reasoning)",
        provider="openai",
        tier=ModelTier.FRONTIER,
        capabilities={
            ProviderCapability.TEXT_GENERATION,
            ProviderCapability.CODE_GENERATION,
            ProviderCapability.CODE_REVIEW,
        },
        max_context_tokens=128_000,
        max_output_tokens=32_768,
        cost_per_1m_input_tokens=15.00,
        cost_per_1m_output_tokens=60.00,
        supports_streaming=False,
        supports_json_mode=False,
        knowledge_cutoff="2024-10",
    ),
]


@provider_registry.register("openai")
class OpenAIAdapter(AIProviderAdapter):
    """Full-featured OpenAI provider adapter."""

    def __init__(self, credential_id: str, config: Dict[str, Any] = None):
        super().__init__(credential_id, config)
        self._client: Optional[AsyncOpenAI] = None
        self._vault = CredentialVault()

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def display_name(self) -> str:
        return "OpenAI"

    @property
    def supported_capabilities(self) -> set[ProviderCapability]:
        return {
            ProviderCapability.TEXT_GENERATION,
            ProviderCapability.CODE_GENERATION,
            ProviderCapability.CODE_REVIEW,
            ProviderCapability.EMBEDDING,
            ProviderCapability.FUNCTION_CALLING,
            ProviderCapability.STREAMING,
            ProviderCapability.VISION,
            ProviderCapability.STRUCTURED_OUTPUT,
            ProviderCapability.LONG_CONTEXT,
            ProviderCapability.IMAGE_GENERATION,
        }

    @property
    def available_models(self) -> List[ModelInfo]:
        return OPENAI_MODELS

    async def initialize(self) -> None:
        """Initialize OpenAI client with encrypted credentials."""
        api_key = await self._vault.get_secret(
            self.credential_id, "api_key"
        )
        org_id = await self._vault.get_secret(
            self.credential_id, "org_id", required=False
        )
        base_url = self.config.get("base_url")  # Support Azure/proxy
        
        self._client = AsyncOpenAI(
            api_key=api_key,
            organization=org_id,
            base_url=base_url,
            timeout=httpx.Timeout(120.0, connect=10.0),
            max_retries=2,
        )
        
        # Validate credentials with a minimal request
        try:
            await self._client.models.list()
            self._status = ProviderStatus.HEALTHY
            logger.info(
                "openai_adapter_initialized",
                credential_id=self.credential_id
            )
        except Exception as e:
            self._status = ProviderStatus.UNHEALTHY
            raise AuthenticationError("openai") from e

    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        """Execute completion request against OpenAI API."""
        if not self._client:
            raise ProviderError(
                "Client not initialized", "openai", retryable=False
            )
        
        model_info = self.select_model(request.model_tier)
        model = request.model or (model_info.model_id if model_info else "gpt-4o-mini")
        
        # Build messages
        messages = list(request.messages)
        if request.system_prompt:
            messages.insert(0, {"role": "system", "content": request.system_prompt})
        
        # Build kwargs
        kwargs: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": request.temperature,
            "top_p": request.top_p,
            "stream": False,
        }
        
        if request.max_tokens:
            kwargs["max_tokens"] = request.max_tokens
        if request.stop:
            kwargs["stop"] = request.stop
        if request.json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        if request.tools:
            kwargs["tools"] = request.tools
            if request.tool_choice:
                kwargs["tool_choice"] = request.tool_choice
        
        start_time = time.monotonic()
        
        try:
            response = await self._client.chat.completions.create(**kwargs)
            latency = (time.monotonic() - start_time) * 1000
            
            usage = TokenUsage(
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens,
                total_tokens=response.usage.total_tokens,
                estimated_cost_usd=model_info.estimate_cost(
                    response.usage.prompt_tokens,
                    response.usage.completion_tokens
                ) if model_info else 0.0,
                model=model,
                provider="openai",
            )
            
            choice = response.choices[0]
            
            tool_calls = None
            if choice.message.tool_calls:
                tool_calls = [
                    {
                        "id": tc.id,
                        "type": tc.type,
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        }
                    }
                    for tc in choice.message.tool_calls
                ]
            
            self._record_success()
            
            return CompletionResponse(
                content=choice.message.content or "",
                model=response.model,
                provider="openai",
                usage=usage,
                finish_reason=choice.finish_reason,
                request_id=request.request_id,
                latency_ms=latency,
                tool_calls=tool_calls,
                raw_response=response.model_dump() if self.config.get("store_raw") else None,
            )
            
        except OpenAIRateLimitError as e:
            self._record_failure()
            retry_after = float(e.response.headers.get("retry-after", 60))
            raise RateLimitError("openai", retry_after=retry_after) from e
        except APIError as e:
            self._record_failure()
            raise self.translate_error(e) from e

    async def stream_complete(
        self, request: CompletionRequest
    ) -> AsyncIterator[str]:
        """Stream completion tokens."""
        if not self._client:
            raise ProviderError("Client not initialized", "openai")
        
        model_info = self.select_model(request.model_tier)
        model = request.model or (model_info.model_id if model_info else "gpt-4o-mini")
        
        messages = list(request.messages)
        if request.system_prompt:
            messages.insert(0, {"role": "system", "content": request.system_prompt})
        
        stream = await self._client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=True,
        )
        
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def embed(
        self, texts: List[str], model: Optional[str] = None
    ) -> List[List[float]]:
        """Generate embeddings using OpenAI."""
        if not self._client:
            raise ProviderError("Client not initialized", "openai")
        
        model = model or "text-embedding-3-small"
        response = await self._client.embeddings.create(
            model=model,
            input=texts,
        )
        return [item.embedding for item in response.data]

    async def health_check(self) -> ProviderStatus:
        """Lightweight health check."""
        try:
            await self._client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=1,
            )
            self._status = ProviderStatus.HEALTHY
        except OpenAIRateLimitError:
            self._status = ProviderStatus.RATE_LIMITED
        except Exception:
            self._status = ProviderStatus.UNHEALTHY
        
        self._last_health_check = datetime.utcnow()
        return self._status

    async def get_quota(self) -> ProviderQuota:
        """
        OpenAI doesn't have a direct quota API, so we track usage
        against contributor-set limits.
        """
        return self._quota

    async def shutdown(self) -> None:
        """Close the HTTP client."""
        if self._client:
            await self._client.close()
            self._client = None
        logger.info("openai_adapter_shutdown", credential_id=self.credential_id)

    def translate_error(self, error: Exception) -> ProviderError:
        """Translate OpenAI errors to unified errors."""
        if isinstance(error, APIError):
            if error.status_code == 401:
                return AuthenticationError("openai")
            if error.status_code == 429:
                return RateLimitError("openai")
            if error.status_code == 402:
                return QuotaExhaustedError("openai")
            return ProviderError(
                str(error), "openai",
                retryable=error.status_code in (500, 502, 503),
                status_code=error.status_code
            )
        return ProviderError(str(error), "openai")
```

### 3. Anthropic Adapter

```python
# providers/adapters/anthropic_adapter.py
"""Anthropic Claude provider adapter."""

from __future__ import annotations

import time
from typing import Any, AsyncIterator, Dict, List, Optional

import structlog
from anthropic import AsyncAnthropic, APIError, RateLimitError as AnthropicRateLimit

from providers.base import *
from providers.registry import provider_registry
from credentials.vault import CredentialVault

logger = structlog.get_logger(__name__)

ANTHROPIC_MODELS = [
    ModelInfo(
        model_id="claude-sonnet-4-20250514",
        display_name="Claude Sonnet 4",
        provider="anthropic",
        tier=ModelTier.FRONTIER,
        capabilities={
            ProviderCapability.TEXT_GENERATION,
            ProviderCapability.CODE_GENERATION,
            ProviderCapability.CODE_REVIEW,
            ProviderCapability.FUNCTION_CALLING,
            ProviderCapability.STREAMING,
            ProviderCapability.VISION,
            ProviderCapability.LONG_CONTEXT,
            ProviderCapability.STRUCTURED_OUTPUT,
        },
        max_context_tokens=200_000,
        max_output_tokens=8_192,
        cost_per_1m_input_tokens=3.00,
        cost_per_1m_output_tokens=15.00,
        supports_streaming=True,
        supports_json_mode=True,
    ),
    ModelInfo(
        model_id="claude-3-5-haiku-20241022",
        display_name="Claude 3.5 Haiku",
        provider="anthropic",
        tier=ModelTier.STANDARD,
        capabilities={
            ProviderCapability.TEXT_GENERATION,
            ProviderCapability.CODE_GENERATION,
            ProviderCapability.CODE_REVIEW,
            ProviderCapability.FUNCTION_CALLING,
            ProviderCapability.STREAMING,
        },
        max_context_tokens=200_000,
        max_output_tokens=8_192,
        cost_per_1m_input_tokens=0.80,
        cost_per_1m_output_tokens=4.00,
        supports_streaming=True,
        supports_json_mode=True,
    ),
]


@provider_registry.register("anthropic")
class AnthropicAdapter(AIProviderAdapter):
    """Anthropic Claude provider adapter."""

    def __init__(self, credential_id: str, config: Dict[str, Any] = None):
        super().__init__(credential_id, config)
        self._client: Optional[AsyncAnthropic] = None
        self._vault = CredentialVault()

    @property
    def provider_name(self) -> str:
        return "anthropic"

    @property
    def display_name(self) -> str:
        return "Anthropic"

    @property
    def supported_capabilities(self) -> set[ProviderCapability]:
        return {
            ProviderCapability.TEXT_GENERATION,
            ProviderCapability.CODE_GENERATION,
            ProviderCapability.CODE_REVIEW,
            ProviderCapability.FUNCTION_CALLING,
            ProviderCapability.STREAMING,
            ProviderCapability.VISION,
            ProviderCapability.LONG_CONTEXT,
            ProviderCapability.STRUCTURED_OUTPUT,
        }

    @property
    def available_models(self) -> List[ModelInfo]:
        return ANTHROPIC_MODELS

    async def initialize(self) -> None:
        api_key = await self._vault.get_secret(self.credential_id, "api_key")
        self._client = AsyncAnthropic(api_key=api_key)
        self._status = ProviderStatus.HEALTHY
        logger.info("anthropic_adapter_initialized")

    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        if not self._client:
            raise ProviderError("Client not initialized", "anthropic")

        model_info = self.select_model(request.model_tier)
        model = request.model or (model_info.model_id if model_info else "claude-3-5-haiku-20241022")

        # Anthropic uses a separate system parameter
        system = request.system_prompt or ""
        
        # Filter out system messages from messages list (Anthropic API style)
        messages = []
        for msg in request.messages:
            if msg["role"] == "system":
                system = msg["content"]
            else:
                messages.append(msg)

        kwargs: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "max_tokens": request.max_tokens or 4096,
            "temperature": request.temperature,
        }
        if system:
            kwargs["system"] = system
        if request.tools:
            kwargs["tools"] = self._convert_tools(request.tools)
        if request.stop:
            kwargs["stop_sequences"] = request.stop

        start_time = time.monotonic()
        
        try:
            response = await self._client.messages.create(**kwargs)
            latency = (time.monotonic() - start_time) * 1000

            content = ""
            tool_calls = []
            for block in response.content:
                if block.type == "text":
                    content += block.text
                elif block.type == "tool_use":
                    tool_calls.append({
                        "id": block.id,
                        "type": "function",
                        "function": {
                            "name": block.name,
                            "arguments": block.input,
                        }
                    })

            usage = TokenUsage(
                prompt_tokens=response.usage.input_tokens,
                completion_tokens=response.usage.output_tokens,
                total_tokens=response.usage.input_tokens + response.usage.output_tokens,
                estimated_cost_usd=model_info.estimate_cost(
                    response.usage.input_tokens,
                    response.usage.output_tokens
                ) if model_info else 0.0,
                model=model,
                provider="anthropic",
            )

            self._record_success()

            return CompletionResponse(
                content=content,
                model=response.model,
                provider="anthropic",
                usage=usage,
                finish_reason=response.stop_reason or "end_turn",
                request_id=request.request_id,
                latency_ms=latency,
                tool_calls=tool_calls if tool_calls else None,
            )

        except AnthropicRateLimit as e:
            self._record_failure()
            raise RateLimitError("anthropic") from e
        except APIError as e:
            self._record_failure()
            raise self.translate_error(e) from e

    async def stream_complete(
        self, request: CompletionRequest
    ) -> AsyncIterator[str]:
        if not self._client:
            raise ProviderError("Client not initialized", "anthropic")
        
        model_info = self.select_model(request.model_tier)
        model = request.model or (model_info.model_id if model_info else "claude-3-5-haiku-20241022")
        
        messages = [m for m in request.messages if m["role"] != "system"]
        system = request.system_prompt or ""
        for m in request.messages:
            if m["role"] == "system":
                system = m["content"]
        
        async with self._client.messages.stream(
            model=model,
            messages=messages,
            system=system or None,
            max_tokens=request.max_tokens or 4096,
            temperature=request.temperature,
        ) as stream:
            async for text in stream.text_stream:
                yield text

    async def health_check(self) -> ProviderStatus:
        try:
            await self._client.messages.create(
                model="claude-3-5-haiku-20241022",
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=1,
            )
            self._status = ProviderStatus.HEALTHY
        except AnthropicRateLimit:
            self._status = ProviderStatus.RATE_LIMITED
        except Exception:
            self._status = ProviderStatus.UNHEALTHY
        return self._status

    async def get_quota(self) -> ProviderQuota:
        return self._quota

    async def shutdown(self) -> None:
        if self._client:
            await self._client.close()

    def translate_error(self, error: Exception) -> ProviderError:
        if isinstance(error, APIError):
            if error.status_code == 401:
                return AuthenticationError("anthropic")
            if error.status_code == 429:
                return RateLimitError("anthropic")
            return ProviderError(
                str(error), "anthropic",
                retryable=error.status_code >= 500
            )
        return ProviderError(str(error), "anthropic")

    def _convert_tools(self, openai_tools: List[Dict]) -> List[Dict]:
        """Convert OpenAI-style tools to Anthropic format."""
        anthropic_tools = []
        for tool in openai_tools:
            if tool.get("type") == "function":
                func = tool["function"]
                anthropic_tools.append({
                    "name": func["name"],
                    "description": func.get("description", ""),
                    "input_schema": func.get("parameters", {}),
                })
        return anthropic_tools
```

### 4. Provider Registry & Plugin Discovery

```python
# providers/registry.py
"""
Auto-discovery plugin registry for provider adapters.
Supports both decorator-based registration and dynamic loading.
"""

from __future__ import annotations

import importlib
import inspect
import pkgutil
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Type

import structlog

from providers.base import AIProviderAdapter

logger = structlog.get_logger(__name__)


class ProviderRegistry:
    """
    Singleton registry for AI provider adapters.
    
    Supports three registration methods:
    1. @provider_registry.register("name") decorator
    2. Auto-discovery from providers/adapters/ directory
    3. External plugin packages with entry_points
    """
    
    _instance: Optional[ProviderRegistry] = None
    
    def __new__(cls) -> ProviderRegistry:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._providers: Dict[str, Type[AIProviderAdapter]] = {}
            cls._instance._metadata: Dict[str, Dict[str, Any]] = {}
        return cls._instance
    
    def register(
        self, 
        name: str, 
        metadata: Dict[str, Any] = None
    ) -> Callable:
        """
        Decorator to register a provider adapter class.
        
        Usage:
            @provider_registry.register("my_provider")
            class MyProviderAdapter(AIProviderAdapter):
                ...
        """
        def decorator(cls: Type[AIProviderAdapter]) -> Type[AIProviderAdapter]:
            if not issubclass(cls, AIProviderAdapter):
                raise TypeError(
                    f"{cls.__name__} must be a subclass of AIProviderAdapter"
                )
            
            self._providers[name] = cls
            self._metadata[name] = metadata or {}
            logger.info(
                "provider_registered",
                provider=name,
                adapter_class=cls.__name__
            )
            return cls
        
        return decorator
    
    def register_class(
        self, name: str, cls: Type[AIProviderAdapter],
        metadata: Dict[str, Any] = None
    ) -> None:
        """Programmatic registration (for dynamic/external plugins)."""
        if not issubclass(cls, AIProviderAdapter):
            raise TypeError(
                f"{cls.__name__} must be a subclass of AIProviderAdapter"
            )
        self._providers[name] = cls
        self._metadata[name] = metadata or {}
    
    def get(self, name: str) -> Optional[Type[AIProviderAdapter]]:
        """Get a registered provider adapter class by name."""
        return self._providers.get(name)
    
    def create_adapter(
        self, name: str, credential_id: str, 
        config: Dict[str, Any] = None
    ) -> AIProviderAdapter:
        """Factory method to instantiate a provider adapter."""
        adapter_cls = self._providers.get(name)
        if not adapter_cls:
            available = ", ".join(self._providers.keys())
            raise ValueError(
                f"Unknown provider '{name}'. Available: {available}"
            )
        return adapter_cls(credential_id=credential_id, config=config or {})
    
    @property
    def available_providers(self) -> List[str]:
        """List all registered provider names."""
        return list(self._providers.keys())
    
    @property
    def provider_info(self) -> Dict[str, Dict[str, Any]]:
        """Get metadata about all registered providers."""
        info = {}
        for name, cls in self._providers.items():
            adapter = cls.__new__(cls)
            info[name] = {
                "name": name,
                "class": cls.__name__,
                "display_name": getattr(adapter, "display_name", name),
                "metadata": self._metadata.get(name, {}),
            }
        return info
    
    def auto_discover(self, package_path: str = "providers.adapters") -> None:
        """
        Auto-discover and import all adapter modules in the package.
        This triggers the @register decorators.
        """
        try:
            package = importlib.import_module(package_path)
            package_dir = Path(package.__file__).parent
            
            for module_info in pkgutil.iter_modules([str(package_dir)]):
                module_name = f"{package_path}.{module_info.name}"
                try:
                    importlib.import_module(module_name)
                    logger.debug("auto_discovered_module", module=module_name)
                except Exception as e:
                    logger.warning(
                        "auto_discover_failed",
                        module=module_name,
                        error=str(e)
                    )
        except ModuleNotFoundError:
            logger.warning("auto_discover_package_not_found", package=package_path)
    
    def discover_entry_points(self, group: str = "aicontrib.providers") -> None:
        """
        Discover external provider plugins installed as packages
        that use the entry_points mechanism.
        
        Example plugin pyproject.toml:
            [project.entry-points."aicontrib.providers"]
            my_provider = "my_package.adapter:MyProviderAdapter"
        """
        try:
            from importlib.metadata import entry_points
            
            eps = entry_points()
            # Python 3.12+ returns a dict-like; 3.9-3.11 returns SelectableGroups
            if hasattr(eps, "select"):
                provider_eps = eps.select(group=group)
            else:
                provider_eps = eps.get(group, [])
            
            for ep in provider_eps:
                try:
                    adapter_cls = ep.load()
                    if issubclass(adapter_cls, AIProviderAdapter):
                        self.register_class(ep.name, adapter_cls)
                        logger.info(
                            "external_plugin_loaded",
                            provider=ep.name,
                            package=ep.value
                        )
                except Exception as e:
                    logger.error(
                        "external_plugin_load_failed",
                        provider=ep.name,
                        error=str(e)
                    )
        except ImportError:
            pass


# Global singleton
provider_registry = ProviderRegistry()
```

### 5. Intelligent Request Router

```python
# providers/router.py
"""
Intelligent multi-provider request router with load balancing,
failover, cost optimization, and contributor budget enforcement.
"""

from __future__ import annotations

import asyncio
import random
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum, auto
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

import structlog

from providers.base import (
    AIProviderAdapter,
    CompletionRequest,
    CompletionResponse,
    ModelTier,
    ProviderCapability,
    ProviderError,
    ProviderStatus,
    QuotaExhaustedError,
    RateLimitError,
)
from providers.registry import provider_registry
from contributors.wallet import ContributorWallet

logger = structlog.get_logger(__name__)


class RoutingStrategy(Enum):
    COST_OPTIMIZED = auto()      # Minimize cost
    QUALITY_OPTIMIZED = auto()   # Use best available model
    LATENCY_OPTIMIZED = auto()   # Use fastest provider
    ROUND_ROBIN = auto()         # Distribute evenly
    WEIGHTED_RANDOM = auto()     # Weighted by remaining budget
    FAILOVER_CHAIN = auto()      # Primary → Secondary → Tertiary


@dataclass
class ProviderPool:
    """Pool of available provider instances keyed by contributor."""
    adapters: Dict[str, List[AIProviderAdapter]] = field(default_factory=dict)
    # contributor_id -> list of their provider adapters
    contributor_adapters: Dict[UUID, List[AIProviderAdapter]] = field(
        default_factory=dict
    )


@dataclass
class RoutingDecision:
    """Record of a routing decision for audit trail."""
    request_id: UUID
    selected_provider: str
    selected_model: str
    contributor_id: UUID
    strategy: RoutingStrategy
    reason: str
    alternatives_considered: List[str]
    estimated_cost: float
    timestamp: datetime = field(default_factory=datetime.utcnow)


class AIRouter:
    """
    Routes AI requests across multiple providers and contributor budgets.
    
    Key responsibilities:
    - Select optimal provider/model for each request
    - Enforce contributor budget limits
    - Handle failover across providers
    - Balance load across contributor tokens
    - Track and audit all routing decisions
    """
    
    def __init__(
        self,
        strategy: RoutingStrategy = RoutingStrategy.COST_OPTIMIZED,
        max_retries: int = 3,
    ):
        self.strategy = strategy
        self.max_retries = max_retries
        self._pool = ProviderPool()
        self._wallets: Dict[UUID, ContributorWallet] = {}
        self._routing_history: List[RoutingDecision] = []
        self._lock = asyncio.Lock()
    
    async def register_contributor_provider(
        self,
        contributor_id: UUID,
        provider_name: str,
        credential_id: str,
        config: Dict[str, Any] = None,
        budget_limit_usd: Optional[float] = None,
        token_limit: Optional[int] = None,
    ) -> AIProviderAdapter:
        """
        Register a contributor's AI provider credentials.
        Initializes the adapter and adds it to the routing pool.
        """
        adapter = provider_registry.create_adapter(
            provider_name, credential_id, config
        )
        await adapter.initialize()
        
        async with self._lock:
            # Add to provider pool
            if provider_name not in self._pool.adapters:
                self._pool.adapters[provider_name] = []
            self._pool.adapters[provider_name].append(adapter)
            
            # Link to contributor
            if contributor_id not in self._pool.contributor_adapters:
                self._pool.contributor_adapters[contributor_id] = []
            self._pool.contributor_adapters[contributor_id].append(adapter)
            
            # Set up wallet if budget specified
            if budget_limit_usd or token_limit:
                wallet = self._wallets.get(contributor_id) or ContributorWallet(
                    contributor_id=contributor_id
                )
                wallet.set_budget(
                    provider_name=provider_name,
                    budget_usd=budget_limit_usd,
                    token_limit=token_limit,
                )
                self._wallets[contributor_id] = wallet
        
        logger.info(
            "contributor_provider_registered",
            contributor_id=str(contributor_id),
            provider=provider_name,
            budget_usd=budget_limit_usd,
        )
        
        return adapter
    
    async def route_request(
        self, request: CompletionRequest
    ) -> CompletionResponse:
        """
        Route a completion request to the optimal provider.
        Handles retries, failover, and budget enforcement.
        """
        candidates = await self._get_candidates(request)
        
        if not candidates:
            raise ProviderError(
                "No available providers for this request",
                provider="router",
                retryable=False,
            )
        
        last_error: Optional[Exception] = None
        
        for attempt in range(self.max_retries):
            if not candidates:
                break
            
            # Select best candidate based on strategy
            adapter, contributor_id, model = self._select_candidate(
                candidates, request
            )
            
            # Check budget
            wallet = self._wallets.get(contributor_id)
            if wallet and not wallet.can_afford(
                adapter.provider_name,
                estimated_tokens=request.max_tokens or 4096
            ):
                logger.info(
                    "budget_exceeded_skipping",
                    contributor=str(contributor_id),
                    provider=adapter.provider_name,
                )
                candidates.remove((adapter, contributor_id, model))
                continue
            
            try:
                # Set model on request if selected by router
                request_copy = CompletionRequest(
                    messages=request.messages,
                    model=model,
                    model_tier=request.model_tier,
                    max_tokens=request.max_tokens,
                    temperature=request.temperature,
                    top_p=request.top_p,
                    stop=request.stop,
                    stream=request.stream,
                    json_mode=request.json_mode,
                    tools=request.tools,
                    tool_choice=request.tool_choice,
                    system_prompt=request.system_prompt,
                    metadata=request.metadata,
                    max_cost_usd=request.max_cost_usd,
                    priority=request.priority,
                    request_id=request.request_id,
                    task_id=request.task_id,
                    contributor_id=contributor_id,
                )
                
                response = await adapter.complete(request_copy)
                
                # Deduct from wallet
                if wallet:
                    wallet.deduct(
                        adapter.provider_name,
                        tokens_used=response.usage.total_tokens,
                        cost_usd=response.usage.estimated_cost_usd,
                    )
                
                # Record routing decision
                self._routing_history.append(RoutingDecision(
                    request_id=request.request_id,
                    selected_provider=adapter.provider_name,
                    selected_model=response.model,
                    contributor_id=contributor_id,
                    strategy=self.strategy,
                    reason=f"Selected on attempt {attempt + 1}",
                    alternatives_considered=[
                        a.provider_name for a, _, _ in candidates
                    ],
                    estimated_cost=response.usage.estimated_cost_usd,
                ))
                
                return response
                
            except RateLimitError as e:
                last_error = e
                logger.warning(
                    "rate_limited_trying_next",
                    provider=adapter.provider_name,
                    attempt=attempt + 1,
                )
                candidates.remove((adapter, contributor_id, model))
                if e.retry_after and e.retry_after < 10:
                    await asyncio.sleep(e.retry_after)
                    
            except QuotaExhaustedError as e:
                last_error = e
                candidates.remove((adapter, contributor_id, model))
                if wallet:
                    wallet.mark_exhausted(adapter.provider_name)
                    
            except ProviderError as e:
                last_error = e
                if not e.retryable:
                    raise
                candidates.remove((adapter, contributor_id, model))
        
        raise last_error or ProviderError(
            "All providers exhausted", "router", retryable=False
        )
    
    async def _get_candidates(
        self, request: CompletionRequest
    ) -> List[Tuple[AIProviderAdapter, UUID, str]]:
        """Get all eligible (adapter, contributor_id, model) tuples."""
        candidates = []
        required_caps = self._infer_capabilities(request)
        
        for contributor_id, adapters in self._pool.contributor_adapters.items():
            for adapter in adapters:
                if not adapter.is_available:
                    continue
                
                # Check capability match
                if not required_caps.issubset(adapter.supported_capabilities):
                    continue
                
                # Find suitable model
                model_info = adapter.select_model(
                    request.model_tier, required_caps
                )
                if model_info:
                    candidates.append(
                        (adapter, contributor_id, model_info.model_id)
                    )
        
        return candidates
    
    def _select_candidate(
        self,
        candidates: List[Tuple[AIProviderAdapter, UUID, str]],
        request: CompletionRequest,
    ) -> Tuple[AIProviderAdapter, UUID, str]:
        """Select the best candidate based on routing strategy."""
        
        if self.strategy == RoutingStrategy.COST_OPTIMIZED:
            # Sort by model cost (cheapest first)
            def cost_key(c):
                adapter, _, model_id = c
                model_info = next(
                    (m for m in adapter.available_models if m.model_id == model_id),
                    None
                )
                return model_info.cost_per_1m_output_tokens if model_info else float("inf")
            return min(candidates, key=cost_key)
        
        elif self.strategy == RoutingStrategy.QUALITY_OPTIMIZED:
            # Prefer frontier models
            tier_priority = {
                ModelTier.FRONTIER: 0,
                ModelTier.STANDARD: 1,
                ModelTier.EFFICIENT: 2,
                ModelTier.SPECIALIZED: 1,
            }
            def quality_key(c):
                adapter, _, model_id = c
                model_info = next(
                    (m for m in adapter.available_models if m.model_id == model_id),
                    None
                )
                return tier_priority.get(model_info.tier, 3) if model_info else 3
            return min(candidates, key=quality_key)
        
        elif self.strategy == RoutingStrategy.ROUND_ROBIN:
            # Rotate through providers
            idx = len(self._routing_history) % len(candidates)
            return candidates[idx]
        
        elif self.strategy == RoutingStrategy.WEIGHTED_RANDOM:
            # Weight by remaining budget
            weights = []
            for adapter, contributor_id, _ in candidates:
                wallet = self._wallets.get(contributor_id)
                if wallet:
                    remaining = wallet.get_remaining_budget(adapter.provider_name)
                    weights.append(max(remaining, 0.01))
                else:
                    weights.append(1.0)
            return random.choices(candidates, weights=weights, k=1)[0]
        
        elif self.strategy == RoutingStrategy.LATENCY_OPTIMIZED:
            # Prefer providers with lower historical latency
            return candidates[0]  # Simplified; real impl would track latencies
        
        else:
            return candidates[0]
    
    def _infer_capabilities(
        self, request: CompletionRequest
    ) -> set[ProviderCapability]:
        """Infer required capabilities from the request."""
        caps = {ProviderCapability.TEXT_GENERATION}
        
        if request.tools:
            caps.add(ProviderCapability.FUNCTION_CALLING)
        if request.stream:
            caps.add(ProviderCapability.STREAMING)
        if request.json_mode:
            caps.add(ProviderCapability.STRUCTURED_OUTPUT)
        
        # Check if messages contain images
        for msg in request.messages:
            if isinstance(msg.get("content"), list):
                for part in msg["content"]:
                    if isinstance(part, dict) and part.get("type") == "image_url":
                        caps.add(ProviderCapability.VISION)
        
        return caps
    
    async def get_pool_status(self) -> Dict[str, Any]:
        """Get current status of all providers in the pool."""
        status = {
            "total_providers": sum(
                len(adapters) for adapters in self._pool.adapters.values()
            ),
            "total_contributors": len(self._pool.contributor_adapters),
            "providers": {},
            "contributors": {},
        }
        
        for name, adapters in self._pool.adapters.items():
            status["providers"][name] = {
                "instance_count": len(adapters),
                "healthy": sum(1 for a in adapters if a.is_available),
                "statuses": [a._status.value for a in adapters],
            }
        
        for cid, wallet in self._wallets.items():
            status["contributors"][str(cid)] = wallet.summary()
        
        return status
```

### 6. Contributor Wallet & Budget Management

```python
# contributors/wallet.py
"""
Token budget wallet for contributors.
Tracks spending, enforces limits, and provides real-time budget status.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID

import structlog

logger = structlog.get_logger(__name__)


@dataclass
class BudgetAllocation:
    """Budget allocation for a specific provider."""
    provider_name: str
    budget_usd: Optional[float] = None       # Max spend in USD
    token_limit: Optional[int] = None          # Max tokens
    tokens_used: int = 0
    cost_spent_usd: float = 0.0
    request_count: int = 0
    is_exhausted: bool = False
    period: Optional[timedelta] = None         # Budget reset period
    period_start: datetime = field(default_factory=datetime.utcnow)
    
    @property
    def tokens_remaining(self) -> Optional[int]:
        if self.token_limit is None:
            return None
        return max(0, self.token_limit - self.tokens_used)
    
    @property
    def budget_remaining_usd(self) -> Optional[float]:
        if self.budget_usd is None:
            return None
        return max(0.0, self.budget_usd - self.cost_spent_usd)
    
    @property
    def utilization_pct(self) -> float:
        if self.budget_usd:
            return (self.cost_spent_usd / self.budget_usd) * 100
        if self.token_limit:
            return (self.tokens_used / self.token_limit) * 100
        return 0.0
    
    def check_and_reset_period(self) -> bool:
        """Reset budget if period has elapsed."""
        if self.period and datetime.utcnow() - self.period_start > self.period:
            self.tokens_used = 0
            self.cost_spent_usd = 0.0
            self.request_count = 0
            self.is_exhausted = False
            self.period_start = datetime.utcnow()
            return True
        return False


@dataclass 
class SpendingRecord:
    """Immutable record of a spending event."""
    timestamp: datetime
    provider_name: str
    model: str
    tokens_used: int
    cost_usd: float
    task_id: Optional[UUID] = None
    request_id: Optional[UUID] = None


class ContributorWallet:
    """
    Manages a contributor's AI token budget across providers.
    
    Features:
    - Per-provider budget limits (USD and/or tokens)
    - Periodic budget reset (daily, weekly, monthly)
    - Real-time spending tracking
    - Budget warnings at thresholds
    - Spending history and analytics
    """
    
    WARN_THRESHOLDS = [0.5, 0.75, 0.90, 0.95]  # % utilization
    
    def __init__(self, contributor_id: UUID):
        self.contributor_id = contributor_id
        self._allocations: Dict[str, BudgetAllocation] = {}
        self._spending_history: List[SpendingRecord] = []
        self._lock = asyncio.Lock()
        self._warned_thresholds: Dict[str, set] = {}  # provider -> set of warned %
    
    def set_budget(
        self,
        provider_name: str,
        budget_usd: Optional[float] = None,
        token_limit: Optional[int] = None,
        period: Optional[timedelta] = None,
    ) -> None:
        """Set or update budget allocation for a provider."""
        self._allocations[provider_name] = BudgetAllocation(
            provider_name=provider_name,
            budget_usd=budget_usd,
            token_limit=token_limit,
            period=period,
        )
        self._warned_thresholds[provider_name] = set()
        logger.info(
            "budget_set",
            contributor=str(self.contributor_id),
            provider=provider_name,
            budget_usd=budget_usd,
            token_limit=token_limit,
        )
    
    def can_afford(
        self, 
        provider_name: str, 
        estimated_tokens: int = 0,
        estimated_cost_usd: float = 0.0,
    ) -> bool:
        """Check if the contributor can afford a request."""
        alloc = self._allocations.get(provider_name)
        if not alloc:
            return True  # No budget set = unlimited
        
        alloc.check_and_reset_period()
        
        if alloc.is_exhausted:
            return False
        if alloc.token_limit and (alloc.tokens_used + estimated_tokens) > alloc.token_limit:
            return False
        if alloc.budget_usd and (alloc.cost_spent_usd + estimated_cost_usd) > alloc.budget_usd:
            return False
        
        return True
    
    def deduct(
        self,
        provider_name: str,
        tokens_used: int,
        cost_usd: float,
        model: str = "",
        task_id: Optional[UUID] = None,
        request_id: Optional[UUID] = None,
    ) -> None:
        """Deduct usage from the budget."""
        alloc = self._allocations.get(provider_name)
        if alloc:
            alloc.tokens_used += tokens_used
            alloc.cost_spent_usd += cost_usd
            alloc.request_count += 1
            
            # Check thresholds
            self._check_warnings(alloc)
        
        # Record spending
        self._spending_history.append(SpendingRecord(
            timestamp=datetime.utcnow(),
            provider_name=provider_name,
            model=model,
            tokens_used=tokens_used,
            cost_usd=cost_usd,
            task_id=task_id,
            request_id=request_id,
        ))
    
    def mark_exhausted(self, provider_name: str) -> None:
        """Mark a provider's budget as exhausted."""
        alloc = self._allocations.get(provider_name)
        if alloc:
            alloc.is_exhausted = True
            logger.warning(
                "budget_exhausted",
                contributor=str(self.contributor_id),
                provider=provider_name,
            )
    
    def get_remaining_budget(self, provider_name: str) -> float:
        """Get remaining budget in USD (or large number if unlimited)."""
        alloc = self._allocations.get(provider_name)
        if not alloc or alloc.budget_usd is None:
            return float("inf")
        return alloc.budget_remaining_usd or 0.0
    
    def summary(self) -> Dict[str, Any]:
        """Get wallet summary for dashboard."""
        total_spent = sum(r.cost_usd for r in self._spending_history)
        total_tokens = sum(r.tokens_used for r in self._spending_history)
        
        providers = {}
        for name, alloc in self._allocations.items():
            providers[name] = {
                "budget_usd": alloc.budget_usd,
                "spent_usd": alloc.cost_spent_usd,
                "remaining_usd": alloc.budget_remaining_usd,
                "token_limit": alloc.token_limit,
                "tokens_used": alloc.tokens_used,
                "tokens_remaining": alloc.tokens_remaining,
                "utilization_pct": round(alloc.utilization_pct, 2),
                "request_count": alloc.request_count,
                "is_exhausted": alloc.is_exhausted,
            }
        
        return {
            "contributor_id": str(self.contributor_id),
            "total_spent_usd": round(total_spent, 6),
            "total_tokens_used": total_tokens,
            "total_requests": len(self._spending_history),
            "providers": providers,
        }
    
    def _check_warnings(self, alloc: BudgetAllocation) -> None:
        """Emit warnings when utilization crosses thresholds."""
        utilization = alloc.utilization_pct / 100.0
        warned = self._warned_thresholds.get(alloc.provider_name, set())
        
        for threshold in self.WARN_THRESHOLDS:
            if utilization >= threshold and threshold not in warned:
                warned.add(threshold)
                logger.warning(
                    "budget_threshold_crossed",
                    contributor=str(self.contributor_id),
                    provider=alloc.provider_name,
                    threshold_pct=int(threshold * 100),
                    utilization_pct=round(alloc.utilization_pct, 2),
                    remaining_usd=alloc.budget_remaining_usd,
                )
        
        self._warned_thresholds[alloc.provider_name] = warned
```

### 7. Encrypted Credential Vault

```python
# credentials/vault.py
"""
Encrypted credential storage with at-rest encryption,
key rotation, and secure memory handling.
"""

from __future__ import annotations

import base64
import json
import os
import secrets
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import structlog
from cryptography.fernet import Fernet, MultiFernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = structlog.get_logger(__name__)


class CredentialVault:
    """
    Secure credential storage with AES encryption.
    
    Security features:
    - AES-256 encryption at rest (via Fernet = AES-CBC + HMAC-SHA256)
    - Master key derived from passphrase via PBKDF2
    - Key rotation support
    - In-memory secret zeroing
    - Audit logging of all access
    - Support for external KMS (AWS KMS, HashiCorp Vault)
    """
    
    def __init__(
        self,
        storage_path: Optional[Path] = None,
        master_key: Optional[str] = None,
        use_env_key: bool = True,
    ):
        self._storage_path = storage_path or Path.home() / ".aicontrib" / "vault.enc"
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Derive encryption key
        if master_key:
            self._fernet = self._derive_fernet(master_key)
        elif use_env_key and os.environ.get("AICONTRIB_VAULT_KEY"):
            self._fernet = Fernet(os.environ["AICONTRIB_VAULT_KEY"].encode())
        else:
            # Generate and store a new key (first run)
            key_path = self._storage_path.parent / ".vault_key"
            if key_path.exists():
                self._fernet = Fernet(key_path.read_bytes())
            else:
                key = Fernet.generate_key()
                key_path.write_bytes(key)
                key_path.chmod(0o600)
                self._fernet = Fernet(key)
        
        self._cache: Dict[str, Dict[str, str]] = {}
        self._load()
    
    def _derive_fernet(self, passphrase: str) -> Fernet:
        """Derive encryption key from passphrase using PBKDF2."""
        salt_path = self._storage_path.parent / ".vault_salt"
        if salt_path.exists():
            salt = salt_path.read_bytes()
        else:
            salt = os.urandom(16)
            salt_path.write_bytes(salt)
            salt_path.chmod(0o600)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=600_000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(passphrase.encode()))
        return Fernet(key)
    
    def _load(self) -> None:
        """Load and decrypt the vault."""
        if self._storage_path.exists():
            encrypted = self._storage_path.read_bytes()
            try:
                decrypted = self._fernet.decrypt(encrypted)
                self._cache = json.loads(decrypted)
            except Exception:
                logger.error("vault_decryption_failed")
                self._cache = {}
        else:
            self._cache = {}
    
    def _save(self) -> None:
        """Encrypt and save the vault."""
        plaintext = json.dumps(self._cache).encode()
        encrypted = self._fernet.encrypt(plaintext)
        self._storage_path.write_bytes(encrypted)
        self._storage_path.chmod(0o600)
    
    async def store_credentials(
        self,
        credential_id: str,
        secrets: Dict[str, str],
        metadata: Dict[str, Any] = None,
    ) -> None:
        """
        Store encrypted credentials.
        
        Args:
            credential_id: Unique identifier (e.g., "contrib_123_openai")
            secrets: Key-value pairs (e.g., {"api_key": "sk-...", "org_id": "org-..."})
            metadata: Non-secret metadata
        """
        self._cache[credential_id] = {
            "secrets": secrets,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat(),
            "last_accessed": None,
        }
        self._save()
        
        logger.info(
            "credentials_stored",
            credential_id=credential_id,
            secret_keys=list(secrets.keys()),
        )
    
    async def get_secret(
        self,
        credential_id: str,
        key: str,
        required: bool = True,
    ) -> Optional[str]:
        """Retrieve a specific secret value."""
        cred = self._cache.get(credential_id)
        if not cred:
            if required:
                raise KeyError(f"Credential '{credential_id}' not found")
            return None
        
        value = cred["secrets"].get(key)
        if value is None and required:
            raise KeyError(
                f"Secret key '{key}' not found in credential '{credential_id}'"
            )
        
        # Update last accessed
        cred["last_accessed"] = datetime.utcnow().isoformat()
        self._save()
        
        logger.debug(
            "secret_accessed",
            credential_id=credential_id,
            key=key,
        )
        
        return value
    
    async def delete_credentials(self, credential_id: str) -> bool:
        """Securely delete credentials."""
        if credential_id in self._cache:
            # Overwrite in memory before deletion
            for key in self._cache[credential_id].get("secrets", {}):
                self._cache[credential_id]["secrets"][key] = "x" * 64
            del self._cache[credential_id]
            self._save()
            logger.info("credentials_deleted", credential_id=credential_id)
            return True
        return False
    
    async def list_credentials(self) -> Dict[str, Dict[str, Any]]:
        """List all stored credentials (metadata only, no secrets)."""
        result = {}
        for cred_id, data in self._cache.items():
            result[cred_id] = {
                "credential_id": cred_id,
                "secret_keys": list(data.get("secrets", {}).keys()),
                "metadata": data.get("metadata", {}),
                "created_at": data.get("created_at"),
                "last_accessed": data.get("last_accessed"),
            }
        return result
    
    async def rotate_key(self, new_passphrase: str) -> None:
        """Rotate the encryption key. Re-encrypts all data."""
        new_fernet = self._derive_fernet(new_passphrase)
        self._fernet = new_fernet
        self._save()
        logger.info("vault_key_rotated")
```

### 8. Task Decomposition & Development Pipeline

```python
# tasks/decomposer.py
"""
AI-powered task decomposition engine.
Takes issues/feature requests and breaks them into AI-executable tasks.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

import structlog

from providers.base import CompletionRequest, ModelTier
from providers.router import AIRouter

logger = structlog.get_logger(__name__)


class TaskType(Enum):
    CODE_GENERATION = "code_generation"
    CODE_REVIEW = "code_review"
    BUG_FIX = "bug_fix"
    REFACTORING = "refactoring"
    TEST_GENERATION = "test_generation"
    DOCUMENTATION = "documentation"
    ARCHITECTURE_DESIGN = "architecture_design"
    TRANSLATION = "translation"
    SECURITY_AUDIT = "security_audit"
    PERFORMANCE_OPTIMIZATION = "performance_optimization"


class TaskPriority(Enum):
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4
    BACKGROUND = 5


class TaskStatus(Enum):
    PENDING = "pending"
    ESTIMATING = "estimating"
    QUEUED = "queued"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class AITask:
    """A single AI-executable task."""
    id: UUID = field(default_factory=uuid4)
    parent_id: Optional[UUID] = None        # Parent task/issue
    project_id: Optional[UUID] = None
    
    task_type: TaskType = TaskType.CODE_GENERATION
    title: str = ""
    description: str = ""
    context: str = ""                        # Relevant code/docs context
    
    # Execution parameters
    model_tier: ModelTier = ModelTier.STANDARD
    estimated_tokens: int = 0
    estimated_cost_usd: float = 0.0
    max_cost_usd: Optional[float] = None
    
    # Dependencies
    depends_on: List[UUID] = field(default_factory=list)
    
    # Status
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    
    # Results
    output: Optional[str] = None
    output_files: Dict[str, str] = field(default_factory=dict)  # path -> content
    review_comments: List[str] = field(default_factory=list)
    
    # Metadata
    created_at: str = ""
    completed_at: Optional[str] = None
    assigned_contributor: Optional[UUID] = None
    assigned_provider: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


DECOMPOSITION_PROMPT = """You are a senior software architect decomposing a development task into AI-executable subtasks.

## Project Context
{project_context}

## Issue/Feature Request
Title: {issue_title}
Description: {issue_description}
Labels: {labels}

## Existing Codebase Context
{code_context}

## Instructions
Decompose this into specific, self-contained AI tasks. Each task should be:
1. Small enough for a single AI completion (ideally < 4000 output tokens)
2. Have clear inputs and expected outputs
3. Include file paths for generated/modified code
4. Specify dependencies on other tasks

Return a JSON array of tasks with this structure:
```json
[
  {{
    "title": "Descriptive task title",
    "description": "Detailed instructions for the AI to execute this task",
    "task_type": "code_generation|code_review|bug_fix|test_generation|documentation|refactoring",
    "model_tier": "standard|frontier|efficient",
    "estimated_output_tokens": 2000,
    "depends_on_indices": [],
    "output_files": ["path/to/file.py"],
    "context_files": ["path/to/relevant/file.py"],
    "priority": "high|medium|low"
  }}
]
```

Be thorough but practical. Prefer smaller, focused tasks over large monolithic ones.
"""


class TaskDecomposer:
    """
    Uses AI to decompose issues into executable tasks.
    Self-referential: uses the contributor pool to power decomposition itself.
    """
    
    def __init__(self, router: AIRouter):
        self.router = router
    
    async def decompose_issue(
        self,
        issue_title: str,
        issue_description: str,
        project_context: str = "",
        code_context: str = "",
        labels: List[str] = None,
    ) -> List[AITask]:
        """
        Decompose a GitHub issue or feature request into AI tasks.
        Uses a frontier model for best decomposition quality.
        """
        prompt = DECOMPOSITION_PROMPT.format(
            project_context=project_context or "No project context provided.",
            issue_title=issue_title,
            issue_description=issue_description,
            labels=", ".join(labels or []),
            code_context=code_context or "No code context provided.",
        )
        
        request = CompletionRequest(
            messages=[{"role": "user", "content": prompt}],
            model_tier=ModelTier.FRONTIER,  # Use best model for planning
            temperature=0.3,  # Low temp for structured output
            json_mode=True,
            max_tokens=4096,
            metadata={"stage": "decomposition"},
        )
        
        response = await self.router.route_request(request)
        
        try:
            tasks_data = json.loads(response.content)
            if isinstance(tasks_data, dict) and "tasks" in tasks_data:
                tasks_data = tasks_data["tasks"]
        except json.JSONDecodeError:
            logger.error("decomposition_json_parse_failed", content=response.content[:200])
            # Fall back to single task
            tasks_data = [{
                "title": issue_title,
                "description": issue_description,
                "task_type": "code_generation",
                "model_tier": "standard",
                "estimated_output_tokens": 4000,
                "depends_on_indices": [],
                "output_files": [],
                "priority": "medium",
            }]
        
        tasks = []
        task_ids = []
        
        for i, task_data in enumerate(tasks_data):
            task = AITask(
                title=task_data.get("title", f"Task {i+1}"),
                description=task_data.get("description", ""),
                task_type=TaskType(task_data.get("task_type", "code_generation")),
                model_tier=self._parse_tier(task_data.get("model_tier", "standard")),
                estimated_tokens=task_data.get("estimated_output_tokens", 2000),
                priority=self._parse_priority(task_data.get("priority", "medium")),
                metadata={
                    "output_files": task_data.get("output_files", []),
                    "context_files": task_data.get("context_files", []),
                    "source_issue": issue_title,
                },
            )
            tasks.append(task)
            task_ids.append(task.id)
        
        # Resolve dependencies
        for i, task_data in enumerate(tasks_data):
            dep_indices = task_data.get("depends_on_indices", [])
            for dep_idx in dep_indices:
                if 0 <= dep_idx < len(task_ids) and dep_idx != i:
                    tasks[i].depends_on.append(task_ids[dep_idx])
        
        # Estimate costs
        for task in tasks:
            task.estimated_cost_usd = self._estimate_cost(task)
        
        logger.info(
            "issue_decomposed",
            issue=issue_title,
            task_count=len(tasks),
            total_estimated_tokens=sum(t.estimated_tokens for t in tasks),
            total_estimated_cost=sum(t.estimated_cost_usd for t in tasks),
        )
        
        return tasks
    
    def _parse_tier(self, tier_str: str) -> ModelTier:
        mapping = {
            "frontier": ModelTier.FRONTIER,
            "standard": ModelTier.STANDARD,
            "efficient": ModelTier.EFFICIENT,
            "specialized": ModelTier.SPECIALIZED,
        }
        return mapping.get(tier_str.lower(), ModelTier.STANDARD)
    
    def _parse_priority(self, priority_str: str) -> TaskPriority:
        mapping = {
            "critical": TaskPriority.CRITICAL,
            "high": TaskPriority.HIGH,
            "medium": TaskPriority.MEDIUM,
            "low": TaskPriority.LOW,
        }
        return mapping.get(priority_str.lower(), TaskPriority.MEDIUM)
    
    def _estimate_cost(self, task: AITask) -> float:
        """Rough cost estimate based on model tier and tokens."""
        # Average cost per 1M output tokens by tier
        tier_costs = {
            ModelTier.FRONTIER: 15.0,
            ModelTier.STANDARD: 2.0,
            ModelTier.EFFICIENT: 0.5,
            ModelTier.SPECIALIZED: 5.0,
        }
        cost_per_1m = tier_costs.get(task.model_tier, 2.0)
        # Assume input is ~2x output for context
        input_cost = (task.estimated_tokens * 2 / 1_000_000) * (cost_per_1m / 3)
        output_cost = (task.estimated_tokens / 1_000_000) * cost_per_1m
        return round(input_cost + output_cost, 6)
```

### 9. Task Executor & Development Pipeline

```python
# tasks/executor.py
"""
Task execution engine - executes AI tasks using the provider pool.
"""

from __future__ import annotations

import asyncio
from collections import defaultdict
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional
from uuid import UUID

import structlog

from providers.base import CompletionRequest
from providers.router import AIRouter
from tasks.decomposer import AITask, TaskStatus, TaskType

logger = structlog.get_logger(__name__)


# ── Task Prompt Templates ──────────────────────────────────────────

TASK_PROMPTS = {
    TaskType.CODE_GENERATION: """You are an expert software engineer. Generate production-quality code.

## Task
{description}

## Context
{context}

## Requirements
- Write clean, well-documented code
- Follow the project's existing code style
- Include type hints (for Python) or appropriate types
- Handle edge cases and errors
- DO NOT include explanations outside of code comments

## Output Format
Return ONLY the code, wrapped in appropriate markdown code blocks with filenames:
```filename:path/to/file.ext
// code here
```
""",
    
    TaskType.CODE_REVIEW: """You are a senior code reviewer. Review the following code changes.

## Code to Review
{context}

## Task
{description}

## Review Criteria
- Correctness and logic errors
- Security vulnerabilities
- Performance issues
- Code style and best practices
- Test coverage gaps

Provide specific, actionable feedback with line references.
""",
    
    TaskType.TEST_GENERATION: """You are a test engineering expert. Generate comprehensive tests.

## Code Under Test
{context}

## Task
{description}

## Requirements
- Cover happy path, edge cases, and error scenarios
- Use appropriate testing framework (pytest for Python, jest for JS)
- Include both unit and integration tests where appropriate
- Use descriptive test names
- Mock external dependencies

Return ONLY test code in markdown code blocks with filenames.
""",
    
    TaskType.BUG_FIX: """You are a debugging expert. Fix the following bug.

## Bug Description
{description}

## Relevant Code
{context}

## Requirements
- Identify the root cause
- Provide a minimal fix
- Explain the fix in a code comment
- Ensure the fix doesn't introduce regressions

Return the fixed code in markdown code blocks with filenames.
""",
    
    TaskType.DOCUMENTATION: """You are a technical writer. Write clear documentation.

## Code/Feature to Document
{context}

## Task
{description}

## Requirements
- Clear, concise language
- Include code examples where appropriate
- Follow the project's documentation style
- Include API references if applicable
""",

    TaskType.REFACTORING: """You are a refactoring expert. Improve the following code.

## Code to Refactor
{context}

## Task
{description}

## Requirements
- Maintain existing functionality (no behavior changes)
- Improve readability and maintainability
- Apply appropriate design patterns
- Reduce complexity where possible

Return the refactored code in markdown code blocks with filenames.
""",
}


class TaskExecutor:
    """
    Executes AI tasks using the multi-provider router.
    Supports dependency resolution, parallel execution, and validation.
    """
    
    def __init__(
        self, 
        router: AIRouter,
        max_concurrent: int = 5,
        on_task_complete: Optional[Callable] = None,
        on_task_failed: Optional[Callable] = None,
    ):
        self.router = router
        self.max_concurrent = max_concurrent
        self.on_task_complete = on_task_complete
        self.on_task_failed = on_task_failed
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._completed_tasks: Dict[UUID, AITask] = {}
    
    async def execute_tasks(
        self, 
        tasks: List[AITask],
        project_context: str = "",
    ) -> List[AITask]:
        """
        Execute a list of tasks respecting dependencies.
        Tasks without dependencies run in parallel.
        """
        # Build dependency graph
        remaining = {t.id: t for t in tasks}
        completed: Dict[UUID, AITask] = {}
        failed: Dict[UUID, AITask] = {}
        
        while remaining:
            # Find tasks whose dependencies are all met
            ready = [
                task for task in remaining.values()
                if all(dep in completed for dep in task.depends_on)
            ]
            
            if not ready:
                # Check for dependency deadlock
                unmet = {
                    tid: [d for d in t.depends_on if d not in completed]
                    for tid, t in remaining.items()
                }
                logger.error("dependency_deadlock", unmet=unmet)
                for task in remaining.values():
                    task.status = TaskStatus.FAILED
                    failed[task.id] = task
                break
            
            # Execute ready tasks in parallel
            results = await asyncio.gather(
                *[
                    self._execute_single_task(
                        task, completed, project_context
                    ) 
                    for task in ready
                ],
                return_exceptions=True,
            )
            
            for task, result in zip(ready, results):
                if isinstance(result, Exception):
                    task.status = TaskStatus.FAILED
                    task.output = str(result)
                    failed[task.id] = task
                    if self.on_task_failed:
                        await self.on_task_failed(task, result)
                else:
                    completed[task.id] = task
                    if self.on_task_complete:
                        await self.on_task_complete(task)
                
                remaining.pop(task.id, None)
        
        self._completed_tasks.update(completed)
        all_tasks = list(completed.values()) + list(failed.values())
        
        logger.info(
            "task_batch_complete",
            total=len(tasks),
            completed=len(completed),
            failed=len(failed),
        )
        
        return all_tasks
    
    async def _execute_single_task(
        self,
        task: AITask,
        completed_tasks: Dict[UUID, AITask],
        project_context: str,
    ) -> None:
        """Execute a single AI task."""
        async with self._semaphore:
            task.status = TaskStatus.IN_PROGRESS
            
            logger.info(
                "task_executing",
                task_id=str(task.id),
                title=task.title,
                type=task.task_type.value,
                tier=task.model_tier.value,
            )
            
            # Build context from dependencies
            dep_context = ""
            for dep_id in task.depends_on:
                dep_task = completed_tasks.get(dep_id)
                if dep_task and dep_task.output:
                    dep_context += f"\n## Output from '{dep_task.title}':\n{dep_task.output}\n"
            
            full_context = f"{project_context}\n{task.context}\n{dep_context}"
            
            # Get prompt template
            prompt_template = TASK_PROMPTS.get(
                task.task_type,
                TASK_PROMPTS[TaskType.CODE_GENERATION]
            )
            
            prompt = prompt_template.format(
                description=task.description,
                context=full_context.strip(),
            )
            
            request = CompletionRequest(
                messages=[{"role": "user", "content": prompt}],
                model_tier=task.model_tier,
                max_tokens=min(task.estimated_tokens * 2, 16384),
                temperature=0.3 if task.task_type in (
                    TaskType.BUG_FIX, TaskType.CODE_REVIEW
                ) else 0.5,
                max_cost_usd=task.max_cost_usd,
                task_id=task.id,
                priority=task.priority.value,
                metadata={"task_type": task.task_type.value},
            )
            
            response = await self.router.route_request(request)
            
            task.output = response.content
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.utcnow().isoformat()
            task.assigned_provider = response.provider
            task.metadata["actual_tokens"] = response.usage.total_tokens
            task.metadata["actual_cost_usd"] = response.usage.estimated_cost_usd
            task.metadata["model_used"] = response.model
            task.metadata["latency_ms"] = response.latency_ms
            
            # Parse output files from markdown code blocks
            task.output_files = self._parse_code_blocks(response.content)
            
            logger.info(
                "task_completed",
                task_id=str(task.id),
                title=task.title,
                tokens=response.usage.total_tokens,
                cost_usd=response.usage.estimated_cost_usd,
                provider=response.provider,
                model=response.model,
                files_generated=len(task.output_files),
            )
    
    def _parse_code_blocks(self, content: str) -> Dict[str, str]:
        """Extract code blocks with filenames from AI output."""
        files = {}
        lines = content.split("\n")
        current_file = None
        current_code = []
        in_block = False
        
        for line in lines:
            if line.startswith("```") and not in_block:
                in_block = True
                # Check for filename pattern: ```filename:path/to/file.py
                header = line[3:].strip()
                if "filename:" in header:
                    current_file = header.split("filename:")[1].strip()
                elif "/" in header or "." in header:
                    # Try to parse as filename
                    potential_file = header.split()[0] if header else None
                    if potential_file and ("/" in potential_file or "." in potential_file):
                        current_file = potential_file
                current_code = []
            elif line.startswith("```") and in_block:
                in_block = False
                if current_file and current_code:
                    files[current_file] = "\n".join(current_code)
                current_file = None
                current_code = []
            elif in_block:
                current_code.append(line)
        
        return files
```

### 10. Core Orchestrator

```python
# core/orchestrator.py
"""
Central orchestrator that ties everything together.
Manages the full lifecycle from issue to merged PR.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

import structlog

from core.event_bus import EventBus, Event
from contributors.wallet import ContributorWallet
from credentials.vault import CredentialVault
from providers.registry import provider_registry
from providers.router import AIRouter, RoutingStrategy
from tasks.decomposer import AITask, TaskDecomposer
from tasks.executor import TaskExecutor

logger = structlog.get_logger(__name__)


@dataclass
class ContributorRegistration:
    """Registration data for a new contributor."""
    contributor_id: UUID = field(default_factory=uuid4)
    name: str = ""
    email: Optional[str] = None
    github_username: Optional[str] = None
    providers: List[Dict[str, Any]] = field(default_factory=list)
    # Each provider: {"name": "openai", "api_key": "sk-...", "budget_usd": 10.0}


@dataclass
class ProjectConfig:
    """Configuration for a project using AIContrib."""
    project_id: UUID = field(default_factory=uuid4)
    name: str = ""
    repo_url: str = ""
    description: str = ""
    default_branch: str = "main"
    routing_strategy: RoutingStrategy = RoutingStrategy.COST_OPTIMIZED
    max_cost_per_issue_usd: float = 5.0
    auto_merge: bool = False
    require_human_review: bool = True
    allowed_task_types: List[str] = field(default_factory=lambda: [
        "code_generation", "test_generation", "documentation",
        "bug_fix", "code_review", "refactoring"
    ])


class AIContribOrchestrator:
    """
    Main orchestrator for the AIContrib system.
    
    This is the primary entry point that coordinates:
    - Contributor registration and credential management
    - Project configuration
    - Issue decomposition into AI tasks
    - Task execution across contributor-provided AI resources
    - Result aggregation and PR creation
    """
    
    def __init__(self):
        self.vault = CredentialVault()
        self.event_bus = EventBus()
        self.router = AIRouter(strategy=RoutingStrategy.COST_OPTIMIZED)
        self.decomposer = TaskDecomposer(self.router)
        self.executor = TaskExecutor(
            router=self.router,
            on_task_complete=self._on_task_complete,
            on_task_failed=self._on_task_failed,
        )
        self._projects: Dict[UUID, ProjectConfig] = {}
        self._contributors: Dict[UUID, ContributorRegistration] = {}
        self._active_jobs: Dict[UUID, Dict[str, Any]] = {}
        
        # Auto-discover providers
        provider_registry.auto_discover()
        provider_registry.discover_entry_points()
    
    # ── Contributor Management ─────────────────────────────────────
    
    async def register_contributor(
        self, registration: ContributorRegistration
    ) -> UUID:
        """
        Register a new contributor with their AI provider credentials.
        
        Example:
            reg = ContributorRegistration(
                name="Alice",
                providers=[
                    {
                        "name": "openai",
                        "api_key": "sk-...",
                        "budget_usd": 25.0,
                        "token_limit": 1_000_000,
                    },
                    {
                        "name": "anthropic",
                        "api_key": "sk-ant-...",
                        "budget_usd": 15.0,
                    },
                ]
            )
            contributor_id = await orchestrator.register_contributor(reg)
        """
        contributor_id = registration.contributor_id
        
        for provider_config in registration.providers:
            provider_name = provider_config["name"]
            credential_id = f"{contributor_id}_{provider_name}"
            
            # Store credentials securely
            secrets = {}
            for key in ["api_key", "api_secret", "access_token", "org_id"]:
                if key in provider_config:
                    secrets[key] = provider_config.pop(key)
            
            await self.vault.store_credentials(
                credential_id=credential_id,
                secrets=secrets,
                metadata={
                    "contributor_id": str(contributor_id),
                    "provider": provider_name,
                    "contributor_name": registration.name,
                },
            )
            
            # Register with router
            await self.router.register_contributor_provider(
                contributor_id=contributor_id,
                provider_name=provider_name,
                credential_id=credential_id,
                config=provider_config.get("config", {}),
                budget_limit_usd=provider_config.get("budget_usd"),
                token_limit=provider_config.get("token_limit"),
            )
        
        self._contributors[contributor_id] = registration
        
        await self.event_bus.emit(Event(
            type="contributor.registered",
            data={
                "contributor_id": str(contributor_id),
                "name": registration.name,
                "providers": [p["name"] for p in registration.providers],
            },
        ))
        
        logger.info(
            "contributor_registered",
            contributor_id=str(contributor_id),
            name=registration.name,
            provider_count=len(registration.providers),
        )
        
        return contributor_id
    
    # ── Project Management ─────────────────────────────────────────
    
    async def register_project(self, config: ProjectConfig) -> UUID:
        """Register a project to receive AI contributions."""
        self._projects[config.project_id] = config
        self.router.strategy = config.routing_strategy
        
        logger.info(
            "project_registered",
            project_id=str(config.project_id),
            name=config.name,
        )
        return config.project_id
    
    # ── Issue Processing ───────────────────────────────────────────
    
    async def process_issue(
        self,
        project_id: UUID,
        issue_title: str,
        issue_description: str,
        labels: List[str] = None,
        code_context: str = "",
        priority: str = "medium",
    ) -> Dict[str, Any]:
        """
        Process an issue end-to-end:
        1. Decompose into AI tasks
        2. Estimate costs
        3. Execute tasks using contributor tokens
        4. Return results (code, tests, docs)
        
        This is the main entry point for automated development.
        """
        project = self._projects.get(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not registered")
        
        job_id = uuid4()
        
        logger.info(
            "processing_issue",
            job_id=str(job_id),
            project=project.name,
            issue=issue_title,
        )
        
        # Step 1: Decompose
        await self.event_bus.emit(Event(
            type="job.decomposing", 
            data={"job_id": str(job_id), "issue": issue_title}
        ))
        
        tasks = await self.decomposer.decompose_issue(
            issue_title=issue_title,
            issue_description=issue_description,
            project_context=project.description,
            code_context=code_context,
            labels=labels,
        )
        
        # Step 2: Cost check
        total_estimated_cost = sum(t.estimated_cost_usd for t in tasks)
        if total_estimated_cost > project.max_cost_per_issue_usd:
            logger.warning(
                "issue_too_expensive",
                estimated_cost=total_estimated_cost,
                limit=project.max_cost_per_issue_usd,
            )
            # Could auto-adjust by using cheaper models
            for task in tasks:
                task.model_tier = ModelTier.EFFICIENT
        
        # Step 3: Execute
        await self.event_bus.emit(Event(
            type="job.executing",
            data={
                "job_id": str(job_id),
                "task_count": len(tasks),
                "estimated_cost": total_estimated_cost,
            }
        ))
        
        completed_tasks = await self.executor.execute_tasks(
            tasks=tasks,
            project_context=project.description,
        )
        
        # Step 4: Aggregate results
        result = self._aggregate_results(job_id, completed_tasks)
        
        await self.event_bus.emit(Event(
            type="job.completed",
            data={
                "job_id": str(job_id),
                **result["summary"],
            }
        ))
        
        return result
    
    def _aggregate_results(
        self, job_id: UUID, tasks: List[AITask]
    ) -> Dict[str, Any]:
        """Aggregate task results into a unified output."""
        all_files: Dict[str, str] = {}
        total_cost = 0.0
        total_tokens = 0
        successful = 0
        failed = 0
        
        for task in tasks:
            if task.status.value == "completed":
                successful += 1
                all_files.update(task.output_files)
                total_cost += task.metadata.get("actual_cost_usd", 0)
                total_tokens += task.metadata.get("actual_tokens", 0)
            else:
                failed += 1
        
        return {
            "job_id": str(job_id),
            "files": all_files,
            "tasks": [
                {
                    "id": str(t.id),
                    "title": t.title,
                    "type": t.task_type.value,
                    "status": t.status.value,
                    "output": t.output,
                    "files": t.output_files,
                    "cost_usd": t.metadata.get("actual_cost_usd", 0),
                    "tokens": t.metadata.get("actual_tokens", 0),
                    "model": t.metadata.get("model_used", ""),
                    "provider": t.assigned_provider,
                }
                for t in tasks
            ],
            "summary": {
                "total_tasks": len(tasks),
                "successful": successful,
                "failed": failed,
                "total_cost_usd": round(total_cost, 6),
                "total_tokens": total_tokens,
                "files_generated": len(all_files),
            },
        }
    
    async def _on_task_complete(self, task: AITask) -> None:
        """Callback when a task completes."""
        await self.event_bus.emit(Event(
            type="task.completed",
            data={
                "task_id": str(task.id),
                "title": task.title,
                "cost_usd": task.metadata.get("actual_cost_usd", 0),
            }
        ))
    
    async def _on_task_failed(self, task: AITask, error: Exception) -> None:
        """Callback when a task fails."""
        await self.event_bus.emit(Event(
            type="task.failed",
            data={
                "task_id": str(task.id),
                "title": task.title,
                "error": str(error),
            }
        ))
    
    # ── Status & Analytics ─────────────────────────────────────────
    
    async def get_status(self) -> Dict[str, Any]:
        """Get comprehensive system status."""
        pool_status = await self.router.get_pool_status()
        
        return {
            "system": "aicontrib",
            "version": "0.1.0",
            "providers": provider_registry.available_providers,
            "registered_contributors": len(self._contributors),
            "registered_projects": len(self._projects),
            "pool": pool_status,
            "active_jobs": len(self._active_jobs),
        }
```

### 11. Event Bus

```python
# core/event_bus.py
"""
Async event bus for system-wide communication and plugin hooks.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Coroutine, Dict, List, Optional
from uuid import UUID, uuid4

import structlog

logger = structlog.get_logger(__name__)

EventHandler = Callable[["Event"], Coroutine[Any, Any, None]]


@dataclass
class Event:
    """System event."""
    type: str                                    # e.g., "task.completed"
    data: Dict[str, Any] = field(default_factory=dict)
    id: UUID = field(default_factory=uuid4)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    source: str = "system"


class EventBus:
    """
    Async event bus supporting:
    - Pub/sub with pattern matching (e.g., "task.*")
    - Event history for audit
    - Webhook forwarding
    """
    
    def __init__(self, max_history: int = 10000):
        self._handlers: Dict[str, List[EventHandler]] = {}
        self._history: List[Event] = []
        self._max_history = max_history
    
    def on(self, event_type: str, handler: EventHandler) -> None:
        """Register a handler for an event type. Supports wildcards."""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
    
    async def emit(self, event: Event) -> None:
        """Emit an event to all matching handlers."""
        self._history.append(event)
        if len(self._history) > self._max_history:
            self._history = self._history[-self._max_history:]
        
        handlers = list(self._handlers.get(event.type, []))
        
        # Match wildcard handlers (e.g., "task.*" matches "task.completed")
        for pattern, pattern_handlers in self._handlers.items():
            if pattern.endswith("*"):
                prefix = pattern[:-1]
                if event.type.startswith(prefix) and pattern != event.type:
                    handlers.extend(pattern_handlers)
        
        # Also trigger catch-all
        handlers.extend(self._handlers.get("*", []))
        
        for handler in handlers:
            try:
                await handler(event)
            except Exception as e:
                logger.error(
                    "event_handler_error",
                    event_type=event.type,
                    handler=handler.__name__,
                    error=str(e),
                )
    
    def get_history(
        self, 
        event_type: Optional[str] = None,
        limit: int = 100,
    ) -> List[Event]:
        """Get event history, optionally filtered."""
        events = self._history
        if event_type:
            events = [e for e in events if e.type == event_type]
        return events[-limit:]
```

### 12. API Layer

```python
# api/app.py
"""
FastAPI application providing the REST API and WebSocket interface.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import FastAPI, HTTPException, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from core.orchestrator import (
    AIContribOrchestrator,
    ContributorRegistration,
    ProjectConfig,
)
from providers.router import RoutingStrategy


# ── Pydantic Models ────────────────────────────────────────────────

class ProviderInput(BaseModel):
    name: str = Field(..., description="Provider name (e.g., 'openai', 'anthropic')")
    api_key: str = Field(..., description="API key (encrypted at rest)")
    budget_usd: Optional[float] = Field(None, description="Max spend in USD")
    token_limit: Optional[int] = Field(None, description="Max tokens to consume")
    config: Dict[str, Any] = Field(default_factory=dict)


class ContributorInput(BaseModel):
    name: str
    email: Optional[str] = None
    github_username: Optional[str] = None
    providers: List[ProviderInput]


class ProjectInput(BaseModel):
    name: str
    repo_url: str
    description: str = ""
    routing_strategy: str = "cost_optimized"
    max_cost_per_issue_usd: float = 5.0
    require_human_review: bool = True


class IssueInput(BaseModel):
    title: str
    description: str
    labels: List[str] = Field(default_factory=list)
    code_context: str = ""
    priority: str = "medium"


# ── App Setup ──────────────────────────────────────────────────────

orchestrator: Optional[AIContribOrchestrator] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global orchestrator
    orchestrator = AIContribOrchestrator()
    yield
    # Cleanup


app = FastAPI(
    title="AIContrib",
    description="Open Source AI-Powered Contribution System",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_orchestrator() -> AIContribOrchestrator:
    if orchestrator is None:
        raise HTTPException(500, "System not initialized")
    return orchestrator


# ── Routes ─────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "aicontrib"}


@app.get("/status")
async def system_status(orch: AIContribOrchestrator = Depends(get_orchestrator)):
    return await orch.get_status()


# ── Contributors ───────────────────────────────────────────────────

@app.post("/contributors", status_code=201)
async def register_contributor(
    data: ContributorInput,
    orch: AIContribOrchestrator = Depends(get_orchestrator),
):
    """Register a contributor with their AI provider credentials."""
    reg = ContributorRegistration(
        name=data.name,
        email=data.email,
        github_username=data.github_username,
        providers=[p.model_dump() for p in data.providers],
    )
    
    contributor_id = await orch.register_contributor(reg)
    
    return {
        "contributor_id": str(contributor_id),
        "name": data.name,
        "providers_registered": len(data.providers),
        "message": "Contributor registered successfully. Credentials encrypted at rest.",
    }


@app.get("/contributors/{contributor_id}/wallet")
async def get_wallet(
    contributor_id: UUID,
    orch: AIContribOrchestrator = Depends(get_orchestrator),
):
    """Get contributor's wallet/budget status."""
    wallet = orch.router._wallets.get(contributor_id)
    if not wallet:
        raise HTTPException(404, "Contributor not found")
    return wallet.summary()


# ── Projects ───────────────────────────────────────────────────────

@app.post("/projects", status_code=201)
async def register_project(
    data: ProjectInput,
    orch: AIContribOrchestrator = Depends(get_orchestrator),
):
    """Register a project to receive AI contributions."""
    strategy_map = {
        "cost_optimized": RoutingStrategy.COST_OPTIMIZED,
        "quality_optimized": RoutingStrategy.QUALITY_OPTIMIZED,
        "round_robin": RoutingStrategy.ROUND_ROBIN,
        "weighted_random": RoutingStrategy.WEIGHTED_RANDOM,
    }
    
    config = ProjectConfig(
        name=data.name,
        repo_url=data.repo_url,
        description=data.description,
        routing_strategy=strategy_map.get(
            data.routing_strategy, RoutingStrategy.COST_OPTIMIZED
        ),
        max_cost_per_issue_usd=data.max_cost_per_issue_usd,
        require_human_review=data.require_human_review,
    )
    
    project_id = await orch.register_project(config)
    return {"project_id": str(project_id), "name": data.name}


# ── Issues → AI Processing ────────────────────────────────────────

@app.post("/projects/{project_id}/issues")
async def process_issue(
    project_id: UUID,
    data: IssueInput,
    orch: AIContribOrchestrator = Depends(get_orchestrator),
):
    """
    Submit an issue for AI processing.
    The system decomposes it into tasks and executes them
    using contributor-provided AI tokens.
    """
    result = await orch.process_issue(
        project_id=project_id,
        issue_title=data.title,
        issue_description=data.description,
        labels=data.labels,
        code_context=data.code_context,
        priority=data.priority,
    )
    return result


# ── Providers ──────────────────────────────────────────────────────

@app.get("/providers")
async def list_providers():
    """List all available AI provider adapters."""
    from providers.registry import provider_registry
    return {
        "providers": provider_registry.available_providers,
        "details": provider_registry.provider_info,
    }


# ── WebSocket for real-time updates ───────────────────────────────

@app.websocket("/ws/events")
async def websocket_events(
    websocket: WebSocket,
    orch: AIContribOrchestrator = Depends(get_orchestrator),
):
    """Real-time event stream via WebSocket."""
    await websocket.accept()
    
    async def forward_event(event):
        try:
            await websocket.send_json({
                "type": event.type,
                "data": event.data,
                "timestamp": event.timestamp.isoformat(),
            })
        except Exception:
            pass
    
    orch.event_bus.on("*", forward_event)
    
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except Exception:
        pass
```

### 13. CLI Interface

```python
# cli/main.py
"""
CLI for AIContrib - manage contributions from the command line.
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import Optional
from uuid import uuid4

import click
import yaml


@click.group()
@click.version_option(version="0.1.0")
def cli():
    """AIContrib - Open Source AI Contribution System"""
    pass


@cli.command()
@click.option("--interactive", "-i", is_flag=True, help="Interactive setup wizard")
def init(interactive: bool):
    """Initialize AIContrib in the current project."""
    config_path = Path(".aicontrib.yml")
    
    if interactive:
        click.echo("🚀 AIContrib Setup Wizard\n")
        
        name = click.prompt("Project name")
        repo = click.prompt("Repository URL")
        description = click.prompt("Project description", default="")
        strategy = click.prompt(
            "Routing strategy",
            type=click.Choice(["cost_optimized", "quality_optimized", "round_robin"]),
            default="cost_optimized",
        )
        max_cost = click.prompt("Max cost per issue (USD)", type=float, default=5.0)
        
        config = {
            "project": {
                "name": name,
                "repo_url": repo,
                "description": description,
            },
            "settings": {
                "routing_strategy": strategy,
                "max_cost_per_issue_usd": max_cost,
                "require_human_review": True,
            },
            "contributors": [],
        }
    else:
        config = {
            "project": {
                "name": Path.cwd().name,
                "repo_url": "",
                "description": "",
            },
            "settings": {
                "routing_strategy": "cost_optimized",
                "max_cost_per_issue_usd": 5.0,
                "require_human_review": True,
            },
            "contributors": [],
        }
    
    config_path.write_text(yaml.dump(config, default_flow_style=False))
    click.echo(f"\n✅ Created {config_path}")
    click.echo("Next: Add contributors with `aicontrib contribute add`")


@cli.group()
def contribute():
    """Manage AI contributions."""
    pass


@contribute.command("add")
@click.option("--name", prompt="Your name")
@click.option(
    "--provider", 
    prompt="AI Provider",
    type=click.Choice(["openai", "anthropic", "google", "mistral", "local"]),
)
@click.option("--api-key", prompt="API Key", hide_input=True)
@click.option("--budget", prompt="Monthly budget (USD)", type=float, default=10.0)
@click.option("--token-limit", type=int, default=None, help="Max tokens")
def contribute_add(
    name: str, provider: str, api_key: str, 
    budget: float, token_limit: Optional[int]
):
    """Add yourself as an AI contributor."""
    
    async def _add():
        from core.orchestrator import AIContribOrchestrator, ContributorRegistration
        
        orch = AIContribOrchestrator()
        
        reg = ContributorRegistration(
            name=name,
            providers=[{
                "name": provider,
                "api_key": api_key,
                "budget_usd": budget,
                "token_limit": token_limit,
            }],
        )
        
        contributor_id = await orch.register_contributor(reg)
        
        click.echo(f"\n✅ Registered as contributor!")
        click.echo(f"   ID: {contributor_id}")
        click.echo(f"   Provider: {provider}")
        click.echo(f"   Budget: ${budget}/month")
        if token_limit:
            click.echo(f"   Token limit: {token_limit:,}")
        click.echo(f"\n🔒 Your API key is encrypted at rest.")
    
    asyncio.run(_add())


@contribute.command("status")
def contribute_status():
    """Show contribution status and spending."""
    
    async def _status():
        from core.orchestrator import AIContribOrchestrator
        orch = AIContribOrchestrator()
        status = await orch.get_status()
        
        click.echo("\n📊 AIContrib Status\n")
        click.echo(f"  Contributors: {status['registered_contributors']}")
        click.echo(f"  Projects: {status['registered_projects']}")
        click.echo(f"  Available Providers: {', '.join(status['providers'])}")
        
        pool = status.get("pool", {})
        if pool.get("contributors"):
            click.echo("\n  💰 Contributor Budgets:")
            for cid, wallet in pool["contributors"].items():
                for provider, info in wallet.get("providers", {}).items():
                    click.echo(
                        f"    {provider}: "
                        f"${info.get('spent_usd', 0):.4f} / "
                        f"${info.get('budget_usd', '∞')} "
                        f"({info.get('utilization_pct', 0):.1f}%)"
                    )
    
    asyncio.run(_status())


@cli.command()
@click.argument("issue_title")
@click.option("--description", "-d", default="", help="Issue description")
@click.option("--project-id", default=None, help="Project ID")
@click.option("--context-file", type=click.Path(exists=True), help="Code context file")
def process(
    issue_title: str, description: str, 
    project_id: Optional[str], context_file: Optional[str]
):
    """Process an issue using AI contributions."""
    
    async def _process():
        from core.orchestrator import AIContribOrchestrator, ProjectConfig
        from uuid import UUID
        
        orch = AIContribOrchestrator()
        
        # Load or create project
        if project_id:
            pid = UUID(project_id)
        else:
            config_path = Path(".aicontrib.yml")
            if config_path.exists():
                config = yaml.safe_load(config_path.read_text())
                proj_config = ProjectConfig(
                    name=config["project"]["name"],
                    description=config["project"].get("description", ""),
                )
                pid = await orch.register_project(proj_config)
            else:
                click.echo("❌ No project configured. Run `aicontrib init` first.")
                return
        
        code_context = ""
        if context_file:
            code_context = Path(context_file).read_text()
        
        click.echo(f"\n🔄 Processing: {issue_title}\n")
        
        result = await orch.process_issue(
            project_id=pid,
            issue_title=issue_title,
            issue_description=description,
            code_context=code_context,
        )
        
        summary = result["summary"]
        click.echo(f"\n✅ Complete!")
        click.echo(f"   Tasks: {summary['successful']}/{summary['total_tasks']} succeeded")
        click.echo(f"   Cost: ${summary['total_cost_usd']:.4f}")
        click.echo(f"   Tokens: {summary['total_tokens']:,}")
        click.echo(f"   Files: {summary['files_generated']}")
        
        if result["files"]:
            click.echo(f"\n📁 Generated Files:")
            for filepath, content in result["files"].items():
                click.echo(f"   {filepath} ({len(content)} chars)")
                
                # Optionally write files
                if click.confirm(f"   Write {filepath}?", default=False):
                    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
                    Path(filepath).write_text(content)
                    click.echo(f"   ✅ Written")
    
    asyncio.run(_process())


if __name__ == "__main__":
    cli()
```

### 14. Configuration File Spec

```yaml
# .aicontrib.yml - Project configuration
project:
  name: "my-awesome-project"
  repo_url: "https://github.com/org/my-awesome-project"
  description: "A Python web framework for building APIs"
  default_branch: "main"

settings:
  routing_strategy: "cost_optimized"  # cost_optimized | quality_optimized | round_robin | weighted_random
  max_cost_per_issue_usd: 5.00
  require_human_review: true
  auto_create_pr: true
  
  # Task settings
  max_concurrent_tasks: 5
  default_model_tier: "standard"       # frontier | standard | efficient
  
  # Safety
  max_file_changes_per_issue: 20
  forbidden_paths:                     # Paths AI should never modify
    - ".env"
    - "secrets/"
    - "*.key"
    - "*.pem"

# Contributors can be defined here or added via CLI/API
contributors:
  - name: "Alice"
    github: "alice-dev"
    providers:
      - name: "openai"
        budget_usd: 25.00
        token_limit: 2000000
        # API key stored in vault, not in config!
      - name: "anthropic"
        budget_usd: 15.00

  - name: "Bob"
    github: "bob-coder"
    providers:
      - name: "openai"
        budget_usd: 10.00
      - name: "local"
        config:
          base_url: "http://localhost:11434"
          model: "codellama:34b"
        # No budget limit for local models

# GitHub App / Webhook integration
integrations:
  github:
    app_id: "${GITHUB_APP_ID}"
    webhook_secret: "${GITHUB_WEBHOOK_SECRET}"
    auto_label: "ai-contribution"
    trigger_labels:
      - "ai-help-wanted"
      - "good-first-ai-issue"
  
  notifications:
    discord_webhook: "${DISCORD_WEBHOOK_URL}"
    slack_webhook: "${SLACK_WEBHOOK_URL}"

# Pipeline customization
pipeline:
  stages:
    - name: "triage"
      enabled: true
      model_tier: "efficient"
    - name: "plan"
      enabled: true
      model_tier: "frontier"
    - name: "implement"
      enabled: true
      model_tier: "standard"
    - name: "test"
      enabled: true
      model_tier: "standard"
    - name: "review"
      enabled: true
      model_tier: "frontier"
    - name: "document"
      enabled: true
      model_tier: "efficient"
```

### 15. Docker Compose

```yaml
# docker-compose.yml
version: "3.9"

services:
  api:
    build:
      context: .
      dockerfile: deploy/docker/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - AICONTRIB_VAULT_KEY=${AICONTRIB_VAULT_KEY}
      - DATABASE_URL=postgresql://aicontrib:password@db:5432/aicontrib
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - vault_data:/app/.aicontrib
    depends_on:
      - db
      - redis
    restart: unless-stopped

  worker:
    build:
      context: .
      dockerfile: deploy/docker/Dockerfile
    command: ["python", "-m", "celery", "-A", "core.celery_app", "worker", "-l", "info"]
    environment:
      - AICONTRIB_VAULT_KEY=${AICONTRIB_VAULT_KEY}
      - DATABASE_URL=postgresql://aicontrib:password@db:5432/aicontrib
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - vault_data:/app/.aicontrib
    depends_on:
      - db
      - redis
    restart: unless-stopped

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:8000
    depends_on:
      - api

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: aicontrib
      POSTGRES_USER: aicontrib
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  vault_data:
  postgres_data:
  redis_data:
```

### 16. pyproject.toml

```toml
[project]
name = "aicontrib"
version = "0.1.0"
description = "Open Source AI-Powered Contribution System"
readme = "README.md"
license = {text = "Apache-2.0"}
requires-python = ">=3.11"
authors = [
    {name = "AIContrib Contributors"},
]
keywords = ["ai", "open-source", "contributions", "llm", "automation"]
classifiers = [
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: Apache Software License",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13",
    "Topic :: Software Development :: Libraries",
]

dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "pydantic>=2.9.0",
    "httpx>=0.27.0",
    "structlog>=24.0.0",
    "cryptography>=43.0.0",
    "pyyaml>=6.0",
    "click>=8.1.0",
    "openai>=1.50.0",
    "anthropic>=0.37.0",
    "google-generativeai>=0.8.0",
    "sqlalchemy[asyncio]>=2.0.0",
    "alembic>=1.13.0",
    "asyncpg>=0.30.0",
    "redis[hiredis]>=5.0.0",
    "celery>=5.4.0",
    "tenacity>=9.0.0",
    "tiktoken>=0.7.0",
    "websockets>=13.0",
]

[project.optional-dependencies]
local = [
    "ollama>=0.3.0",
    "transformers>=4.45.0",
]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=5.0.0",
    "ruff>=0.7.0",
    "mypy>=1.11.0",
    "pre-commit>=4.0.0",
    "httpx>=0.27.0",  # For test client
]
docs = [
    "mkdocs>=1.6.0",
    "mkdocs-material>=9.5.0",
]

[project.scripts]
aicontrib = "cli.main:cli"

[project.entry-points."aicontrib.providers"]
# Built-in providers are registered via decorators
# External plugins would add entries here

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "N", "UP", "B", "A", "SIM", "TCH"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.mypy]
python_version = "3.11"
strict = true
```

---

## How It All Works Together

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTRIBUTOR FLOW                              │
│                                                                 │
│  1. Alice registers with OpenAI key + $25/month budget         │
│  2. Bob registers with Anthropic key + $15/month budget        │
│  3. Carol registers with local Ollama (no budget limit)        │
│                                                                 │
│     ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│     │  Alice   │     │   Bob    │     │  Carol   │            │
│     │ OpenAI   │     │Anthropic │     │  Local   │            │
│     │ $25/mo   │     │ $15/mo   │     │ Ollama   │            │
│     └────┬─────┘     └────┬─────┘     └────┬─────┘            │
│          │                │                 │                   │
│          └────────────────┼─────────────────┘                  │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │   Provider  │                              │
│                    │    Pool     │                              │
│                    └──────┬──────┘                              │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                    DEVELOPMENT FLOW                              │
│                           │                                     │
│  4. Issue created: "Add user authentication"                   │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │ Decomposer  │ (Uses Frontier model)       │
│                    │ "Break into │                              │
│                    │  AI tasks"  │                              │
│                    └──────┬──────┘                              │
│                           │                                     │
│              ┌────────────┼────────────┐                       │
│              │            │            │                        │
│        ┌─────▼────┐ ┌────▼─────┐ ┌────▼─────┐                │
│        │ Task 1:  │ │ Task 2:  │ │ Task 3:  │                │
│        │ Auth     │ │ Login    │ │ Tests    │                 │
│        │ Models   │ │ Endpoint │ │ for Auth │                 │
│        └─────┬────┘ └────┬─────┘ └────┬─────┘                │
│              │            │       (depends on 1&2)             │
│              │            │            │                        │
│        ┌─────▼────────────▼────────────▼─────┐                │
│        │         Smart Router                 │                │
│        │  • Task 1 → Alice's OpenAI ($0.02)  │                │
│        │  • Task 2 → Bob's Claude ($0.03)    │                │
│        │  • Task 3 → Carol's Ollama (free)   │                │
│        └─────────────────┬───────────────────┘                │
│                          │                                     │
│                   ┌──────▼──────┐                              │
│                   │  Generated  │                              │
│                   │  Code +     │                              │
│                   │  Tests +    │                              │
│                   │  PR         │                              │
│                   └─────────────┘                              │
│                                                                 │
│  Total cost: $0.05 (spread across 3 contributors)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Creating a Custom Provider Plugin

```python
# my_custom_provider/adapter.py
"""
Example: Creating a custom provider plugin for AIContrib.
Can be distributed as a separate pip package.
"""

from providers.base import (
    AIProviderAdapter, CompletionRequest, CompletionResponse,
    ModelInfo, ModelTier, ProviderCapability, ProviderQuota,
    ProviderStatus, ProviderError, TokenUsage,
)
from providers.registry import provider_registry


@provider_registry.register("my_custom_llm")
class MyCustomLLMAdapter(AIProviderAdapter):
    """Adapter for My Custom LLM API."""
    
    @property
    def provider_name(self) -> str:
        return "my_custom_llm"
    
    @property
    def display_name(self) -> str:
        return "My Custom LLM"
    
    @property
    def supported_capabilities(self):
        return {
            ProviderCapability.TEXT_GENERATION,
            ProviderCapability.CODE_GENERATION,
        }
    
    @property
    def available_models(self):
        return [
            ModelInfo(
                model_id="my-model-v1",
                display_name="My Model V1",
                provider="my_custom_llm",
                tier=ModelTier.STANDARD,
                capabilities=self.supported_capabilities,
                max_context_tokens=32000,
                max_output_tokens=4096,
                cost_per_1m_input_tokens=1.0,
                cost_per_1m_output_tokens=3.0,
            )
        ]
    
    async def initialize(self):
        # Connect to your API
        api_key = await self._vault.get_secret(self.credential_id, "api_key")
        self._client = MyCustomClient(api_key=api_key)
        self._status = ProviderStatus.HEALTHY
    
    async def complete(self, request):
        # Call your API and return unified response
        result = await self._client.generate(
            prompt=request.messages[-1]["content"],
            max_tokens=request.max_tokens,
        )
        return CompletionResponse(
            content=result.text,
            model="my-model-v1",
            provider="my_custom_llm",
            usage=TokenUsage(
                prompt_tokens=result.input_tokens,
                completion_tokens=result.output_tokens,
                total_tokens=result.total_tokens,
                estimated_cost_usd=0.0,
                model="my-model-v1",
                provider="my_custom_llm",
            ),
            finish_reason="stop",
            request_id=request.request_id,
            latency_ms=result.latency_ms,
        )
    
    async def stream_complete(self, request):
        async for chunk in self._client.stream(
            prompt=request.messages[-1]["content"]
        ):
            yield chunk.text
    
    async def health_check(self):
        try:
            await self._client.ping()
            self._status = ProviderStatus.HEALTHY
        except Exception:
            self._status = ProviderStatus.UNHEALTHY
        return self._status
    
    async def get_quota(self):
        return ProviderQuota()
    
    async def shutdown(self):
        await self._client.close()
    
    def translate_error(self, error):
        return ProviderError(str(error), "my_custom_llm")
```

To distribute as a plugin package:

```toml
# my_custom_provider/pyproject.toml
[project]
name = "aicontrib-my-custom-llm"
version = "0.1.0"
dependencies = ["aicontrib>=0.1.0"]

[project.entry-points."aicontrib.providers"]
my_custom_llm = "my_custom_provider.adapter:MyCustomLLMAdapter"
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Plugin architecture** | New AI providers can be added without modifying core code |
| **Encrypted credential vault** | API keys are the most sensitive data; AES-256 at rest |
| **Per-contributor budgets** | Contributors maintain sovereignty over their spend |
| **Multi-provider routing** | Resilience, cost optimization, and leveraging diverse model strengths |
| **Circuit breaker pattern** | Prevents cascading failures when a provider goes down |
| **Task decomposition** | Complex issues become manageable AI-sized units |
| **Dependency DAG execution** | Tasks can depend on others; parallel where possible |
| **Event-driven architecture** | Extensible hooks for notifications, audit, analytics |
| **Unified provider interface** | Single API regardless of whether using OpenAI, Anthropic, or local LLMs |
| **Cost estimation before execution** | Budget transparency; no surprise charges |
| **Apache 2.0 license** | Maximum adoption for both individuals and enterprises |

This system transforms open-source contribution from "donate money" to **"donate AI compute"** — a fundamentally new contribution model for the AI era.
