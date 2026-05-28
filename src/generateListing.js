import fs from "fs";
import path from "path";
import { Command } from "commander";
import { loadAndValidateConfig } from "./validateConfig.js";

const program = new Command();
program.requiredOption("-c, --config <path>", "Path to YAML config");
program.parse();
const options = program.opts();

const config = loadAndValidateConfig(options.config);

const keywords = config.listing?.keywords || [];
const price = config.listing?.price ? `${config.listing.price} ${config.listing.currency || "EUR"}` : "TBD";

const content = `# ${config.template_name}

${config.positioning?.one_liner || config.main_problem}

## Pre koho je šablóna

${config.target_user}

## Čo rieši

${config.main_problem}

## Čo je vo vnútri

${config.databases.map(db => `- ${db.name}: ${db.description || "evidencia a prehľad"}`).join("\n")}

## Rýchly štart

${(config.sections || []).flatMap(s => s.checklist || []).slice(0, 8).map(i => `- ${i}`).join("\n")}

## Cena

${price}

## Keywords

${keywords.join(", ")}

## Krátky popis

${config.template_name} je jednoduchá Notion šablóna pre ${config.target_user.toLowerCase()}. Pomáha riešiť: ${config.main_problem.toLowerCase()}
`;

const outDir = "output/listings";
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${config.slug}.md`);
fs.writeFileSync(outPath, content, "utf8");

console.log(`Listing draft written to ${outPath}`);
