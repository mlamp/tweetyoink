# TweetYoink Server - Project Prompt

## Project Overview

Build a **multi-model AI agent framework** backend server for the TweetYoink Chrome extension. This server receives tweet data from the extension, processes it using multiple LLM models (Grok, Claude, Gemini, ChatGPT, etc.), and returns analyzed results for display in an overlay UI.

**Important**: This is a **separate repository** from the TweetYoink extension. Do not modify the extension codebase.

---

## Quick Context

### What is TweetYoink?

TweetYoink is a Chrome extension that:
- Captures tweet data from Twitter/X (text, author, metrics, media, URL)
- Sends captured data to a user-configured backend server (this project)
- Displays the server's response in an overlay UI within the browser
- Supports both synchronous (immediate) and asynchronous (polling) responses

### What Does This Server Do?

This server:
1. **Receives** tweet data via HTTP POST requests from the extension
2. **Processes** tweets using pluggable AI agents (each can use different LLM models)
3. **Returns** analysis results as structured content items (text, images, links)
4. **Supports** async processing with polling for long-running LLM tasks

---

## API Contract (MUST FOLLOW)

The server **MUST** implement the OpenAPI 3.0.3 specification defined here:

**📄 API Specification**: https://github.com/mlamp/tweetyoink/blob/main/api-contract.yaml

### Key API Requirements

#### 1. POST `/` - Submit Tweet for Processing

**Request Body**: `TweetData` object containing:
- `text` - Tweet text with emojis preserved
- `url` - Direct link to tweet (e.g., `https://x.com/user/status/123`)
- `author` - Handle, display name, verified status, profile image
- `timestamp` - When tweet was posted (ISO 8601)
- `metrics` - Reply, retweet, like, bookmark, view counts
- `media` - Array of images/videos/GIFs with URLs and alt text
- `linkCard` - Link preview card data (if present)
- `tweetType` - Flags for quote/retweet/reply
- `parent` - Quoted tweet data (if `isQuote = true`)
- `metadata` - Extraction confidence, warnings, duration

**Response Options**:

**Synchronous (Immediate)**:
```json
{
  "status": "completed",
  "result": [
    {
      "type": "text",
      "content": "Sentiment: Positive (95% confidence)",
      "metadata": {
        "title": "Sentiment Analysis",
        "model": "claude-3-5-sonnet"
      }
    },
    {
      "type": "text",
      "content": "Topics: technology, AI, deployment"
    }
  ]
}
```

**Asynchronous (Background Processing)**:
```json
{
  "status": "pending",
  "requestId": "req_1730394123_abc123xyz",
  "estimatedDuration": 30,
  "message": "Tweet queued for AI analysis"
}
```

#### 2. POST `/status` - Check Async Request Status

**Request Body**:
```json
{
  "requestId": "req_1730394123_abc123xyz"
}
```

**Response** (when processing):
```json
{
  "status": "processing",
  "requestId": "req_1730394123_abc123xyz",
  "progress": 0.65,
  "message": "Analyzing tweet with Claude AI..."
}
```

**Response** (when complete):
```json
{
  "status": "completed",
  "result": [
    {
      "type": "text",
      "content": "Analysis complete! Positive sentiment detected."
    }
  ]
}
```

### Response Content Items

The extension displays content items of type `"text"` and `"image"` in the overlay:

```typescript
{
  type: "text" | "image" | "link" | "unknown",
  content: string, // Text string or image URL
  metadata?: {
    title?: string,
    model?: string,
    confidence?: number,
    // ... any additional metadata
  }
}
```

- **`type: "text"`** - Rendered as plain text (XSS-safe via `textContent`)
- **`type: "image"`** - Rendered as `<img>` tag with URL from `content` field
- **`type: "link"`** - Future support (currently ignored)
- **`type: "unknown"`** - Ignored by extension

---

## Technical Requirements

### 1. Language & Framework

**Recommended Stack**: Python + FastAPI + LiteLLM

**Why**:
- **FastAPI**: Modern, fast async web framework with automatic OpenAPI docs
- **LiteLLM**: Unified interface for 100+ LLM providers (Claude, Grok, Gemini, OpenAI, etc.)
- **Python**: Rich AI/ML ecosystem, excellent async support, type hints

**Alternative**: TypeScript/Node.js + Express/Fastify + custom LLM wrappers (if preferred)

### 2. Multi-Model LLM Support

**MUST** support multiple LLM providers:
- **xAI Grok** (`grok-beta`, `grok-vision-beta`)
- **Anthropic Claude** (`claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, etc.)
- **Google Gemini** (`gemini-1.5-pro`, `gemini-1.5-flash`, etc.)
- **OpenAI** (`gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`, etc.)
- **Others**: Mistral, Cohere, Llama, etc. (extensible)

**Use LiteLLM for abstraction**:
```python
import litellm

response = litellm.completion(
    model="grok-beta",  # or "claude-3-5-sonnet", "gpt-4", "gemini-pro"
    messages=[{"role": "user", "content": "Analyze this tweet"}],
    api_key=os.getenv("XAI_API_KEY")
)
```

### 3. Agent Framework Architecture

**Design as a pluggable agent system** where:
- Each agent is **independent** and **configurable**
- Agents can use **different LLM models**
- Agents can be **enabled/disabled** via configuration
- Agents can run **sequentially** or in **parallel**

**Example Agents**:
1. **Sentiment Analyzer** - Uses Claude to detect sentiment
2. **Topic Classifier** - Uses Grok to extract topics/themes
3. **Fact Checker** - Uses GPT-4 to verify claims
4. **Image Describer** - Uses Gemini Vision to describe tweet images
5. **Engagement Predictor** - Uses fine-tuned model to predict virality
6. **Toxicity Detector** - Uses moderation APIs to flag harmful content

**Agent Interface** (Python example):
```python
from abc import ABC, abstractmethod
from typing import List

class Agent(ABC):
    def __init__(self, config: dict):
        self.model = config.get("model", "gpt-3.5-turbo")
        self.enabled = config.get("enabled", True)

    @abstractmethod
    async def process(self, tweet_data: TweetData) -> List[ContentItem]:
        """Process tweet and return content items for overlay display"""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Agent name"""
        pass

class SentimentAgent(Agent):
    @property
    def name(self) -> str:
        return "Sentiment Analyzer"

    async def process(self, tweet_data: TweetData) -> List[ContentItem]:
        # Use LiteLLM to call configured model
        response = await litellm.acompletion(
            model=self.model,  # Could be "claude-3-5-sonnet", "grok-beta", etc.
            messages=[{
                "role": "user",
                "content": f"Analyze sentiment of: {tweet_data.text}"
            }]
        )

        return [ContentItem(
            type="text",
            content=response.choices[0].message.content,
            metadata={"agent": self.name, "model": self.model}
        )]
```

**Agent Registry/Orchestrator**:
```python
class AgentOrchestrator:
    def __init__(self):
        self.agents: List[Agent] = []

    def register(self, agent: Agent):
        if agent.enabled:
            self.agents.append(agent)

    async def process_tweet(self, tweet_data: TweetData) -> List[ContentItem]:
        """Run all registered agents and collect results"""
        results = []

        # Run agents in parallel (or sequentially if dependencies exist)
        tasks = [agent.process(tweet_data) for agent in self.agents]
        agent_results = await asyncio.gather(*tasks)

        for items in agent_results:
            results.extend(items)

        return results
```

### 4. Configuration System

**MUST** support flexible configuration for:
- API keys for each LLM provider
- Which agents are enabled/disabled
- Which model each agent uses
- Agent-specific settings

**Example `config.yaml`**:
```yaml
llm_providers:
  xai:
    api_key: ${XAI_API_KEY}
  anthropic:
    api_key: ${ANTHROPIC_API_KEY}
  google:
    api_key: ${GOOGLE_API_KEY}
  openai:
    api_key: ${OPENAI_API_KEY}

agents:
  sentiment:
    enabled: true
    model: "claude-3-5-sonnet-20241022"
    temperature: 0.3

  topics:
    enabled: true
    model: "grok-beta"
    temperature: 0.5

  fact_check:
    enabled: false
    model: "gpt-4"

  image_analysis:
    enabled: true
    model: "gemini-1.5-pro"
    # Only runs if tweet has media

server:
  host: "0.0.0.0"
  port: 3000
  cors_origins: ["chrome-extension://*"]

async:
  enabled: true
  timeout_seconds: 300  # 5 minutes
  cleanup_after_seconds: 3600  # 1 hour
```

### 5. Async Processing

**Implement background task queue** for long-running LLM requests:
- Use **Celery** + **Redis** (Python)
- Or **Bull** + **Redis** (Node.js)
- Or in-memory queue for simple deployments

**Flow**:
1. POST `/` returns `{ status: "pending", requestId: "..." }`
2. Background worker processes tweet with agents
3. Extension polls POST `/status` every 5 seconds
4. When complete, `/status` returns `{ status: "completed", result: [...] }`

### 6. CORS Configuration

**MUST** allow Chrome extension origins:
```python
# FastAPI example
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://*",  # Allow all Chrome extensions
        "http://localhost:*",    # Allow local development
    ],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)
```

### 7. Error Handling

**Return structured errors** per OpenAPI spec:
```json
{
  "status": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds."
  }
}
```

**Error Codes**:
- `INVALID_TWEET_DATA` - Malformed request
- `UNAUTHORIZED` - Invalid API key
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `AI_TIMEOUT` - LLM request timeout
- `AI_ERROR` - LLM provider error
- `INTERNAL_ERROR` - Server error

### 8. Rate Limiting

**Implement rate limiting** to prevent abuse:
- Per-IP rate limits (e.g., 100 requests/hour)
- Per-user rate limits (if using auth)
- Separate limits for sync vs async endpoints

### 9. Logging & Monitoring

**Log important events**:
- Incoming requests with request ID
- Agent execution time and results
- LLM API calls (model, tokens, cost)
- Errors and warnings

**Include metadata**:
- Request ID for tracing async requests
- Model used for each agent
- Processing duration
- Token usage (for cost tracking)

### 10. Testing

**Provide test harness**:
- Sample tweet data for testing agents
- Mock LLM responses for faster testing
- Unit tests for each agent
- Integration tests for API endpoints

---

## Project Structure (Suggested)

```
tweetyoink-server/
├── README.md
├── requirements.txt (or package.json)
├── config.yaml
├── .env.example
├── main.py (or index.ts)
├── api/
│   ├── routes.py          # FastAPI routes (POST /, POST /status)
│   └── models.py          # Pydantic models from OpenAPI spec
├── agents/
│   ├── base.py            # Agent ABC
│   ├── sentiment.py       # Sentiment analysis agent
│   ├── topics.py          # Topic extraction agent
│   ├── fact_check.py      # Fact checking agent
│   ├── image_analysis.py  # Image description agent
│   └── registry.py        # Agent orchestrator
├── services/
│   ├── llm.py             # LiteLLM wrapper
│   ├── async_tasks.py     # Background task queue
│   └── config.py          # Configuration loading
├── utils/
│   ├── logging.py         # Logging setup
│   └── validation.py      # Input validation
└── tests/
    ├── test_agents.py
    ├── test_api.py
    └── fixtures/
        └── sample_tweets.json
```

---

## Example Agent Implementations

### Sentiment Analysis Agent (Claude)

```python
class SentimentAgent(Agent):
    @property
    def name(self) -> str:
        return "Sentiment Analyzer"

    async def process(self, tweet_data: TweetData) -> List[ContentItem]:
        if not tweet_data.text:
            return []

        prompt = f"""Analyze the sentiment of this tweet and provide:
1. Overall sentiment (Positive/Negative/Neutral)
2. Confidence score (0-100%)
3. Brief explanation

Tweet: {tweet_data.text}"""

        response = await litellm.acompletion(
            model=self.model,  # e.g., "claude-3-5-sonnet-20241022"
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )

        return [ContentItem(
            type="text",
            content=response.choices[0].message.content,
            metadata={
                "agent": self.name,
                "model": self.model,
                "confidence": 0.95
            }
        )]
```

### Topic Extraction Agent (Grok)

```python
class TopicAgent(Agent):
    @property
    def name(self) -> str:
        return "Topic Classifier"

    async def process(self, tweet_data: TweetData) -> List[ContentItem]:
        if not tweet_data.text:
            return []

        prompt = f"""Extract 3-5 main topics from this tweet.
Return as comma-separated list.

Tweet: {tweet_data.text}
Author: @{tweet_data.author.handle}"""

        response = await litellm.acompletion(
            model=self.model,  # e.g., "grok-beta"
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )

        topics = response.choices[0].message.content

        return [ContentItem(
            type="text",
            content=f"🏷️ Topics: {topics}",
            metadata={
                "agent": self.name,
                "model": self.model
            }
        )]
```

### Image Analysis Agent (Gemini Vision)

```python
class ImageAnalysisAgent(Agent):
    @property
    def name(self) -> str:
        return "Image Analyzer"

    async def process(self, tweet_data: TweetData) -> List[ContentItem]:
        if not tweet_data.media:
            return []

        results = []

        for media in tweet_data.media:
            if media.type != "image":
                continue

            response = await litellm.acompletion(
                model=self.model,  # e.g., "gemini-1.5-pro"
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe this image from the tweet."},
                        {"type": "image_url", "image_url": media.url}
                    ]
                }]
            )

            results.append(ContentItem(
                type="text",
                content=f"🖼️ Image: {response.choices[0].message.content}",
                metadata={
                    "agent": self.name,
                    "model": self.model,
                    "image_url": media.url
                }
            ))

        return results
```

---

## Deployment Considerations

### Environment Variables

```bash
# .env file
XAI_API_KEY=your_grok_api_key
ANTHROPIC_API_KEY=your_claude_api_key
GOOGLE_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://localhost/tweetyoink  # Optional

SERVER_HOST=0.0.0.0
SERVER_PORT=3000
```

### Docker Support

Provide `Dockerfile` and `docker-compose.yml` for easy deployment:

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  worker:  # Background task worker
    build: .
    command: celery -A tasks worker
    env_file:
      - .env
    depends_on:
      - redis
```

### Scaling

- **Horizontal scaling**: Run multiple API instances behind load balancer
- **Worker scaling**: Run multiple background workers for async tasks
- **Redis clustering**: For high-volume async request storage

---

## Getting Started Checklist

**Phase 1: Foundation**
- [ ] Set up Python/FastAPI project structure
- [ ] Implement OpenAPI schema validation (use API contract)
- [ ] Add CORS middleware
- [ ] Create POST `/` and POST `/status` routes
- [ ] Add health check endpoint (`GET /health`)

**Phase 2: LLM Integration**
- [ ] Install and configure LiteLLM
- [ ] Test connections to Grok, Claude, Gemini, OpenAI
- [ ] Implement API key management from config
- [ ] Add error handling for LLM failures

**Phase 3: Agent Framework**
- [ ] Create Agent base class (ABC)
- [ ] Implement AgentOrchestrator
- [ ] Build 2-3 sample agents (sentiment, topics)
- [ ] Add agent configuration system

**Phase 4: Async Processing**
- [ ] Set up Redis connection
- [ ] Implement background task queue (Celery/Bull)
- [ ] Create request ID generation (unique, non-guessable)
- [ ] Add request status tracking
- [ ] Implement cleanup of expired requests (1 hour TTL)

**Phase 5: Production Ready**
- [ ] Add rate limiting
- [ ] Implement structured logging
- [ ] Add token usage tracking (for cost monitoring)
- [ ] Write unit tests for agents
- [ ] Write integration tests for API
- [ ] Create Docker deployment
- [ ] Write comprehensive README

**Phase 6: Advanced Features**
- [ ] Add authentication (API key or Bearer token)
- [ ] Implement user quota system
- [ ] Add metrics/analytics dashboard
- [ ] Support webhook callbacks (alternative to polling)
- [ ] Add result caching (same tweet → cached response)

---

## Success Criteria

The server is **production-ready** when:

1. ✅ **API Contract Compliance**: Passes all OpenAPI spec validation
2. ✅ **Multi-Model Support**: Successfully uses Grok, Claude, Gemini, and OpenAI
3. ✅ **Agent Extensibility**: New agents can be added without modifying core code
4. ✅ **Async Processing**: Handles long-running LLM requests (5+ minutes) gracefully
5. ✅ **Error Resilience**: Handles LLM failures, timeouts, and rate limits
6. ✅ **Performance**: Responds to sync requests in <2 seconds
7. ✅ **Documentation**: README explains setup, configuration, and agent development
8. ✅ **Testing**: Unit and integration tests with >80% coverage
9. ✅ **Deployment**: Can be deployed via Docker in <5 minutes

---

## Additional Resources

- **OpenAPI Spec**: https://github.com/mlamp/tweetyoink/blob/main/api-contract.yaml
- **TweetYoink Extension**: https://github.com/mlamp/tweetyoink
- **LiteLLM Docs**: https://docs.litellm.ai/
- **FastAPI Docs**: https://fastapi.tiangolo.com/

---

## Notes for LLM Assistant

When implementing this server:

1. **Start with the API contract** - Use the OpenAPI spec as the source of truth
2. **Keep agents simple** - Start with 2-3 basic agents, add complexity later
3. **Use async/await** - All LLM calls should be async to prevent blocking
4. **Test early** - Verify API contract compliance before adding agents
5. **Log everything** - Request IDs, agent execution, LLM calls, errors
6. **Handle failures gracefully** - LLM APIs will fail, timeout, or rate limit
7. **Make it configurable** - Hardcoded values = pain during deployment
8. **Document as you go** - Future you (and contributors) will thank you

Good luck building! 🚀
