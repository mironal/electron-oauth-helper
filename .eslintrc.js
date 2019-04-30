module.exports = {
  parserOptions: {
    ecmaVersion: 8,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },
  parser: "@typescript-eslint/parser",
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:ava/recommended",
    "plugin:node/recommended",
    "plugin:promise/recommended",
    "plugin:security/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
  ],
  plugins: ["ava", "node", "import", "promise", "security"],
  rules: {
    "node/no-deprecated-api": "off",
    "node/no-unpublished-require": [
      "error",
      {
        allowModules: ["electron"],
      },
    ],
    "promise/avoid-new": "off",
    "promise/always-return": "off",
    "no-multiple-empty-lines": ["error", { max: 1 }],
    indent: ["error", 2, { SwitchCase: 1 }],
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double"],
    semi: ["error", "never"],
    "no-var": ["error"],
    "prefer-const": ["error"],
  },
}
