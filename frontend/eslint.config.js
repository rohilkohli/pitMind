import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    files: ["**/*.test.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
        describe: "readonly",
        expect: "readonly",
        it: "readonly",
      },
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "jsx-a11y/click-events-have-key-events": "off", "jsx-a11y/no-static-element-interactions": "off", "jsx-a11y/no-noninteractive-element-interactions": "off", "jsx-a11y/label-has-associated-control": "off", "@typescript-eslint/no-explicit-any": "off", "@typescript-eslint/no-unused-vars": "off", "react-hooks/exhaustive-deps": "off", "react-refresh/only-export-components": "off"
    },
  },
);
