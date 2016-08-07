var path = require('path');
var marked = require('marked');
var Mustache = require('mustache');


// Don't wrap detected paragraphs that already are wrapped by tags

var applyLayout = function(contents, env) {
    var front_matter = env.page;
    if (front_matter.hasOwnProperty('layout')) {
        var layout = front_matter.layout;
        var layout_contents = env.layouts[layout];
        if (layout_contents) {
            var variables = Object.create(env.transpilers);
            for (var key in front_matter) {
                variables[key] = front_matter[key];
            }
            variables.url = env.url;
            variables.contents = contents;
            return Mustache.render(layout_contents, variables);
        } else {
            throw "layout not found: " + layout;
        }
    } else {
        return contents;
    }
}

var applyTemplates = function(contents, env) {
    var metadata = Object.create(env.transpilers);
    metadata.site = env.site;
    metadata.url = env.url;
    metadata.page = env.page;
    return Mustache.render(contents, metadata);
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
