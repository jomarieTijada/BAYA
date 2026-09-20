module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for Drizzle expo-sqlite migrations.
      // The generated packages/db/drizzle/migrations.js imports .sql files directly.
      // This plugin inlines those SQL strings at build time so Metro can bundle them.
      ['inline-import', { extensions: ['.sql'] }],
    ],
  };
};
