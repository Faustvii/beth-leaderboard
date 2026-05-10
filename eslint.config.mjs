import path from "node:path";
import { fileURLToPath } from "node:url";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import isaacscriptPlugin from "eslint-plugin-isaacscript";
import eslintPluginPrettier from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(
  {
    ignores: ["node_modules/**", "build/**", "public/**", "eslint.config.mjs"],
  },
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  eslintConfigPrettier,
  {
    plugins: {
      prettier: eslintPluginPrettier,
      import: importPlugin,
      isaacscript: isaacscriptPlugin,
    },
    rules: {
      "prettier/prettier": "error",
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",

      // These off/not-configured-the-way-we-want lint rules we like & opt into
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "import/consistent-type-specifier-style": ["error", "prefer-inline"],

      // For educational purposes we format our comments/jsdoc nicely
      "isaacscript/complete-sentences-jsdoc": "warn",
      "isaacscript/format-jsdoc-comments": "warn",

      // These lint rules don't make sense for us but are enabled in the preset configs
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  },
);
