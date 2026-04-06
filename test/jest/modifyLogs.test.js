import os from "os";
import path from "path";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { modifyLogs, scanPath } from "../../src/logs.js";

const fixtureUrl = new URL("../fixtures/js-test/test.js", import.meta.url);

const expectedToStay = [
  'console.error("[ERROR] error");',
  'console.warn("[WARN] warn");',
  'console.info("[INFO] info");',
  'obj.console.log("not global");',
  "const str = \"console.log('[NOT EXECUTED] in string')\";",
  '// console.log("[NOT EXECUTED] in comment");',
  "const { log } = console;",
];

const expectedToBeCommented = [
  '// console.log("[LOG 1] simple");',
  '// console.log("[LOG 2] multiple", "arguments", 123, { a: 1 });',
  "// console.log(`[LOG 3] template ${42}`);",
  '// console.log("[LOG 4] multiline", 123, { foo: "bar" });',
  '//   console.log("[LOG 5] inside function");',
  '//   console.log("[LOG 6] inside arrow");',
  '//     console.log("[LOG 7] inside class method");',
  '// console.log("[LOG 8] sum:", 1 + 2);',
  '// console.log("[LOG 9] with comment");',
  '// console.log("[LOG 10] weird formatting");',
  '// console.log("[LOG 11] no semicolon");',
];

async function createFixtureWorkspace() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "logrm-regression-"));
  const filePath = path.join(tempDir, "test.js");
  const fixtureContent = await readFile(fixtureUrl, "utf8");
  await writeFile(filePath, fixtureContent, "utf8");
  return { tempDir, filePath };
}

function assertUntouchedLinesIntact(updated) {
  for (const snippet of expectedToStay) {
    expect(updated).toContain(snippet);
  }
}

describe("logs regression using js-test fixture", () => {
  test("scanPath detects all global console.log calls", async () => {
    const { tempDir, filePath } = await createFixtureWorkspace();

    try {
      const [[logDetails, scannedPath]] = await scanPath(tempDir);
      expect(scannedPath).toBe(filePath);
      expect(logDetails).toHaveLength(11);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("modifyLogs remove mode removes targeted console.log statements only", async () => {
    const { tempDir, filePath } = await createFixtureWorkspace();

    try {
      const [[logDetails]] = await scanPath(tempDir);
      const source = await readFile(filePath, "utf8");

      await modifyLogs(filePath, source, logDetails, "remove");

      const updated = await readFile(filePath, "utf8");
      assertUntouchedLinesIntact(updated);

      const remainingResults = await scanPath(tempDir);
      expect(remainingResults).toHaveLength(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("modifyLogs comment mode comments targeted lines and keeps non-targeted calls", async () => {
    const { tempDir, filePath } = await createFixtureWorkspace();

    try {
      const [[logDetails]] = await scanPath(tempDir);
      const source = await readFile(filePath, "utf8");

      await modifyLogs(filePath, source, logDetails, "comment");

      const updated = await readFile(filePath, "utf8");
      for (const snippet of expectedToBeCommented) {
        expect(updated).toContain(snippet);
      }
      assertUntouchedLinesIntact(updated);

      const remainingResults = await scanPath(tempDir);
      expect(remainingResults).toHaveLength(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
