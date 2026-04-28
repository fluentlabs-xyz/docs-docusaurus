# Diagrams

When and how to draw diagrams in technical docs.

## When to draw a diagram

A diagram earns its place when it shows a topology, a flow, or a state machine that prose would describe more poorly. Decorative diagrams that just rephrase the surrounding paragraph are noise — cut them.

Three patterns that genuinely need a diagram:
- **Topology** — components and their static relationships (architecture overviews, layered models).
- **Sequence** — message flow across actors over time, especially with branching.
- **State / pipeline** — staged process with conditional transitions.

Anything else, prefer prose.

## Tooling: SVG vs Mermaid vs static images

**SVG (handcrafted)** — preferred for architecture diagrams. Predictable rendering at any container width, no plugin dependency, exact control over typography and color, diff-able as text. The cost is one-time authoring effort.

**Mermaid** — convenient for quick draft diagrams, but rendering quality depends on the host site's CSS, container width, and theme. Text overflows boxes, edge labels truncate, and the rendering engine evolves between versions. For a docs site where rendering control matters, Mermaid is a footgun in production.

**Static images (PNG/JPG)** — reasonable for screenshots, wireframes, and illustrations that aren't generated from code. Bad for architecture diagrams because they don't respond to dark/light theme, can't be edited by a contributor without the source file, and bloat the repo.

Default to SVG for architecture and pipeline work. Use Mermaid only if the page is throwaway or the diagram is so simple its rendering is uncontroversial.

## The draft → final pattern

Mermaid (or even ASCII art) is a useful **drafting medium** even when the final diagram will be SVG. Mermaid lets you iterate on structure with the user quickly — boxes, arrows, branching — without paying SVG authoring cost up front. Once the structure is locked, convert to handcrafted SVG with the project's palette.

The pattern:

1. Sketch structure in Mermaid in chat or the markdown source. Get user agreement on what goes in the diagram and how it branches.
2. Author the SVG with the agreed structure plus the project's standard palette, marker, and viewBox.
3. Replace the Mermaid block with `![alt](/img/<section>/<name>.svg)`.

Skipping the draft step often produces SVGs that need to be re-authored after user feedback on structure. Keep the cheap iteration loop cheap.

## Style consistency within a section

Every diagram in a section should share:
- **Background**: transparent (`fill="none"` on the root `<svg>`) so dark-themed sites show through.
- **Stroke palette**: one neutral color for box and arrow strokes, never multiple competing colors. Reserve color for emphasis only.
- **Text hierarchy**: titles at one weight/size, subtitles at one weight/size lighter. Two tiers max.
- **Marker definition**: one shared arrowhead marker referenced by every line, not per-arrow inline definitions.
- **Stroke width**: consistent — typically 1.5px for everything.

Inconsistency reads as low-effort.

## Conditional vs sequential flows

Solid lines are for the happy path. Dashed lines (typically `stroke-dasharray="5,5"`) are for conditional, alternative, or unresolved transitions. Label both — readers should not have to infer which is which.

For state-machine diagrams, sequential transitions are solid; "if this fails" or "if disputed" branches are dashed.

## Sequence diagrams

For sequence diagrams done in raw SVG:
- Actors as boxes across the top, lifelines as dashed verticals running down.
- Messages as horizontal arrows with the message label centered above.
- Self-loops as a three-segment path going right, down, back to the lifeline with arrowhead.
- Branching alternatives separated by a dashed horizontal line, each branch labeled in italic.

Don't try to mimic UML alt/opt boxes precisely — the visual overhead beats the clarity gain.

## Sizing for site container

Pick a viewBox sized for typical content container width. Most docs sites render content in a ~720–900px column. A diagram with viewBox `0 0 1000 500` will scale to ~80% in that container, shrinking text from 14pt to ~11pt — readable but tight.

If text becomes hard to read at site width, the diagram has too much in it. Cut elements or split into two diagrams. Don't fight the container by making the SVG larger.

## What to never put in a diagram

- Constants and addresses that change between releases — they belong in the surrounding prose where a single edit fixes them.
- Long descriptive paragraphs in box labels — boxes hold names and short qualifiers, not sentences.
- Color-coded states without a legend — readers won't infer what red vs green means.
