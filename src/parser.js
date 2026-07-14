import { parse as acornParse, Parser } from "acorn";
import { tsPlugin } from "@sveltejs/acorn-typescript";
import jsx from "acorn-jsx";

const TsParser = Parser.extend(tsPlugin());
const JsxParser = Parser.extend(jsx());
const TsxParser = Parser.extend(tsPlugin(), jsx());

/**
 * Parses `src` as-is into an acorn AST so node offsets map onto it directly.
 * @param {string} src source code to parse
 * @param {string} [filePath] path used to pick the JS/TS/JSX/TSX parser
 * @returns {object} the acorn Program AST, with a `comments` array attached
 */
export function getParser(src, filePath = "") {
  const comments = [];
  const isTS = filePath.endsWith(".ts");
  const isTSX = filePath.endsWith(".tsx");
  const isJSX = filePath.endsWith(".jsx");

  const config = {
    ecmaVersion: "latest",
    sourceType: "module",
    locations: true,
    ranges: true,
    onComment: comments,
  };

  let ast;
  if (isTS) {
    ast = TsParser.parse(src, config);
  } else if (isTSX) {
    ast = TsxParser.parse(src, config);
  } else if (isJSX) {
    ast = JsxParser.parse(src, config);
  } else {
    ast = acornParse(src, config);
  }

  ast.comments = comments;
  return ast;
}
