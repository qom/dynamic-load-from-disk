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

exports.path = /^\/recipes\/default\/filesystem-tiddlers.json$/;

exports.handler = function(request,response,state) {
   response.writeHead(200, {"Content-Type": "application/json"});
	//var tiddlerFiles = JSON.stringify(listTiddlerFiles($tw.boot.wikiTiddlersPath));
    var tiddlerFiles = listNewOrRemoved();
	response.end(JSON.stringify(tiddlerFiles),"utf8");
};

function listNewOrRemoved() {
    
    var tiddlerPath = $tw.boot.wikiTiddlersPath;
    var loadedAtBoot = $tw.boot.files;
    //var originalFilePaths = state.wiki.getTiddler("$:/config/OriginalTiddlerPaths");
    //var originalFilePaths = $tw.boot.files;
    var tiddlersOnDisk = listTiddlerFiles(tiddlerPath);
    
    var deletedFromDisk = [];
    var originalFilePaths = [];
    $tw.utils.each(loadedAtBoot, file => {
        originalFilePaths.push(file.filepath);
        if (!tiddlersOnDisk.includes(file.filepath)) {
            deletedFromDisk.push(file.filepath);
        }
    });
    
    var newOnDisk = [];
    tiddlersOnDisk.forEach(file => {
        if (!originalFilePaths.includes(file)) {
            newOnDisk.push(file);
        }
    });
    
    return {new: newOnDisk, deleted: deletedFromDisk};
    
    /*
    // Load missing tiddlers
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
    */
    
}
    
function listTiddlerFiles(folderPath) {
    
    var files = fs.readdirSync(folderPath);
    var tiddlerFiles =[];
    $tw.utils.each(files, function(file) {
        
        var stat = fs.statSync(path.resolve(folderPath, file));
        if (stat.isDirectory()) {
            tiddlerFiles = tiddlerFiles.concat(listTiddlerFiles(path.resolve(folderPath, file)));        
        }
                                  
        if (stat.isFile() && !file.endsWith(".meta")) {
            tiddlerFiles.push(path.resolve(folderPath, file));           
        }
        
    });
    return tiddlerFiles;
    
}

}());
