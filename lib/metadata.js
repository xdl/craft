//special metadata keys
var SORT_BY_DESC = "sort_by_descending";
var EXPORT_TO = "export_to"; //attaches the metadata of current node to this node as a child in the EXPORTS array
var EXPORTS = "exports"; //exposed to Mustache as an array, for iteration purposes

//exported functions
//------------------
var createRootNode = function() {
    return {
        "children": []
    };
}

//parentNode -> childNode
var addDirNodeTo = function(parent, child_name) {
    var child = {
        "children": []
    };
    parent.children.push(child);
    // needs a constant time lookup for aggregates as well, e.g. for site.blog
    parent[child_name] = child;
    return child;
}

//parentNode -> null
var addFileNodeTo = function(parent, fm) {
    parent.children.push(fm);
}

var preProcess = function(fm, env) {
    env.page = fm;

    //TODO move the processing of special keywords into an array of continuations
    if (fm[SORT_BY_DESC]) {
        var sort_by_location = env;
        for (var metadatas in fm.sort_by_descending) {
            var paths = metadatas.split(".");
            var key = fm.sort_by_descending[metadatas];
            for (var i = 0, len = paths.length; i < len; i++) {
                sort_by_location = sort_by_location[paths[i]];
            }
            sort_by_location.sort(function(a, b) {
                if (b[key] < a[key]) {
                    return -1;
                }
                if (b[key] > a[key]) {
                    return 1;
                }
                return 0;
            });
        }
    }
    if (fm[EXPORT_TO]) {
        var paths = fm.export_to.split(".");
        var export_location = env;
        for (var i = 0, len = paths.length; i < len; i++) {
            export_location = export_location[paths[i]];
        }
        if (!(EXPORTS in export_location)) {
            export_location.exports = [];
        }
        export_location.exports.push(fm);
    }
}

exports.createRootNode = createRootNode;
exports.addDirNodeTo = addDirNodeTo;
exports.addFileNodeTo = addFileNodeTo;
exports.preProcess = preProcess;
