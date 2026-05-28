import "dotenv/config";
import { Client } from "@notionhq/client";
import { Command } from "commander";
import { loadAndValidateConfig } from "./validateConfig.js";
import { buildDatabaseProperties } from "./notionProperties.js";
import { heading1, heading2, paragraph, divider, todoItem } from "./notionBlocks.js";

const program = new Command();
program.requiredOption("-c, --config <path>", "Path to YAML config");
program.parse();
const options = program.opts();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  notionVersion: process.env.NOTION_VERSION || "2022-06-28"
});

function chunkBlocks(blocks, size = 90) {
  const chunks = [];
  for (let i = 0; i < blocks.length; i += size) {
    chunks.push(blocks.slice(i, i + size));
  }
  return chunks;
}

async function appendBlocks(blockId, blocks) {
  for (const chunk of chunkBlocks(blocks)) {
    await notion.blocks.children.append({
      block_id: blockId,
      children: chunk
    });
  }
}

async function createMainPage(config) {
  const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
  if (!parentPageId) throw new Error("Missing NOTION_PARENT_PAGE_ID in .env");

  const children = [
    heading1(config.template_name),
    paragraph(config.positioning?.one_liner || config.main_problem),
    paragraph(`Pre koho: ${config.target_user}`),
    paragraph(`Hlavný problém: ${config.main_problem}`),
    divider()
  ];

  for (const section of config.sections || []) {
    children.push(heading2(section.title));
    if (section.body) children.push(paragraph(section.body));
    if (section.checklist) {
      for (const item of section.checklist) children.push(todoItem(item));
    }
    children.push(divider());
  }

  const page = await notion.pages.create({
    parent: { type: "page_id", page_id: parentPageId },
    icon: { type: "emoji", emoji: config.emoji || "📒" },
    properties: {
      title: {
        title: [{ type: "text", text: { content: config.template_name } }]
      }
    },
    children
  });

  return page.id;
}

async function createDatabase(parentPageId, db) {
  const properties = buildDatabaseProperties(db.fields);

  const database = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: db.name } }],
    description: db.description ? [{ type: "text", text: { content: db.description } }] : [],
    is_inline: true,
    properties
  });

  return database.id;
}

async function run() {
  if (!process.env.NOTION_API_KEY) throw new Error("Missing NOTION_API_KEY in .env");

  const config = loadAndValidateConfig(options.config);

  console.log(`Creating template: ${config.template_name}`);
  const mainPageId = await createMainPage(config);

  await appendBlocks(mainPageId, [
    heading2("Databázy"),
    paragraph("Nižšie sú vygenerované základné databázy. Po vygenerovaní ich manuálne uprav, pridaj views a sample dáta.")
  ]);

  for (const db of config.databases) {
    console.log(`Creating database: ${db.name}`);
    await createDatabase(mainPageId, db);
  }

  console.log("");
  console.log("Done.");
  console.log(`Main Notion page ID: ${mainPageId}`);
  console.log("Next: polish layout, add database views/sample data, then publish as duplicate template.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
