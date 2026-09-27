// babel.config.js
// Expo's default Babel preset plus module-resolver so that the @data and
// @shared-types aliases work at Metro bundling time (not just in tsc).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@data': '../src/data',
            '@shared-types': '../src/types',
          },
        },
      ],
    ],
  };
};
