import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import security from 'eslint-plugin-security'
import sonarjs from 'eslint-plugin-sonarjs'
import vitest from 'eslint-plugin-vitest'

// New plugin imports:
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
  // 1) Ignored files (replaces .eslintignore)
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/infrastructure/cdk.out/**',
      '**/packages/shared/src/infrastructure/storage/providers/LocalFileStorage.ts',
      '**/infrastructure/config/pm2.ecosystem.config.js',
      '**/packages/frontend/flutter-app/**',
      '**/frontend/flutter-app/**',
      '**/.dart_tool/**',
      '**/ios/**',
      '**/android/**',
      '**/windows/**',
      '**/linux/**',
      '**/macos/**',
      '**/web/**',
      '**/previous-architecture/**',
      '**/packages/sdk/src/openapi/**',
      'ai/**',
      'pika-old/**',
      'docs/**',
      'scripts/vercel-test.ts',
      'reports/**',
      '**/generated/**',
      '**/*.min.js',
    ],
  },

  // 2) Base ESLint recommended + Prettier configs (flat versions)
  js.configs.recommended,
  prettier,

  // Special override for storage files to avoid fs security warnings
  {
    files: [
      '**/packages/shared/src/infrastructure/storage/providers/LocalFileStorage.ts',
      '**/packages/shared/src/infrastructure/storage/FileStorage.js',
      '**/packages/shared/src/infrastructure/storage/FileStorage.ts',
    ],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },

  // Special override for Vercel serverless function
  {
    files: ['api/index.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },

  // 3) General config (Node environment, plugin rules, custom rules)
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        process: 'readonly',
      },
    },

    plugins: {
      security,
      sonarjs,
      // (We keep Prettier as a config only.)
    },

    rules: {
      'linebreak-style': ['error', 'unix'],
      'prefer-const': [
        'warn',
        {
          destructuring: 'all',
        },
      ],
      semi: ['error', 'never'],
      'no-prototype-builtins': 0,
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: 'next|context|req|key|i|event',
        },
      ],
      'no-trailing-spaces': 'error',
      'no-undef': 'error',
      'no-redeclare': 'off',
      'no-shadow': 'warn',

      // SonarJS rules
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/no-nested-template-literals': 'warn',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-redundant-boolean': 'warn',

      // Security plugin rules
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'warn',
    },
  },

  // 4) Override for TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        requireConfigFile: false,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      'no-undef': 'off', // TS handles types
      'no-unused-vars': 'off', // disable base rule in favor of plugin rules
      '@typescript-eslint/no-unused-vars': 'off', // disable TS rule to avoid duplicate reports

      // New rules for automatically sorting and cleaning imports:
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Side effect imports.
            ['^\\u0000'],
            // Packages. Customize as needed.
            ['^@?\\w'],
            // Absolute imports.
            ['^(?!\\.)'],
            // Relative imports.
            ['^\\.'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // Existing TypeScript rules:
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-redeclare': [
        0,
        {
          ignoreDeclarationMerge: true,
        },
      ],
      'padding-line-between-statements': [
        'error',
        // Const
        // always blank line before any non-const after a const
        { blankLine: 'always', prev: 'const', next: '*' },
        // always blank line after any non-const before a const
        { blankLine: 'always', prev: '*', next: 'const' },
        // but don't enforce blank lines between two consts
        { blankLine: 'any', prev: 'const', next: 'const' },

        // Let
        // always blank line before any non-let after a let
        { blankLine: 'always', prev: 'let', next: '*' },
        // always blank line after any non-let before a let
        { blankLine: 'always', prev: '*', next: 'let' },
        // but don't enforce blank lines between two lets
        { blankLine: 'any', prev: 'let', next: 'let' },

        // Return
        // always blank line before any non-return after a return
        { blankLine: 'always', prev: 'return', next: '*' },
        // always blank line after any non-return before a return
        { blankLine: 'always', prev: '*', next: 'return' },
        // but don't enforce blank lines between two returns
        { blankLine: 'any', prev: 'return', next: 'return' },

        // For
        // always blank line before any non-for after a for
        { blankLine: 'always', prev: 'for', next: '*' },
        // always blank line after any non-for before a for
        { blankLine: 'always', prev: '*', next: 'for' },
        // but don't enforce blank lines between two for
        { blankLine: 'any', prev: 'for', next: 'for' },
      ],
    },
  },

  // 5) Override for Vitest test files
  {
    files: [
      '**/*.test.js',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/*.spec.js',
      '**/*.integration-spec.ts',
      '**/*.integration-spec.js',
      '**/tests/**/*',
      '**/__mocks__/**/*',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        afterAll: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        fit: 'readonly',
        it: 'readonly',
        test: 'readonly',
        xdescribe: 'readonly',
        xit: 'readonly',
        xtest: 'readonly',
        vi: 'readonly',
      },
    },
    plugins: {
      vitest,
    },
    rules: {
      'no-import-assign': 'off',
      'no-shadow': 'off',
      'vitest/consistent-test-it': [
        'error',
        { fn: 'it', withinDescribe: 'it' },
      ],
      'vitest/no-conditional-tests': 'error',
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/prefer-hooks-in-order': 'error',
      'vitest/prefer-hooks-on-top': 'error',
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-to-contain': 'error',
      'vitest/prefer-to-have-length': 'error',
      'vitest/valid-expect': 'error',
      'padding-line-between-statements': [
        'error',
        // Const
        // always blank line before any non-const after a const
        { blankLine: 'always', prev: 'const', next: '*' },
        // always blank line after any non-const before a const
        { blankLine: 'always', prev: '*', next: 'const' },
        // but don't enforce blank lines between two consts
        { blankLine: 'any', prev: 'const', next: 'const' },

        // Let
        // always blank line before any non-let after a let
        { blankLine: 'always', prev: 'let', next: '*' },
        // always blank line after any non-let before a let
        { blankLine: 'always', prev: '*', next: 'let' },
        // but don't enforce blank lines between two lets
        { blankLine: 'any', prev: 'let', next: 'let' },

        // Return
        // always blank line before any non-return after a return
        { blankLine: 'always', prev: 'return', next: '*' },
        // always blank line after any non-return before a return
        { blankLine: 'always', prev: '*', next: 'return' },
        // but don't enforce blank lines between two returns
        { blankLine: 'any', prev: 'return', next: 'return' },

        // For
        // always blank line before any non-for after a for
        { blankLine: 'always', prev: 'for', next: '*' },
        // always blank line after any non-for before a for
        { blankLine: 'always', prev: '*', next: 'for' },
        // but don't enforce blank lines between two for
        { blankLine: 'any', prev: 'for', next: 'for' },
      ],
    },
  },

  // 6) Override for Node.js scripts
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off', // Node globals are available
    },
  },

  // 7) Security overrides for files with false positives (must be last to take precedence)
  {
    files: [
      'packages/api-gateway/src/api/routes/docsRoutes.ts',
      'packages/api-gateway/src/health/healthCheckHandler.ts',
      'packages/api-gateway/src/middleware/zodValidationMiddleware.ts',
      'packages/api/src/common/utils/openapi.ts',
      'packages/api/src/common/utils/validators.ts',
      'packages/api/src/scripts/generate-all-swagger-docs.ts',
      'packages/api/src/scripts/generate-scalar-docs.ts',
      'packages/http/src/infrastructure/express/validation/zodValidation.ts',
    ],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'off',
    },
  },
]
