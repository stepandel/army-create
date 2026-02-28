export interface Template {
  name: string;
  label: string;
  description: string;
  repo: string;
}

export const TEMPLATES: Template[] = [
  {
    name: "army",
    label: "Army (PM + Engineer + QA)",
    description: "Full team: PM preps tickets, Engineer codes, QA tests PRs",
    repo: "https://github.com/stepandel/army-identities",
  },
];

export function findTemplate(name: string): Template | undefined {
  return TEMPLATES.find((t) => t.name === name);
}

export function isGitUrl(str: string): boolean {
  return (
    str.startsWith("https://") ||
    str.startsWith("http://") ||
    str.startsWith("git@")
  );
}
