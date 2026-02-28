import * as p from "@clack/prompts";
import { TEMPLATES, findTemplate, type Template } from "./templates.js";

export interface UserChoices {
  projectName: string;
  template: Template;
  provider: "aws" | "hetzner" | "local";
  region: string;
  instanceType: string;
  ownerName: string;
  timezone: string;
  workingHours: string;
}

const AWS_REGIONS = [
  { value: "us-east-1", label: "US East — N. Virginia" },
  { value: "us-east-2", label: "US East — Ohio" },
  { value: "us-west-2", label: "US West — Oregon" },
  { value: "eu-west-1", label: "EU — Ireland" },
  { value: "eu-central-1", label: "EU — Frankfurt" },
  { value: "ap-southeast-1", label: "Asia Pacific — Singapore" },
  { value: "ap-northeast-1", label: "Asia Pacific — Tokyo" },
];

const HETZNER_LOCATIONS = [
  { value: "ash", label: "Ashburn, US" },
  { value: "fsn1", label: "Falkenstein, DE" },
  { value: "nbg1", label: "Nuremberg, DE" },
  { value: "hel1", label: "Helsinki, FI" },
];

const AWS_INSTANCE_TYPES = [
  { value: "t3.small", label: "t3.small — 2 vCPU, 2 GB (~$15/mo)" },
  { value: "t3.medium", label: "t3.medium — 2 vCPU, 4 GB (~$30/mo)" },
  { value: "t3.large", label: "t3.large — 2 vCPU, 8 GB (~$60/mo)" },
];

const HETZNER_SERVER_TYPES_US = [
  { value: "cpx21", label: "cpx21 — 3 vCPU, 4 GB (~$5/mo)" },
  { value: "cpx31", label: "cpx31 — 4 vCPU, 8 GB (~$9/mo)" },
  { value: "cpx41", label: "cpx41 — 8 vCPU, 16 GB (~$16/mo)" },
];

const HETZNER_SERVER_TYPES_EU = [
  { value: "cx22", label: "cx22 — 2 vCPU, 4 GB (~$4/mo)" },
  { value: "cx32", label: "cx32 — 4 vCPU, 8 GB (~$7/mo)" },
  { value: "cx42", label: "cx42 — 8 vCPU, 16 GB (~$14/mo)" },
];

const HETZNER_US_LOCATIONS = ["ash", "hil"];

function cancelled(): never {
  p.cancel("Setup cancelled.");
  process.exit(0);
}

export async function runPrompts(defaults: {
  projectName?: string;
  templateName?: string;
}): Promise<UserChoices> {
  // --- Template ---
  let template: Template;

  if (defaults.templateName) {
    const found = findTemplate(defaults.templateName);
    if (found) {
      template = found;
    } else {
      p.log.error(
        `Unknown template "${defaults.templateName}". Available: ${TEMPLATES.map((t) => t.name).join(", ")}`
      );
      process.exit(1);
    }
  } else if (TEMPLATES.length === 1) {
    template = TEMPLATES[0];
  } else {
    const choice = await p.select({
      message: "Select a template",
      options: TEMPLATES.map((t) => ({
        value: t.name,
        label: t.label,
        hint: t.description,
      })),
    });
    if (p.isCancel(choice)) cancelled();
    template = findTemplate(choice as string)!;
  }

  // --- Project name ---
  let projectName: string;
  if (defaults.projectName) {
    projectName = defaults.projectName;
  } else {
    const name = await p.text({
      message: "Project name",
      placeholder: "my-army",
      validate: (v) => {
        if (!v.trim()) return "Project name is required";
        if (!/^[a-zA-Z0-9_-]+$/.test(v)) return "Only letters, numbers, hyphens, and underscores";
      },
    });
    if (p.isCancel(name)) cancelled();
    projectName = name;
  }

  // --- Cloud provider ---
  const provider = await p.select({
    message: "Cloud provider",
    options: [
      { value: "hetzner", label: "Hetzner Cloud", hint: "Best value — EU & US locations" },
      { value: "aws", label: "AWS", hint: "Amazon EC2 instances" },
      { value: "local", label: "Local Docker", hint: "Run locally for testing" },
    ],
  });
  if (p.isCancel(provider)) cancelled();

  // --- Region ---
  let region = "local";
  if (provider !== "local") {
    const regionOptions =
      provider === "aws"
        ? AWS_REGIONS
        : HETZNER_LOCATIONS;

    const regionChoice = await p.select({
      message: provider === "aws" ? "AWS Region" : "Hetzner location",
      options: regionOptions.map((r) => ({ value: r.value, label: r.label })),
    });
    if (p.isCancel(regionChoice)) cancelled();
    region = regionChoice as string;
  }

  // --- Instance type ---
  let instanceType = "local";
  if (provider !== "local") {
    let typeOptions: { value: string; label: string }[];
    if (provider === "aws") {
      typeOptions = AWS_INSTANCE_TYPES;
    } else {
      typeOptions = HETZNER_US_LOCATIONS.includes(region)
        ? HETZNER_SERVER_TYPES_US
        : HETZNER_SERVER_TYPES_EU;
    }

    const typeChoice = await p.select({
      message: "Instance type",
      options: typeOptions.map((t) => ({ value: t.value, label: t.label })),
    });
    if (p.isCancel(typeChoice)) cancelled();
    instanceType = typeChoice as string;
  }

  // --- Owner info ---
  const ownerName = await p.text({
    message: "Your name (agents will know who they work for)",
    placeholder: "Jane",
    validate: (v) => {
      if (!v.trim()) return "Name is required";
    },
  });
  if (p.isCancel(ownerName)) cancelled();

  const timezone = await p.text({
    message: "Timezone",
    initialValue: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  if (p.isCancel(timezone)) cancelled();

  const workingHours = await p.text({
    message: "Working hours",
    initialValue: "9am-6pm",
  });
  if (p.isCancel(workingHours)) cancelled();

  return {
    projectName,
    template,
    provider: provider as UserChoices["provider"],
    region,
    instanceType,
    ownerName,
    timezone,
    workingHours,
  };
}
