// -------------------------------
// EXPECTED TO BE REMOVED
// -------------------------------

// Simple single-line
console.log("simple");

// With multiple arguments
console.log("multiple", "arguments", 123, { a: 1 });

// With template literals
console.log(`template ${42}`);

// Multiline call
console.log("multiline", 123, { foo: "bar" });

// Nested in a function
function foo() {
  console.log("inside function");
}

// Inside an arrow function
const bar = () => {
  console.log("inside arrow");
};

// Inside a class method
class Baz {
  method() {
    console.log("inside class method");
  }
}

// With expressions
console.log("sum:", 1 + 2);

// With inline comments
console.log("with comment"); // should be removed

// Whitespace and unusual formatting
console.log("weird formatting");

// No semicolon
console.log("no semicolon");

// -------------------------------
// EXPECTED TO STAY (NOT REMOVED)
// -------------------------------

// Other console methods are not targeted
console.error("error");
console.warn("warn");
console.info("info");

// Not the global console object
obj.console.log("not global");

// Just text content, not executable code
const str = "console.log('not a log')";

// Inside a comment, not executable code
// console.log("not a log");

// Destructured assignment, not a call expression
const { log } = console;
