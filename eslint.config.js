// eslint.config.js
import js from "@eslint/js";
import pluginPrettier from "eslint-plugin-prettier";
import configPrettier from "eslint-config-prettier";
import html from "eslint-plugin-html";

export default [
  // Ignore patterns
  { ignores: ["node_modules/**", "dist/**"] },

  // JS recommended
  js.configs.recommended,

  // JavaScript files + Prettier
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
      },
    },
    plugins: { prettier: pluginPrettier },
    rules: {
      "prettier/prettier": ["error"],
    },
  },

  // HTML files with inline JS linting
  {
    files: ["**/*.html"],
    plugins: { html },
    settings: {
      "html/report-bad-indent": "error",
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules, // same rules for inline JS
    },
  },

  // Disable stylistic rules that conflict with Prettier
  configPrettier,
];
