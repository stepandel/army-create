import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { UserChoices } from "./prompts.js";

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function patchManifest(dest: string, choices: UserChoices): void {
  const manifestPath = path.join(dest, "clawup.yaml");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("Template does not contain a clawup.yaml");
  }

  const raw = fs.readFileSync(manifestPath, "utf-8");
  const manifest = YAML.parse(raw);

  // Patch top-level fields
  manifest.stackName = choices.projectName;
  manifest.provider = choices.provider;
  manifest.region = choices.region;
  manifest.instanceType = choices.instanceType;
  manifest.ownerName = choices.ownerName;
  manifest.timezone = choices.timezone;
  manifest.workingHours = choices.workingHours;

  // Patch templateVars
  if (manifest.templateVars) {
    manifest.templateVars.OWNER_NAME = choices.ownerName;
    manifest.templateVars.TIMEZONE = choices.timezone;
    manifest.templateVars.WORKING_HOURS = choices.workingHours;
  }

  // Update provider-specific secrets
  patchSecrets(manifest, choices.provider);

  const doc = new YAML.Document(manifest);
  fs.writeFileSync(manifestPath, doc.toString(), "utf-8");
}

function patchSecrets(
  manifest: Record<string, unknown>,
  provider: string
): void {
  const secrets = (manifest.secrets ?? {}) as Record<string, string>;

  // Remove provider-specific keys that don't apply
  if (provider !== "hetzner") {
    delete secrets.hcloudToken;
  } else if (!secrets.hcloudToken) {
    secrets.hcloudToken = "${env:HCLOUD_TOKEN}";
  }

  // Ensure tailscale keys are present for non-local
  if (provider !== "local") {
    if (!secrets.tailscaleAuthKey) secrets.tailscaleAuthKey = "${env:TAILSCALE_AUTH_KEY}";
    if (!secrets.tailnetDnsName) secrets.tailnetDnsName = "${env:TAILNET_DNS_NAME}";
  } else {
    delete secrets.tailscaleAuthKey;
    delete secrets.tailnetDnsName;
    delete secrets.tailscaleApiKey;
  }

  manifest.secrets = secrets;
}

export function patchEnvExample(dest: string, choices: UserChoices): void {
  const envPath = path.join(dest, ".env.example");
  if (!fs.existsSync(envPath)) return;

  let content = fs.readFileSync(envPath, "utf-8");

  // Remove Hetzner token line if not using Hetzner
  if (choices.provider !== "hetzner") {
    content = content
      .split("\n")
      .filter((line) => !line.includes("HCLOUD_TOKEN"))
      .join("\n");
  }

  // Remove Tailscale lines if local
  if (choices.provider === "local") {
    content = content
      .split("\n")
      .filter(
        (line) =>
          !line.includes("TAILSCALE_AUTH_KEY") &&
          !line.includes("TAILNET_DNS_NAME") &&
          !line.includes("TAILSCALE_API_KEY")
      )
      .join("\n");
  }

  fs.writeFileSync(envPath, content, "utf-8");
}

export function patchUserMd(dest: string, choices: UserChoices): void {
  const entries = fs.readdirSync(dest, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const userMd = path.join(dest, entry.name, "USER.md");
    if (!fs.existsSync(userMd)) continue;

    let content = fs.readFileSync(userMd, "utf-8");
    content = content.replace(/\{\{OWNER_NAME\}\}/g, choices.ownerName);
    content = content.replace(/\{\{TIMEZONE\}\}/g, choices.timezone);
    content = content.replace(/\{\{WORKING_HOURS\}\}/g, choices.workingHours);
    fs.writeFileSync(userMd, content, "utf-8");
  }
}

export function initGitRepo(dest: string): void {
  execSync("git init", { cwd: dest, stdio: "pipe" });
  execSync("git add -A", { cwd: dest, stdio: "pipe" });
  execSync('git commit -m "Initial scaffold from army-create"', {
    cwd: dest,
    stdio: "pipe",
  });
}

export function scaffold(dest: string, choices: UserChoices): void {
  copyDir(choices.template.dir, dest);
  patchManifest(dest, choices);
  patchEnvExample(dest, choices);
  patchUserMd(dest, choices);
  initGitRepo(dest);
}
