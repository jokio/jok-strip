// [Module System]
var requirejs = require('./common/r');

requirejs.config({
    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require
});

requirejs(['GameServer'],
function (GameServer) {
    //foo and bar are loaded according to requirejs
    //config, but if not found, then node's require
    //is used to load the module.
});



// [Node Inspector]
var fork = require('child_process').fork;

var inspectorArgs = [];
var forkOptions = { silent: true };
var inspector = fork(
  require.resolve('node-inspector/bin/inspector'),
  inspectorArgs,
  forkOptions
);

console.log('')
console.log('')
console.log(' [DEBUG]:', 'http://localhost:8080/debug?port=5858');
