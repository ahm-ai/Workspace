module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
    "plugin:sonarjs/recommended"
  ],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
    "simple-import-sort",
    "unused-imports",
    "sonarjs"
  ],
  rules: {
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",

    "no-unused-vars": "off", // or "@typescript-eslint/no-unused-vars": "off",

		"unused-imports/no-unused-imports": "error",
		"unused-imports/no-unused-vars": [
			"warn",
			{ "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
		]
    
  }
};
