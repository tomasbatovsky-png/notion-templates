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

function richTextValue(value) {
  return [{ type: "text", text: { content: String(value ?? "") } }];
}

function buildPageProperties(fields, row) {
  const properties = {};

  for (const field of fields) {
    if (!(field.name in row)) continue;

    const value = row[field.name];

    switch (field.type) {
      case "title":
        properties[field.name] = { title: richTextValue(value) };
        break;
      case "rich_text":
        properties[field.name] = { rich_text: richTextValue(value) };
        break;
      case "number":
        properties[field.name] = { number: Number(value) };
        break;
      case "date":
        properties[field.name] = { date: { start: String(value) } };
        break;
      case "select":
        properties[field.name] = { select: { name: String(value) } };
        break;
      case "checkbox":
        properties[field.name] = { checkbox: Boolean(value) };
        break;
      case "url":
        properties[field.name] = { url: String(value) };
        break;
      case "email":
        properties[field.name] = { email: String(value) };
        break;
      case "phone_number":
        properties[field.name] = { phone_number: String(value) };
        break;
      default:
        throw new Error(`Unsupported field type in sample row: ${field.type}`);
    }
  }

  return properties;
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

async function createSampleRows(databaseId, db) {
  const rows = db.sample_rows || [];
  if (rows.length === 0) return;

  for (const row of rows) {
    await notion.pages.create({
      parent: { type: "database_id", database_id: databaseId },
      properties: buildPageProperties(db.fields, row)
    });
  }
}

async function run() {
  if (!process.env.NOTION_API_KEY) throw new Error("Missing NOTION_API_KEY in .env");

  const config = loadAndValidateConfig(options.config);

  console.log(`Creating template: ${config.template_name}`);
  const mainPageId = await createMainPage(config);

  await appendBlocks(mainPageId, [
    heading2("Databázy"),
    paragraph("Nižšie sú vygenerované základné databázy so vzorovými dátami. Po vygenerovaní ich manuálne uprav, pridaj views a dolad dashboard.")
  ]);

  for (const db of config.databases) {
    console.log(`Creating database: ${db.name}`);
    const databaseId = await createDatabase(mainPageId, db);
    await createSampleRows(databaseId, db);
  }

  console.log("");
  console.log("Done.");
  console.log(`Main Notion page ID: ${mainPageId}`);
  console.log("Next: polish layout, add database views, screenshots and publish as duplicate template.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
