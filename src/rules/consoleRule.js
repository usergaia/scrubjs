import { ancestor, base } from "./walk.js";

const DEFAULT_METHODS = ["log"];

/**
 * Finds standalone `console.<method>` statements, the ones safe to change.
 * @param {object} ast acorn Program AST to walk
 * @param {string} content source the AST was parsed from
 * @param {string[]} [methods] console method names to match
 * @returns {object[]} the detected findings
 */
export function detectConsole(ast, content, methods = DEFAULT_METHODS) {
  const wanted = new Set(methods);
  const findings = [];

  ancestor(
    ast,
    {
      CallExpression: function (node, ancestors) {
        const { callee } = node;
        if (
          callee.type !== "MemberExpression" ||
          callee.object.type !== "Identifier" ||
          callee.object.name !== "console" ||
          !wanted.has(callee.property.name)
        )
          return;

        const parent = ancestors[ancestors.length - 2];
        if (parent?.type !== "ExpressionStatement") return;

        findings.push({
          kind: "console." + callee.property.name,
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

  return findings;
}
