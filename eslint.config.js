import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: 'ArrowFunctionExpression', message: 'Convención: sin arrow functions.' },
        { selector: 'TemplateLiteral', message: 'Convención: sin template literals.' },
        { selector: 'VariableDeclaration[kind="const"]', message: 'Convención: usar var.' },
        { selector: 'VariableDeclaration[kind="let"]', message: 'Convención: usar var.' }
      ]
    }
  }
];
