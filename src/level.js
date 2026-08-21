'use strict';

let foreground;
let background;
let tileLayer;

const LEVEL1 = [
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,1,2,2,2,2,2,2,2,2,2,2,2,3,0,0,0,0,0,0,0,0,0,0,
0,6,7,7,7,7,7,7,7,7,7,7,7,8,0,0,0,0,0,0,0,0,0,0,
0,6,7,7,7,7,7,7,7,7,7,7,7,8,0,0,0,0,0,0,0,0,0,0,
0,6,7,7,7,7,7,7,7,7,7,7,7,8,0,0,0,0,0,0,0,0,0,0,
0,11,12,12,12,12,12,12,12,12,12,12,12,13,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15
];

const START_POINT = [
  vec2(10, 18),
];

const LEVELS = [
  LEVEL1,
];

async function loadLevel(idx) {
    // Remap scene theme.
    const sceneTheme = THEME_INDEX_CLOUD;
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
            const tileIndex = tile_id - 1;
            const data = new TileLayerData(tileIndex);
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
