// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 1. Global Ignores (replaces .eslintignore)
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', 'eslint.config.mjs'],
  },

  // 2. Base Configurations
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  
  // 3. Prettier Integration (Must be near the end to override other formatting rules)
  eslintPluginPrettierRecommended,

  // 4. Global Settings & Parser Options
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 'latest',
      sourceType: 'module', // Allows using 'import' in your TS files
      parserOptions: {
        projectService: true, // The modern, faster alternative to 'project: ["./tsconfig.json"]'
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 5. Rules (Merged from your old .eslintrc.js + Modern Standards)
  {
    rules: {
      // -- Prettier Force --
      'prettier/prettier': ['error', { endOfLine: 'lf' }],

      // -- TypeScript Specifics --
      '@typescript-eslint/no-explicit-any': 'off', // Pragramatic: sometimes 'any' is necessary
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Inference is usually enough
      
      // Floating promises are dangerous in backends (unhandled rejections crashes servers)
      '@typescript-eslint/no-floating-promises': 'warn', 

      // Unused vars: Warn, but ignore vars starting with underscore (_)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { 
          argsIgnorePattern: '^_', 
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        },
      ],

      // -- Safety vs Decorator Conflicts --
      // In NestJS/Decorators, strictly typed arguments/returns can be messy. 
      // We turn these OFF or WARN to prevent false positives in Controllers/DTOS.
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  // 6. Overrides (DTOs specific)
  {
    files: ['**/*.dto.ts'],
    rules: {
      // DTOs often use libraries like class-validator where types are inferred loosely
      '@typescript-eslint/no-unsafe-assignment': 'off', 
    },
  },
);
