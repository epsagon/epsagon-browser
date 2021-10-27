module.exports = {
  extends: 'airbnb-base',
  ignorePatterns: ['*.test.js', '**/dist/*.js', '**/test/*.js'],
  rules: { 'max-len': ['error', { code: 120 }] },
};
