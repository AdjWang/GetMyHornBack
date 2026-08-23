'use strict';

let foreground;
let background;
let tileLayer;

const TILED_FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
const TILED_FLIPPED_VERTICALLY_FLAG = 0x40000000;
const TILED_FLIPPED_DIAGONALLY_FLAG = 0x20000000;
const TILED_TILE_ID_MASK = 0x0fffffff;

const LEVEL0 = [
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,3,2,2,2147483651,0,0,0,0,0,0,0,0,0,0,3,2,2,2147483651,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2
];

const LEVEL1 = [
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,2,2147483651,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,3,2,2,2147483651,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,2,2147483651,0,0,0,0,
0,0,3,2,2,2147483651,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,3,2,2,2147483651,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
2,2,2,2,2,2,2,2,2147483651,0,0,0,0,0,0,0,0,0,3,2,2,2,2,2
];

const START_POINT = [
  vec2(10, 18),
  vec2(10, 18),
];

const LEVELS = [
  LEVEL0,
  LEVEL1,
];

const LEVEL_THEMES = [
  THEME_INDEX_CLOUD,
  THEME_INDEX_GRASS,
];

function decodeTiledTile(gid) {
    const rawGid = gid >>> 0;
    const horizontal = !!(rawGid & TILED_FLIPPED_HORIZONTALLY_FLAG);
    const vertical = !!(rawGid & TILED_FLIPPED_VERTICALLY_FLAG);
    const diagonal = !!(rawGid & TILED_FLIPPED_DIAGONALLY_FLAG);
    const tile = (rawGid & TILED_TILE_ID_MASK) - 1;
    let direction = 0;
    let mirror = false;
    if (diagonal) {
        if (horizontal && vertical) {
            direction = 1;
            mirror = true;
        } else if (horizontal) {
            direction = 1;
        } else if (vertical) {
            direction = 3;
        } else {
            direction = 3;
            mirror = true;
        }
    } else if (horizontal && vertical) {
        direction = 2;
    } else if (horizontal) {
        mirror = true;
    } else if (vertical) {
        direction = 2;
        mirror = true;
    }
    return new TileLayerData(tile, direction, mirror);
}

async function loadLevel(idx) {
    // Remap scene theme.
    const sceneTheme = LEVEL_THEMES[idx];
    await remapTilesetColor(0, sceneTheme);
    foreground = new Foreground(sceneTheme);
    background = new Background(sceneTheme);
    // Create tile collision and visible tile layer.
    initTileCollision(vec2(WORLD_WIDTH, WORLD_HEIGHT));
    const pos = vec2(0, 0);
    tileLayer = new TileLayer(pos, tileCollisionSize);
    tileLayer.renderOrder = RENDER_ORDER_TILE_LAYER;
    for (let y = 0; y < tileCollisionSize.y; y++) {
        for (let x = 0; x < tileCollisionSize.x; x++) {
            let pos = vec2(x, tileCollisionSize.y - y - 1);
            // set tile data
            const tile_id = LEVELS[idx][y * WORLD_WIDTH + pos.x];
            if (tile_id == 0) {
                continue;
            }
            const data = decodeTiledTile(tile_id);
            tileLayer.setData(pos, data);
            setTileCollisionData(pos, 1);
        }
    }
    // Draw tile layer with new data.
    tileLayer.tileInfo = tile(0, 16, TEXTURE_INDEX_TILESET, 0);
    tileLayer.redraw();

   new Unicorn(START_POINT[idx]);
  //  new Dragon(START_POINT[idx]);
}
