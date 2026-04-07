import { parse as recastParse } from "recast";
import { parse as acornParse, Parser } from "acorn";
import { tsPlugin } from "@sveltejs/acorn-typescript";
import jsx from "acorn-jsx";

const TsParser = Parser.extend(tsPlugin());
const JsxParser = Parser.extend(jsx());
const TsxParser = Parser.extend(tsPlugin(), jsx());

export function getParser(src, filePath = "") {
  const comments = [];
  const isTS = filePath.endsWith(".ts");
  const isTSX = filePath.endsWith(".tsx");
  const isJSX = filePath.endsWith(".jsx");

  function handleParse(src) {
    const tokens = [];
    const config = {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
      ranges: true,
      tokens: true,
      onComment: comments,
      onToken: tokens,
    };

    let result;
    if (isTS) {
      result = TsParser.parse(src, config);
    } else if (isTSX) {
      result = TsxParser.parse(src, config);
    } else if (isJSX) {
      result = JsxParser.parse(src, config);
    } else {
      result = acornParse(src, config);
    }

    result.tokens = tokens;
    return result;
  }

  const ast = recastParse(src, {
    parser: {
      parse: handleParse,
    },
  });

  ast.comments = comments;
  return ast;
}
