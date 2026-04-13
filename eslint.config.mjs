import eslint from '@eslint/js'
import functional from 'eslint-plugin-functional'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '**/*.d.ts'] },
  eslint.configs.recommended,
  // Node/config files (vite.config.ts etc.)
  {
    files: ['*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.node.json',
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
  },
  // App source files
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
    ],
    plugins: {
      functional,
      react: reactPlugin,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.app.json',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.app.json',
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'functional/no-let': 'error',
      'functional/immutable-data': ['error', { ignoreIdentifierPattern: ['^draft.*', '.*Ref$'] }],
      'functional/no-loop-statements': 'error',
      'max-lines': ['error', { max: 150, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
      'import/no-cycle': 'error',
      'import/no-default-export': 'error',
    },
  },
  // Allowed default exports overrides
  {
    files: ['src/main.tsx', 'src/App.tsx'],
    rules: {
      'import/no-default-export': 'off',
      'functional/immutable-data': 'off',
      'functional/no-let': 'off',
      'max-lines-per-function': 'off',
    },
  },
  {
    files: ['src/db.ts'],
    rules: {
      'functional/no-let': 'off',
      'max-lines-per-function': 'off',
    },
  },
  // Stricter overrides for engine and catalog
  {
    files: ['src/engine/**/*.{ts,tsx}', 'src/catalog/**/*.{ts,tsx}'],
    rules: {
      'no-throw-literal': 'error',
      'functional/no-throw-statements': 'error',
      'functional/no-try-statements': 'error',
    },
  }
)
