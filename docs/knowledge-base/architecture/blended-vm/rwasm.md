---
title: rWASM
sidebar_position: 1
---
rWASM
---

rWasm (reduced WebAssembly) is an EIP-3540 compatible binary IR of Wasm. It is designed to simplify the execution
process of Wasm binaries while maintaining 99% compatibility with original Wasm features.

rWasm is a specially modified binary IR of Wasm execution. It retains 99% compatibility with the original Wasm bytecode
and instruction set but features a modified binary structure that avoids the pitfalls of non-zk friendly elements,
without altering opcode behavior.

The main issue with Wasm is its use of relative offsets for type mappings, function mappings, and block/loop statements,
which complicates the proving process. rWasm addresses this by adopting a more flattened binary structure without
relative offsets and eliminating the need for a type mapping validator, allowing for straightforward execution.

The flattened structure of rWasm simplifies the process of proving the correctness of each opcode execution and places
several verification steps in the hands of the developer. This modification makes rWasm a more efficient and zk-friendly
option for integrating Web2 developers into the Web3 ecosystem.

## Technology

Key Differences between rWasm and Wasm:

- **Deterministic Function Order**: Functions are ordered based on their position in the codebase.
- **Block/Loop Replacement**: Blocks and loops are replaced with Br-family instructions.
- **Redesigned Break Instructions**: Break instructions now support program counter (PC) offsets instead of depth-level.
- **Simplified Binary Verification**: Most sections are removed to streamline binary verification.
- **Unified Memory Segment Section**: Implements all Wasm memory standards in one place.
- **Removed Global Variables Section**: A global variables section is eliminated.
- **Eliminated Type Mapping**: Type mapping is no longer necessary as the code is fully validated.
- **Special Entrypoint Function**: A unique entry point function encompasses all segments.

The new binary representation ensures a fully equivalently compatible Wasm runtime module from the binary.
Some features are no longer supported by the rWasm runtime: module imports; global variables; memory imports;
global variables export.
These features are unnecessary as Fluent does not utilize them.

## Structure

The rWasm binary format supports the following sections:

- **Bytecode Section**: Replaces the function/code/entrypoint sections.
- **Memory Section**: Replaces memory/data sections for all active/passive/declare section types.

The following sections, currently implemented, are scheduled for removal:

- **Function Section**: This section determines the size of each function and is used to properly allocate functions in
  memory. Once the `CallInternal` opcode is eliminated, this section can be dropped as well.
- **Element Section**: This section defines allocations for tables used in indirect calls. The `CallIndirect`
  instruction is being phased out, and once this process is complete, the section will also be removed.

### Bytecode Section

This section consolidates Wasm's original function, code, and start sections. It contains all instructions for the
entire binary without any additional separators for functions. Functions are recovered from the bytecode by reading the
function section, which contains function lengths. The entrypoint function is injected at the end, which is used to
initialize all segments according to Wasm constraints.

> Note: The function section is planned to be removed and entrypoint stored at offset 0. To achieve this, eliminating
> stack calls must be achieved while implementing indirect breaks. Although Fluent has an implementation for this, it is
> not yet satisfactory, and a migration is planned to a register-based IR before finalizing it.

### Memory & Data Section

In Wasm, memory and data sections are handled separately. In rWasm, the Memory section defines memory bounds (lower and
upper limits), and data sections, which can be either active or passive, and specify data to be mapped inside memory.
Unlike Wasm, rWasm eliminates the separate memory section, modifies the corresponding instruction logic, and merges all
data sections.

Here's an example of a WAT file that initializes memory with minimum and maximum memory bounds (default allocated memory
is one page, and the maximum possible allocated pages are two):

```wat
(module
  (memory 1 2)
)
```

To support this, the `memory.grow` instruction is injected into the entrypoint to initialize the default memory.
A special preamble is also added to all `memory.grow` instructions to perform upper bound checks.

Here is an example of the resulting entrypoint injection:

```wat
(module
  (func $__entrypoint
    i32.const $_init_pages
    memory.init
    drop)
)
```

According to Wasm standards, a memory overflow causes `u32::MAX` to be placed on the stack.
For upper-bound checks, the `memory.size` opcode can be used. Here is an example of such an injection:

```wat
(module
  (func $_func_uses_memory_grow
    (block
      local.get 1
      memory.size
      i32.add
      i32.const $_max_pages
      i32.gts
      drop
      i32.const 4294967295
      br 0
      memory.grow)
  )
)
```

These injections fully comply with Wasm standards, allowing Fluent to support official Wasm memory constraint checks for
the memory section.

For the data section, the process is more complex because Fluent needs to support three different data section types:

- **Active**: Has a pre-defined compile-time offset.
- **Passive**: Can be initialized dynamically at runtime.

To address this, all sections are merged. If the memory is active, it is initialized inside the entrypoint with
re-mapped offsets. Otherwise, the offset is remembered in a special mapping to adjust passive segments when the user
calls `memory.init` manually.

Here is an example of an entrypoint injection for an active data segment:

```wat
(module
  (func $__entrypoint
    i32.const $_relative_offset
    i64.const $_data_offset
    i64.const $_data_length // or u64::MAX in case of overflow
    memory.init 0
    data.drop $segment_index+1
  )
)
```

The data segment must be dropped finally. According to Wasm standards, once the segment is initialized, it must be
entirely removed from memory. To simulate this behavior, Fluent uses zero segments as a default and stores special data
segment flags to know which segments are still active.

For passive data segments, the logic is similar, but data segment offsets must be recalculated on the fly.

```wat
(module
  (func $_func_uses_memory_init
    // adjust length
    (block
      local.get 1
      local.get 3
      i32.add
      i32.const $_data_len
      i32.gts
      br_if_eqz 0
      i32.const 4294967295 // an error
      local.set 1
    )
    // adjust offset
    i32.const $_data_offset
    local.get 3
    i32.add
    local.set 2
    // do init
    memory.init $_segment_index+1
  )
)
```

*The provided injections are examples and may vary based on specific requirements.*
