# army-create

> **This project is archived.** The upstream dependency [clawup](https://github.com/stepandel/clawup) has been archived and is no longer maintained. This CLI is no longer functional and will not receive updates.

Scaffold a new [clawup](https://github.com/stepandel/clawup) agent army project from a template.

## Quick Start

```bash
npx army-create my-project
```

Or install globally:

```bash
npm install -g army-create
army-create my-project
```

## What It Does

The CLI walks you through a few prompts and generates a fully configured clawup project with three specialized AI agents:

| Agent | Name | Role |
|-------|------|------|
| PM | Juno | Breaks down tickets, plans work, tracks progress, unblocks teams |
| Engineer | Titus | Leads engineering — coding, shipping, PR reviews |
| Tester | Scout | Quality assurance — bug hunting, verification, edge case testing |

Each agent comes with its own identity (personality, skills, tools, workspace files) and runs [OpenClaw](https://docs.openclaw.ai/) with Claude Code in a Docker sandbox, connected via Tailscale mesh VPN.

## Usage

```
army-create [project-name] [--template <name>]

Options:
  --template, -t   Template to use (default: army)
  --help, -h       Show help and available templates
```

The CLI prompts for:

1. **Project name** — alphanumeric, hyphens, and underscores
2. **Cloud provider** — Hetzner Cloud, AWS, or Local Docker
3. **Region** — provider-specific (e.g., `ash` for Hetzner US, `us-east-1` for AWS)
4. **Instance type** — provider-specific with cost estimates
5. **Owner info** — name, timezone (auto-detected), working hours

## Generated Project Structure

```
my-project/
├── clawup.yaml          # Deployment manifest
├── .env.example         # Required secrets template
├── .gitignore
├── pm/                  # PM agent identity
│   ├── identity.yaml
│   ├── SOUL.md          # Personality & values
│   ├── IDENTITY.md      # Role & responsibilities
│   ├── BOOTSTRAP.md     # Initialization instructions
│   ├── HEARTBEAT.md     # Periodic tasks
│   ├── TOOLS.md         # Available tools
│   ├── USER.md          # Owner-specific context
│   └── skills/          # Agent skills
├── eng/                 # Engineer agent identity
│   └── ...
└── tester/              # Tester agent identity
    └── ...
```

## Next Steps

After scaffolding:

```bash
cd my-project
cp .env.example .env     # Fill in your API keys
clawup setup             # Validate secrets & provision infrastructure
clawup deploy            # Deploy the agent fleet
```

## Required Secrets

The generated `.env.example` lists all required API keys:

- **Infrastructure** — Tailscale auth/API keys, cloud provider token (Hetzner or AWS)
- **AI** — Anthropic API key, Brave Search API key
- **Per-agent** — Slack bot/app tokens, Linear API keys, GitHub tokens (3 sets, one per agent)

## License

MIT
