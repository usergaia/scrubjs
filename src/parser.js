import { parse as recastParse } from "recast";
import { parse as acornParse } from "acorn";
import { Parser } from "acorn";
import typescript from "acorn-typescript";

const TsParser = Parser.extend(typescript());
const tsAcornParse = TsParser.parse.bind(TsParser);

export function getParser(src, filePath = "") {
  const comments = [];
  const isTypeScript = filePath.endsWith(".ts") || filePath.endsWith(".tsx");
  // const isJSX = filePath.endsWith(".jsx") || filePath.endsWith(".tsx");

  function handleAcornParse(src) {
    const config = {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
      ranges: true,
      onComment: comments,
    };

    // if (isJSX) {
    //   config.plugins = { jsx: true };
    // }

    return (isTypeScript ? tsAcornParse : acornParse)(src, config);
  }

  const ast = recastParse(src, {
    parser: {
      parse: handleAcornParse,
    },
  });

  ast.comments = comments;
  return ast;
}
