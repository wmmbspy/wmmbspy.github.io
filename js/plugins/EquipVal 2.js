/*:
* @param momoEquipList
* @desc 格式如A1:1,W2:15。A1表示1号护甲，W2表示2号武器,冒号后面写开关。多条请用英文逗号分割。
* @default 
*/

var MOMO = {}
MOMO.parameters = PluginManager.parameters('EquipVal');
MOMO.EquipList = MOMO.parameters['momoEquipList'] || "";
MOMO.Game_Actor_changeEquip = Game_Actor.prototype.changeEquip;
Game_Actor.prototype.changeEquip = function(slotId, item) {
	var oldItem = this.equips()[slotId];
	MOMO.Game_Actor_changeEquip.apply(this, arguments);
	var list = MOMO.EquipList.split(",");
	while (list.length){
		var str = list.pop().split(":");
		var equipId = str[0].slice(1);
		var switchId = +str[1];
		if (oldItem){
			if (oldItem.id == equipId){
				if ((DataManager.isWeapon(oldItem) && str[0][0] == "W")||(DataManager.isArmor(oldItem) && str[0][0] == "A")){
					$gameSwitches._data[switchId] = false;
					console.log("更改开关:关"+switchId);
				}
			}
		}
		if (item){
			if (item.id == equipId){
				if ((DataManager.isWeapon(item) && str[0][0] == "W")||(DataManager.isArmor(item) && str[0][0] == "A")){
					$gameSwitches._data[switchId] = true;
					console.log("更改开关:开"+switchId);
				}
			}
		}
	}
};