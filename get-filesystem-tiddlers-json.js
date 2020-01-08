/*\
title: $:/om/modules/server/routes/get-filesystem-tiddlers-json.js
type: application/javascript
module-type: route

GET /recipes/default/tiddlers/filesystem-tiddlers.json

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
    
var fs = require("fs");
var path = require("path");

exports.method = "GET";

exports.path = /^\/filesystem\/get-filesystem-tiddlers.json$/;

exports.handler = function(request,response,state) {
    response.writeHead(200, {"Content-Type": "application/json"});
    var param = state.urlInfo.query ? state.urlInfo.query.split('=') : null;
    var filesystemAdaptor = $tw.syncadaptor;
    
    var paramType, paramValue = "";
    if (param) {
        paramType = param[0];
        paramValue = param[1];
    }
   
    var tiddlerFiles = {};
    if (paramType == "filter" && paramValue == "newOrDeleted") {
        tiddlerFiles = {tiddlers: filesystemAdaptor.listNewOrRemoved()};
    } else {
        tiddlerFiles = {tiddlers: filesystemAdaptor.listTiddlerFiles($tw.boot.wikiTiddlersPath)};
    }
    
	response.end(JSON.stringify(tiddlerFiles),"utf8");
};

}());
