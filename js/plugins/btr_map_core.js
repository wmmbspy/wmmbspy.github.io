//=============================================================================
// btr_map_core.js
//=============================================================================

/*:
 * @plugindesc v1.07 Generate random maps
 * @author Biterkid (Lantiz)
 *
 * @help
 * =============================================================================
 * btr_map_core by Biterkid (Lantiz)
 * =============================================================================
 * Terms of use
 * ------------
 * You can use it for free with proper credits given
 * You can edit it as long as you share any improvement on RPG Maker Web Forum
 * The purpose of sharing this is to improve it, so help us help you!
 * =============================================================================
 * Usage
 * -----
 * To define a map as random it's name must have $ at the start
 * If using grid mode, the map size must be divisible by the screen size
 * =============================================================================
 * Map note tags
 * -------------
 * <fow:true/false>        - to control the use of fog of war 
 * <fowtile:0>             - tile used as fog of war (the tile id)
 * <fowrange:4>            - range for revealing the fog of war 
 * <type:x>                - type defined by an extension plugin
 * <regenerate:true/false> - reload the map when player enters it
 * <grid>                  - Zelda style camera
 * <skip:[]>               - tiles to skip from auto tiling 
 *                           see the buildCache function of the extension to
 *                           know the tile value inside the _map list 
 * -----------------------------------------------------------------------------
 * Event note tags
 * ---------------
 * <entrance>   - used for player transfer
 * <exit>       - used for player transfer
 * <tile:xxxx>  - see each extension, like btr_map_world.js
 * <sideOf:x,0> - event id, direction (2/4/6/8)
 * <rate:0>     - chance to spawn in percentual, ignored for sideOf
 * <width:0>    - to avoid events overlaping each other
 * <height:0>   - to avoid events overlaping each other
 * <min:0>      - minimum amount of spawns
 * <max:0>      - maximum amount of spawns
 * <reset>      - reset events self switches to false on cache data
 * =============================================================================
 * Script calls
 * ------------
 * refreshEntrance - update $dataMap.entrance with player position
 * =============================================================================
 * Plugin commands
 * ---------------
 * map refreshentrance - update $dataMap.entrance with player position
 * =============================================================================
 */

//==============================================================================
 // ** Noise API
 //==============================================================================
 /*
  * A speed-improved perlin and simplex noise algorithms for 2D.
  *
  * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
  * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
  * Better rank ordering method by Stefan Gustavson in 2012.
  * Converted to Javascript by Joseph Gentle.
  *
  * Version 2012-03-09
  *
  * This code was placed in the public domain by its original author,
  * Stefan Gustavson. You may use it as you see fit, but
  * attribution is appreciated.
  *
   ISC License
   
   Copyright (c) 2013, Joseph Gentle

   Permission to use, copy, modify, and/or distribute this software for any
   purpose with or without fee is hereby granted, provided that the above
   copyright notice and this permission notice appear in all copies.

   THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
   REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
   AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
   INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
   LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
   OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
   PERFORMANCE OF THIS SOFTWARE.
   
   https://github.com/josephg/noisejs/blob/master/LICENSE
  *
  */
const NOISE_STYLE = {
    perlin: 0,
    simplex: 1
};

//==============================================================================
// ** Noise Gradient
//==============================================================================
function Grad() {
    this.initialize.apply(this, arguments);
}

Grad.prototype.initialize = function(x, y, z) {
    this._x = x; 
    this._y = y; 
    this._z = z;
};

Grad.prototype.dot2 = function(x, y) {
    return this._x * x + this._y * y;
};

Grad.prototype.dot3 = function(x, y, z) {
    return this._x * x + this._y * y + this._z * z;
};

//==============================================================================
// ** Map array generator
//==============================================================================
function Generator() {
    this.initialize.apply(this, arguments);
}

Generator.prototype.initialize = function() {
    
    // To remove the need for index wrapping, double the permutation table length
    this._perm = new Array(512);
    this._gradP = new Array(512);
    this._grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
                   new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
                   new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];
    this._p = [151,160,137,91,90,15,
               131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
               190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
               88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
               77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
               102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
               135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
               5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
               223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
               129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
               251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
               49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
               138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
};

//supports 2^16
Generator.prototype.noiseSeed = function(s) {
    var seed = s || Math.rand(0, 65536);
    
    if(seed > 0 && seed < 1) {
        seed *= 65536;
    }

    seed = Math.floor(seed);
    if(seed < 256) {
        seed += seed << 8;
    }

    for(var i = 0; i < 256; i++) {
        var v;
        
        if (i & 1) {
            v = this._p[i] ^ (seed & 255);
        } else {
            v = this._p[i] ^ ((seed>>8) & 255);
        }

        this._perm[i] = this._perm[i + 256] = v;
        this._gradP[i] = this._gradP[i + 256] = this._grad3[v % 12];
    }  
};

// 2D simplex noise
Generator.prototype.simplex2d = function(xin, yin) {
    var n0, n1, n2; // Noise contributions from the three corners

    // Skewing and unskewing factors for 2, 3, and 4 dimensions
    var F2 = 0.5 * (Math.sqrt(3) - 1);
    var G2 = (3 - Math.sqrt(3)) / 6;
    var F3 = 1 / 3;
    var G3 = 1 / 6;

    // Skew the input space to determine which simplex cell we're in
    var s = (xin + yin) * F2; // Hairy factor for 2D
    var i = Math.floor(xin + s);
    var j = Math.floor(yin + s);
    var t = (i + j) * G2;
    var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin - j + t;

    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    
    // Offsets for second (middle) corner of simplex in (i,j) coords
    var i1;
    var j1; 
    
    if(x0 > y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        i1 = 1; 
        j1 = 0;
    } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        i1 = 0; 
        j1 = 1;
    }

    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    var y1 = y0 - j1 + G2;
    var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
    var y2 = y0 - 1 + 2 * G2;

    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;
    
    var gi0 = this._gradP[i + this._perm[j]];
    var gi1 = this._gradP[i + i1 + this._perm[j + j1]];
    var gi2 = this._gradP[i + 1 + this._perm[j + 1]];

    // Calculate the contribution from the three corners
    var t0 = 0.5 - x0 * x0 - y0 * y0;
    if(t0 < 0) {
        n0 = 0;
    } else {
        t0 *= t0;
        n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
    }
    
    var t1 = 0.5 - x1 * x1 - y1 * y1;
    if(t1 < 0) {
        n1 = 0;
    } else {
        t1 *= t1;
        n1 = t1 * t1 * gi1.dot2(x1, y1);
    }

    var t2 = 0.5 - x2 * x2 - y2 * y2;
    if(t2 < 0) {
        n2 = 0;
    } else {
        t2 *= t2;
        n2 = t2 * t2 * gi2.dot2(x2, y2);
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70 * (n0 + n1 + n2);
};

// 2D Perlin Noise
Generator.prototype.fade = function(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
};

Generator.prototype.lerp = function(a, b, t) {
    return (1 - t) * a + t * b;
}

Generator.prototype.perlin2d = function(x, y) {

    // Find unit grid cell containing point
    var X = Math.floor(x);
    var Y = Math.floor(y);

    // Get relative xy coordinates of point within that cell
    x = x - X; 
    y = y - Y;

    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255; 
    Y = Y & 255;

    // Calculate noise contributions from each of the four corners
    var n00 = this._gradP[X + this._perm[Y]].dot2(x, y);
    var n01 = this._gradP[X + this._perm[Y + 1]].dot2(x, y - 1);
    var n10 = this._gradP[X + 1 + this._perm[Y]].dot2(x - 1, y);
    var n11 = this._gradP[X + 1 + this._perm[Y + 1]].dot2(x - 1, y - 1);

    // Compute the fade curve value for x
    var u = this.fade(x);

    // Interpolate the four results
    return this.lerp(   this.lerp(n00, n10, u),
                        this.lerp(n01, n11, u),
                        this.fade(y)    );
};

//generate a 2d array following the noise style pattern
Generator.prototype.noiseMap = function(width, height, values, divisor, noiseStyle) {
   
    //this delivers better patterns than perlin
    noiseStyle = noiseStyle || NOISE_STYLE.perlin;
    
    //this delivers good patterns when using perlin
    divisor = divisor || 12;
    
    //this is a good variation between three values when using simplex
    //0 = mid | 1 = under | 2 above
    values = values || [1, 0, 0, 0, 2];
    
    var inc = 2 / values.length;
    var translator = [{
        value: values[1],
        range: {
            start: -1,
            end: -inc
        }
    }];
    
    var tIndex = 0;
    for(var i = 2; i < values.length; i++) {
        var last = translator[tIndex].range.end;
        tIndex++;
        translator[tIndex] = {
            value: values[i],
            range: {
                start: last,
                end: last + inc
            }
        }
    }
    
    this.noiseSeed();
    
    var map = [];
    for(var x = 0; x < width; x++) {
        map[x] = [];
        
        for(var y = 0; y < height; y++) {
            map[x][y] = values[0]; //index 0 is always fill value

            //guarantee passability on the borders
            if(x > 0 && y > 1 && x < (width - 1) && y < (height - 2)) {
                value = 0;

                switch(noiseStyle) {
                    case 0: value = this.perlin2d(x / divisor, y / divisor);
                    case 1: value = this.simplex2d(x / divisor, y / divisor);
                }

                for(var i = 0; i < translator.length; i++) {
                    var t = translator[i];
                    if(value >= t.range.start && value <= t.range.end) {
                        map[x][y] = t.value;
                    }
                }
            }
        }
    }
    
    return map;
};

//==============================================================================
// ** Maze API
//==============================================================================
Generator.prototype.mazeMap = function(width, height, blockSize) {
    blockSize = blockSize || 1;

    //original width and height will be used on map translation
    var nw = Math.floor(width / blockSize);
    var nh = Math.floor(height / blockSize);
    
	//only odd shapes, careful x and y are reversed
	var shapex = Math.floor(nw / 2) * 2 + 1;
	var shapey = Math.floor(nh / 2) * 2 + 1;
    
	//adjust complexity and density relative to maze size
    var complexity = 0.75;
	var density = 0.75;
	complexity = Math.floor(complexity * 5 * (shapey + shapex));
	density    = Math.floor(density * Math.floor(shapey / 2) * Math.floor(shapex / 2));
    
	//build actual maze
	var Z = [];
	for(var i = 0; i < shapey; i++) {
        
		Z[i] = [];
		for(var j = 0; j < shapex; j++) {
            
			//fill borders
			if((i == 0) || (i == (shapey - 1)) || (j == 0) || (j == (shapex - 1))) {
				Z[i][j] = 1;
            } else {
				Z[i][j] = 2;
            }
		}
	}
    
	// Make isles
	for(var i = 0; i < density; i++) {
		var x = Math.round(Math.random() * Math.floor(shapex / 2)) * 2;
		var y = Math.round(Math.random() * Math.floor(shapey / 2)) * 2;
        
		Z[y][x] = 1;
		for(var j = 0; j < complexity; j++) {
            
			var neighbours = [];
			if(x > 1) {
				neighbours.push([y, x - 2]);
            }
			if(x < shapex-2) {
				neighbours.push([y, x + 2]);
            }
			if(y > 1) {
				neighbours.push([y - 2, x]);
            }
			if(y < shapey-2) {
				neighbours.push([y + 2, x]);
            }
			if(neighbours.length > 0) {
				var y_x_ = neighbours[Math.round(Math.random() * (neighbours.length - 1))];
				var y_ = y_x_[0];
				var x_ = y_x_[1];
                
				if(Z[y_][x_] == 2)	{
					Z[y_][x_] = 1;
					Z[Math.floor(y_ + (y - y_)/2)][Math.floor(x_ + (x - x_)/2)] = 1;
					x = x_;
					y = y_;
				}
			}
		}
	}
    
    //to translate maze to map and adjust blockSize
    var map = [];
    for(var x = 0; x < width; x++) {
        map[x] = [];
        for(var y = 0; y < height; y++) {
            map[x][y] = -1;
        }
    }
    
    //translate the maze to the map adjusting the map size based on the blockSize
    for(var x = 0; x < Z.length; x++) {
		for(var y = 0; y < Z[x].length; y++) {
            var mapX = (x * blockSize);
            var mapY = (y * blockSize);
  
            for(var mx = mapX; mx < (mapX + blockSize); mx++) {
                for(var my = mapY; my < (mapY + blockSize); my++) {
                    map[mx][my] = Z[x][y];
                }
            }
        }
    }
    
	return map;
};

//==============================================================================
// ** BSP Tree API
// ** Does not seem to work well for city, needs fixing
//==============================================================================
const BSP_STYLE = {
    'dungeon': 0,
    'city': 1
};

function BSP_Leaf() {
   this.initialize.apply(this, arguments); 
}   
    
BSP_Leaf.prototype.initialize = function(x, y, width, height, style) {
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this._minLeafSize = 11;
    this._minRoomSize = 8;
    this._leftChild = null;
    this._rightChield = null;
    this._room = null;
    this._road = null;
    this._halls = [];
    this._style = style || BSP_STYLE.dungeon;
};

BSP_Leaf.prototype.halls = function() {
    return this._halls;
};

BSP_Leaf.prototype.road = function() {
    return this._road;
};

BSP_Leaf.prototype.style = function() {
    return this._style;
};

BSP_Leaf.prototype.left = function() {
    return this._x;
};

BSP_Leaf.prototype.top = function() {
    return this._y;
};

BSP_Leaf.prototype.right = function() {
    return this._x + this._width - 1;
};

BSP_Leaf.prototype.bottom = function() {
    return this._y + this._height - 1;
};

BSP_Leaf.prototype.split = function() {
   
    //split the leaf into two children
    if(this._leftChild || this._rightChild) {
        return false; //already split
    }

    //determine direction of split
    //if the width is more then 25% larger than height, we split vertically
    //if the height is more than 25% larger than the width, we split horizontally
    //otherwise we split randomly
    var splitH = Math.rand(0, 1) == 0;
    if(this._width > this._height && this._width / this._height >= 1.25) {
        splitH = false;
    } else if(this._height > this._width && this._height / this._width >= 1.25) {
        splitH = true;
    }

    //determine the maximum height or width
    var max = (splitH ? this._height : this._width) - this._minLeafSize; 
    if(max <= this._minLeafSize) {
        return false; //too small to split
    }

    //determine where to split
    var split = Math.rand(this._minLeafSize, max); 

    //create left and right children based on the direction of the split
    if(splitH) {
        this._leftChild = new BSP_Leaf(this._x, this._y, this._width, split, this._style);
        this._rightChild = new BSP_Leaf(this._x, this._y + split, this._width, this._height - split, this._style);
    } else {
        this._leftChild = new BSP_Leaf(this._x, this._y, split, this._height, this._style);
        this._rightChild = new BSP_Leaf(this._x + split, this._y, this._width - split, this._height, this._style);
    }
    
    return true;    
};

BSP_Leaf.prototype.createRoom = function() {
    
	//this leaf has been split, so go into the children leafs
	if(this._leftChild || this._rightChild) {
		if(this._leftChild) {
			this._leftChild.createRoom();
		}
		if(this._rightChild) {
			this._rightChild.createRoom();
		}
        
        //if there are both left and right children in this Leaf, create a hallway between them
		if(this._leftChild && this._rightChild) {
			this.createHalls(this._leftChild.getRoom(), this._rightChild.getRoom());
		}
        
    //this Leaf is ready to have a room
	} else {
		        
		//the room can be between 7 tiles to the size of the leaf - 5
        var w = Math.rand(this._minRoomSize, this._width - 5);
        var h = Math.rand(this._minRoomSize, this._height - 5);
        
		//place the room within the Leaf, but don't put it right 
		//against the side of the Leaf (that would merge rooms together)
        var x = Math.rand(this._x + 1, this._x + this._width  - w - 2);
        var y = Math.rand(this._y + 1, this._y + this._height - h - 2);
        
        h--;
        w--;
        
		this._room = new Rectangle(x, y, w, h);
        
        if(this._style == BSP_STYLE.city) {
            this.createRoad();
        }
	}
};

BSP_Leaf.prototype.getRoom = function() {
    
    // iterate all the way through these leafs to find a room, if one exists
	if(this._room) {
        return this._room;
    } 
    
    var lRoom = null;
    var rRoom = null;

    if(this._leftChild)	{
        lRoom = this._leftChild.getRoom();
    }

    if(this._rightChild) {
        rRoom = this._rightChild.getRoom();
    }

    if(!(lRoom || rRoom)) {
        return null;
    } 
    if(!rRoom) {
        return lRoom;
    } 
    if(!lRoom) {
        return rRoom;
    } 
    if(Math.rand(0, 1) == 0) {
        return lRoom;
    } 
    return rRoom;
};

//try to figure out which point is where and then either draw a straight line
//or a pair of lines to make a right-angle to connect the rooms
BSP_Leaf.prototype.createHalls = function(l, r) {
    var point1  = new Point(l.cx(), l.cy());
    var point2  = new Point(r.cx(), r.cy());
    
    var w = point2.x - point1.x;
    var h = point2.y - point1.y;
    
    if(w < 0) {
		if(h < 0) {
			if(Math.rand(0, 1) == 0)	{
				this._halls.push(new Rectangle(point2.x, point1.y, Math.abs(w), 2));
				this._halls.push(new Rectangle(point2.x, point2.y, 1, Math.abs(h)));
			} else {
				this._halls.push(new Rectangle(point2.x, point2.y, Math.abs(w), 2));
				this._halls.push(new Rectangle(point1.x, point2.y, 1, Math.abs(h)));
			}
		}
		else if(h > 0) {
			if(Math.rand(0, 1) == 0)	{
				this._halls.push(new Rectangle(point2.x, point1.y, Math.abs(w), 2));
				this._halls.push(new Rectangle(point2.x, point1.y, 1, Math.abs(h)));
			} else {
				this._halls.push(new Rectangle(point2.x, point2.y, Math.abs(w), 2));
				this._halls.push(new Rectangle(point1.x, point1.y, 1, Math.abs(h)));
			}
		} else {// if (h == 0)
			this._halls.push(new Rectangle(point2.x, point2.y, Math.abs(w), 2));
		}
	}
	else if(w > 0) {
		if(h < 0) {
			if(Math.rand(0, 1) == 0)	{
				this._halls.push(new Rectangle(point1.x, point2.y, Math.abs(w), 2));
				this._halls.push(new Rectangle(point1.x, point2.y, 1, Math.abs(h)));
			} else {
				this._halls.push(new Rectangle(point1.x, point1.y, Math.abs(w), 2));
				this._halls.push(new Rectangle(point2.x, point2.y, 1, Math.abs(h)));
			}
		}
		else if(h > 0) {
			if(Math.rand(0, 1) == 0)	{
				this._halls.push(new Rectangle(point1.x, point1.y, Math.abs(w), 2));
				this._halls.push(new Rectangle(point2.x, point1.y, 1, Math.abs(h)));
			} else {
				this._halls.push(new Rectangle(point1.x, point2.y, Math.abs(w), 2));
				this._halls.push(new Rectangle(point1.x, point1.y, 1, Math.abs(h)));
			}
		} else {// if (h == 0)
			this._halls.push(new Rectangle(point1.x, point1.y, Math.abs(w), 2));
		}
	} else { // if (w == 0)
		if(h < 0) {
			this._halls.push(new Rectangle(point2.x, point2.y, 1, Math.abs(h)));
		} else if(h > 0) {
			this._halls.push(new Rectangle(point1.x, point1.y, 1, Math.abs(h)));
		}
	}
};

BSP_Leaf.prototype.createRoad = function() {
    var up = Math.abs(this._room.top - this.top());
    var right = Math.abs(this.right() - this._room.right);
    var bottom = Math.abs(this.bottom() - this._room.bottom);
    var left = Math.abs(this._room.left - this.left());
    var nearest = up;
    
    if(right < nearest) {
        nearest = right;
    }
    
    if(left < nearest) {
        nearest = left;
    }
    
    if(bottom < nearest) {
        nearest = bottom;
    }
    
    switch(nearest) {
        case up:
            this._road = new Rectangle(this._room.cx(), this.top() , 1, up);
            break;
        case right:
            this._road = new Rectangle(this._room.right, this._room.cy(), right, 1);
            break;
        case bottom:
            this._road = new Rectangle(this._room.cx(), this._room.bottom + 1, 1, bottom);
            break;
        case left:
            this._road = new Rectangle(this.left() , this._room.cy(), left, 1);
            break;
    }
};

//generate a 2d array filled with BSP leaves
Generator.prototype.BSPTreeMap = function(width, height, values, hallwayStyle, maxLeafSize) {
    maxLeafSize = maxLeafSize || 13;
    values = values || [0, 1, 2, 3, 4];
    
    var leaves = [
        new BSP_Leaf(0, 0, width, height, hallwayStyle)
    ];
    
    var split = true;
    while(split === true) {
        split = false;
        
        for(var i = 0; i < leaves.length; i++) {
            var leaf = leaves[i];
            
            //if the leaf was not yet split
            if(!leaf._leftChild && !leaf._rightChild) {
                
                //if this Leaf is too big or 75% chance
                if(leaf._width > maxLeafSize || leaf._height > maxLeafSize || Math.rand(1, 100) > 25) {
                    split = leaf.split();
                    if(split) {
                        leaves.push(leaf._leftChild);
                        leaves.push(leaf._rightChild);
                    }
                }
            }
        }
    }
    
    //create rooms
    for(var i = 0; i < leaves.length; i++) {
        leaves[i].createRoom();
    }
    
    //create map array
    var map = [];
    for(var x = 0; x < width; x++) {
        map[x] = [];
        for(var y = 0; y < height; y++) {
            map[x][y] = values[0];
        }
    }

    for(var i = 0; i < leaves.length; i++) {
        var leaf = leaves[i];
        
        if(leaf.style() == BSP_STYLE.city) {
            for(var x = leaf.left(); x <= leaf.right(); x ++) {
                for(var y = leaf.top(); y <= leaf.bottom(); y++) {
                    if(x == leaf.left() || x == leaf.right() ||
                       y == leaf.top()  || y == leaf.bottom()) {
                        map[x][y] = values[1];
                    }
                }
            }            
        } else {
            var halls = leaf.halls();
            if(halls.length > 0) {
                for(var j = 0; j < halls.length; j++) {
                    var hall = halls[j];
                    for(var x = hall.left; x <= hall.right; x++) {
                        for(var y = hall.top; y <= hall.bottom; y++) {
                            map[x][y] = values[1];
                        }
                    }
                }
            }
        }
        
        //draw room
        var room = leaf.getRoom();
        if(room) {
            for(var x = room.left; x <= room.right; x ++) {
                for(var y = room.top; y <= room.bottom; y++) {
                    
                    if(leaf.style() == BSP_STYLE.city && 
                       (x == room.left || x == room.right ||
                        y == room.top  || y == room.bottom)) {
                        
                        map[x][y] = values[3];
                    } else {
                        map[x][y] = values[2];
                    }
                }
            }
            
            var road = leaf.road();
            if(road) {
                for(var x = road.left; x <= road.right; x++) {
                    for(var y = road.top; y <= road.bottom; y++) {
                        
                        map[x][y] = values[1];
                        
                        if(map[x][y - 1] == values[3] && 
                           (map[x - 1][y - 1] == values[3] || 
                            map[x + 1][y - 1] == values[3])) {
                            
                            map[x][y]     = values[2];
                            map[x][y - 1] = values[2];
                            
                        } 
                    }
                }
            }
        } 
    }
    
    return map;
};

//==============================================================================
// ** Utilities
//==============================================================================
var currentFowTile = 0;

Game_Map.prototype.getMapName = function(mapId) {
    return 'Map%1'.format((mapId || this.mapId()).padZero(3));
};

Game_Map.prototype.isMapRandom = function(mapId) {
    if(mapId) {
        return $gameTemp._mapInfos[(mapId)].name.indexOf('$') == 0;
    }
    
    return this.mapId() > 0 && $gameTemp._mapInfos[this.mapId()].name.indexOf('$') == 0;
};

Game_Map.prototype.copyEvent = function(sx, sy, dx, dy, place, sourceMap) {
    var dataMap = typeof sourceMap == 'object' ? sourceMap : JSON.parse($fs.readFileSync((this.dataDir() + 'Map%1.json'.format(sourceMap.padZero(3))), 'utf8'));
    var data    = null;

    dataMap.events.forEach(function(evt) {
        if(evt && evt.x == sx && evt.y == sy) {
            data = JSON.makeDeepCopy(evt);
        }
    });

    if(!data || data.length < 1) {
        return;
    }

    data.eventId = $dataMap.events.length;
    data.id = data.eventId;
    data.x = dx;
    data.y = dy;
    
    $dataMap.events[data.eventId] = data;
    
    //clear the self switches when generating a map
    if(DataManager._btrNewMapId) {
        var switches = ['A', 'B', 'C', 'D'];

        for(var i = 0; i < switches.length; i++) {
            $gameSelfSwitches.setValue([DataManager._btrNewMapId, data.eventId, switches[i]], false);
        }
    }
    
    if(place) {
        this.placeEvent(data);
    }
};

Game_Map.prototype.placeEvent = function(mapId, data) {
    var event = new Game_Event(mapId, data.eventId);
    var sprite = new Sprite_Character(event);

    SceneManager._scene._spriteset._characterSprites.push(sprite);
    SceneManager._scene._spriteset._tilemap.addChild(sprite);

    this._events[data.eventId] = event;
    
    return event;
};

//get the tile id inside the resource map data
Game_Map.prototype.loadedTileId = function(x, y, z) {
    return this._resourceMap.data[(z * this._resourceMap.height + y) * this._resourceMap.width + x] || 0;
};

Game_Map.prototype.tileIndex = function(x, y, z) {
    return (z * this.height() + y) * this.width() + x;
}

//==============================================================================
// ** Data object
//==============================================================================
var mapCore_game_temp_initialize = Game_Temp.prototype.initialize;
Game_Temp.prototype.initialize = function() {
    mapCore_game_temp_initialize.call(this);
    this.initializeMapCache();
};
    
Game_Temp.prototype.initializeMapCache = function() {
    this._cacheData = [];
    this._isGeneratedMap = [];
    this._exploredMaps = [];
    this._mapInfos = File.loadData('MapInfos');
};
    
Game_Temp.prototype.cacheData = function(resetEvents) {
    if($dataMap) {
        
        $gameTemp._isPushing = !resetEvents;
        
        if(resetEvents) {
            var switches = ['A', 'B', 'C', 'D'];
            
            $dataMap.events.forEach(function(evt) {
                
                if(evt && evt.meta.reset) {
                    
                    for(var i = 0; i < switches.length; i++) {
                        $gameSelfSwitches.setValue([$gameMap.mapId(), evt.eventId, switches[i]], false);
                    }
                    
                }
                
            });
        }
        
        $gameTemp._cacheData[$gameMap.mapId()] = JSON.makeDeepCopy($dataMap);
    }
};

Game_Map.prototype.loadMap = function(mapId) {    
    var mapName = this.getMapName(mapId);
    
    var initializeMap = function() {
        
        //generated mas already defines the fow layer
        if($gameMap.isMapRandom(mapId)) {
            $gameMap.generateMap();   
            $gameTemp._isGeneratedMap[mapId] = true;         
            
        } else {
            
            //defines the fow layer
            for(var x = 0; x < $dataMap.width; x++) {
                for(var y = 0; y < $dataMap.height; y++) {
                    $dataMap.data[$gameMap.tileIndex(x, y, 7)] = !$dataMap.meta.fow;
                }
            }
        }
    };
       
    //temporary cache - scene transitions
    if($gameTemp._cacheData[mapId]) {
        
        if($dataMap.meta.regenerate && !$gameTemp._isPushing) {
            initializeMap();
        
        } else {
            $dataMap = JSON.makeDeepCopy($gameTemp._cacheData[mapId]);
            delete $gameTemp._cacheData[mapId];
        }
            
        
    //reloading or $gameTemp is clear
    } else if($fs.existsSync(File.fileDir() + mapName + '.json')) { 
        $dataMap = File.loadFile(mapName);
        
    //first attempt
    } else {        
        initializeMap();
    }
    
    $gameTemp._exploredMaps[mapId] = mapId;
    currentFowTile = $dataMap.meta.fowtile;
};

var mapCore_game_system_onBeforeSave = Game_System.prototype.onBeforeSave;
Game_System.prototype.onBeforeSave = function() {
    mapCore_game_system_onBeforeSave.call(this);
    
    var mId = $gameMap.mapId();
    
    if($gameMap.isMapRandom() && $gameTemp._cacheData[mId]) {
        $gameTemp._cacheData[mId]._entrance.x = $gamePlayer.x;
        $gameTemp._cacheData[mId]._entrance.y = $gamePlayer.y;
        $gameTemp._cacheData[mId]._entranceSide = $gamePlayer.reverseDir($gamePlayer.direction());
    }
    
    $gameTemp._exploredMaps.forEach(function(mapId) {
        File.saveFile($gameTemp._cacheData[mapId], $gameMap.getMapName(mapId));
    });
};

var mapCore_sceneGameover_start = Scene_Gameover.prototype.start;
Scene_Gameover.prototype.start = function() {
    $gameTemp.initializeMapCache();
    this.centerSprite(this._backSprite);
    mapCore_sceneGameover_start.call(this);
};

Scene_Map.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    
    this._transfer = $gamePlayer.isTransferring();
    
    var mapId = $gameMap.mapId();
    
    if(this._transfer) {
        mapId = $gamePlayer.newMapId();
        $gameTemp.cacheData(true);
    }
    
    DataManager.loadMapData(mapId);
};

var mapCore_sceneManager_push = SceneManager.push;
SceneManager.push = function(sceneClass) {
    $gameTemp.cacheData();
    mapCore_sceneManager_push.call(this, sceneClass);
};

DataManager.loadMapData = function(mapId) {
    
    if (mapId > 0) {
        var filename = 'Map%1.json'.format(mapId.padZero(3));
        
        this._btrNewMapId = mapId;
        this.loadDataFile('$dataMap', filename);
        
    } else {
        this.makeEmptyMap();
    }
};
    
DataManager.loadDataFile = function(name, src) {
    var xhr = new XMLHttpRequest();
    var url = 'data/' + src;
    
    xhr.open('GET', url);
    xhr.overrideMimeType('application/json');
    
    xhr.onload = function() {
        if (xhr.status < 400) {
            window[name] = JSON.parse(xhr.responseText);
            DataManager.onLoad(window[name]);
            if(name == '$dataMap') {
                $gameMap.loadMap(DataManager._btrNewMapId);
                delete DataManager._btrNewMapId;
            } 
        }
    };
    
    xhr.onerror = function() {
        DataManager._errorUrl = DataManager._errorUrl || url;
    };
    
    window[name] = null;
    
    xhr.send();
};

//==============================================================================
// ** Player transfer
//==============================================================================
var mapCore_game_player_reserveTransfer = Game_Player.prototype.reserveTransfer;
Game_Player.prototype.reserveTransfer = function(mapId, x, y, d, fadeType) {
    
    if($gameMap.mapId() != mapId) {
        Graphics._loadingCount = 60;
        Graphics.updateLoading();
    }
    
    mapCore_game_player_reserveTransfer.call(this, mapId, x, y, d, fadeType);
};  
    
Game_Player.prototype.performTransfer = function() {
    if(this.isTransferring()) {   
        
        if (this._newMapId !== $gameMap.mapId() || this._needsMapReload) {
            $gameMap.setup(this._newMapId);
            this._needsMapReload = false;
        }
        
        if($gameMap.isMapRandom()) {
            this._newX          = $dataMap._entrance.x;
            this._newY          = $dataMap._entrance.y;
            this._newDirection  = this.reverseDir($dataMap._entranceSide);    
        }
        
        this.locate(this._newX, this._newY);
        this.setDirection(this._newDirection);
        this.refresh();
        this.clearTransferInfo();
        
        Graphics.endLoading();
    }
};

//==============================================================================
// ** Fog of war
//==============================================================================
Game_CharacterBase.prototype.underHidden = function(value) {
    return !$gameMap.tileId(this.x, this.y, 7);
};

var mapCore_game_characterBase_isTransparent = Game_CharacterBase.prototype.isTransparent;
Game_CharacterBase.prototype.isTransparent = function() {
    return mapCore_game_characterBase_isTransparent.call(this) || this.underHidden();
};

var mapCore_game_map_updateScroll = Game_Map.prototype.updateScroll;
Game_Map.prototype.updateScroll = function() {
    mapCore_game_map_updateScroll.call(this);
    this.refreshFow();
};

Game_Map.prototype.refreshFow = function() {
    if($dataMap.meta.fow) {
        var px = $gamePlayer.x;
        var py = $gamePlayer.y;
        var radius = $dataMap.meta.fowrange;
        var midRadius = Math.ceil(radius / 2);

        if(!radius) {
            throw new Error('The map does not have a <fowrange> meta data');
        }
        
        //reveal front
        switch($gamePlayer.direction()) {
            case 8: //up
                for(var x = (px - midRadius); x <= (px + midRadius); x++) {
                    
                    if(x >= 0 && x < this.width()) {
                        
                        for(var y = (py - radius); y <= py; y++)   {
                            
                            if(y >= 0 && y < this.height() && 
                               
                               ((y > (py - radius)) || 
                                (x > (px - midRadius) && x < (px + midRadius) && y == (py - radius)))) {
                                    
                                $dataMap.data[this.tileIndex(x, y, 7)] = true;
                                
                            }
                        }
                    }
                }
                break;
                
            case 6: //right
                for(var x = px; x <= (px + radius); x++) {
                    
                    if(x >= 0 && x < this.width()) {
                        
                        for(var y = (py - midRadius); y <= (py + midRadius); y++)   {
                            
                            if(y >= 0 && y < this.height() && 
                               
                               ((x < (px + radius)) ||
                                (y > (py - midRadius) && y < (py + midRadius) && x == (px + radius)))) {
                                    
                                $dataMap.data[this.tileIndex(x, y, 7)] = true;
                            }
                        }
                    }
                }
                break;
                
            case 2: //down
                for(var x = (px - midRadius); x <= (px + midRadius); x++) {
                    
                    if(x >= 0 && x < this.width()) {
                        
                        for(var y = py; y <= (py + radius); y++)   {
                            
                            if(y >= 0 && y < this.height() && 
                               
                               ((y < (py + radius)) || 
                                (x > (px - midRadius) && x < (px + midRadius) && y == (py + radius)))) {
                                    
                                $dataMap.data[this.tileIndex(x, y, 7)] = true;
                            }
                        }
                    }
                }
                break;
                
            case 4: //left
                for(var x = (px - radius); x <= px; x++) {
                    
                    if(x >= 0 && x < this.width()) {
                        
                        for(var y = (py - midRadius); y <= (py + midRadius); y++)   {
                            
                            if(y >= 0 && y < this.height() && 
                               
                               ((x > (px - radius)) ||
                                (y > (py - midRadius) && y < (py + midRadius) && x == (px - radius)))) {
                                    
                                $dataMap.data[this.tileIndex(x, y, 7)] = true;
                            }
                        }
                    }
                }
                break;
        }
        
        if(!this.isScrolling()) {
            SceneManager._scene._spriteset._tilemap.refresh();
        }
    }  
};

var mapCore_scene_map_isReady = Scene_Map.prototype.isReady;
Scene_Map.prototype.isReady = function() {
    var isReady = mapCore_scene_map_isReady.call(this);
    
    if(isReady) {
        $gameMap.refreshFow();
    }  
    
    return isReady;
};

Tilemap.prototype._readMapData = function(x, y, z) {
    if(this._mapData) {
        var width = this._mapWidth;
        var height = this._mapHeight;
        
        if (this.horizontalWrap) {
            x = x.mod(width);
        }
        
        if (this.verticalWrap) {
            y = y.mod(height);
        }
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
            
            if(this._mapData[(7 * height + y) * width + x]) {
                return this._mapData[(z * height + y) * width + x] || 0;
            } 
            
            return currentFowTile;
            
        }
    }
    
    return 0;
};

//==============================================================================
// ** Auto tiles
//==============================================================================
Game_Map.prototype.autotileEdge = function(autotile, x, y, z) {
    if(this.isLoopHorizontal()) {
        x = x % this.width();
    }
    if(this.isLoopVertical()) {
        y = y % this.height();
    }

    return this.isValid(x, y) && autotile != this.autotileType(x, y, z);
};

Game_Map.prototype.autotileWallEdge = function(autotile, x, y, z) {
    var same = this.autotileEdge(autotile, x, y, z);
    if(same && this.autotileType(x, y, z) + 8 == autotile) {
        return false;
    }
    return same;
};

Game_Map.prototype.getAutotileTileId = function(autotile, index) {
    return 2048 + (48 * autotile) + index;
};

Game_Map.prototype.getAutotileGroup = function(autotile) {
    if(!autotile) {
        return 0;
    }
    if( autotile == 5  || autotile == 7  ||
        autotile == 9  || autotile == 11 ||
        autotile == 13 || autotile == 15) {
        return 2 ;
    }
    if(autotile >= 48 && autotile <= 79) {
        return 1 ;
    }
    if(autotile >= 88 && autotile <= 95) {
        return 1;
    }
    if(autotile >= 104 && autotile <= 111) {
        return 1;
    }
    if(autotile >= 120 && autotile <= 127) {
        return 1;
    }
    return 0;
};

Game_Map.prototype.waterfallAutotileIndex = function(l, r) {
    var edge = 0;
    if(l) {
        edge += 1;
    }
    if(r) {
        edge += 2;
    }
    return edge;
};

Game_Map.prototype.wallTopAutotileIndex = function(u, d, l, r) {
    var edge = 0;
    if(l) {
        edge += 1;
    }
    if(u) {
        edge += 2;
    }
    if(r) {
        edge += 4;
    }
    if(d) {
        edge += 8;
    }
    return edge;
};

Game_Map.prototype.normalAutotileIndex = function(u, d, l, r, ul, ur, dl, dr) {
    var edge = 0;
    if(l) {
        edge += 1;
    }
    if(u) {
        edge += 2;
    }
    if(r) {
        edge += 4;
    }
    if(d) {
        edge += 8;
    }
    var corner = 0;
    switch(edge) {
        case 0:
            if(ul) {
                corner += 1;
            }
            if(ur) {
                corner += 2;
            }
            if(dr) {
                corner += 4;
            }
            if(dl) {
                corner += 8;
            }
            return corner;
        case 1:
            if(ur) {
                corner += 1;
            }
            if(dr) {
                corner += 2;
            }
            return 16 + corner;
        case 2:
            if(dr) {
                corner += 1;
            }
            if(dl) {
                corner += 2;
            }
            return 20 + corner;
        case 4:
            if(dl) {
                corner += 1;
            }
            if(ul) {
                corner += 2;
            }
            return 24 + corner;
        case 8:
            if(ul) {
                corner += 1;
            }
            if(ur) {
                corner += 2;
            }
            return 28 + corner;
        case 5:
            return 32;
        case 10:
            return 33;
        case 3:
            return dr ? 35 : 34;
        case 6:
            return dl ? 37 : 36;
        case 12:
            return ul ? 39 : 38;
        case 9:
            return ur ? 41 : 40;
        case 7 :
            return 42;
        case 11:
            return 43;
        case 13:
            return 44;
        case 14:
            return 45;
        case 15:
            return 46;
        default:
            return 47;
    }
};

Game_Map.prototype.updateAutotile = function(x, y, z) {
    var autotile = this.autotileType(x, y, z);
    
    if(autotile < 0) {
        return;
    }
    
    var index = 0;
    var autoTileGroup = this.getAutotileGroup(autotile);
    
    switch(autoTileGroup) {
        case 2:
            var l = this.autotileEdge(autotile, x - 1, y, z);
            var r = this.autotileEdge(autotile, x + 1, y, z);
            index = this.waterfallAutotileIndex(l, r);
            break;
        case 1:
            var l = this.autotileWallEdge(autotile, x - 1, y, z);
            var r = this.autotileWallEdge(autotile, x + 1, y, z);
            var u = this.autotileEdge(autotile, x, y - 1, z);
            var d = this.autotileEdge(autotile, x, y + 1, z);
            index = this.wallTopAutotileIndex(u, d, l, r);
            break;
        case 0:
            var l = this.autotileEdge(autotile, x - 1, y, z);
            var r = this.autotileEdge(autotile, x + 1, y, z);
            var u = this.autotileEdge(autotile, x, y - 1, z);
            var d = this.autotileEdge(autotile, x, y + 1, z);
            var ul = this.autotileEdge(autotile, x - 1, y - 1, z);
            var ur = this.autotileEdge(autotile, x + 1, y - 1, z);
            var dl = this.autotileEdge(autotile, x - 1, y + 1, z);
            var dr = this.autotileEdge(autotile, x + 1, y + 1, z);
            index = this.normalAutotileIndex(u, d, l, r, ul, ur, dl, dr);
            break;
    }
    
    $dataMap.data[this.tileIndex(x, y, z)] = this.getAutotileTileId(autotile, index);
};

Game_Map.prototype.updateAllAutoTiles = function() {
    for(var i = 0; i < this.width(); i++) {
        for(var j = 0; j < this.height(); j++) {
            for(var k = 0; k < 6; k++) {
                this.updateAutotile(i, j, k);
            }
        }
    }
};
//---

Game_Map.prototype.fixBlockTiles = function(top, base) {
    
    //probably cant handle the autotiles well if taller
    //the auto tile functions need improvement
    var baseHeight = 1; //Math.rand(1, 3);

    for(var i = 0; i < this.width(); i++) {
        for(var j = 0; j <= this.height(); j++) {

            if( this._map[i][j] == top &&
                this._map[i][j + 1] != top &&
                this._map[i][j + 1] != base) {

                var count = 0;
                var tBase = baseHeight;

                //base y axis
                for(var k = (j + 1); k <= (j + tBase); k++) {

                    if(count < tBase && k < this.height()) {

                        if( this._map[i][j + 1] != top &&
                            this._map[i][j + 1] != base) {
                            
                            this._map[i][k] = base;
                        }

                        count++;

                        if(this._map[i][k + 1] == top) {
                            this._map[i][k] = top;
                            tBase++;
                        }
                    }
                }
            }
        }
    }
};

//==============================================================================
// ** Drawing
//==============================================================================
//simple path find for drawing roads
Game_Map.prototype.findPath = function(start, end, passableTiles) {
    if(!passableTiles) {
        throw new Error('btr_map_core: Passable tiles not informed on findPath');
    }
    
    var self = this;
    var index = 0;
    var closed = [];
    
    var open = [{
        'square'       : start,
        'parent'       : null,
        'distanceEnd'  : Math.abs(end.x - start.x) + Math.abs(end.y - start.y),
        'distanceStart': 0
    }];
    
    var isClosed = function(square) {
        for(var i = 0; i < closed.length; i++) {
            var current = closed[i].square;
            if(current.x == square.x && current.y == square.y) {
                return true;
            }
        }
        return false;
    };
    
    var checkOpen = function(square) {
        for(var i = 0; i < open.length; i++) {
            var current = open[i].square;
            if(current.x == square.x && current.y == square.y) {
                return {isOpen: true, index: i};
            }
        }
        return {isOpen: false, index: -1};
    };
    
    var isValid = function(square) {
        var validSquare = self._map[square.x] ? true : null;
        var passable = null;
        
        if(validSquare) {
            for(var i = 0; i < passableTiles.length; i++) {
                if(self._map[square.x][square.y] == passableTiles[i]) {
                    passable = true;
                }
            }
        }
        
        return validSquare && passable;
    };

    var addPoint = function(square, parent) {
        if(isValid(square) && !isClosed(square)) {
            var ret = checkOpen(square);
            
            if(ret.isOpen) {
                if(parent.distanceStart < open[ret.index].distanceStart) {
                    open[ret.index].parent = parent;
                }
                
            } else {
                open.push({
                    'square'       : square,
                    'parent'       : parent,
                    'distanceEnd'  : Math.abs(end.x - square.x) + Math.abs(end.y - square.y),
                    'distanceStart': Math.abs(start.x - square.x) + Math.abs(start.y - square.y)
                });
            }
            
        }
    };
    
    var checkAdj = function(index) {
        var point = open[index];
        
        if(point.square.x == end.x && point.square.y == end.y) {
            return point;
        }
        
        //up
        addPoint(new Point(point.square.x, point.square.y - 1), point);
        
        //right
        addPoint(new Point(point.square.x + 1, point.square.y), point);
        
        //down
        addPoint(new Point(point.square.x, point.square.y + 1), point);
        
        //left
        addPoint(new Point(point.square.x - 1, point.square.y), point); 
        
        closed.push(point);
        open.splice(index, 1);
        
        if(open.length > 0) {
            var nextIndex = 0;
            
            for(var i = 0; i < open.length; i++) {
                if((open[i].distanceStart + open[i].distanceEnd) < 
                   (open[nextIndex].distanceStart + open[nextIndex].distanceEnd)) {
                    
                    nextIndex = i;
                }
            }
            
            return checkAdj(nextIndex);
        }

        return closed[0];
    };
    
    return checkAdj(0);    
};
    
Game_Map.prototype.drawPath = function(path, pathTile, exclude) {
    var self = this;
    
    var isValid = function(square) {
        var valid = self._map[square.x] ? true : null;
        var passable = true;
        
        if(valid) {
            for(var i = 0; i < exclude.length; i++) {
                if(self._map[square.x][square.y] == exclude[i]) {
                    passable = false;
                }
            }
        }
        
        return valid && passable;
    };
    
    exclude = exclude || [];
    
    while(path.parent) {
        if(isValid(path.square)) {
            this._map[path.square.x][path.square.y] = pathTile;
        }
        path = path.parent;
    }

    if(isValid(path.square)) {
        this._map[path.square.x][path.square.y] = pathTile;
    }
};

Game_Map.prototype.drawMap = function() {
    for(var i = 0; i < this._names.length; i++) {
        this._places[this._names[i]] = [];
    }
    
    for(var x = 0; x < this.width(); x++) {
        for(var y = 0; y < this.height(); y++) {
            var name = eval('$gameMap.tileName' + $dataMap.meta.type.upperFirst() + '(x, y)')

            this._places[name].push({x: x, y: y});
            
            for(var z = 0; z < 6; z++) {
                $dataMap.data[this.tileIndex(x, y, z)] = this._tiles[name][z];
            }
            
            $dataMap.data[this.tileIndex(x, y, 7)] = !$dataMap.meta.fow;
        }
    }  
};
    
Game_Map.prototype.castShadows = function(top, base) {
    for(var i = 1; i < this.width(); i++) {
        for(var j = 0; j < this.height(); j++) {
            
            var condition = this._map[i][j] != top && this._map[i][j] != base && 
                            (this._map[i - 1][j] == top || this._map[i - 1][j] == base);
            
            if(j > 0) {
                condition = condition && this._map[i - 1][j - 1] == top;
            }
            
            if(condition) {
                $dataMap.data[this.tileIndex(i, j, 4)] = 5;
            }
        }
    }
};

Game_Map.prototype.buildCache = function() {
    if(!$dataMap.meta.type) {
        throw new Error('Map type undefined');
    }
    
    this._resourceMap = JSON.makeDeepCopy($dataMap);
    this._generator = new Generator();
    this._map = []; 
    this._skip = $dataMap.meta.skip || []; 
    this._names = [];
    this._places = {};
    this._values = {};
    this._tiles = {};
    this._events = [];
    this._randomEvents = {};
    this._sideOfEvents = {};
    this._entranceEvent = {};
    this._exitEvent = {};
    
    $dataMap._entrance = {x: 0, y: 0};
    $dataMap._entranceSide = 8;
    $dataMap.events = [];
    $dataMap.data = [];
    
    for(var x = 0; x < this.width(); x++) {
        this._map[x] = [];
        for(var y = 0; y < this.height(); y++) {
            this._map[x][y] = 0;
        }
    }
    
    eval('$gameMap.buildCache' + $dataMap.meta.type.upperFirst() + '()');
};
    
Game_Map.prototype.clearCache = function() {
    delete this._resourceMap;
    delete this._generator;
    delete this._randomEvents;
    delete this._sideOfEvents;
    delete this._entranceEvent;
    delete this._exitEvent;
    delete this._map;
    delete this._skip;
    delete this._names;
    delete this._places;
    delete this._values;
    delete this._tiles;
};
    
Game_Map.prototype.generateMap = function() {  
    this.buildCache();
    this.getEvents();        
    
    eval('$gameMap.generate' + $dataMap.meta.type.upperFirst() + '()');
    
    this.spawnEvents();
    this.clearCache();
};

Game_Map.prototype.canPlaceEvent = function(meta, x, y) {
    
    //above
    for(var nx = x - meta.width; nx <= x + meta.width; nx++) {
        for(var ny = y - meta.height; ny <= y + meta.height; ny++) {
            
            var temp = $dataMap.events.filter(function(event) {
                return event.x == nx && event.y == ny;
            });
            
            if(temp.length > 0) {
                return false;
            }
        }
    }

    //top left corner on map
    var tlcX = x - Math.floor(meta.width / 2);
    var tlcY = y - (meta.height - 1);
    
    //bottom right corner on map
    var brcX = x + Math.floor(meta.width / 2);
    var brcY = y;

    //not map area
    if( tlcX < 1 || brcX >= this.width() - 1 ||
        tlcY < 1 || brcY >= this.height() - 1) {
        
        return false;
    }

    //individual rules
    return meta.sideOf || eval('$gameMap.canPlaceEvent' + $dataMap.meta.type.upperFirst() + '(meta, x, y)');
};

Game_Map.prototype.getEvents = function() { 
    this._resourceMap.events.forEach(function(evt) {

        if(evt) {
            DataManager.extractEventMetadata(evt);
            
            evt.meta.width = Number(evt.meta.width || '1');
            evt.meta.height = Number(evt.meta.height || '1');

            if(evt.meta.entrance) {
                this._entranceEvent = evt;

            } else if(evt.meta.exit) {
                this._exitEvent = evt;

            } else if(evt.meta.sideOf) {
                var e = evt.meta.sideOf.split(',');
                
                if(typeof e === 'string') {

                    this._sideOfEvents[e] = this._sideOfEvents[e] | {};
                    this._sideOfEvents[e][(Math.rand(1, 4) * 2)] = evt;

                } else {

                    this._sideOfEvents[e[0]] = this._sideOfEvents[e[0]] || {};
                    this._sideOfEvents[e[0]][e[1]] = evt;
                }

            } else if(evt.meta.tile) {                
                this._randomEvents[evt.meta.tile] = this._randomEvents[evt.meta.tile] || [];
                this._randomEvents[evt.meta.tile].push(evt);
            }
            
        }
    }, this);
    
};
    
Game_Map.prototype.spawnEvents = function() {

    //transition events
    if(this._entranceEvent) {
        this.copyEvent(this._entranceEvent.x, this._entranceEvent.y, $dataMap._entrance.x, $dataMap._entrance.y, false, this._resourceMap);
    }
    
    if(this._exitEvent) {
        this.copyEvent(this._exitEvent.x, this._exitEvent.y, $dataMap._exit.x, $dataMap._exit.y, false, this._resourceMap);
    }
    //---
    
    var newPos = function(metaA, metaB, pos, d) {        
        switch(d) {
            case 2:
                return {x: pos.x, y: (pos.y + 1 + metaA.height + metaB.height)};
                break;
                
            case 4:
                return {x: (pos.x - 1 - metaA.width - metaB.width), y: pos.y};
                break;
                
            case 6:
                return {x: (pos.x + 1 + metaA.width + metaB.width), y: pos.y};
                break;
                
            case 8:
                return {x: pos.x, y: (pos.y - 1 - metaA.height - metaB.height)};
                break;
        }
        
    };
    
    var places = this._places;

    //better order for spawning
    this._names.sort(function(a, b) {
        if(places[a]) {
            return places[b] ? (places[a].length - places[b].length) : -1;
        }
        
        return places[b] ? 1 : 0;
    }, this);
    
    this._names.forEach(function(name) {        
        var eventList = this._randomEvents[name];
        
        if(eventList) {
            
            //better order for spawning
            eventList.sort(function(a, b) {
                return a.meta.min ? -1 : (b.meta.min ? 1 : 0);
            })
            
            eventList.forEach(function(evt) {
                evt.meta.spawned = 0;

                var sideEvents = this._sideOfEvents[evt.id] || this._sideOfEvents[evt.name];
                places = this._places[name].slice();
                
                if(evt.meta.min) {
                    evt.meta.min *= 1;

                    while(places.length && evt.meta.spawned < evt.meta.min) {
                        var sp = false;
                        var pos = {};
                        var index = 0;

                        while(!sp) {
                            index = Math.rand(0, (places.length - 1));
                            pos = places[index];
                            sp = this.canPlaceEvent(evt.meta, pos.x, pos.y);

                            if(!sp) {

                                if(places.length < 1) {
                                    return false;
                                }
                            }
                        }

                        places.splice(index, 1);

                        this.copyEvent(evt.x, evt.y, pos.x, pos.y, false, this._resourceMap);

                        if(sideEvents) {
                            for(var d = 2; d < 9; d += 2) {
                                var e = sideEvents[d];

                                if(e) {
                                    var p = newPos(evt.meta, e.meta, pos, d);

                                    if(this.canPlaceEvent(e.meta, p.x, p.y)) {
                                        this.copyEvent(e.x, e.y, p.x, p.y, false, this._resourceMap);
                                    }
                                }

                            }
                        }

                        evt.meta.spawned++;  
                    }
                }    

                if(evt.meta.max) {

                    //this cast is probably not needed as of the $cast function on btr_core
                    //needs testing
                    evt.meta.max *= 1;
                    evt.meta.rate *= 1;

                    while(places.length && evt.meta.spawned < evt.meta.max) {

                        var sp = false;
                        var pos = {};
                        var index = 0;

                        while(!sp) {
                            index = Math.rand(0, (places.length - 1));
                            pos = places[index];
                            sp = this.canPlaceEvent(evt.meta, pos.x, pos.y);

                            if(!sp) {

                                if(places.length < 1) {
                                    return false;
                                }
                            }
                        }

                        places.splice(index, 1);

                        //this is not really accurate as it is for tile, keep in mind
                        if(Math.rand(1, 100) <= Math.floor(evt.meta.rate)) {

                            this.copyEvent(evt.x, evt.y, pos.x, pos.y, false, this._resourceMap);

                            if(sideEvents) {
                                for(var d = 2; d < 9; d += 2) {
                                    var e = sideEvents[d];

                                    if(e) {
                                        var p = newPos(evt.meta, e.meta, pos, d);

                                        if(this.canPlaceEvent(e.meta, p.x, p.y)) {
                                            this.copyEvent(e.x, e.y, p.x, p.y, false, this._resourceMap);
                                        }
                                    }

                                }
                            }

                        }

                        evt.meta.spawned++;  
                    }

                } else {
                    evt.meta.rate *= 1;

                    places.forEach(function(pos) {

                        if(this.canPlaceEvent(evt.meta, pos.x, pos.y) && Math.rand(1, 100) <= Math.floor(evt.meta.rate)) {

                            this.copyEvent(evt.x, evt.y, pos.x, pos.y, false, this._resourceMap);

                            if(sideEvents) {
                                for(var d = 2; d < 9; d += 2) {
                                    var e = sideEvents[d];

                                    if(e) {
                                        var p = newPos(evt.meta, e.meta, pos, d);

                                        if(this.canPlaceEvent(e.meta, p.x, p.y)) {
                                            this.copyEvent(e.x, e.y, p.x, p.y, false, this._resourceMap);
                                        }
                                    }

                                }
                            }

                        }
                    }, this);
                }  
                
            }, this);
            
        }
        
    }, this);
        
};

//==============================================================================
// ** Grid mode
//==============================================================================
var mapCore_game_player_updateScroll = Game_Player.prototype.updateScroll;
Game_Player.prototype.updateScroll = function(lastScrolledX, lastScrolledY) {
    var x = this.scrolledX();
    var y = this.scrolledY();
    var sx = Math.round(SceneManager._boxWidth / $gameMap.tileWidth());
    var sy = Math.round(SceneManager._boxHeight / $gameMap.tileHeight());
    var speedX = Math.round($gameMap.tileWidth() / 8);
    var speedY = Math.round($gameMap.tileHeight() / 8);
 
    if($dataMap.meta.grid){
        
        //right border
        if(x >= sx) {
            $gameMap.startScroll(6, sx, speedX);
        };
        
        //left border
        if(x < -0.5) {
            $gameMap.startScroll(4, sx, speedX);
        };
        
        //bottom border
        if(y >= sy) {
            $gameMap.startScroll(2, sy, speedY);
        };
        
        //top border
        if(y < -0.5) {
            $gameMap.startScroll(8, sy, speedY);
        };
        
    }else{
        mapCore_game_player_updateScroll.call(this, lastScrolledX, lastScrolledY);
    };
};
 
var mapCore_game_player_canMove = Game_Player.prototype.canMove;
Game_Player.prototype.canMove = function() {
    return (mapCore_game_player_canMove.call(this) && !$gameMap.isScrolling());
}; 

var mapCore_game_vehicle_canMove = Game_Vehicle.prototype.canMove;
Game_Vehicle.prototype.canMove = function() {
    return (mapCore_game_vehicle_canMove.call(this) && !$gameMap.isScrolling());
};
 
var mapCore_game_map_setDisplayPos = Game_Map.prototype.setDisplayPos;
Game_Map.prototype.setDisplayPos = function(x, y) {
    if($dataMap.meta.grid){
        var sx = Math.floor(SceneManager._boxWidth / $gameMap.tileWidth());
        var sy = Math.floor(SceneManager._boxHeight / $gameMap.tileHeight());
        
        var gridX = Math.floor($gamePlayer._newX / sx);
        var gridY = Math.floor($gamePlayer._newY / sy);
        
        this._displayX = (gridX * sx);
        this._displayY = (gridY * sy);
        
        this._parallaxX = this._displayX;
        this._parallaxY = this._displayY;
        
    }else{
        mapCore_game_map_setDisplayPos.call(this, x, y);   
    };
};

//==============================================================================
// ** Interpreter
//==============================================================================
Game_Interpreter.prototype.refreshEntrance = function() {
    $dataMap._entrance = {x: $gamePlayer.x, y: $gamePlayer.y};
    $dataMap._entranceSide = $gamePlayer.direction();
};
    
var mapCore_game_interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand
Game_Interpreter.prototype.pluginCommand = function(command, args) {
  	mapCore_game_interpreter_pluginCommand.call(this, command, args);

    command = command.toLowerCase();
  	if(command === 'map' && args[0]) {
        var option = args[0].toLowerCase();
        switch (option) {
            case 'refreshentrance':    //map refreshentrance
                this.refreshEntrance();
                break;
        }
    }
};