import gulp from 'gulp';
import browserSyncLib from 'browser-sync';
import { deleteSync } from 'del';
import htmlMin from 'gulp-html-minifier-terser';
import sharpOptimizeImages from 'gulp-sharp-optimize-images';
import webp from 'gulp-webp';
import * as sass from 'sass';
import gulpSass from 'gulp-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';

const { src, dest, series, parallel, watch } = gulp;
const browserSync = browserSyncLib.create();
const compiledSass = gulpSass(sass);

/* ---------- BrowserSync ---------- */
export const server = () => {
  browserSync.init({
    server: { baseDir: 'dist/' },
    notify: false,
    open: false,
  });
};

/* ---------- Clean ---------- */
export const clean = (done) => {
  deleteSync(['dist']);
  done();
}

/* ---------- Styles ---------- */
export const styles = () => {
  return src('src/sass/style.scss', { sourcemaps: true })
    .pipe(plumber())
    .pipe(compiledSass({ outputStyle: 'expanded' }).on('error', compiledSass.logError))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest('dist/css', { sourcemaps: '.' }))
    .pipe(browserSync.stream());
};

/* ---------- HTML ---------- */
export const html = () => {
  return src('src/*.html')
    .pipe(htmlMin({ collapseWhitespace: true }))
    .pipe(dest('dist/'));
};

/* ---------- Copy files ---------- */
export const copyFiles = () => {
  return src([
    'src/fonts/**/*',
    'src/*.ico',
    'src/site.webmanifest',
    'src/browserconfig.xml',
  ], { base: 'src' })
    .pipe(dest('dist/'));
};

/* ---------- Copy images ---------- */
export const copyImages = () => {
  return src('src/img/**/*.{png,jpg,jpeg,svg,gif,webp}', {
    encoding: false,
  })
    .pipe(dest('dist/img'));
};

/* ---------- Optimize images ---------- */
export const optimizeImages = () => {
  return src('src/img/**/*.{png,jpg,jpeg}')
    .pipe(
      sharpOptimizeImages({
        resize: false,
        png_to_png: { quality: 80 },
        jpg_to_jpg: { quality: 80, mozjpeg: true },
      })
    )
    .pipe(dest('dist/img'));
};

/* ---------- WebP ---------- */
export const webpImages = () => {
  return src('src/img/**/*.{jpg,jpeg,png}')
    .pipe(webp({ quality: 90 }))
    .pipe(dest('dist/img'));
};

/* ---------- BrowserSync reload helper ---------- */
export const reload = (done) => {
  browserSync.reload();
  done();
;}

/* ---------- Watcher ---------- */
export const watcher = () => {
  watch('src/sass/**/*.scss', styles);
  watch('src/*.html', series(html, reload));
  watch('src/img/**/*.{jpg,jpeg,png,svg,gif,webp}', series(copyImages, webpImages, reload));
};

/* ---------- Main tasks ---------- */
export const dev = series(
  clean,
  parallel(copyFiles, copyImages, styles, html, webpImages),
  parallel(server, watcher)
);

export const build = series(
  clean,
  parallel(copyFiles, optimizeImages, styles, html, webpImages)
);

/* ---------- Default ---------- */
export default dev;
