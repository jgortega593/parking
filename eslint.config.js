// eslint.config.js
export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: require('eslint-plugin-react'),
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: { React: 'writable' },
    },
    rules: {
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
    },
  },
];
