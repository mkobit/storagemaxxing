import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import functional from "eslint-plugin-functional";
import importX from "eslint-plugin-import-x";
import jsonc from "eslint-plugin-jsonc";
import * as jsoncParser from "jsonc-eslint-parser";
import globals from "globals";
import { fixupPluginRules } from "@eslint/compat";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "node_modules/**", ".claude/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      functional,
      import: importX,
      react: fixupPluginRules(react as any),
      "react-hooks": fixupPluginRules(reactHooks as any),
      "jsx-a11y": fixupPluginRules(jsxA11y as any),
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...(react.configs.recommended.rules as any),
      ...(reactHooks.configs.recommended.rules as any),
      ...(jsxA11y.configs.recommended.rules as any),
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      complexity: ["error", 8],
      "functional/immutable-data": ["error", { ignoreImmediateMutation: true }],
      "functional/no-let": "error",
      "functional/no-loop-statements": "error",
      "functional/prefer-readonly-type": "error",
      "import/no-cycle": "error",
      "import/no-default-export": "error",
      "import/no-unresolved": "off",
      "max-depth": ["error", 3],
      "max-params": ["error", 4],
      "no-restricted-imports": ["error", { "patterns": ["**/index", "**/index.ts", "**/index.tsx"] }],
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": "off",
      "functional/no-expression-statements": "off",
      "functional/no-return-void": "off",
    },
  },
  {
    files: [
      "packages/geometry/src/**/*.ts",
      "packages/packer/src/**/*.ts",
      "packages/catalog/src/**/*.ts",
      "packages/solver/src/**/*.ts",
      "packages/assembly/src/**/*.ts",
    ],
    ignores: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "functional/no-expression-statements": "error",
      "functional/no-throw-statements": "error",
      "functional/no-try-statements": "error",
    },
  },
  {
    files: ["**/*.json", "**/*.json5", "**/*.jsonc"],
    languageOptions: {
      parser: jsoncParser as any,
    },
    plugins: {
      jsonc,
    },
    rules: {
      ...(jsonc.configs["recommended-with-json"].rules as any),
      "jsonc/no-comments": "error",
      "jsonc/sort-keys": ["error", "asc"],
    },
  },
  {
    files: ["package.json", "packages/*/package.json", "apps/*/package.json"],
    rules: {
      "jsonc/sort-keys": "off",
    },
  },
  {
    files: ["eslint.config.ts"],
    rules: {
      "import/no-default-export": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
    },
  },
);
