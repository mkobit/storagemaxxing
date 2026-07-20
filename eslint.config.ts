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

const DAG_ORDER = [
  "geometry",
  "catalog",
  "assembly",
  "packer",
  "store",
  "web",
] as const;

const INDEX_IMPORT_PATTERN = {
  group: ["**/index", "**/index.ts", "**/index.tsx"],
} as const;

// Lint-enforced package DAG per openspec/specs/monorepo-topology:
// each package may import only @storagemaxxing/* packages strictly below it.
const dagBoundaries = DAG_ORDER.slice(0, -1).map((pkg, i) => ({
  files: [`packages/${pkg}/src/**/*.{ts,tsx}`],
  ignores: ["**/*.test.ts", "**/*.test.tsx"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          INDEX_IMPORT_PATTERN,
          ...DAG_ORDER.slice(i + 1).map((upper) => ({
            group: [`@storagemaxxing/${upper}`, `@storagemaxxing/${upper}/*`],
            message: `packages/${pkg} may not import @storagemaxxing/${upper}: violates the monorepo DAG ${DAG_ORDER.join(" -> ")} (see openspec/specs/monorepo-topology).`,
          })),
        ],
      },
    ],
  } as any,
}));

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "node_modules/**",
      ".claude/**",
      ".beads/**",
      "apps/web/test-results/**",
      "apps/web/e2e/**",
      "apps/web/scripts/**",
      "apps/web/playwright.config.ts",
      "scripts/**",
    ],
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
      "functional/no-expression-statements": ["error", { ignoreVoid: true }],
      "functional/no-let": "error",
      "functional/no-loop-statements": "error",
      "functional/prefer-readonly-type": "error",
      "import/extensions": ["error", "never", { css: "always" }],
      "import/no-cycle": "error",
      "import/no-default-export": "error",
      "import/no-unresolved": "off",
      "max-depth": ["error", 3],
      "max-params": ["error", 4],
      "no-restricted-imports": [
        "error",
        { patterns: ["**/index", "**/index.ts", "**/index.tsx"] },
      ],
      "react/react-in-jsx-scope": "off",
    },
  },
  ...dagBoundaries,
  {
    files: ["apps/web/src/**/*.{ts,tsx}", "apps/web/serve.ts"],
    rules: {
      "functional/no-expression-statements": "off",
    },
  },
  {
    // Enforces openspec/specs/web-design-system "no new hardcoded color
    // values": components must consume @theme tokens (apps/web/src/index.css)
    // instead of hex/rgb/hsl literals or Tailwind arbitrary bracket literals.
    files: ["apps/web/src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b/]",
          message:
            "Hardcoded color literal -- reference a @theme token in apps/web/src/index.css instead.",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/-\\[(?!var\\()[^\\]]+\\]/]",
          message:
            "Tailwind arbitrary bracket literal -- use a token/scale utility, or a var(--theme-token) reference, or if the value is structural (not styling), disable this rule inline with a reason.",
        },
      ],
    },
  },
  {
    // Categorical data-viz palette (visually distinguishes bin instances by
    // index), not UI-chrome styling -- exempt from the hex-literal ban above.
    files: ["apps/web/src/ui/binColorPalette.ts"],
    rules: {
      "no-restricted-syntax": "off",
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
      ...(jsonc.configs["recommended-with-json"] as any).rules,
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
    files: ["eslint.config.ts", "apps/web/vite.config.ts"],
    rules: {
      "import/no-default-export": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
    },
  },
);
