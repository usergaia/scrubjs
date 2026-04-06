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
function foo() {
  console.log("[LOG 5] inside function");
}

// Inside an arrow function
const bar = () => {
  console.log("[LOG 6] inside arrow");
};

// Inside a class method
class Baz {
  method() {
    console.log("[LOG 7] inside class method");
  }
}

// With expressions
console.log("[LOG 8] sum:", 1 + 2);

// With inline comments
console.log("[LOG 9] with comment");

// Whitespace and unusual formatting
console.log("[LOG 10] weird formatting");

// No semicolon
console.log("[LOG 11] no semicolon");

// ============================================================
// NOT EXECUTED / SHOULD STAY
// ============================================================

// Destructured assignment, not a call expression
const { log } = console;

// Inside a comment, not executable code
// console.log("[NOT EXECUTED] in comment");

// Just text content, not executable code
const str = "console.log('[NOT EXECUTED] in string')";

// Not the global console object
const obj = { console };
obj.console.log("not global");

// Other console methods are not targeted
console.error("[ERROR] error");
console.warn("[WARN] warn");
console.info("[INFO] info");
