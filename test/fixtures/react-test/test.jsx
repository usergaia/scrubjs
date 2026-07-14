import React from "react";

// ============================================================
// LOGS TO BE REMOVED
// ============================================================

// Simple console.log in component
const SimpleComponent = () => {
  console.log("[LOG 1] in JSX component");
  return <div>Content</div>;
};

// In useEffect
const ComponentWithEffect = () => {
  React.useEffect(() => {
    console.log("[LOG 2] in useEffect");
  }, []);

  return <div>Effect Component</div>;
};

// In event handler
const ComponentWithHandler = () => {
  const handleClick = () => {
    console.log("[LOG 3] click handler");
  };

  return <button onClick={handleClick}>Click</button>;
};

// In JSX expression
const ComponentWithExpression = () => {
  console.log("[LOG 4] before render");
  return <div>console.log("[LOG 5] in JSX expression") Content</div>;
};

// In loop
const ComponentWithLoop = () => {
  const items = [1, 2, 3];
  return (
    <div>
      {items.map((item) => {
        console.log("[LOG 6] in map", item);
        return <div key={item}>{item}</div>;
      })}
    </div>
  );
};

// In custom hook
const useCustomHook = () => {
  console.log("[LOG 7] in custom hook");
  return "hook value";
};

// With template literal
const ComponentWithTemplate = () => {
  const name = "Test";
  console.log(`[LOG 8] template ${name}`);
  return <div>{name}</div>;
};

// Nested in function with JSX
function FunctionComponent() {
  console.log("[LOG 9] in function component");
  debugger;
  return <span>Span</span>;
}

// Debugger inside a component
const ComponentWithDebugger = () => {
  debugger;
  return <div>Debug</div>;
};

// ============================================================
// NOT EXECUTED / SHOULD STAY
// ============================================================

// In comment
// console.log("[NOT EXECUTED] in comment");

// In string
const str = "console.log('[NOT EXECUTED] in string')";

// Debugger keyword inside a string, not a statement
const debuggerStr = "debugger";

// In JSX as text content (not executed)
const ComponentWithText = () => <div>console.log("not executed")</div>;

// Other console methods
const ComponentWithOtherMethods = () => {
  console.error("[ERROR] error message");
  console.warn("[WARN] warning message");
  console.info("[INFO] info message");
  return <div>Component</div>;
};

// Destructured console
const { log } = console;
log("[DESTRUCTURED] not a direct global console.log");

// Property access (not global console)
const obj = { console: { log: () => {} } };
obj.console.log("not global");

// Kept with // scrubjs-keep
console.log("[KEEP] trailing marker"); // scrubjs-keep

// scrubjs-keep
console.log("[KEEP] leading marker");

// In conditional render
const ComponentWithConditional = ({ show }) => {
  return (
    <>
      {show && console.log("[NOT EXECUTED] conditional render")}
      {show ? <div>Shown</div> : console.log("[NOT EXECUTED] else branch")}
    </>
  );
};

// Arrow function without return
const ArrowNoReturn = () =>
  console.log("[NOT EXECUTED] arrow function") || <div>Div</div>;
