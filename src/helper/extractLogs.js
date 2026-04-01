import { simple } from "acorn-walk";

/**
 * Scans an AST for all console.log calls and returns their code and positions.
 *
 * @param {object} ast - The parsed AST (from recast/acorn) of the source file.
 * @param {string} content - The original source code as a string.
 * @returns {Array<{code: string, start: number, end: number}>} Array of detected console.log calls with their code and start/end positions.
 */
export function extractLogs(ast, content) {
  const matches = [];
  simple(ast.program, {
    CallExpression(node) {
      const { callee } = node;
      if (
        callee.type === "MemberExpression" &&
        callee.object.type === "Identifier" &&
        callee.object.name === "console" &&
        callee.property.name === "log"
      ) {
        matches.push({
          code: content.slice(node.start, node.end),
          start: node.start,
          end: node.end,
        });
      }
    },
  });
  return matches;
}
