// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ["dist/*", "server_dist/*", "node_modules/*"],
  },
  {
    files: ["client/**/*.{ts,tsx}"],
    rules: {
      // Warn about console statements - should use logger utility instead
      "no-console": ["warn", { allow: [] }],
      // Warn about unused variables
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
    },
  },
]);
