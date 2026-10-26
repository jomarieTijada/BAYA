// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // Generated exports and vendored runtimes are verified by build/integrity tests.
    // Keep lint focused on authored application, scripts and tests.
    ignores: ["dist/**", "dist-*/**", ".expo/**", "android/**", "ios/**", "coverage/**", "public/ort/**", "modules/baya-native/android/build/**"],
  }
  , { files: ["jest.setup-*.js"], languageOptions: { globals: { jest: "readonly" } } }
]);
