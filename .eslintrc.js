module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname, // this is the reason this is a .js file
    project: ['./tsconfig.eslint.json'],
  },
  ignorePatterns: [
    'deps/*',
    'build/*',
    'lib/**/*.d.ts',
    'bin/**/*.d.ts',
  ],
  extends: [
    '@rubensworks'
  ],
  rules: {
    'no-implicit-coercion': 'off'
  }
};
