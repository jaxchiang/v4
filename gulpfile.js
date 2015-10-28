/**
 * gulpfile.js
 * Created by Lukezhu
 */

var gulp     = require('gulp');
var rimraf   = require('rimraf');
var path     = require('path');
var gutil    = require('gulp-util');
var vfs      = require('vinyl-fs');
var vftp     = require('vinyl-ftp');
var combiner = require('stream-combiner2');
var $        = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'gulp.*'],
    replaceString: /\bgulp[\-.]/
});

// 获取基本配置信息
var config = require('./_config/config.js');

// ftp 配置信息
var ftpConnection = vftp.create({
    host     : config.ftpHost,
    user     : config.ftpUser,
    password : config.ftpPass,
    parallel : 5,
    log      : gutil.log,
    // debug    : gutil.log
});

// 判断是否生产模式
// gulp 命令中含有 --dev 参数则非生产模式
var isProduction = gutil.env.dev !== true;
var sourceMap    = !isProduction;

// swig 配置信息
// Docs: http://paularmstrong.github.io/swig/docs/
var swighljs    = require('./_config/swig_hljs.js');
var swigLocals  = {};
var swigOptions = {
    defaults : { cache: false, locals: swigLocals },
    data     : { page: {} },
    setup    : function(swig) {
        // 在 swig 模版引擎中增加 highlight 标签 用于高亮代码片段
        // Usage: {% highlight 'js' %}code...{% endhighlight %}
        swig.setExtension(swighljs.ext.name, swighljs.ext.obj);
        swig.setTag('highlight', swighljs.parse, swighljs.compile, swighljs.ends, swighljs.block);
    }
}

// 处理文件变化事件
// 高亮显示变化的文件
var handleChangeEvent = function(evt) {
    gutil.log(evt);
    var file = evt.path.split('/');
    var filename = file[file.length - 1];
    gutil.log('File:', gutil.colors.cyan(filename), 'was', gutil.colors.magenta(evt.type));
}

// 处理样式任务
gulp.task('css', function() {
    var combined = combiner.obj([
        gulp.src(config.lessFiles),
        (sourceMap ? $.sourcemaps.init({ loadMaps: true }) : gutil.noop()),
        $.less(),
        $.autoprefixer({ browsers: ['> 1%', 'IE 7'] }),
        (isProduction ? $.minifyCss({ compatibility: 'ie7' }) : gutil.noop()),
        (sourceMap ? $.sourcemaps.write() : gutil.noop()),
        gulp.dest(config.cssOutputDir)
    ]);

    combined.on('error', console.error.bind(console));

    return combined;
});

// 处理模板任务
gulp.task('template', function() {
    var combined = combiner.obj([
        gulp.src(config.tmplFiles),
        $.swig(swigOptions),
        gulp.dest(config.tmplOutputDir)
    ]);

    combined.on('error', console.error.bind(console));

    return combined;
});

// 清空发布目录
gulp.task('clean', ['css', 'template'], function(cb) {
    rimraf([config.dist, '/**'].join(), cb);
});

// 给静态文件生成 hash 防止缓存
gulp.task('rev', ['css', 'template', 'clean'], function() {
    var revAll = new $.revAll({
        hashLength          : 4,
        fileNameManifest    : 'manifest.json',
        dontGlobal          : config.revIgnore,
        dontRenameFile      : config.revIgnoreRename,
        dontSearchFile      : config.revIgnoreSearch,
        dontUpdateReference : config.revIgnoreUpdate
    });

    return gulp.src(config.revFiles)
        .pipe(config.rev ? revAll.revision() : gutil.noop())
        .pipe(gulp.dest(config.dist))
        .pipe(config.rev ? revAll.manifestFile() : gutil.noop())
        .pipe(config.rev ? gulp.dest(config.dist) : gutil.noop());
});

// 发布文件到 ftp
gulp.task('deploy', function() {
    vfs.src([
        './dist/**'
    ], { buffer: false })
        .pipe(ftpConnection.dest(config.ftpPath));
})

// 开发任务
// gulp --dev
gulp.task('default', ['css', 'template'], function() {
    // 监听 less 文件变化
    gulp.watch(config.lessFiles4Watch, ['css']).on('change', function(evt) {
        handleChangeEvent(evt);
    });

    // 监听模版文件变化
    gulp.watch(config.tmplFiles4Watch, ['template']).on('change', function(evt) {
        handleChangeEvent(evt);
    });

    // 启动本地调试服务器
    gulp.src(config.app)
        .pipe($.webserver({
            host             : config.serverHost,
            port             : config.serverPort,
            directoryListing : true,
            livereload       : { enable: true },
            open             : ['http://', config.serverHost === '0.0.0.0' ? 'localhost' : config.serverHost, ':', config.serverPort, config.serverIndex].join('')
        }));
});

// 发布任务
gulp.task('build', ['css', 'template', 'clean', 'rev']);
