import os from "os";
import path from "path";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { modifyLogs, scanDirectory } from "../../src/logs.js";

const fixtureUrl = new URL("../js-test/test.js", import.meta.url);

const expectedToStay = [
  'console.error("error");',
  'console.warn("warn");',
  'console.info("info");',
  'obj.console.log("not global");',
  "const str = \"console.log('not a log')\";",
  '// console.log("not a log");',
  "const { log } = console;",
];

const expectedToBeCommented = [
  '// console.log("simple");',
  '// console.log("multiple", "arguments", 123, { a: 1 });',
  "// console.log(`template ${42}`);",
  '// console.log("multiline", 123, { foo: "bar" });',
  '//   console.log("inside function");',
  '//   console.log("inside arrow");',
  '//     console.log("inside class method");',
  '// console.log("sum:", 1 + 2);',
  '// console.log("with comment"); // should be removed',
  '// console.log("weird formatting");',
  '// console.log("no semicolon");',
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
  test("scanDirectory detects all global console.log calls", async () => {
    const { tempDir, filePath } = await createFixtureWorkspace();

    try {
      const [[logDetails, scannedPath]] = await scanDirectory(tempDir);
      expect(scannedPath).toBe(filePath);
      expect(logDetails).toHaveLength(11);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("modifyLogs remove mode removes targeted console.log statements only", async () => {
    const { tempDir, filePath } = await createFixtureWorkspace();

    try {
      const [[logDetails]] = await scanDirectory(tempDir);
      const source = await readFile(filePath, "utf8");

      await modifyLogs(filePath, source, logDetails, "remove");

      const updated = await readFile(filePath, "utf8");
      assertUntouchedLinesIntact(updated);

      const [[remainingLogs]] = await scanDirectory(tempDir);
      expect(remainingLogs).toHaveLength(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("modifyLogs comment mode comments targeted lines and keeps non-targeted calls", async () => {
    const { tempDir, filePath } = await createFixtureWorkspace();

    try {
      const [[logDetails]] = await scanDirectory(tempDir);
      const source = await readFile(filePath, "utf8");

      await modifyLogs(filePath, source, logDetails, "comment");

      const updated = await readFile(filePath, "utf8");
      for (const snippet of expectedToBeCommented) {
        expect(updated).toContain(snippet);
      }
      assertUntouchedLinesIntact(updated);

      const [[remainingLogs]] = await scanDirectory(tempDir);
      expect(remainingLogs).toHaveLength(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
