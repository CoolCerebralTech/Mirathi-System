module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json'],
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // must be LAST to turn off conflicting rules
  ],
  rules: {
    // Keep Prettier as the single source of truth for formatting
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'lf',
      },
    ],

    // --- Disable ALL "unsafe" type-aware linting rules ---
    // This will stop the linter from complaining about returning, assigning,
    // or using variables that it infers as `any`.
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',

    // Other helpful rules remain
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' , varsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['*.js'],
      parser: 'espree',
    },
  ],
  ignorePatterns: ['dist', 'node_modules', 'coverage'],
};