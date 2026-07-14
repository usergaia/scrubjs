// ============================================================
// LOGS TO BE REMOVED
// ============================================================

// Simple single-line
console.log("[LOG 1] simple");

// With multiple arguments
console.log("[LOG 2] multiple", "arguments", 123, { a: 1 });

// With template literals
console.log(`[LOG 3] template ${42}`);

// Multiline call
console.log("[LOG 4] multiline", 123, { foo: "bar" });

// Nested in a function
function foo2(): void {
  console.log("[LOG 5] inside function");
}

// Inside an arrow function
const bar2 = (): void => {
  console.log("[LOG 6] inside arrow");
};

// Inside a class method
class Baz2 {
  method(): void {
    console.log("[LOG 7] inside class method");
  }
}

// With expressions
console.log("[LOG 8] sum:", 1 + 2);

// With comments
console.log("[LOG 9] with comment");

// With whitespace and unusual formatting
console.log("[LOG 10] weird formatting");

// With no semicolon
console.log("[LOG 11] no semicolon");

// TypeScript-specific: with types and generics
function generic<T>(val: T): void {
  console.log("[LOG 12] inside generic", val);
}

// Debugger statement
debugger;

// Debugger inside a function
function withDebugger(): void {
  debugger;
}

// ============================================================
// NOT EXECUTED / SHOULD STAY
// ============================================================

// Console with destructured assignment
log("[DESTRUCTURED] not a global console.log");

// Console in a comment
// console.log("[NOT EXECUTED] in comment");

// Console in a string
const str2: string = "console.log('[NOT EXECUTED] in string')";

// Debugger keyword inside a string, not a statement
const debuggerStr: string = "debugger";

// Console as a property
obj.console.log("not global");

// Console with chained calls
console.error("[ERROR] error");
console.warn("[WARN] warn");
console.info("[INFO] info");

// ============================================================
// KEPT WITH // scrubjs-keep
// ============================================================

console.log("[KEEP] trailing marker"); // scrubjs-keep

// scrubjs-keep
console.log("[KEEP] leading marker");
