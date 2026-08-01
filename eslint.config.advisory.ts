import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import baseConfig from "./eslint.config";

// Advisory-only overlay (design.md Decision 4): kept out of eslint.config.ts
// because `bun run lint` (eslint . --max-warnings 0) is already zero-tolerance,
// so registering these rules there would make them blocking immediately, not
// advisory. Run as a separate CI step with continue-on-error: true until the
// undocumented-disable-comment backlog (sm-c1su, sm-m0ar, sm-jrr8, sm-3rhz,
// sm-timr) closes, then move these two rules into eslint.config.ts and retire
// this file (sm-1631).
export default [
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "eslint-comments": eslintComments,
    },
    rules: {
      "eslint-comments/no-unlimited-disable": "error",
      "eslint-comments/require-description": "error",
    },
  },
];
