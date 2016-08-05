var chai = require('chai');
var path = require('path');
var FrontMatter = require('../lib/frontmatter.js');

//TODO: set up with chai, empty front matter should return true
var no_fm = path.resolve(__dirname, 'assets/no_front_matter.md');
var empty_fm = path.resolve(__dirname, 'assets/empty_front_matter.md');
var contains_fm = path.resolve(__dirname, 'assets/contains_front_matter.md');
console.log(FrontMatter.containsFrontMatter(no_fm));
console.log(FrontMatter.containsFrontMatter(empty_fm));
console.log(FrontMatter.containsFrontMatter(contains_fm));
