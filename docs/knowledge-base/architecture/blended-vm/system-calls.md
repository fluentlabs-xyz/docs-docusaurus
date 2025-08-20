---
title: System Calls
sidebar_position: 5
---
System Calls
---

A collection of system functions provides access to low-level operations,
serving both our VM runtime and our circuit definitions.
Each system function is replaced with a specialized ZK-gadget to speed up the proving process.
These functions can include hashing algorithms, I/O operations, and nested call functions.

> **WARNING**: The system functions API/ABI are still under development and may change in the future.

```rust
#[link(wasm_import_module = "fluentbase_v1preview")]
extern "C" {
    /// Functions that provide access to crypto elements, right now we support following:
    /// - Keccak256
    /// - Poseidon (two modes, message hash and two elements hash)
    /// - Ecrecover
    pub fn _keccak256(data_offset: *const u8, data_len: u32, output32_offset: *mut u8);
    pub fn _poseidon(data_offset: *const u8, data_len: u32, output32_offset: *mut u8);
    pub fn _poseidon_hash(
        fa32_offset: *const u8,
        fb32_offset: *const u8,
        fd32_offset: *const u8,
        output32_offset: *mut u8,
    );
    pub fn _ecrecover(
        digest32_offset: *const u8,
        sig64_offset: *const u8,
        output65_offset: *mut u8,
        rec_id: u32,
    );

    /// Basic system methods that are available for every app (shared and sovereign)
    pub fn _exit(code: i32) -> !;
    pub fn _write(offset: *const u8, length: u32);
    pub fn _input_size() -> u32;
    pub fn _read(target: *mut u8, offset: u32, length: u32);
    pub fn _output_size() -> u32;
    pub fn _read_output(target: *mut u8, offset: u32, length: u32);
    pub fn _forward_output(offset: u32, len: u32);
    pub fn _state() -> u32;
    pub fn _read_context(target_ptr: *mut u8, offset: u32, length: u32);

    /// Executes a nested call with specified bytecode poseidon hash.
    ///
    /// # Parameters
    /// - `hash32_ptr`: A pointer to a 254-bit poseidon hash of a contract to be called.
    /// - `input_ptr`: A pointer to the input data (const u8).
    /// - `input_len`: The length of the input data (u32).
    /// - `fuel_ptr`: A mutable pointer to a fuel value (u64), consumed fuel is stored in the same
    ///   pointer after execution.
    /// - `state`: A state value (u32), used internally to maintain function state.
    ///
    /// Fuel ptr can be set to zero if you want to delegate all remaining gas.
    /// In this case sender won't get consumed gas result.
    ///
    /// # Returns
    /// - An `i32` value indicating the result of the execution,
    /// negative or zero result stands for terminated execution,
    /// but positive code stands for interrupted execution (works only for root execution level)
    pub fn _exec(
        hash32_ptr: *const u8,
        input_ptr: *const u8,
        input_len: u32,
        fuel_ptr: *mut u64,
        state: u32,
    ) -> i32;

    /// Resumes the execution of a previously suspended function call.
    ///
    /// This function is designed to handle the resumption of a function call
    /// that was previously paused.
    /// It takes several parameters that provide
    /// the necessary context and data for resuming the call.
    ///
    /// # Parameters
    ///
    /// * `call_id` - A unique identifier for the call that needs to be resumed.
    /// * `return_data_ptr` - A pointer to the return data that needs to be passed back to the
    ///   resuming function.
    /// This should point to a byte array.
    /// * `return_data_len` - The length of the return data in bytes.
    /// * `exit_code` - An integer code that represents the exit status of the resuming function.
    ///   Typically, this might be 0 for success or an error code for failure.
    /// * `fuel_ptr` - A mutable pointer to a 64-bit unsigned integer representing the fuel need to
    ///   be charged, also it puts a consumed fuel result into the same pointer
    pub fn _resume(
        call_id: u32,
        return_data_ptr: *const u8,
        return_data_len: u32,
        exit_code: i32,
        fuel_ptr: *mut u64,
    ) -> i32;

    pub fn _charge_fuel(delta: u64) -> u64;
    pub fn _fuel() -> u64;

    /// Journaled ZK Trie methods to work with blockchain state
    pub fn _preimage_size(hash32_ptr: *const u8) -> u32;
    pub fn _preimage_copy(hash32_ptr: *const u8, preimage_ptr: *mut u8);

    pub fn _debug_log(msg_ptr: *const u8, msg_len: u32);
}
```

For each system function, a unique identifier is assigned.
During the rWASM translation, every function call is replaced with a `Call(SysCallIdx)` instruction.
This approach significantly enhances the efficiency and simplicity of the proving process.

```rust
#[repr(u32)]
#[allow(non_camel_case_types)]
pub enum SysFuncIdx {
    #[default]
    UNKNOWN = 0x0000,

    // crypto
    KECCAK256 = 0x0101,
    POSEIDON = 0x0102,
    POSEIDON_HASH = 0x0103,
    ECRECOVER = 0x0104,

    // SYS host
    EXIT = 0x0001,
    STATE = 0x0002,
    READ = 0x0003,
    INPUT_SIZE = 0x0004,
    WRITE = 0x0005,
    OUTPUT_SIZE = 0x0006,
    READ_OUTPUT = 0x0007,
    EXEC = 0x0009,
    RESUME = 0x000a,
    FORWARD_OUTPUT = 0x000b,
    CHARGE_FUEL = 0x000c,
    FUEL = 0x000d,
    READ_CONTEXT = 0x000e,

    // preimage
    PREIMAGE_SIZE = 0x070D,
    PREIMAGE_COPY = 0x070E,

    DEBUG_LOG = 0x0901,
}
```
