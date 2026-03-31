import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";

let logList = [];

export async function scanDirectory(dir) {
  const files = await readdir(dir);
  let logs = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    let content = await readFile(filePath, "utf8");
    const matches = content.match(/console\.log\(.*?\);?/g) || [];

    logs.push([matches, filePath]);
  }
  return logs;
}

export async function removeLogs(filePath, content) {
  content = content.replace(/console\.log\(.*\);?/g, "");
  console.log(`Cleaned logs from ${filePath}`);
  await writeFile(filePath, content, "utf8");
}

logList = await scanDirectory("./src");
