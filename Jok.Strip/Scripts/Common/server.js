var requirejs = require('./r');
var fork = require('child_process').fork;

requirejs.config({
    //Pass the top-level main.js/index.js require
    //function to requirejs so that node modules
    //are loaded relative to the top-level JS file.
    nodeRequire: require,
    generateSourceMaps: true,
    useSourceUrl: true
});

requirejs(['../GameServer'],
function (GameServer) {
    //foo and bar are loaded according to requirejs
    //config, but if not found, then node's require
    //is used to load the module.
});

var inspectorArgs = [];
var forkOptions = { silent: false };
var inspector = fork(
  require.resolve('node-inspector/bin/inspector'),
  inspectorArgs,
  forkOptions
);
