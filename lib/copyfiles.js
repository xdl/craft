//Adapted from: http://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js

var path = require('path');
var fs = require('fs');

var deleteFolderRecursive = function(file_path) {
    if( fs.existsSync(file_path) ) {
        fs.readdirSync(file_path).forEach(function(file,index){
            var curPath = path.join(file_path, file);
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(file_path);
    }
};

var copyFileSync = function(source, target) {
    var targetFile = target;
    //if target is a directory a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }
    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

var copyFolderRecursiveSync = function(source, target, toIgnore) {
    var files = [];

    //check if folder needs to be created or integrated
    var targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    //copy
    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.filter(toIgnore).forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync(curSource, targetFolder, toIgnore);
            } else {
                copyFileSync(curSource, targetFolder);
            }
        } );
    }
}


//exported functions
//---


var copyFileIntoDirSync = function(source, target) {
    var targetFolder = path.join( target, path.basename( source ) );
    fs.writeFileSync(targetFolder, fs.readFileSync(source));
}

var copyInertFiles = function(source, target, toCopy) {
    var targetFolder = path.join( target, path.basename( source ) );
    files = fs.readdirSync( source );
    if (fs.existsSync(target)) {
        deleteFolderRecursive(target);
    }
    fs.mkdirSync(target);
    files.filter(toCopy).forEach(function(file) {
        var curSource = path.join( source, file );
        if (fs.lstatSync(curSource).isDirectory()) {
            copyFolderRecursiveSync(curSource, target, toCopy);
        } else {
            copyFileSync(curSource, target);
        }
    })
};

exports.copyFileIntoDirSync = copyFileIntoDirSync
exports.copyInertFiles = copyInertFiles
