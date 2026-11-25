// Keep exported fonts at predictable public URLs, independent of workspace and
// scoped-package directory names. Metro development URLs remain untouched.
module.exports = function exportFontPath(asset) {
  if (asset.httpServerLocation.includes('?export_path=') &&
      ['ttf', 'otf', 'woff', 'woff2'].includes(asset.type)) {
    return { ...asset, httpServerLocation: '/assets?export_path=/assets/fonts' };
  }
  return asset;
};
