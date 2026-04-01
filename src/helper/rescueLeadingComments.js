/**
 * Before pruning a node, move its leading comments onto the next sibling.
 * If there is no next sibling, move them to the parent as innerComments
 * so recast still emits them.
 *
 * @param {object} nodePath - The recast NodePath of the node to be pruned.
 */
export function rescueLeadingComments(nodePath) {
  const leading = nodePath.node.comments?.filter((c) => c.leading);
  if (!leading?.length) return;

  const parent = nodePath.parent.node;
  const siblings =
    nodePath.parent.node[nodePath.name] ?? // named array prop
    nodePath.parentPath?.node[nodePath.parentPath?.name];
  const idx = nodePath.name; // numeric index when parent is an array

  // Find the next sibling in the same statement list
  const nextSibling = Array.isArray(siblings)
    ? siblings[Number(idx) + 1]
    : null;

  if (nextSibling) {
    // Prepend onto the next sibling's leading comments
    nextSibling.comments = [
      ...leading.map((c) => ({ ...c, leading: true, trailing: false })),
      ...(nextSibling.comments ?? []),
    ];
  } else {
    // No next sibling - attach as innerComments on the parent block
    parent.comments = [
      ...(parent.comments ?? []),
      ...leading.map((c) => ({ ...c, leading: false, trailing: false })),
    ];
  }

  // Strip them from the node we're about to delete
  nodePath.node.comments = nodePath.node.comments.filter((c) => !c.leading);
}
