module.exports = {
  plugins: {
    'postcss-import': {},
    '@tailwindcss/postcss': {},
    'postcss-preset-env': {
      stage: 2,
      features: {
        'nesting-rules': true
      }
    }
  }
};
