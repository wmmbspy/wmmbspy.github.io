//=============================================================================
// btr_file.js
//=============================================================================

/*:
 * @plugindesc v1.01 File management
 * @author Biterkid (Lantiz)
 *
 * @help
 * =============================================================================
 * btr_file by Biterkid (Lantiz)
 * =============================================================================
 * Terms of use
 * ------------
 * You can use it for free with proper credits given
 * You can edit it as long as you share any improvement on RPG Maker Web Forum
 * The purpose of sharing this is to improve it, so help us help you!
 * =============================================================================
 */

//==============================================================================
// ** Node objects
//==============================================================================
var $fs   = require('fs');
var $path = require('path');

//==============================================================================
// ** File
//==============================================================================
function File() {
    throw new Error('btr_file: This is a static class');
}

File.copyDir = function(src, dest) {   
    if(!$fs.existsSync(dest)) {
        $fs.mkdirSync(dest, parseInt('0777', 8));
    }
    
	var files = $fs.readdirSync(src);
    
	for(var i = 0; i < files.length; i++) {
        
		var current = $fs.lstatSync($path.join(src, files[i]));
        
		if(current.isDirectory()) {
			this.copyDir($path.join(src, files[i]), $path.join(dest, files[i]));
            
		} else if(current.isSymbolicLink()) {
			var symlink = $fs.readlinkSync($path.join(src, files[i]));
			$fs.symlinkSync(symlink, $path.join(dest, files[i]));
            
		} else {
			this.copy($path.join(src, files[i]), $path.join(dest, files[i]));
		}
	}
};

File.copy = function(src, dest) {
    var BUF_LENGTH = 64 * 1024;
    var buff = new Buffer(BUF_LENGTH);
    var fdr = $fs.openSync(src, 'r');
    var fdw = $fs.openSync(dest, 'w');
    var bytesRead = 1;
    var pos = 0;
    
    while(bytesRead > 0) {
        bytesRead = $fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
        $fs.writeSync(fdw, buff, 0, bytesRead);
        pos += bytesRead;
    }
    
    $fs.closeSync(fdr);
    $fs.closeSync(fdw);
};

File.removeDir = function(dir) {
	var list = $fs.readdirSync(dir);
    
	for(var i = 0; i < list.length; i++) {
		var filename = $path.join(dir, list[i]);
		
        if(filename != "." && filename != "..") {
            var stat = $fs.lstatSync(filename);
            
            if(stat.isDirectory()) {
                
                //rmdir recursively
                this.removeDir(filename);
                
            } else {
                
                //rm fiilename
                $fs.unlinkSync(filename);
            }
        }
	}
    
	$fs.rmdirSync(dir);
};

File.gameDir = function() {
    if(!this._dir) {
        this._dir = $path.dirname(process.mainModule.filename);
        this._dir = $path.join(this._dir, '/');
    }
    
    return this._dir;
};

File.dataDir = function() {
    return $path.join(this.gameDir(), 'data/');
};

File.saveDir = function() {
    var dir = $path.join(this.gameDir(), 'save/');
    
    if(!$fs.existsSync(dir)) {
        $fs.mkdirSync(dir, parseInt('0777', 8));
    }
    
    return dir;
};

File.userDir = function() {
    var dir = $path.join(this.saveDir(), 'file' + this.userId() + '/');
    
    if(!$fs.existsSync(dir)) {
        $fs.mkdirSync(dir, parseInt('0777', 8));
    }
    
    return dir;
};

File.fileDir = function() {
    var dir = $path.join(this.userDir(), 'file/');
        
    if(!$fs.existsSync(dir)) {
        $fs.mkdirSync(dir, parseInt('0777', 8));
    }
    
    return dir;
};

File.imgDir = function() {
    var dir = $path.join(this.userDir(), 'img/');
        
    if(!$fs.existsSync(dir)) {
        $fs.mkdirSync(dir, parseInt('0777', 8));
    }
    
    return dir;
};

File.saveFile = function(json, filename) {
    $fs.writeFileSync(this.fileDir() + encodeURIComponent(filename + '.json'), JSON.stringify(json));
};

File.loadFile = function(filename) {   
    var file = this.fileDir() + encodeURIComponent(filename + '.json');
    
    if($fs.existsSync(file)) {
        return JSON.parse($fs.readFileSync(file, 'utf8'));
    }
    
    return null;
};

File.removeFile = function(filename) {    
    var file = this.fileDir() + encodeURIComponent(filename + '.json');
    
    if($fs.existsSync(file)) {
        $fs.unlinkSync(file);
    }
};

File.loadData = function(filename) {    
    return JSON.parse($fs.readFileSync((this.dataDir() + encodeURIComponent(filename + '.json')), 'utf8'));
};

File.saveData = function(json, filename) {    
    $fs.writeFileSync((this.dataDir() + encodeURIComponent(filename + '.json')), JSON.stringify(json));
};

File.removeSave = function() {
    var file = this.saveDir() + 'file' + this.userId() + '.rpgsave';
    
    if($fs.existsSync(file)) {
        $fs.unlinkSync(file);
    }
    
    this.removeDir(this.userDir());
};

File.saveBitmap = function(bitmap, filename) {
    var image64 = bitmap._canvas.toDataURL().replace(/^data:image\/png;base64,/, "");
    filename    = this.imgDir() + encodeURIComponent(filename + '.png');
 
    $fs.writeFileSync(filename, image64, 'base64');
};

File.loadBitmap = function(filename, callback) {
    if(callback) {
        var bitmap = Bitmap.load(this.imgDir() + encodeURIComponent(filename + '.png'));
        
        bitmap.addLoadListener(function() {
            bitmap.rotateHue(0);
            callback(bitmap);
        });
        
    } else {
        var hasEncryptedImages = Decrypter.hasEncryptedImages;
        
        Decrypter.hasEncryptedImages = false;
        
        var bitmap = ImageManager.loadNormalBitmap(this.imgDir() + encodeURIComponent(filename + '.png'), 0);
       
        Decrypter.hasEncryptedImages = hasEncryptedImages
        
        return bitmap;
    }
};

File.removeBitmap = function(filename) {    
    var file = this.imgDir() + encodeURIComponent(filename + '.png');
    
    if($fs.existsSync(file)) {
        $$fs.unlinkSync(file);
    }
};

File.saveGif = function(encoder) {
    var filename = File.imgDir() + encodeURIComponent(new Date().getTime() + '.gif');
    var gif64 = encode64(encoder.stream().getData());

    $fs.writeFileSync(filename, gif64, 'base64');
};

File.userId = function() {
    if($gameSystem._saveId == -1) {
        var dir = $path.join(this.saveDir() + 'temp/');
        
        if($fs.existsSync(dir)) {
            this.removeDir(dir);
        }
        
        $gameSystem._saveId = 'temp';
    }
    
    return $gameSystem._saveId;
};

//==============================================================================
// ** Changes the game saving to work with user directory
//==============================================================================
var file_game_system_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
    file_game_system_initialize.call(this);
    this._saveId = -1;
    this._saved = false;
};

var file_game_system_onBeforeSave = Game_System.prototype.onBeforeSave;
Game_System.prototype.onBeforeSave = function() {
    file_game_system_onBeforeSave.call(this);
    var savefileId = SceneManager._scene.savefileId();
    
    if(this._saveId != savefileId) {
        var newDir = $path.join(File.saveDir(), 'file' + savefileId + '/');
        
        if($fs.existsSync(newDir)) {
            File.removeDir(newDir);
        }
        
        File.copyDir(File.userDir(), newDir);
    }
    
    this._saveId = savefileId;
    this._saved = true;
};