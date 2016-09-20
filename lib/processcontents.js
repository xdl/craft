var path = require('path');
var marked = require('marked');
var Mustache = require('mustache');

//returns a new object, with all the keys in key_to_hoist hoisted to toplevel
var hoistKey = function(obj, key_to_hoist) {
    var hoisted_obj = Object.create(obj[key_to_hoist]);
    for (var key in obj) {
        if (key != key_to_hoist) {
            hoisted_obj[key] = obj[key]
        }
    }
    return hoisted_obj;
}

var applyLayout = function(contents, env) {
    var front_matter = env.page;
    if (front_matter.hasOwnProperty('layout')) {
        var layout = front_matter.layout;
        var layout_contents = env.layouts[layout];
        if (layout_contents) {
            var hoisted_env = hoistKey(hoistKey(env, "transpilers"), "page");
            hoisted_env.contents = contents;
            return Mustache.render(layout_contents, hoisted_env);
        } else {
            throw "layout not found: " + layout;
        }
    } else {
        return contents;
    }
}

var applyTemplates = function(contents, env) {
    return Mustache.render(contents, hoistKey(env, "transpilers"));
}

var applyMarkdown = function(contents, location) {
    var path_parsed = path.parse(location);
    var extension = path_parsed.ext;

    if (extension == ".md" || extension == ".markdown") { 
        return marked(contents);
    } else {
        return contents;
    }
}

//exported functions
//------------------

var processContents = function(contents, contents_url, env) {
    var path_parsed = path.parse(contents_url);
    var extension = path_parsed.ext;
    var dstfilename = path_parsed.name + ".html";
    contents = applyTemplates(contents, env);
    contents = applyMarkdown(contents, contents_url);
    contents = applyLayout(contents, env);
    return [contents,dstfilename];
}

exports.processContents = processContents;
