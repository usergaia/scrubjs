import React from "react";

// ============================================================
// LOGS TO BE REMOVED
// ============================================================

// Simple console.log in component
const SimpleComponent: React.FC = () => {
  console.log("[LOG 1] in TSX component");
  return <div>Content</div>;
};

// In useEffect
const ComponentWithEffect: React.FC = () => {
  React.useEffect(() => {
    console.log("[LOG 2] in useEffect");
  }, []);

  return <div>Effect Component</div>;
};

// In event handler
const ComponentWithHandler: React.FC = () => {
  const handleClick = () => {
    console.log("[LOG 3] click handler");
  };

  return <button onClick={handleClick}>Click</button>;
};

// In JSX expression
const ComponentWithExpression: React.FC = () => {
  console.log("[LOG 4] before render");
  return (
    <div>
      {void console.log("[LOG 5] in JSX expression")}
      Content
    </div>
  );
};

// In conditional render
const ComponentWithConditional: React.FC<{ show: boolean }> = ({ show }) => {
  return (
    <>
      {show && console.log("[LOG 6] conditional render")}
      {show ? <div>Shown</div> : console.log("[LOG 7] else branch")}
    </>
  );
};

// In loop
const ComponentWithLoop: React.FC = () => {
  const items = [1, 2, 3];
  return (
    <div>
      {items.map((item) => {
        console.log("[LOG 8] in map", item);
        return <div key={item}>{item}</div>;
      })}
    </div>
  );
};

// In custom hook
const useCustomHook = () => {
  console.log("[LOG 9] in custom hook");
  return "hook value";
};

// With template literal
const ComponentWithTemplate: React.FC = () => {
  const name = "Test";
  console.log(`[LOG 10] template ${name}`);
  return <div>{name}</div>;
};

// Debugger inside a component
const ComponentWithDebugger: React.FC = () => {
  debugger;
  return <div>Debug</div>;
};

// Debugger inside a custom hook
const useDebugHook = () => {
  debugger;
  return "value";
};

// ============================================================
// NOT EXECUTED / SHOULD STAY
// ============================================================

// In comment
// console.log("[NOT EXECUTED] in comment");

// In string
const str: string = "console.log('[NOT EXECUTED] in string')";

// Debugger keyword inside a string, not a statement
const debuggerStr: string = "debugger";

// In JSX as text content (not executed)
const ComponentWithText: React.FC = () => (
  <div>console.log("not executed")</div>
);

// Other console methods
const ComponentWithOtherMethods: React.FC = () => {
  console.error("[ERROR] error message");
  console.warn("[WARN] warning message");
  console.info("[INFO] info message");
  return <div>Component</div>;
};

// Destructured console
const { log } = console;
log("[DESTRUCTURED] not a direct global console.log");

// Property access (not global console)
const obj = { console: { log: (msg: string) => {} } };
obj.console.log("not global");

// Kept with // scrubjs-keep
console.log("[KEEP] trailing marker"); // scrubjs-keep

// scrubjs-keep
console.log("[KEEP] leading marker");
