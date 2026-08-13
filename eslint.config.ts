import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import functional from "eslint-plugin-functional";
import importX from "eslint-plugin-import-x";
import jsonc from "eslint-plugin-jsonc";
import storybook from "eslint-plugin-storybook";
import * as jsoncParser from "jsonc-eslint-parser";
import globals from "globals";
import { fixupPluginRules } from "@eslint/compat";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";

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
      ".screenshots/**",
      "apps/web/test-results/**",
      "apps/web/playwright-report/**",
      "apps/web/e2e/**",
      "apps/web/scripts/**",
      "apps/web/playwright.config.ts",
      "apps/web/.storybook/**",
      "apps/web/storybook-static/**",
      "apps/web/.wrangler/**",
      "scripts/**",
      ".agents/hooks/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  importX.flatConfigs.typescript,
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
      "eslint-comments": eslintComments,
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
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true },
      ],
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
      "eslint-comments/no-unlimited-disable": "error",
      "eslint-comments/require-description": "error",
    },
  },
  ...dagBoundaries,
  {
    // Ban barrel FILES at creation, not just barrel imports (which
    // no-restricted-imports at INDEX_IMPORT_PATTERN already blocks). A new
    // index.{ts,tsx} that re-exports siblings is architecturally dead here --
    // importing **/index is banned repo-wide -- so it only accrues as
    // untracked dead code (the sm-bg72/sm-ut5o pattern) and widens the
    // import/no-cycle surface. Zero-dep core no-restricted-syntax rather than
    // eslint-plugin-barrel-files, whose rule is import-side and overlaps the
    // existing ban. Decision recorded in sm-cyg7. apps/web/src/index.tsx is the
    // Vite entry (not a re-export hub) and is exempt.
    files: ["**/index.{ts,tsx}"],
    ignores: ["apps/web/src/index.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportAllDeclaration",
          message:
            "Barrel file: 'export *' in an index.{ts,tsx} re-export hub is banned (sm-cyg7). Import the source module directly.",
        },
        {
          selector: "ExportNamedDeclaration[source]",
          message:
            "Barrel file: re-exporting from another module in an index.{ts,tsx} is banned (sm-cyg7). Import the source module directly.",
        },
      ],
    },
  },
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
    // Wires the previously-unused eslint-plugin-storybook devDependency
    // (openspec/changes/storybook-adoption) into story files only.
    files: ["apps/web/src/**/*.stories.tsx"],
    plugins: { storybook },
    rules: {
      ...(storybook.configs["flat/recommended"][1].rules as any),
      "import/no-default-export": "off",
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
