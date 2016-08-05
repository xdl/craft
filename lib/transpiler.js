var createMustacheWrapper = function(fns, exported_functions, fn, env) {
    fns[fn] = function() {
        return function(text, render) {
            return exported_functions[fn](render(text), env);
        };
    }
}

//path -> {fns}
var createMustacheWrappers = function(include_path, env) {
    var exported_functions = require(include_path);
    var fns = {};
    for (var fn in exported_functions) {
        if (exported_functions.hasOwnProperty(fn)) {
            //needs a closure to capture fn variable binding:
            //http://stackoverflow.com/questions/20587714/addeventlistener-for-index-how-to-use-closure
            createMustacheWrapper(fns, exported_functions, fn, env);
        }
    }
    return fns;
};

exports.createMustacheWrappers = createMustacheWrappers;
