---
title: Interruption System
sidebar_position: 3
---
Interruption System
---

Fluent interoperability relies heavily on its interruption system.
Smart contracts on Fluent are limited to pure functions,
preventing system calls from accessing external resources such as bytecodes, cold or invalidated storage slots,
or performing nested calls.
Including system calls imposes additional proving overhead,
as proving gadgets must be developed for each call, complicating system development.
This also impacts the flexibility in managing rights or extending contracts,
making the system less sustainable for the fork-less concept.
In such a scenario, system contracts cannot be upgraded without updating the circuits.

Fluent solves this problem by enabling an interruption system that helps manage context switching between nested apps
and the so-called STF that stands for context management.

For simplicity, let's assume that STF, smart contracts and EEs are all functions
(since they are essentially state transition functions or a part of STF).
Functions can be categorized as either root or non-root.
A root function is defined as a function where the depth level is equal to 0.
The root function is pivotal because it handles all context switching and cross-contract accesses,
serving as a security layer.

The root function has the ultimate authority over all state transitions within the blockchain.
Additionally, the root function is in charge of managing and executing system calls.
The root function cannot be interrupted, but it is capable of handling interruptions.

## System Bindings

The system bindings manage context switching in a Fluent interruption system.
Functions signatures are provided below.
These functions maintain the entire flow of an interruption system.

```rust
/// Low-level function that terminates the execution of the program and exits with the specified
/// exit code.
///
/// This function is typically used to perform an immediate and final exit of a program,
/// bypassing Rust's standard teardown mechanisms.
/// It effectively stops execution and prevents further operations, including cleanup or
/// unwinding.
///
/// # Parameters
/// - `code` (i32): The non-positive exit code indicating the reason for termination.
///
/// # Notes
/// - This function is generally invoked in specialized environments, such as WebAssembly
///   runtimes, or through higher-level abstractions.
/// - Consider alternatives in standard applications, such as returning control to the caller or
///   using Rust's standard exit mechanisms, for safer options.
pub fn _exit(code: i32) -> !;

/// Executes a nested call with specified bytecode poseidon hash.
///
/// # Parameters
/// - `hash32_ptr`: A pointer to a 254-bit poseidon hash of a contract to be called.
/// - `input_ptr`: A pointer to the input data (const u8).
/// - `input_len`: The length of the input data (u32).
/// - `fuel16_ptr`: A 16 byte array of elements where [fuel_limit/fuel_used, fuel_refunded]
/// - `state`: A state value (u32), used internally to maintain function state.
///
/// Fuel ptr can be set to zero if you want to delegate all remaining gas.
/// In this case sender won't get the consumed gas result.
///
/// # Returns
/// - An `i32` value indicating the result of the execution, negative or zero result stands for
///   terminated execution, but positive code stands for interrupted execution (works only for
///   root execution level)
pub fn _exec(
    hash32_ptr: *const u8,
    input_ptr: *const u8,
    input_len: u32,
    fuel16_ptr: *mut [i64; 2],
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
/// * `return_data_ptr` - A pointer to the return data that needs to be passed back to the resuming function. This should point to a byte array.
/// * `return_data_len` - The length of the return data in bytes.
/// * `exit_code` - An integer code that represents the exit status of the resuming function. Typically, this might be 0 for success or an error code for failure.
/// * `fuel_limit` - A fuel used representing the fuel need to be charged, also it puts a consumed fuel result into the same pointer
pub fn _resume(
    call_id: u32,
    return_data_ptr: *const u8,
    return_data_len: u32,
    exit_code: i32,
    fuel16_ptr: *mut [i64; 2],
) -> i32;
```

During execution, once shared resources are requested, it pauses the execution and forwards params into the STF.
Once the interruption is over, it resumes the previous frame.

Here is the basic flow of an interruption:

![Interruption Flow](../../../../static/img/kb/interruption-flow.png)

## Application Exit

The application exit binding terminates function execution with the specified exit code. The function is designed to
exit from any smart contract or application. It immediately halts the contract execution and forwards all execution
results, including the exit code and return data, to the caller contract.

**Constraints:**
The exit code must always be a negative 32-bit integer.
Supplying a positive exit code will result in a `NonNegativeExitCode` execution error.
Positive exit codes indicate interrupted execution and are exclusive to the `_exec` or `_resume` functions.

## Exec & Resume

During execution, once shared resources are requested, it pauses the execution and forwards params into the STF.

Interrupted params contain the following items:

- `hash32_ptr`: A pointer to a 32-byte code hash of a contract to be called (bytecode hash for STF or syscall code
  hash).
- `input`: An input parameter for smart contract or input for interruption.
- `fuel_ptr`: A mutable pointer to a fuel value. The consumed and refunded fuel is stored in the same pointer after
  execution.
- `state`: A state value (u32), used internally to maintain function state (main or deploy).

This binding executes a nested call or sends an interruption to the parent execution call though context switching. If
the depth level is greater than 0 (non STF), then an interruption occurs; otherwise, bytecode is executed.

Once the interruption is resolved, it resumes the execution of a previously suspended function call by specifying return
data, resulting exit code and fuel consumed.

The resume function operates similarly to exec,
but it requires an interrupted call ID and the interruption result (including return data and exit code).
Interruption events may also occur during the resume process,
requiring an execution loop capable of handling and correctly processing these interruptions.

## System Calls

System calls use the same approach as an interruption system.
Since the root-STF function is responsible for all state transitions, including cold/warm storage reads, then a syscall
can be represented as an interruption to the ephemeral smart contract.

For accessing state data, Fluent uses special ephemeral smart contracts to access information located outside a smart
contract. For example, in case of storage cache invalidation, the contract must request the newest info from the root
call instead of reading invalidated cache. Also, nested calls to other contracts require ACL checks that must be checked
and verified by the root-STF.

Here is an example of what the system call looks like for Rust contracts.

```rust
fn syscall_storage_read<SDK: NativeAPI>(native_sdk: &mut SDK, slot: &U256) -> U256 {
  // do a call to the root-STF to request some storage slot
  let (_, exit_code) = native_sdk.exec(
      &SYSCALL_ID_STORAGE_READ, // an unique storage read code hash
      slot.as_le_slice(), // a requesting slice with data (aka call-input)
      GAS_LIMIT_SYSCALL_STORAGE_READ, // a gas limit for this call (max threshold)
      STATE_MAIN, // state of the call (must always be 0, except some special tricky cases)
  );
  // make sure returning result is zero (Ok)
  assert_eq!(exit_code, 0);
  // read output from the return data (storage slot value is always 32 bytes)
  let mut output: [u8; 32] = [0u8; 32];
  native_sdk.read_output(&mut output, 0);
  // convert return data to the U256 value
  U256::from_le_bytes(output)
}
```

For example, if smart contract **A** needs to send a message to smart contract **B**, it can trigger a special system
call interruption.
Upon interruption, the STF processes the interruption, performs ACL checks, executes the target application, and then
resumes the previous context with the appropriate exit code and return data.
