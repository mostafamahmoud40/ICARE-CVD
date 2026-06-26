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
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "max-lines": [
        "warn",
        {
          max: 450,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      // Legitimate URL/form sync patterns across the app; fix incrementally per hook.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: ["src/**/*.tsx"],
    ignores: [
      "**/use*.tsx",
      "**/*PageContainer.tsx",
      "**/components/ui/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@tanstack/react-query",
              importNames: ["useQuery", "useMutation", "useInfiniteQuery"],
              message:
                "Move TanStack Query to a co-located use*.ts hook (DIP / AGENTS.md).",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
