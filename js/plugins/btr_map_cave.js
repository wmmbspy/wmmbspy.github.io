//=============================================================================
// btr_map_cave.js
//=============================================================================

/*:
 * @plugindesc v1.02 Extension to btr_map_core
 * @author Biterkid (Lantiz)
 *
 * @help
 * =============================================================================
 * btr_map_cave by Biterkid (Lantiz)
 * =============================================================================
 * Terms of use
 * ------------
 * You can use it for free with proper credits given
 * You can edit it as long as you share any improvement on RPG Maker Web Forum
 * The purpose of sharing this is to improve it, so help us help you!
 * =============================================================================
 * Tiles - add the tiles at these coordinates on the map
 * -----------------------------------------------------
 * [0, 0] - floor
 * [0, 1] - wallTop
 * [0, 2] - wallBase
 * =============================================================================
 * Map note tags
 * -------------
 * <type:cave>
 * <border:2>
 * =============================================================================
 * Event note tags
 * ---------------
 * <tile:xxxx> - wallTop, wallBase, fTop, fRight, fBottom, fLeft, fCenter
 * =============================================================================
 */

Game_Map.prototype.buildCacheCave = function() {
    this._values = {
        wallTop: 0,
        wallBase: 1,
        floor: 2,
        fTop: 3,
        fRight: 4,
        fBottom: 5,
        fLeft: 6,
        fCenter: 7
        
    };
    
    this._names = [
        'wallTop',
        'wallBase',
        'floor',
        'fTop',
        'fRight',
        'fBottom',
        'fLeft',
        'fCenter'
    ];
    
    this._tiles = {
        wallTop: [],
        wallBase: [],
        floor: [],
        fTop: [],
        fRight: [],
        fBottom: [],
        fLeft: [],
        fCenter: []
    };

    for(var z = 0; z < 6; z++) {
        this._tiles.wallTop[z] = this.loadedTileId(0, 1, z);
        this._tiles.wallBase[z] = this.loadedTileId(0, 2, z);
        this._tiles.floor[z] = this.loadedTileId(0, 0, z);
        this._tiles.fTop[z] = this._tiles.floor[z];
        this._tiles.fRight[z] = this._tiles.floor[z];
        this._tiles.fBottom[z] = this._tiles.floor[z];
        this._tiles.fLeft[z] = this._tiles.floor[z];
        this._tiles.fCenter[z] = this._tiles.floor[z];
    }
};

Game_Map.prototype.tileNameCave = function(x, y) {
    var id = this._map[x][y];
    
    if(id > 1 && this.isValid(x - 1, y - 1) && this.isValid(x + 1, y + 1)) {
        
        //get adjacent
        var adjTopLeft = this._map[x][y - 1];
        var adjTop = this._map[x][y - 1];
        var adjTopRight = this._map[x + 1][y - 1];
        var adjRight = this._map[x + 1][y];
        var adjBottomRight = this._map[x + 1][y + 1];
        var adjBottom = this._map[x][y + 1];
        var adjBottomLeft = this._map[x - 1][y + 1];
        var adjLeft = this._map[x - 1][y];

        var isDoor =    (adjTop == this._values.wallBase && adjBottom == this._values.wallTop) ||
                        (adjLeft == this._values.wallTop && adjRight == this._values.wallTop) ||
                        (adjLeft == this._values.wallBase && adjRight == adjLeft) ||
                        (adjLeft == this._values.floor && adjTopLeft == this._values.wallBase && adjBottomLeft == this._values.wallTop) ||
                        (adjRight == this._values.floor && adjTopRight == this._values.wallBase && adjBottomRight == this._values.wallTop) ||
                        (adjTop == this._values.floor && adjTopLeft == this._values.wallBase && adjTopRight == adjTopLeft) ||
                        (adjBottom == this._values.floor && adjBottomLeft == this._values.wallTop && adjBottomRight == adjBottomLeft);

        if(isDoor) {
            return 'floor'
        }
        
        //check place
        if(adjTop == this._values.wallBase) {
            return 'fTop';
        }
        
        if(adjBottom == this._values.wallTop) {
            return 'fBottom';
        }
        
        if(adjRight < 2) {
            return 'fRight';
        }
        
        if(adjLeft < 2) {
            return 'fLeft';
        }
        
        if(adjTop == this._values.floor && adjRight == adjTop && adjBottom == adjTop && adjLeft == adjTop) {
            return 'fCenter';
        }
        
        return 'floor';
    }

    return this._names[id];    
};

Game_Map.prototype.canPlaceEventCave = function(meta, x, y) {
    var self = this._map[x][y];
    var tile = this._values[meta.tile];

    //check floor
    if(self > 1 && tile > 1 && this.isValid(x - 1, y - 1) && this.isValid(x + 1, y + 1)) {

        //get adjacent
        var adjTopLeft = this._map[x][y - 1];
        var adjTop = this._map[x][y - 1];
        var adjTopRight = this._map[x + 1][y - 1];
        var adjRight = this._map[x + 1][y];
        var adjBottomRight = this._map[x + 1][y + 1];
        var adjBottom = this._map[x][y + 1];
        var adjBottomLeft = this._map[x - 1][y + 1];
        var adjLeft = this._map[x - 1][y];

        //check angles
        var topLeft = adjLeft < 2 && adjTop == this._values.wallBase;
        var topRight = adjRight < 2 && adjTop == this._values.wallBase;
        var bottomLeft = adjLeft == this._values.wallTop && adjBottom == adjLeft;
        var bottomRight = adjRight == this._values.wallTop && adjBottom == adjRight;
        var isDoor =    (adjTop == this._values.wallBase && adjBottom == this._values.wallTop) ||
                        (adjLeft == this._values.wallTop && adjRight == this._values.wallTop) ||
                        (adjLeft == this._values.wallBase && adjRight == adjLeft) ||
                        (adjLeft == this._values.floor && adjTopLeft == this._values.wallBase && adjBottomLeft == this._values.wallTop) ||
                        (adjRight == this._values.floor && adjTopRight == this._values.wallBase && adjBottomRight == this._values.wallTop) ||
                        (adjTop == this._values.floor && adjTopLeft == this._values.wallBase && adjTopRight == adjTopLeft) ||
                        (adjBottom == this._values.floor && adjBottomLeft == this._values.wallTop && adjBottomRight == adjBottomLeft);

        if(isDoor || topLeft || topRight || bottomLeft || bottomRight){
            return false;
        }

        //check place
        var isTop = tile == this._values.fTop && adjTop == this._values.wallBase;
        var isRight = tile == this._values.fRight && adjRight < 2;
        var isBottom = tile == this._values.fBottom && adjBottom == this._values.wallTop;
        var isLeft = tile == this._values.fLeft && (adjLeft < 2);
        var isCenter = tile == this._values.fCenter && adjTop == this._values.floor && adjRight == adjTop && adjBottom == adjTop && adjLeft == adjTop;

        if(!(isTop || isRight || isBottom || isLeft || isCenter)) {
            return false;
        }

    //only placeable over floor or wallBase
    } else if(!(tile == this._values.wallBase && self == tile)) {
        return false;
    }

    return true;  
};

Game_Map.prototype.placeEntranceExitCave = function() {
    var border = $dataMap.meta.border || 2;
    border++;
    
    //define entrance and exit
    $dataMap._entranceSide = Math.rand(1, 4) * 2;

    //exit will never be close to entrance
    $dataMap._exitSide = $gamePlayer.reverseDir($dataMap._entranceSide);

    $dataMap._entrance = {x: 0, y: 0};
    $dataMap._exit = {x: 0, y: 0};

    for(i = 0; i <= 1; i++) {
        var p   = null;
        var val =  null;

        if(i == 0) {
            val = $dataMap._entranceSide;
            p 	= $dataMap._entrance;
        } else {
            val = $dataMap._exitSide;
            p	= $dataMap._exit;
        }

        switch (val) {
            case 8: //up
                p.x = border;
                p.y = border;
                
                do {
                    p.x = Math.rand(border, this.width() - border);
                } while(this._map[p.x][p.y] != this._values.floor);
                break;
            case 6: //right
                p.x = this.width() - border;
                p.y = border;
                
                do {
                    p.y = Math.rand(border, this.height() - border);
                } while(this._map[p.x][p.y] != this._values.floor);
                break;
            case 2: //down
                p.x = border;
                p.y = this.height() - border;
                
                do {
                    p.x = Math.rand(border, this.width() - border);
                } while(this._map[p.x][p.y] != this._values.floor);
                break;
            default: //4 - left
                p.x = border - 1;
                p.y = border;
                
                do {
                    p.y = Math.rand(border, this.height() - border);
                } while(this._map[p.x][p.y] != this._values.floor);
        }
    }
    //---
};

Game_Map.prototype.generateCave = function() {
    var border = $dataMap.meta.border || 2;

    //cotrol the amount of each tile, this is kind of difficult to measure, so better not touch
    var values = [
        this._values.wallTop, //index 0 is always fill value
        this._values.floor,
        this._values.floor,
        this._values.floor,
        this._values.floor,
        this._values.floor,
        this._values.floor,
        this._values.wallTop,
        this._values.wallTop,
        this._values.wallTop,
        this._values.wallTop,
        this._values.wallTop,
        this._values.wallTop,
        this._values.wallTop,
        this._values.wallTop,
        this._values.wallTop,
        this._values.wallTop,
        this._values.wallTop
    ];

    //draw ground, water and block top
    this._map = this._generator.noiseMap(this.width(), this.height(), values);

    //fill border x
    for(var x = 0; x < this.width(); x++) {
        for(var y = 0; y < border; y++) {
            this._map[x][y] = this._values.wallTop;
            this._map[x][this.height() - 1 - y] = this._values.wallTop;
        }
    }
    
    //fill border y
    for(var y = 0; y < this.height(); y++) {
        for(var x = 0; x < border; x++) {
            this._map[x][y] = this._values.wallTop;
            this._map[this.width() - 1 - x][y] = this._values.wallTop;
        }
    }
    
    this.fixBlockTiles(this._values.wallTop, this._values.wallBase);
    this.placeEntranceExitCave();
    this.drawMap();
    this.castShadows(this._values.wallTop, this._values.wallBase);
    this.updateAllAutoTiles();
};