# Voice

Tone and style rules for technical documentation written for engineers and auditors.

## Target audience and tone

Public technical docs are read by infra/protocol engineers, security auditors, and careful application developers. Write as a senior engineer who has shipped the system in question — direct, calm authority, no marketing flex. Not a tutorial author explaining concepts from first principles, not a developer advocate selling a feature.

The reader does not need to be told they are about to read documentation. They do not need a "what this section covers" preamble. They need facts, mechanism, and the boundaries that hold the mechanism together.

## Anti-patterns to strip

These are the LLM tells that make documentation read as machine-generated. Strip every instance during writing or in a dedicated revision pass.

1. **Meta-narration** — "this section explains…", "the point of this is…", "what matters here is…", "the important thing to understand…".
2. **Reflexive triads** — "X, Y, and Z" when one or two items would do; symmetric three-bullet lists at every section end.
3. **Filler hedges** — "it is worth noting", "it is important to understand", "one key thing", "the subtle thing to remember".
4. **False summaries** — "in essence", "ultimately", "in short", "simply put", "at a high level".
5. **Corporate abstractions** — "uniformly", "coherently", "seamlessly", "robustly".
6. **Hype adjectives** — "powerful", "elegant", "beautiful", "novel", "cutting-edge".
7. **Overused copulative patterns** — "X is what Y" where an active verb works; "the {noun} is {verb}ing {noun}" rhythm across consecutive sentences.
8. **Self-referential navigation** — "the rest of this section explains…", "this page walks you through…" when the sidebar already does that work.
9. **Pseudo-authoritative hedging** — "it should be noted that…", "one could argue that…", "generally speaking…".
10. **LLM signposts** — "let's explore…", "consider the following…", "imagine that…".
11. **Repetition for rhetoric** — saying the same point three times with different wording. Say it once.

## Concrete grounding

Narrative prose is fine; ungrounded narrative is not. Every meaningful claim should land on a concrete anchor — a constant name, an address, a method signature, a chain ID, a magic value. The anchor is what makes the page useful for reference; the prose is what makes it readable.

Bad: "The bridge has a deposit deadline that admins can configure."
Better: "The L1-owned `_depositProcessingWindow` is snapshotted into each outbound deposit at send time and bounded at `MAX_DEPOSIT_PROCESSING_WINDOW = 50_400` blocks."

If a fact comes from contract source, prefer the literal name (`commitBatch`, `_rollupCorrupted`, `FUEL_DENOM_RATE = 20`) over a paraphrase. Code rot beats narrative rot — when the constant is renamed, the diff is obvious.

## ASCII conventions

Use ASCII apostrophes (`'`) and ASCII quotes (`"`) throughout. Smart punctuation (`'`, `'`, `"`, `"`) breaks search, copy-paste of code-adjacent text, and creates noisy diffs when editors auto-correct. The exception is when the source you are quoting must be preserved character-faithful — then call it out explicitly.

## Cross-link patterns

A trailing "See [X]" link at the end of an entry is more useful than inline links scattered through prose. It signals "for the full picture, here". Inline links work when the linked page genuinely interrupts the current sentence ("the [interruption protocol](...) handles this"), but should be rare.

Glossary-style entries should close with one canonical link to the deeper page. Never link to multiple destinations from a single entry — the reader picks none.

## Length discipline

Length is a budget, not a target. Every paragraph should earn its existence. Default question before adding a paragraph: "if I removed this, would the reader miss anything they couldn't get from the prior paragraph or a linked page?" If no, cut it.

Short pages with high information density beat long pages padded with explanation. Treat 1500 words as the upper bound for a single architecture page; cut harder if you can.
