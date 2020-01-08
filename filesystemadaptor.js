/*\
title: $:/plugins/tiddlywiki/filesystem/filesystemadaptor.js
type: application/javascript
module-type: syncadaptor

A sync adaptor module for synchronising with the local filesystem via node.js APIs

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Get a reference to the file system
var fs = $tw.node ? require("fs") : null,
	path = $tw.node ? require("path") : null;

function FileSystemAdaptor(options) {
	var self = this;
	this.wiki = options.wiki;
	this.logger = new $tw.utils.Logger("filesystem",{colour: "blue"});
	// Create the <wiki>/tiddlers folder if it doesn't exist
	$tw.utils.createDirectory($tw.boot.wikiTiddlersPath);
}

FileSystemAdaptor.prototype.name = "filesystem";

FileSystemAdaptor.prototype.isReady = function() {
	// The file system adaptor is always ready
	return true;
};

FileSystemAdaptor.prototype.getTiddlerInfo = function(tiddler) {
	return {};
};

/*
Return a fileInfo object for a tiddler, creating it if necessary:
  filepath: the absolute path to the file containing the tiddler
  type: the type of the tiddler file (NOT the type of the tiddler -- see below)
  hasMetaFile: true if the file also has a companion .meta file

The boot process populates $tw.boot.files for each of the tiddler files that it loads. The type is found by looking up the extension in $tw.config.fileExtensionInfo (eg "application/x-tiddler" for ".tid" files).

It is the responsibility of the filesystem adaptor to update $tw.boot.files for new files that are created.
*/
FileSystemAdaptor.prototype.getTiddlerFileInfo = function(tiddler,callback) {
	// See if we've already got information about this file
	var title = tiddler.fields.title,
		fileInfo = $tw.boot.files[title];
	if(!fileInfo) {
		// Otherwise, we'll need to generate it
		fileInfo = $tw.utils.generateTiddlerFileInfo(tiddler,{
			directory: $tw.boot.wikiTiddlersPath,
			pathFilters: this.wiki.getTiddlerText("$:/config/FileSystemPaths","").split("\n"),
			wiki: this.wiki
		});
		$tw.boot.files[title] = fileInfo;
	}
	callback(null,fileInfo);
};

FileSystemAdaptor.prototype.deleteTiddlerFileInfo = function(title,callback) {
    var fileInfo = $tw.boot.files[title],
        updatedFiles = {};
    
    // Too slow to do on every delete?
    for (var file in $tw.boot.files) {
        if (file != title) {
            updatedFiles[file] = $tw.boot.files[file]
        }
    }
    
    // Will this cause memory leak? When will the original file object be garbage collected?
    $tw.boot.files = updatedFiles;
}

/*
Save a tiddler and invoke the callback with (err,adaptorInfo,revision)
*/
FileSystemAdaptor.prototype.saveTiddler = function(tiddler,callback) {
	var self = this;
	this.getTiddlerFileInfo(tiddler,function(err,fileInfo) {
		if(err) {
			return callback(err);
		}
		$tw.utils.saveTiddlerToFile(tiddler,fileInfo,callback);
	});
};

/*
Load a tiddler and invoke the callback with (err,tiddlerFields)

We don't need to implement loading for the file system adaptor, because all the tiddler files will have been loaded during the boot process.
*/
FileSystemAdaptor.prototype.loadTiddler = function(title,callback) {
    
    // Load missing tiddlers
   
    // var filepath = title.replace($tw.boot.wikiTiddlersPath + "/", "");
    if(!$tw.wiki.getTiddler(title)) {   
    
        var filepath = title;

        console.log(filepath);
        var tiddlerFile = $tw.loadTiddlersFromFile(filepath,{title: filepath});
        /*if(tiddlerFile.filepath) {
            $tw.utils.each(tiddlerFile.tiddlers,function(tiddler) {
                $tw.boot.files[tiddler.title] = {
                   filepath: tiddlerFile.filepath,
                   type: tiddlerFile.type,
                   hasMetaFile: tiddlerFile.hasMetaFile
                };
            });
        }*/

        $tw.wiki.addTiddlers(tiddlerFile.tiddlers);
    }
    
    if (callback) {
	    callback(null,null);
    }
};

/*
Delete a tiddler and invoke the callback with (err)
*/
FileSystemAdaptor.prototype.deleteTiddler = function(title,callback,options) {
	var self = this,
		fileInfo = $tw.boot.files[title];
	// Only delete the tiddler if we have writable information for the file
	if(fileInfo) {
		// Delete the file
        this.deleteTiddlerFileInfo(title);
		fs.unlink(fileInfo.filepath,function(err) {
			if(err) {
				return callback(err);
			}
			// Delete the metafile if present
			if(fileInfo.hasMetaFile) {
				fs.unlink(fileInfo.filepath + ".meta",function(err) {
					if(err) {
						return callback(err);
					}
					return $tw.utils.deleteEmptyDirs(path.dirname(fileInfo.filepath),callback);
				});
			} else {
				return $tw.utils.deleteEmptyDirs(path.dirname(fileInfo.filepath),callback);
			}
		});
	} else {
		callback(null);
	}
};
    
FileSystemAdaptor.prototype.syncChangesFromDisk = function() {
    
    var self = this;
    var changedTiddlers = this.listNewOrRemoved();
    
    // Note: if the deleted tiddler file name doesn't match the tiddler title
   /* changedTiddlers.deleted.forEach(title => filesystemAdaptor.deleteTiddler(title));
    changedTiddlers.new.forEach(title => filesystemAdaptor.loadTiddler(title));*/
    
    // Find the tiddler title entry corresponding to the delted tiddler filename in $tw.boot.files.
    // This is necessary in case the tiddler filename doesn't match the tiddler title.
    changedTiddlers.deleted.forEach(filepath => {
        var tiddlerNameForDeletedFile = "";
        for (var fileInfo in $tw.boot.files) {
            if($tw.boot.files[fileInfo].filepath == filepath) {
                tiddlerNameForDeletedFile = fileInfo;
            }
        }
        // This enqueus a change event, but deleteTiddler not called?
        $tw.wiki.deleteTiddler(tiddlerNameForDeletedFile);
        self.deleteTiddlerFileInfo(tiddlerNameForDeletedFile);
    });
    changedTiddlers.new.forEach(title => self.loadTiddler(title));
}
    
/*
List only tiddlers that are new, or have been removed from disk.
*/
FileSystemAdaptor.prototype.listNewOrRemoved = function () {
    
    var tiddlerPath = $tw.boot.wikiTiddlersPath;
    var loadedAtBoot = $tw.boot.files;
    //var originalFilePaths = state.wiki.getTiddler("$:/config/OriginalTiddlerPaths");
    //var originalFilePaths = $tw.boot.files;
    var tiddlersOnDisk = this.listTiddlerFiles(tiddlerPath);
    var wikiTiddlers = $tw.wiki.getTiddlers();
            
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
    
  /*  tiddlersOnDisk.forEach(file => {
       if(!wikiTiddlers.includes(file)) {
            newOnDisk.push(tiddler);   
       }
    });*/

    
    
    return {new: newOnDisk, deleted: deletedFromDisk};
};

/*
Rescan the tiddler folder and collect all file names along with relative paths.
*/
FileSystemAdaptor.prototype.listTiddlerFiles = function(folderPath) {
    var self = this;
    var files = fs.readdirSync(folderPath);
    var tiddlerFiles =[];
    $tw.utils.each(files, function(file) {
        
        var stat = fs.statSync(path.resolve(folderPath, file));
        if (stat.isDirectory()) {
            tiddlerFiles = tiddlerFiles.concat(self.listTiddlerFiles(path.resolve(folderPath, file)));        
        }
                                  
        if (stat.isFile() && !file.endsWith(".meta")) {
            tiddlerFiles.push(path.resolve(folderPath, file));           
        }
        
    });
    return tiddlerFiles;
    
};
    
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
    

if(fs) {
	exports.adaptorClass = FileSystemAdaptor;
}

})();
