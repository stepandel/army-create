import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface Template {
  name: string;
  label: string;
  description: string;
  dir: string;
}

export const TEMPLATES: Template[] = [
  {
    name: "army",
    label: "Army (PM + Engineer + QA)",
    description: "Full team: PM preps tickets, Engineer codes, QA tests PRs",
    dir: path.resolve(__dirname, "..", "templates", "army"),
  },
];

export function findTemplate(name: string): Template | undefined {
  return TEMPLATES.find((t) => t.name === name);
}
