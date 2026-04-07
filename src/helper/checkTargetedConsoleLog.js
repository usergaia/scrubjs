/**
 * Checks if a node is an ExpressionStatement wrapping a console.log call targeted for modification.
 *
 * @param {object} node - The AST node to check (should be an ExpressionStatement).
 * @param {Set<string>} callSet - Set of "start,end" strings for targeted console.log calls.
 * @returns {boolean} True if the node is a targeted console.log statement, false otherwise.
 */
export function checkTargetedConsoleLog(node, callSet) {
  if (node.type !== "ExpressionStatement") return false;

  const expr = node.expression;

  // Must be a direct console.log call — not a wrapping call like useEffect(...)
  if (expr.type !== "CallExpression") return false;
  const { callee } = expr;
  if (
    callee.type !== "MemberExpression" ||
    callee.object.type !== "Identifier" ||
    callee.object.name !== "console" ||
    callee.property.name !== "log"
  )
    return false;

  // Final guard: the call itself must be in the targeted set
  return callSet.has(`${expr.start},${expr.end}`);
}
