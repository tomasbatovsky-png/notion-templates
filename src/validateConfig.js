import fs from "fs";
import yaml from "js-yaml";
import { Command } from "commander";
import { z } from "zod";
import { fileURLToPath } from "url";

const FieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["title", "rich_text", "number", "date", "select", "checkbox", "url", "email", "phone_number"]),
  options: z.array(z.string()).optional()
}).superRefine((field, ctx) => {
  if (field.type === "select" && (!field.options || field.options.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Select field "${field.name}" must have options.`
    });
  }
});

const DatabaseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(FieldSchema).min(1)
}).superRefine((db, ctx) => {
  const titleCount = db.fields.filter(f => f.type === "title").length;
  if (titleCount !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Database "${db.name}" must contain exactly one title field.`
    });
  }
});

const SectionSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  checklist: z.array(z.string()).optional()
});

const TemplateSchema = z.object({
  template_name: z.string().min(1),
  slug: z.string().min(1),
  language: z.string().min(2),
  emoji: z.string().optional(),
  target_user: z.string().min(1),
  main_problem: z.string().min(1),
  positioning: z.object({
    one_liner: z.string().optional(),
    promise: z.string().optional()
  }).optional(),
  sections: z.array(SectionSchema).default([]),
  databases: z.array(DatabaseSchema).min(1),
  listing: z.object({
    price: z.number().optional(),
    currency: z.string().optional(),
    keywords: z.array(z.string()).optional()
  }).optional()
});

export function loadAndValidateConfig(path) {
  const raw = fs.readFileSync(path, "utf8");
  const data = yaml.load(raw);
  return TemplateSchema.parse(data);
}

function runCli() {
  const program = new Command();
  program.requiredOption("-c, --config <path>", "Path to YAML config");
  program.parse();
  const options = program.opts();

  try {
    const config = loadAndValidateConfig(options.config);
    console.log(`OK: ${config.template_name}`);
    console.log(`Databases: ${config.databases.length}`);
    console.log(`Sections: ${config.sections.length}`);
  } catch (error) {
    console.error("Config validation failed:");
    console.error(error.errors || error);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
