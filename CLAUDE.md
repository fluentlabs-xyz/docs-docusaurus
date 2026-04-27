# Fluent Docs (Docusaurus)

Public documentation site for Fluent, published at https://docs.fluent.xyz. Built with Docusaurus 3.9.

## Build & Test

- `npm run start` — local dev server on port 8000
- `npm run build` — production build. **Required gate before commit**: fails on broken internal links via `onBrokenLinks: "throw"` in `docusaurus.config.js`.
- `npm run serve` — preview the production build locally
- `npm run clear` — clear Docusaurus cache when the build behaves oddly

## On every task

- Read `.claude/voice.md`, `.claude/workflow.md`, `.claude/diagrams.md`

These are committed to the repo so every contributor (and their AI assistants) follows the same rules. If you maintain personal cross-project standards in `~/.claude/standards/docs/`, the in-repo files are the project-canonical version — drift from your personal copy is allowed and expected.

This is a docs-only repository. Generic code standards are not auto-loaded — almost every task here is content/structure, not application code. If a task does touch `docusaurus.config.js`, custom plugins, or `src/` SCSS, ask whether broader code-style rules apply.

### Site facts

- **Published URL**: https://docs.fluent.xyz
- **Theme**: dark only — `colorMode.defaultMode: "dark"` and `disableSwitch: true` in `docusaurus.config.js`. Diagrams and content must read on a dark background.
- **Sidebar**: auto-generated from the `docs/` filesystem (`sidebars.js`). Ordering is controlled by `sidebar_position` frontmatter on individual pages and `_category_.json` `position` per folder. Verify positions don't collide with siblings when adding entries.
- **Source-of-truth for protocol/contract behavior**: `fluentbase-docs/` directory at repo root, mirrored from `https://github.com/fluentlabs-xyz/fluentbase/tree/devel/docs`. Not committed (gitignored). Use as the authoritative reference when documenting rollup, bridge, or runtime mechanics.

### Filename and URL conventions

- **Bare slugs only** for content files in `docs/` — no `NN-` numeric prefixes (e.g. `overview.md`, not `01-overview.md`). Sidebar order goes through frontmatter; the URL is the file slug.
- New section folder: include `_category_.json` with `label`, `position`, and `collapsed`. Verify the `position` against siblings.
- New top-level page: bump `sidebar_position` on trailing pages (glossary, resources, contribute) to keep numbering contiguous.

### Diagrams

- **Mermaid is installed** (`@docusaurus/theme-mermaid@3.9.2`, `markdown.mermaid: true`) but **not used** for architecture diagrams. Mermaid renders poorly at the site's container width — node and edge labels truncate. Use handcrafted SVG instead.
- SVGs live in `static/img/<section>/`, referenced from markdown as `/img/<section>/<name>.svg`.
- Style palette tuned for this dark theme: stroke `#cccccc` 1.5px, primary text `#ffffff` font-weight 600, subtitles/metadata `#a0a0a0` (italic where appropriate), `fill="none"` on every shape so the dark background shows through. One shared arrowhead marker per file.
- Dashed `stroke-dasharray="5,5"` for conditional / unresolved transitions. Solid lines for the happy path.
- **Workflow for new diagrams**: sketch first in Mermaid (or ASCII art) for fast structural iteration with the user. Once the structure is approved, convert to handcrafted SVG with the palette above. Don't ship Mermaid — only use it as a draft medium because the live render at this site's container width truncates labels.
- See `~/.claude/standards/docs/diagrams.md` for general diagram principles.

### Admonitions

Whitelisted keywords (from `docusaurus.config.js:48-59`): `tip`, `prerequisite`, `warning`, `info`, `danger`, `best-practice`, `summary`. Use only when the admonition carries real meaning — not as cosmetic emphasis.

### Cross-link conventions

Internal links use relative `.md` paths. Within a section: `[Execution Model](./execution-model.md)`. Across sections: `[Blended 101](../knowledge-base/blended-101.md)`. Glossary entries close with one trailing `See [X]` link to the deeper page.

### Cross-reference audit (after adding or renaming a page)

The build's `onBrokenLinks: "throw"` catches dead links but not *missing* references. After every content change, walk these predictable hotspots in this repo:

- `docs/get-started.md` — landing-page cards (table block + div-view-cards block) hardcode their targets. A new top-level section is invisible if nothing here routes to it.
- `docs/glossary.md` — terms introduced by the new page may already have entries; if not, consider adding one. Existing entries on adjacent concepts should point at the new page in their trailing `See [X]` link if it is now the deeper home.
- `docs/knowledge-base/blended-101.md` and `docs/knowledge-base/fluent-overview.md` — concept pages that frequently reference architecture pages.
- Sibling pages inside the same section — system-architecture pages cross-reference each other heavily.
- `_category_.json` files — when adding a new top-level folder, verify `position` against siblings to avoid Docusaurus tie-break ordering.

When renaming a slug, `grep -rn "<old-slug>" docs/` before assuming you have caught every reference.

See `.claude/workflow.md` for the underlying principle.

## Security

- Never read files listed in .gitignore, except `.claude/` directory
- Never read .env, .env.*, *.pem, *.key, *secret*, *credential* files
- If a task requires secrets — ask the human to provide only the specific value needed
