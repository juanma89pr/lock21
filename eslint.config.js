import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

// Convenciones del proyecto: sin arrow functions, sin template literals, var,
// y setDoc siempre con {merge:true} (tercer argumento obligatorio).
var convenciones = [
  'error',
  { selector: 'ArrowFunctionExpression', message: 'Convención: sin arrow functions.' },
  { selector: 'TemplateLiteral', message: 'Convención: sin template literals.' },
  { selector: 'VariableDeclaration[kind="const"]', message: 'Convención: usar var.' },
  { selector: 'VariableDeclaration[kind="let"]', message: 'Convención: usar var.' },
  { selector: 'CallExpression[callee.name="setDoc"][arguments.length<3]', message: 'Convención: setDoc siempre con {merge:true}.' }
];

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
      'no-restricted-syntax': convenciones
    }
  },
  {
    files: ['netlify/**/*.{js,mjs}', 'tests/**/*.{js,mjs}', 'scripts/**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node
    },
    rules: {
      'no-restricted-syntax': convenciones
    }
  }
];
