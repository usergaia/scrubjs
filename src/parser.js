import { parse as recastParse } from "recast";
import { parse as acornParse } from "acorn";

export function getParser(src) {
  const comments = [];

  function handleAcornParse(s) {
    return acornParse(s, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
      ranges: true,
      onComment: comments,
    });
  }

  const ast = recastParse(src, {
    parser: {
      parse: handleAcornParse,
    },
  });

  ast.comments = comments;
  return ast;
}
