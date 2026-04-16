const { src, dest } = require('gulp');

function buildIcons() {
  return src(['nodes/**/*.json', 'nodes/**/*.{png,svg}', 'credentials/**/*.{png,svg}'], {
    allowEmpty: true,
    base: '.',
  }).pipe(dest('dist'));
}

exports.build = buildIcons;
exports.default = buildIcons;
