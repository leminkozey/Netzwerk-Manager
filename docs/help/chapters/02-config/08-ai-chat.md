# AI Chat

A floating chat widget on the landing page that connects to a local AI server. Ask questions about your network, get troubleshooting help, or look up device info — all without leaving the dashboard.

## How It Works

The browser never talks to the AI directly. All requests go through the Network Manager server, which proxies them to an Ollama-compatible API backend. This keeps the AI server safely behind your backend.

Network device information from your config (IPs, services, uptime devices, control devices, Pi-hole settings) is automatically appended to the system prompt. This means the AI already knows your network layout and can give specific answers instead of generic advice.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Show or hide the AI chat widget on the landing page. |
| `ollamaHost` | `string` | `'192.168.2.137'` | IP or hostname of the AI server. |
| `ollamaPort` | `number` | `11434` | API port of the AI server. |
| `model` | `string` | `'qwen2.5:7b'` | Model name as known by the AI server. |
| `systemPrompt` | `string` | *(German default)* | Base system prompt. Network info is appended automatically. |

```js
ai: {
  enabled: true,
  ollamaHost: '192.168.2.100',
  ollamaPort: 11434,
  model: 'qwen2.5:7b',
  systemPrompt: 'You are a helpful network assistant. Answer concisely.',
},
```

## Compatible Servers

Any server that implements the Ollama `/api/chat` endpoint format works:

| Server | Default Port | Notes |
|--------|:------------:|-------|
| [Ollama](https://ollama.com) | 11434 | Run `ollama list` to see available models. |
| [LM Studio](https://lmstudio.ai) | 1234 | Enable the local server in settings. |
| [LocalAI](https://localai.io) | 8080 | OpenAI-compatible, also supports Ollama format. |

## Settings Panel

When AI Chat is enabled, a dedicated tab appears in the settings. It shows:

- **Live status** — green (online, model loaded), yellow (online, model not loaded), or red (offline)
- **Host and port** — the configured AI server address
- **Model** — the currently configured model name
- **System prompt** — the base prompt text

The status check queries the AI server's `/api/tags` endpoint to verify both connectivity and model availability.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/ai/chat` | Yes | Send a message. Streams the response via Server-Sent Events. |
| `GET` | `/api/ai/status` | Yes | Check AI server connectivity and model availability. |

## Tips

- The chat keeps up to 20 messages of history per conversation for context.
- Messages are limited to 2000 characters each.
- If the status shows yellow, the model name in your config may not match what's installed on the AI server.
- The system prompt is a good place to set the response language and personality. Network context is always appended regardless of what you put here.
