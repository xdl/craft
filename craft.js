//Dependencies
var fs = require('fs');
var path = require('path');
var program = require('commander');

var FrontMatter = require('./lib/frontmatter.js');
var CopyFiles = require('./lib/copyfiles.js');
var ProcessContents = require('./lib/processcontents.js');
var Transpiler = require('./lib/transpiler.js');
var Metadata = require('./lib/metadata.js');

//Special filenames, directories
var LAYOUTS_FILENAME = "_layouts";
var TRANSPILERS_FILENAME = "_transpilers";
var CONFIG_FILENAME = "config.json";
var DEFAULT_EXTENSIONS_TO_PROCESS = [".md", ".html"];
var DEFAULT_IGNORES = [LAYOUTS_FILENAME, TRANSPILERS_FILENAME, CONFIG_FILENAME];

var craft = function(origin_path, dst_path, url) {
    //0. Setting up environment:
    var config_path = path.join(origin_path, CONFIG_FILENAME);
    var config = JSON.parse(fs.readFileSync(config_path));
    var environment = {};
    environment.root = origin_path; 
    environment.config = config;
    environment.url = url;
    environment.site = Metadata.createRootNode();
    environment.layouts = {};
    environment.transpilers = {};

    if (environment.config.ignored_filenames) {
        environment.config.ignored_filenames = environment.config.ignored_filenames.concat(DEFAULT_IGNORES);
    } else {
        environment.config.ignored_filenames = DEFAULT_IGNORES;
    }

    if (environment.config.ext_to_process) {
        environment.config.ext_to_process = environment.config.ext_to_process.concat(DEFAULT_EXTENSIONS_TO_PROCESS);
    } else {
        environment.config.ext_to_process = DEFAULT_EXTENSIONS_TO_PROCESS;
    }

    //1. copying over the files that don't need processing:
    var toCopy = function(file) {
        //ignore file and directories with names mentioned in ignored_files, and extensions that might contain front matter for processing
        return !(environment.config.ignored_filenames.indexOf(file) >= 0) && !(environment.config.ext_to_process.indexOf(path.extname(file)) >= 0)
    }

    console.log("Processing inert files...");
    CopyFiles.copyInertFiles(origin_path,dst_path,toCopy);

    //2. Doing a postorder traversal of files that might need processing:
    var setTranspilers = function(_transpilers, trans_directory) {
        fs.readdirSync(trans_directory).forEach(function(filename) {
            var transpiler_path = path.join(trans_directory, filename);
            var transpilers = Transpiler.createMustacheWrappers(transpiler_path, environment);
            for (var transpiler in transpilers) {
                if (transpilers.hasOwnProperty(transpiler)) {
                    _transpilers[transpiler] = transpilers[transpiler];
                }
            }
        });
    };

    var setLayouts = function(_layouts, layouts_directory) {
        fs.readdirSync(path.join(layouts_directory)).forEach(function(filename) {
            var layout_path = path.join(layouts_directory, filename);
            var layout_name = path.parse(layout_path).name;
            var layout_contents = fs.readFileSync(layout_path, "utf-8");
            _layouts[layout_name] = layout_contents;
        });
    };

    var toProcess = function(file) {
        return (environment.config.ext_to_process.indexOf(path.extname(file)) >= 0);
    };

    var toIgnore = function(file) {
        return (environment.config.ignored_filenames.indexOf(file) >= 0);
    };

    var visit = function(src_path, dst_path, parent) {
        files = fs.readdirSync(src_path);
        var files_next = [];
        var directories_next = [];
        //setting _transpilers and _layouts, and sorting into files and directories
        files.forEach(function(file) {
            var curSource = path.join(src_path, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                if (file == TRANSPILERS_FILENAME) {
                    setTranspilers(environment.transpilers, curSource);
                } else if (file == LAYOUTS_FILENAME) {
                    setLayouts(environment.layouts, curSource);
                } else if (!toIgnore(file)) {
                    directories_next.push(file);
                }
            } else {
                if (toProcess(file)) {
                    files_next.push(file);
                }
            }
        });
        //building up metadata:
        directories_next.forEach(function(dir) {
            var current_path = path.join(src_path, dir);
            var target_path = path.join(dst_path, dir);

            //push layouts, transpilers and parent
            var old_layouts = environment.layouts;
            var new_layouts = Object.create(old_layouts);
            environment.layouts = new_layouts;

            var old_transpilers = environment.transpilers;
            var new_transpilers = Object.create(old_transpilers);
            environment.transpilers = new_transpilers;

            var child = Metadata.addDirNodeTo(parent, dir)

            visit(current_path, target_path, child);

            //pop
            environment.transpilers = old_transpilers;
            environment.layouts = old_layouts;
        });
        files_next.forEach(function(file) {
            var current_path = path.join(src_path, file);
            if (FrontMatter.containsFrontMatter(current_path)) {
                var fm_contents = FrontMatter.parseFrontMatterFile(current_path);
                var fm = fm_contents[0];
                var contents = fm_contents[1];

                Metadata.addFileNodeTo(parent, fm);
                Metadata.preProcess(fm, environment);

                var processed_dstfilename = ProcessContents.processContents(contents, current_path, environment);
                var processed = processed_dstfilename[0];
                var dstfilename = processed_dstfilename[1];
                var target_path = path.join(dst_path, dstfilename);
                fs.writeFileSync(target_path, processed);
            } else {
                CopyFiles.copyFileIntoDirSync(current_path, dst_path);
            }
        });
    }

    console.log("Processing files...");
    visit(origin_path, dst_path, environment.site);
}

exports.craft = craft;

//http://stackoverflow.com/questions/4981891/node-js-equivalent-of-pythons-if-name-main
if (require.main === module) {
    var src;
    var dst;
    var url;
    program
    .version('0.0.1')
    .description('Runs the craft command line tool')
    .arguments('<source> <destination> [url_root]')
    .action(function(source, destination, url_root) {
        src = source;
        dst = destination;
        if (url_root) {
            url = url_root;
        } else {
            url = "";
        }
    })
    .parse(process.argv);

    if (typeof src === 'undefined' || dst === 'undefined') {
       program.outputHelp();
       process.exit(0);

    }
    craft(src, dst, url);
}
