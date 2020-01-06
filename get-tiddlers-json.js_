/*\
title: $:/core/modules/server/routes/get-tiddlers-json.js
type: application/javascript
module-type: route

GET /recipes/default/tiddlers/tiddlers.json

OM Modified.

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
    
var fs = require("fs");
var path = require("path");

exports.method = "GET";

exports.path = /^\/recipes\/default\/tiddlers.json$/;

exports.handler = function(request,response,state) {
    var filter = state.queryParameters.filter || "[all[tiddlers]!is[system]sort[title]]",
		excludeFields = (state.queryParameters.exclude || "text").split(","),
		titles = state.wiki.filterTiddlers(filter);
	response.writeHead(200, {"Content-Type": "application/json"});
	var tiddlers = [];
    checkWikiPathForNewTiddlers(state);
	$tw.utils.each(titles,function(title) {
		var tiddler = state.wiki.getTiddler(title);
		if(tiddler) {
			var tiddlerFields = tiddler.getFieldStrings({exclude: excludeFields});
			tiddlerFields.revision = state.wiki.getChangeCount(title);
			tiddlerFields.type = tiddlerFields.type || "text/vnd.tiddlywiki";
			tiddlers.push(tiddlerFields);
		}
	});
	var text = JSON.stringify(tiddlers);
	response.end(text,"utf8");
};
    
function checkWikiPathForNewTiddlers(state) {
    
    var searchPath = $tw.boot.wikiTiddlersPath;
    var originalFilePaths = state.wiki.getTiddler("$:/config/OriginalTiddlerPaths");
    //var originalFilePaths = $tw.boot.files;
    var tiddlerFiles = findTiddlerFiles(searchPath);
    
    $tw.utils.each(tiddlerFiles, function(filepath) {
        var relativePath = filepath.replace($tw.boot.wikiTiddlersPath + "/", "");
        if (originalFilePaths.fields.text.indexOf(relativePath) == -1) {
            console.log(filepath);
            var tiddlerFile = $tw.loadTiddlersFromFile(filepath,{title: filepath});
            if(tiddlerFile.filepath) {
                $tw.utils.each(tiddlerFile.tiddlers,function(tiddler) {
				    $tw.boot.files[tiddler.title] = {
					   filepath: tiddlerFile.filepath,
					   type: tiddlerFile.type,
					   hasMetaFile: tiddlerFile.hasMetaFile
				    };
                });
            }
		    $tw.wiki.addTiddlers(tiddlerFile.tiddlers);
        }
    })
    
}
    
function findTiddlerFiles(searchPath) {
    
    var files = fs.readdirSync(searchPath);
    var tiddlerFiles =[];
    $tw.utils.each(files, function(file) {
        
        var stat = fs.statSync(path.resolve(searchPath, file));
        if (stat.isDirectory()) {
            tiddlerFiles = tiddlerFiles.concat(findTiddlerFiles(path.resolve(searchPath, file)));        
        }
                                  
        if (stat.isFile() && !file.endsWith(".meta")) {
            tiddlerFiles.push(path.resolve(searchPath, file));           
        }
        
    });
    return tiddlerFiles;
    
}

}());
