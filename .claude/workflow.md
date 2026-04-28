# Workflow

How to approach a docs task end-to-end.

## Source-of-truth grounding before drafting

Before writing prose, locate the authoritative source for what you are documenting. For protocol/contract docs that means the contract source itself, plus any upstream docs the team treats as canonical (often a separate repo synced locally for reference). Read the source first, draft second.

If the authoritative source is in flux or contradicts the docs you are about to write, stop. Document divergence is worse than no documentation — it actively misleads.

When the source lives outside the repo and is not committed (e.g. a local sync of an upstream docs/), reference that constraint explicitly so the agent knows facts come from there, not from the public site.

## Voice as a separate revision pass

Drafting and voice-polishing are different skills and should be different passes. First draft: get the facts right, get the structure right, hit the concrete anchors. Don't worry about LLM tells.

Then run a dedicated **de-AI pass** with the anti-pattern list from `voice.md` open as a checklist. Strip meta-narration, hedges, false summaries, hype. This pass is voice-only — facts, structure, admonitions, links, diagrams, frontmatter all stay byte-identical.

Combining the passes produces neither — facts get bent to fit the prose, prose gets bent to fit the facts.

## Fact-check after voice pass

A voice rewrite that touches every paragraph is exactly when you can accidentally weaken a claim ("could commit" → "commits") or drop a precision ("X is the load-bearing field" → "X is the field"). After de-AI, do a fact-check pass against the diff: is every concrete anchor preserved? Did any modal verb get stronger or weaker than the source supports?

This is the cheapest place to catch drift. Once committed, drift compounds.

## Build verification gate

Run the site's build command after every meaningful change. For Docusaurus and similar generators, broken internal links and missing assets fail the build only when explicitly configured (`onBrokenLinks: "throw"`). Confirm that gate is on, then run the build before claiming any docs change is done.

A build that "should work" because nothing structurally changed has lost the team an hour of bisecting later. Run it.

## Single-concept commits

A commit that adds a new page, fixes voice across three other pages, and renumbers the sidebar mixes three reviewable concerns into one diff. Split:

- New content → its own commit.
- Voice/style revisions → its own commit.
- Mechanical reshuffles (sidebar positions, file renames) → either folded into the change that requires them, or their own commit.

Reviewers evaluate one concern per commit; mixed commits force them to evaluate all three at once and approve none confidently.

## Tone preservation when revising existing pages

When editing a page someone else wrote, preserve their voice unless the user has asked for a global tone change. Resist the impulse to "improve" prose that already works just because it's not exactly how you would have written it. Editors who rewrite for taste burn maintainer trust faster than they add value.

The exception is documented anti-patterns (LLM tells, false summaries, hype) — those are bugs, not stylistic preferences.

## Cross-reference audit after adding or renaming content

A new page or a renamed slug does not exist in isolation. After the change, walk through the predictable places that might need to point at it:

- **Sidebar and navigation metadata** — does the new page have a `sidebar_position` that does not collide with siblings? Did renaming break a parent folder's category config?
- **Landing pages and discovery cards** — front pages, "what's next" cards, hero-section links often hardcode their targets. The new page is invisible if nothing on the entry-point pages routes a reader to it.
- **Glossary** — terms introduced in the new page may already have entries elsewhere; if not, consider adding short entries that point at the new page. Existing glossary entries on related concepts should mention the new page in their trailing "See [X]" link if it now offers a deeper home.
- **Adjacent topic pages** — pages on neighbouring topics often reference each other. A new page on topic X should be discoverable from pages on topic Y where a reader would naturally want the link.
- **External tooling that depends on URL stability** — search-index configs, redirect rules, social-share previews. A renamed slug breaks these silently because the build's broken-link checker only sees what is in the repo.

The build's broken-link checker catches dead links. It does not catch *missing* links — places where a reader would expect a reference but none exists. Audit by hand: read the affected pages from the perspective of someone arriving at them via the most likely entry point, and ask whether they would discover the new content.

For renames specifically, grep the entire `docs/` tree for the old slug before assuming it is only referenced where you remember it.
