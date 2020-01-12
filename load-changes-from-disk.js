/*\
title: $:/om/modules/server/routes/load-changes-from-disk.js
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

exports.path = /^\/filesystem\/load-changes-from-disk$/;

exports.handler = function(request,response,state) {
    response.writeHead(200, {"Content-Type": "application/json"});
    var filesystemAdaptor = $tw.syncadaptor;
    var changedTiddlers = filesystemAdaptor.syncChangesFromDisk();
    
    //TODO: return changed tiddlers (with filenames) from syncChangesFromDisk
    
	response.end(JSON.stringify(changedTiddlers),"utf8");
};

}());
