# Niche Template Factory

Small pipeline for generating draft Notion templates from YAML configs.

The goal is not to copy existing templates. The goal is:

```text
problem description -> structured YAML spec -> Notion draft -> manual polish -> marketplace listing
```

## What it does

This MVP generates:

- a main Notion template page
- onboarding sections
- checklist sections
- inline Notion databases
- a local marketplace listing draft

It does not fully automate Marketplace publishing. That remains manual.

## Setup

```bash
npm install
cp .env.example .env
```

Then edit `.env`:

```bash
NOTION_API_KEY=...
NOTION_PARENT_PAGE_ID=...
```

In Notion, create a parent page and share it with your integration.

## Validate config

```bash
npm run validate
```

## Generate first template

```bash
npm run generate
```

## Generate listing text

```bash
npm run listing
```

Output listing will appear in:

```text
output/listings/
```

## Workflow

1. Add a new YAML config in `configs/`
2. Validate it
3. Generate Notion draft
4. Manually polish design, views, screenshots, cover
5. Publish Notion page with "Duplicate as template"
6. Sell via Gumroad / Etsy / Notion Marketplace
7. Track clicks and sales
