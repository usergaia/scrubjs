import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import recast from "recast";
import {
  extractLogs,
  isTargetedConsoleLog,
  rescueLeadingComments,
  commentOutLogs,
} from "./helper/index.js";

const { parse, print, visit } = recast;
const acornParse = (await import("acorn")).parse;

const parseOptions = {
  parser: {
    parse(src) {
      const comments = [];
      const ast = acornParse(src, {
        ecmaVersion: "latest",
        sourceType: "module",
        locations: true,
        ranges: true,
        onComment: comments,
      });
      ast.comments = comments;
      return ast;
    },
  },
};

export async function scanDirectory(dir) {
  const files = await readdir(dir);
  const logs = [];
  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = await readFile(filePath, "utf8");
    const ast = parse(content, parseOptions);
    const logDetails = extractLogs(ast, content);
    logs.push([logDetails, filePath]);
  }
  return logs;
}

export async function modifyLogs(filePath, content, logsToModify, mode) {
  if (mode === "comment") {
    const result = commentOutLogs(content, logsToModify);
    await writeFile(filePath, result, "utf8");
    return;
  }

  // mode === "remove" (defaults to remove; might change in future if more modes are added)
  const ast = parse(content, parseOptions);
  const callSet = new Set(logsToModify.map((l) => `${l.start},${l.end}`));

  visit(ast, {
    visitExpressionStatement(nodePath) {
      if (isTargetedConsoleLog(nodePath.node, callSet)) {
        rescueLeadingComments(nodePath);
        nodePath.prune();
        return false;
      }
      this.traverse(nodePath);
    },
  });

  const { code } = print(ast, { reuseWhitespace: true });
  await writeFile(filePath, code, "utf8");
}
