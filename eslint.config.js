// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['bin/', '*.config.js', '*.config.ts', 'dist/', 'node_modules/']
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 2020
      }
    },
    rules: {
      semi: [2, 'never']
    }
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked
  }
)
