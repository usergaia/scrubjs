import os from "os";
import path from "path";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { modifyLogs, scanPath } from "../../src/logs.js";

async function createFixtureWorkspace(fixtureUrl) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "logrm-regression-"));
  const ext = fixtureUrl.pathname.endsWith(".ts") ? ".ts" : ".js";
  const filePath = path.join(tempDir, `test${ext}`);
  const fixtureContent = await readFile(fixtureUrl, "utf8");
  await writeFile(filePath, fixtureContent, "utf8");
  return { tempDir, filePath };
}

function assertUntouchedLinesIntact(updated, expectedToStay) {
  for (const snippet of expectedToStay) {
    expect(updated).toContain(snippet);
  }
}

describe("logs regression using js-test fixture", () => {
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
    '  // console.log("[LOG 5] inside function");',
    '  // console.log("[LOG 6] inside arrow");',
    '    // console.log("[LOG 7] inside class method");',
    '// console.log("[LOG 8] sum:", 1 + 2);',
    '// console.log("[LOG 9] with comment");',
    '// console.log("[LOG 10] weird formatting");',
    '// console.log("[LOG 11] no semicolon");',
  ];

  test("scanPath detects all global console.log calls", async () => {
    const { tempDir, filePath } = await createFixtureWorkspace(fixtureUrl);

    try {
      const [[logDetails, scannedPath]] = await scanPath(tempDir);
      expect(scannedPath).toBe(filePath);
      expect(logDetails).toHaveLength(11);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("modifyLogs remove mode removes targeted console.log statements only", async () => {
    const { tempDir, filePath } = await createFixtureWorkspace(fixtureUrl);

    try {
      const [[logDetails]] = await scanPath(tempDir);
      const source = await readFile(filePath, "utf8");

      await modifyLogs(filePath, source, logDetails, "remove");

      const updated = await readFile(filePath, "utf8");
      assertUntouchedLinesIntact(updated, expectedToStay);

      const remainingResults = await scanPath(tempDir);
      expect(remainingResults).toHaveLength(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("modifyLogs comment mode comments targeted lines and keeps non-targeted calls", async () => {
    const { tempDir, filePath } = await createFixtureWorkspace(fixtureUrl);

    try {
      const [[logDetails]] = await scanPath(tempDir);
      const source = await readFile(filePath, "utf8");

      await modifyLogs(filePath, source, logDetails, "comment");

      const updated = await readFile(filePath, "utf8");
      for (const snippet of expectedToBeCommented) {
        expect(updated).toContain(snippet);
      }
      assertUntouchedLinesIntact(updated, expectedToStay);

      const remainingResults = await scanPath(tempDir);
      expect(remainingResults).toHaveLength(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("logs regression using ts-test fixture", () => {
  const fixtureUrl = new URL("../fixtures/ts-test/test.ts", import.meta.url);

  const expectedToStay = [
    'console.error("[ERROR] error");',
    'console.warn("[WARN] warn");',
    'console.info("[INFO] info");',
    'obj.console.log("not global");',
    "const str2: string = \"console.log('[NOT EXECUTED] in string')\";",
    '// console.log("[NOT EXECUTED] in comment");',
    'log("[DESTRUCTURED] not a global console.log");',
  ];

  const expectedToBeCommented = [
    '// console.log("[LOG 1] simple");',
    '// console.log("[LOG 2] multiple", "arguments", 123, { a: 1 });',
    "// console.log(`[LOG 3] template ${42}`);",
    '// console.log("[LOG 4] multiline", 123, { foo: "bar" });',
    '  // console.log("[LOG 5] inside function");',
    '  // console.log("[LOG 6] inside arrow");',
    '    // console.log("[LOG 7] inside class method");',
    '// console.log("[LOG 8] sum:", 1 + 2);',
    '// console.log("[LOG 9] with comment");',
    '// console.log("[LOG 10] weird formatting");',
    '// console.log("[LOG 11] no semicolon");',
    '  // console.log("[LOG 12] inside generic", val);',
  ];

  test("scanPath detects all global console.log calls", async () => {
    const { tempDir, filePath } = await createFixtureWorkspace(fixtureUrl);

    try {
      const [[logDetails, scannedPath]] = await scanPath(tempDir);
      expect(scannedPath).toBe(filePath);
      expect(logDetails).toHaveLength(12);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("modifyLogs remove mode removes targeted console.log statements only", async () => {
    const { tempDir, filePath } = await createFixtureWorkspace(fixtureUrl);

    try {
      const [[logDetails]] = await scanPath(tempDir);
      const source = await readFile(filePath, "utf8");

      await modifyLogs(filePath, source, logDetails, "remove");

      const updated = await readFile(filePath, "utf8");
      assertUntouchedLinesIntact(updated, expectedToStay);

      const remainingResults = await scanPath(tempDir);
      expect(remainingResults).toHaveLength(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("modifyLogs comment mode comments targeted lines and keeps non-targeted calls", async () => {
    const { tempDir, filePath } = await createFixtureWorkspace(fixtureUrl);

    try {
      const [[logDetails]] = await scanPath(tempDir);
      const source = await readFile(filePath, "utf8");

      await modifyLogs(filePath, source, logDetails, "comment");

      const updated = await readFile(filePath, "utf8");
      for (const snippet of expectedToBeCommented) {
        expect(updated).toContain(snippet);
      }
      assertUntouchedLinesIntact(updated, expectedToStay);

      const remainingResults = await scanPath(tempDir);
      expect(remainingResults).toHaveLength(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

// describe("logs regression using jsx-test fixture", () => {
//   const fixtureUrl = new URL(
//     "../fixtures/react-test/test.jsx",
//     import.meta.url,
//   );

//   const expectedToStay = [
//     'console.error("[ERROR] error");',
//     'console.warn("[WARN] warn");',
//     'console.info("[INFO] info");',
//     'obj.console.log("not global");',
//     "const str = \"console.log('[NOT EXECUTED] in string')\";",
//     '// console.log("[NOT EXECUTED] in comment");',
//     "const { log } = console;",
//   ];

//   const expectedToBeCommented = [
//     '// console.log("[LOG 1] in JSX component");',
//     '// console.log("[LOG 2] in useEffect");',
//     '// console.log("[LOG 3] click handler");',
//     '// console.log("[LOG 4] before render");',
//     '{/* console.log("[LOG 5] in JSX expression") */}',
//     '{/* console.log("[LOG 6] conditional render") */}',
//     '{/* console.log("[LOG 7] else branch") */}',
//   ];

//   test("scanPath detects all global console.log calls", async () => {
//     const { tempDir, filePath } = await createFixtureWorkspace(fixtureUrl);

//     try {
//       const [[logDetails, scannedPath]] = await scanPath(tempDir);
//       expect(scannedPath).toBe(filePath);
//       expect(logDetails).toHaveLength(7);
//     } finally {
//       await rm(tempDir, { recursive: true, force: true });
//     }
//   });

//   test("modifyLogs remove mode removes targeted console.log statements only", async () => {
//     const { tempDir, filePath } = await createFixtureWorkspace(fixtureUrl);

//     try {
//       const [[logDetails]] = await scanPath(tempDir);
//       const source = await readFile(filePath, "utf8");

//       await modifyLogs(filePath, source, logDetails, "remove");

//       const updated = await readFile(filePath, "utf8");
//       assertUntouchedLinesIntact(updated, expectedToStay);

//       const remainingResults = await scanPath(tempDir);
//       expect(remainingResults).toHaveLength(0);
//     } finally {
//       await rm(tempDir, { recursive: true, force: true });
//     }
//   });

//   test("modifyLogs comment mode comments targeted lines and keeps non-targeted calls", async () => {
//     const { tempDir, filePath } = await createFixtureWorkspace(fixtureUrl);

//     try {
//       const [[logDetails]] = await scanPath(tempDir);
//       const source = await readFile(filePath, "utf8");

//       await modifyLogs(filePath, source, logDetails, "comment");

//       const updated = await readFile(filePath, "utf8");
//       for (const snippet of expectedToBeCommented) {
//         expect(updated).toContain(snippet);
//       }
//       assertUntouchedLinesIntact(updated, expectedToStay);

//       const remainingResults = await scanPath(tempDir);
//       expect(remainingResults).toHaveLength(0);
//     } finally {
//       await rm(tempDir, { recursive: true, force: true });
//     }
//   });
// });

// describe("logs regression using tsx-test fixture", () => {
//   const fixtureUrl = new URL(
//     "../fixtures/react-test/test.tsx",
//     import.meta.url,
//   );

//   const expectedToStay = [
//     'console.error("[ERROR] error");',
//     'console.warn("[WARN] warn");',
//     'console.info("[INFO] info");',
//     'obj.console.log("not global");',
//     "const str: string = \"console.log('[NOT EXECUTED] in string')\";",
//     '// console.log("[NOT EXECUTED] in comment");',
//     'log("[DESTRUCTURED] not a direct global console.log");',
//   ];

//   const expectedToBeCommented = [
//     '// console.log("[LOG 1] in TSX component");',
//     '// console.log("[LOG 2] in useEffect");',
//     '// console.log("[LOG 3] click handler");',
//     '// console.log("[LOG 4] before render");',
//     '{/* void console.log("[LOG 5] in JSX expression") */}',
//     '{/* console.log("[LOG 6] conditional render") */}',
//     '{/* console.log("[LOG 7] else branch") */}',
//     '// console.log("[LOG 8] in map", item);',
//     '// console.log("[LOG 9] in custom hook");',
//     "// console.log(`[LOG 10] template ${name}`);",
//   ];

//   test("scanPath detects all global console.log calls", async () => {
//     const { tempDir, filePath } = await createFixtureWorkspace(fixtureUrl);

//     try {
//       const [[logDetails, scannedPath]] = await scanPath(tempDir);
//       expect(scannedPath).toBe(filePath);
//       expect(logDetails).toHaveLength(10);
//     } finally {
//       await rm(tempDir, { recursive: true, force: true });
//     }
//   });

//   test("modifyLogs remove mode removes targeted console.log statements only", async () => {
//     const { tempDir, filePath } = await createFixtureWorkspace(fixtureUrl);

//     try {
//       const [[logDetails]] = await scanPath(tempDir);
//       const source = await readFile(filePath, "utf8");

//       await modifyLogs(filePath, source, logDetails, "remove");

//       const updated = await readFile(filePath, "utf8");
//       assertUntouchedLinesIntact(updated, expectedToStay);

//       const remainingResults = await scanPath(tempDir);
//       expect(remainingResults).toHaveLength(0);
//     } finally {
//       await rm(tempDir, { recursive: true, force: true });
//     }
//   });

//   test("modifyLogs comment mode comments targeted lines and keeps non-targeted calls", async () => {
//     const { tempDir, filePath } = await createFixtureWorkspace(fixtureUrl);

//     try {
//       const [[logDetails]] = await scanPath(tempDir);
//       const source = await readFile(filePath, "utf8");

//       await modifyLogs(filePath, source, logDetails, "comment");

//       const updated = await readFile(filePath, "utf8");
//       for (const snippet of expectedToBeCommented) {
//         expect(updated).toContain(snippet);
//       }
//       assertUntouchedLinesIntact(updated, expectedToStay);

//       const remainingResults = await scanPath(tempDir);
//       expect(remainingResults).toHaveLength(0);
//     } finally {
//       await rm(tempDir, { recursive: true, force: true });
//     }
//   });
// });
