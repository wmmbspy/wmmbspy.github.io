/*:
* @plugindesc 
* @author mrcopra
* 
* 
* @help 
*
*/
Window_BattleLog.prototype.createBackSprite = function() {
    this._backSprite = new Sprite();
    this._backSprite.bitmap = this._backBitmap;
    this._backSprite.y = this.y;

};
Window_BattleLog.prototype.addText = function(text) {

};