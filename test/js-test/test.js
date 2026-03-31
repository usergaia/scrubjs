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

// With comments
console.log("with comment"); // should be removed

// Console with chained calls (should NOT be removed)
console.error("error");
console.warn("warn");
console.info("info");

// Console as a property (should NOT be removed)
obj.console.log("not global");

// Console in a string (should NOT be removed)
const str = "console.log('not a log')";

// Console in a comment (should NOT be removed)
// console.log("not a log");

// Console with whitespace and unusual formatting
console.log("weird formatting");

// Console with no semicolon
console.log("no semicolon");

// Console with destructured assignment (should NOT be removed)
const { log } = console;
