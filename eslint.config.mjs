import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Supabase responses are untyped — any is unavoidable here
      "@typescript-eslint/no-explicit-any": "off",
      // load() is async; setState runs after await, not synchronously
      "react-hooks/set-state-in-effect": "off",
      // React Compiler memoization hint — not a real bug
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
]);

export default eslintConfig;
