//=============================================================================
// btr_core.js
//=============================================================================

/*:
 * @plugindesc v1.02 Global functions
 * @author Biterkid (Lantiz)
 *
 * @help
 * =============================================================================
 * btr_core by Biterkid (Lantiz)
 * =============================================================================
 * Terms of use
 * ------------
 * You can use it for free with proper credits given
 * You can edit it as long as you share any improvement on RPG Maker Web Forum
 * The purpose of sharing this is to improve it, so help us help you!
 * =============================================================================
 */

//==============================================================================
// ** Base extensions
//==============================================================================
Math.rand = function(min, max) {
    return (Math.floor(Math.random() * (max - min + 1) / 1) * 1 + min);
};

Math.roundTo = function(value, dec) {
    var decStr = '1';
    for(var i = 0; i < dec; i++) {
        decStr += '0';
    }    
    dec = decStr * 1;
    return Math.round(value * dec) / dec;
};

String.prototype.upperFirst = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

Rectangle.prototype.cx = function() {
    return this.left + Math.round((this.right - this.left) / 2);
};

Rectangle.prototype.cy = function() {
    return this.top + Math.round((this.bottom - this.top) / 2);
};

//greatly improves the performance over JsonEx since it has no encoding
JSON.makeDeepCopy = function(json) {
    return this.parse(this.stringify(json));
};

//==============================================================================
// ** For casting metadata values
//==============================================================================
var $cast = function(value) {
    
    if(value.substring(0, 1) == '[') {
        value = JSON.parse(value);
        
        value.forEach(function(obj) {
            var v = Number(obj);

            obj = (v || v === 0 ? v : String(obj));

            if(obj == 'true' || obj == 'false') {
                obj = obj == 'true';
            }
        });
        
    } else {        
        var v = Number(value);

        value = (v || v === 0 ? v : String(value));

        if(value == 'true' || value == 'false') {
            value = value == 'true';
        }
        
    }
    
    return value;
};

//==============================================================================
// ** To extract typed metadata
//==============================================================================
DataManager.extractMetadata = function(data) {
    var re = /<([^<>:]+)(:?)([^>]*)>/g;
    
    data.meta = {};
    for(;;) {
        var match = re.exec(data.note);
        if (match) {
            if (match[2] === ':') {
                data.meta[match[1]] = $cast(match[3]);
            } else {
                data.meta[match[1]] = true;
            }
        } else {
            break;
        }
    }
};

DataManager.extractEventMetadata = function(evt) {
    var re = /<([^<>:]+)(:?)([^>]*)>/g;
    var note = '';
    
    evt.pages.forEach(function(page) {
        page.list.forEach(function(row) {
            if(row.code === 108 || row.code === 408) {
                note += '\n' + row.parameters[0];
            }
        });
    });
                         
    evt.meta = {};
    for(;;) {
        var match = re.exec(note);
        if (match) {
            if (match[2] === ':') {
                evt.meta[match[1]] = $cast(match[3]);
            } else {
                evt.meta[match[1]] = true;
            }
        } else {
            break;
        }
    }
};