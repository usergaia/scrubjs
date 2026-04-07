import { ancestor, base } from "acorn-walk";
import { extend } from "acorn-jsx-walk";

extend(base);

/**
 * Scans an AST for all console.log calls and returns their code and positions.
 *
 * @param {object} ast - The parsed AST (from recast/acorn) of the source file.
 * @param {string} content - The original source code as a string.
 * @returns {Array<{code: string, start: number, end: number}>} Array of detected console.log calls with their code and start/end positions.
 */
export function extractLogs(ast, content) {
  const matches = [];

  ancestor(
    ast.program,
    {
      CallExpression(node, ancestors) {
        const { callee } = node;
        if (
          callee.type !== "MemberExpression" ||
          callee.object.type !== "Identifier" ||
          callee.object.name !== "console" ||
          callee.property.name !== "log"
        )
          return;

        const parent = ancestors[ancestors.length - 2];

        // Skip logs that are part of logical expressions — functional role
        if (parent?.type === "LogicalExpression") return;

        // Skip ternary branches — functional role
        if (parent?.type === "ConditionalExpression") return;

        const isJSXExpression = parent?.type === "JSXExpressionContainer";

        matches.push({
          code: content.slice(node.start, node.end),
          start: node.start,
          end: node.end,
          isJSXExpression,
        });
      },
    },
    base,
  );

  return matches;
}
