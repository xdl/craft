var path = require('path');

var getPwd = function(env) {
    var parents = [];
    var visiting = env.page.parent;
    while (visiting !== null) {
        parents.push(visiting.name);
        visiting = visiting.parent;
    }
    return path.join.apply(this, parents.reverse());
};

exports.include = function(text, env) {
    var pwd = getPwd(env);
    var extension = ".html";
    var include_file = path.join(pwd,text + extension);
    return include_file;
}
