import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["test", "node_modules"]),
  {
    files: ["**/*.js"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        __dirname: "readonly",
        module: "readonly",
        console: "readonly",
      },
    },
    rules: {
      semi: ["error", "always"],
      quotes: [
        "error",
        "double",
        { avoidEscape: true, allowTemplateLiterals: true },
      ],
      indent: ["error", 2],
      "no-multiple-empty-lines": ["error", { max: 1 }],
      eqeqeq: ["error", "always"],
      "no-console": "off",
      "no-nested-ternary": "error",
      "func-style": ["error", "declaration"],
      "object-shorthand": ["error", "never"],
    },
  },
]);
