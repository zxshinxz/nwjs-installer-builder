"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) {
            return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) {
                resolve(value);
            });
        }
        function onfulfill(value) {
            try {
                step("next", value);
            } catch (e) {
                reject(e);
            }
        }
        function onreject(value) {
            try {
                step("throw", value);
            } catch (e) {
                reject(e);
            }
        }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var ChildProcess = require('child_process');
var mkdirp = require('mkdirp');
var temp = require('temp');
temp.track();
var P = require('bluebird');
function _exec(cmd, args) {
    return new P(function (resolve, reject) {
        ChildProcess.execFile(cmd, args, function (err, stdout, stderr) {
            if (err || stderr) {
                reject(err || stderr);
                return;
            }
            resolve(stdout);
        });
    });
}
var _mkdirp = P.promisify(mkdirp);

var Builder = (function () {
    function Builder(options) {
        (0, _classCallCheck3.default)(this, Builder);

        this.options = options;
    }

    (0, _createClass3.default)(Builder, [{
        key: "build",
        value: function build() {
            return __awaiter(this, void 0, _promise2.default, _regenerator2.default.mark(function _callee() {
                var appDir, outputDir, tmpDir, nuspecData, files, template, nuspecCompiled, nuspecPath, cmd, args, output, pass, iconPath;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                appDir = path.resolve(this.options.appDirectory);
                                outputDir = path.resolve(this.options.outputDirectory);
                                tmpDir = temp.mkdirSync('nwjs-installer-builder');
                                // Sanitize.

                                this.options.version = this.options.version.replace(/^v/, '');
                                this.options.name = this.options.name.replace(/ /, '');
                                _context.next = 7;
                                return _mkdirp(tmpDir);

                            case 7:
                                nuspecData = {
                                    name: this.options.name,
                                    version: this.options.version,
                                    title: this.options.title,
                                    description: this.options.description || '',
                                    authors: this.options.authors,
                                    iconUrl: this.options.iconUrl,
                                    copyright: "Copyright © " + new Date().getFullYear() + " " + this.options.authors,
                                    files: ''
                                };
                                files = [];

                                _.forEach(this.options.files, function (file, key) {
                                    files.push("<file src=\"" + key + "\" target=\"lib\\net45" + (file ? '\\' + file : '') + "\" />");
                                });
                                nuspecData.files = files.join('\n');
                                template = _.template(fs.readFileSync(path.resolve(__dirname, '..', 'resources', 'template.nuspec'), 'utf8'));
                                nuspecCompiled = template(nuspecData);
                                nuspecPath = path.resolve(tmpDir, nuspecData.name + ".nuspec");

                                fs.writeFileSync(nuspecPath, nuspecCompiled, 'utf8');
                                cmd = path.resolve(__dirname, '..', 'vendor', 'nuget.exe');
                                args = ['pack', nuspecPath, '-BasePath', appDir, '-OutputDirectory', tmpDir, '-NoDefaultExcludes'];
                                _context.next = 19;
                                return _exec(cmd, args);

                            case 19:
                                output = _context.sent;

                                cmd = path.resolve(__dirname, '..', 'vendor', 'Update.com');
                                args = ['--releasify', path.join(tmpDir, this.options.name + "." + this.options.version + ".nupkg"), '--releaseDir', outputDir, '--loadingGif', path.resolve(this.options.loadingGif), '--no-msi'];
                                if (this.options.certFile && this.options.certPassFile) {
                                    args.push('--signWithParams');
                                    pass = fs.readFileSync(this.options.certPassFile, 'utf8');

                                    args.push("/a /f \"" + path.resolve(this.options.certFile) + "\" /p \"" + pass.replace('\n', '') + "\"");
                                }
                                if (this.options.setupIcon) {
                                    iconPath = path.resolve(this.options.setupIcon);

                                    args.push('--setupIcon');
                                    args.push(iconPath);
                                }
                                _context.next = 26;
                                return _exec(cmd, args);

                            case 26:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }]);
    return Builder;
})();

exports.Builder = Builder;
//# sourceMappingURL=builder.js.map
