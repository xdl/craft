var fs = require('fs');
var YAML = require('yamljs');

//text -> [contents, matched, captured, rest, ...]
var regexFrontMatter = function(contents) {
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
    //https://github.com/dworthen/js-yaml-front-matter/blob/master/lib/js-yaml-front.js
    var yaml_re = /^(-{3}(?:\n|\r)([\w\W]+?)(?:\n|\r)-{3})?([\w\W]*)*/;
    return yaml_re.exec(contents);
}

//exported functions
//------------------

//file_path -> bool
var fileContainsFrontMatter = function(file) {
    var contents = fs.readFileSync(file);
    var result = regexFrontMatter(contents);
    return Boolean(result[2]);
}

//file_path -> json, contents
var parseFrontMatterFile = function(file) {
    var contents = fs.readFileSync(file);
    var result = regexFrontMatter(contents);
    return [YAML.parse(result[2]), result[3]];
}

exports.containsFrontMatter = fileContainsFrontMatter;
exports.parseFrontMatterFile = parseFrontMatterFile;
