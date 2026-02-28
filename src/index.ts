#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { TEMPLATES } from "./templates.js";
import { runPrompts } from "./prompts.js";
import { scaffold } from "./scaffold.js";

async function main() {
  const args = process.argv.slice(2);
  let projectName: string | undefined;
  let templateName: string | undefined;

  // Parse args: army-create [project-name] [--template <name>]
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--template" || arg === "-t") {
      templateName = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      const names = TEMPLATES.map((t) => `    ${t.name.padEnd(8)} ${t.description}`).join("\n");
      console.log(`
  ${pc.bold("army-create")} — scaffold a clawup agent army project

  ${pc.dim("Usage:")}
    npx army-create [project-name] [--template <name>]

  ${pc.dim("Templates:")}
${names}

  ${pc.dim("Examples:")}
    npx army-create my-project
    npx army-create my-project --template army
`);
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      projectName = arg;
    }
  }

  p.intro(pc.bgCyan(pc.black(" army-create ")));

  const choices = await runPrompts({ projectName, templateName });
  const dest = path.resolve(process.cwd(), choices.projectName);

  // Check target directory
  if (fs.existsSync(dest)) {
    const contents = fs.readdirSync(dest);
    if (contents.length > 0) {
      p.log.error(`Directory "${choices.projectName}" already exists and is not empty.`);
      process.exit(1);
    }
  }

  const s = p.spinner();
  s.start("Scaffolding project...");

  try {
    scaffold(dest, choices);
  } catch (err) {
    s.stop("Failed to scaffold project.");
    p.log.error(
      err instanceof Error ? err.message : "Unknown error during scaffolding"
    );
    process.exit(1);
  }

  s.stop("Project scaffolded.");

  // Count agents from the template
  const manifestPath = path.join(dest, "clawup.yaml");
  let agentCount = 0;
  if (fs.existsSync(manifestPath)) {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const { parse } = await import("yaml");
    const manifest = parse(raw);
    agentCount = manifest.agents?.length ?? 0;
  }

  p.note(
    [
      `${pc.cyan("cd")} ${choices.projectName}`,
      `${pc.cyan("cp")} .env.example .env     ${pc.dim("# fill in API keys")}`,
      `${pc.cyan("clawup setup")}`,
      `${pc.cyan("clawup deploy")}`,
    ].join("\n"),
    "Next steps"
  );

  p.outro(
    `${pc.green("Done!")} Created ${pc.bold(choices.projectName)} with ${agentCount} agent${agentCount !== 1 ? "s" : ""}.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
