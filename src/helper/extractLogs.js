import { ancestor, base } from "acorn-walk";
import { extend } from "acorn-jsx-walk";

extend(base);

// Match only console.log calls whose direct parent is an ExpressionStatement —
// logs that stand alone as a statement, which are the ones safe to both comment
// and remove. This skips `a && log()` / ternaries, `{log()}` and `{void log()}`
// in JSX, `() => log()` arrow returns, and `log()` as a call argument; a log in
// a `.map()` block body still has an ExpressionStatement parent, so it's kept.
export function extractLogs(ast, content) {
  const matches = [];

  ancestor(
    ast,
    {
      CallExpression: function (node, ancestors) {
        const { callee } = node;
        if (
          callee.type !== "MemberExpression" ||
          callee.object.type !== "Identifier" ||
          callee.object.name !== "console" ||
          callee.property.name !== "log"
        )
          return;

        const parent = ancestors[ancestors.length - 2];
        if (parent?.type !== "ExpressionStatement") return;

        matches.push({
          code: content.slice(node.start, node.end),
          start: node.start,
          end: node.end,
          line: node.loc?.start.line,
          stmtStart: parent.start,
          stmtEnd: parent.end,
        });
      },
    },
    base,
  );

  return matches;
}
