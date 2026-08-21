/*
    LittleJS JS13K Starter Game
    - For size limited projects
    - Includes all core engine features
    - Builds to 7kb zip file
*/

'use strict';

// game variables
let foreground;
let background;
let backgroundMusic;
let backgroundMusicVolume = 0.0;

// WebGL can be removed to save ~963 bytes - see "Disabling WebGL" in README.md

const level1 = [
4,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,5,
8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
8,0,1,2,2,2,2,2,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
8,0,6,7,7,7,7,7,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
8,0,6,7,7,7,7,7,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
8,0,6,7,7,7,7,7,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
8,0,6,7,7,7,7,7,9,2,2,2,2,2,2,2,2,2,2,2,2,3,0,0,0,0,0,0,0,6,
8,0,11,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,5,8,0,0,0,0,0,0,0,6,
8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,8,0,0,0,0,0,0,0,6,
8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,8,0,0,0,0,0,0,0,6,
8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,8,0,0,0,0,0,0,0,6,
8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,8,0,0,0,0,0,0,0,6,
8,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,0,0,0,0,11,13,0,0,0,0,0,0,0,6,
8,0,0,0,0,0,0,0,0,0,0,0,0,11,12,13,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
8,0,0,0,0,0,0,1,2,2,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
8,0,0,0,0,0,0,11,12,12,13,0,0,0,0,0,0,16,18,0,0,0,0,0,0,0,0,0,0,6,
8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,28,0,0,0,0,0,0,0,0,0,0,6,
8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
9,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,10
];

///////////////////////////////////////////////////////////////////////////////
let player;
let dragon;
let rainbowCellPreview;
let rainbowCellMousePreview;

async function gameInit() {
    // Remap scene theme.
    const sceneTheme = THEME_INDEX_CLOUD;
    await remapTilesetColor(0, sceneTheme);
    foreground = new Foreground(sceneTheme);
    background = new Background(sceneTheme);

    // Create tile collision and visible tile layer.
    initTileCollision(vec2(WORLD_WIDTH, WORLD_HEIGHT));
    const pos = vec2(0, 0);
    const tileLayer = new TileLayer(pos, tileCollisionSize);
    tileLayer.renderOrder = RENDER_ORDER_TILE_LAYER;
    for (let y = 0; y < tileCollisionSize.y; y++) {
        for (let x = 0; x < tileCollisionSize.x; x++) {
            let pos = vec2(x, tileCollisionSize.y - y - 1);
            // set tile data
            const tile_id = level1[y * WORLD_WIDTH + pos.x];
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
    // Setup camera.
    updateWorldCamera();
    // Enable gravity.
    gravity.y = -0.01;

    player = new Unicorn(vec2(20, 18));
    dragon = new Dragon(vec2(15, 18));
    rainbowCellMousePreview = new RainbowCellMousePreview;
    rainbowCellPreview = new RainbowCellPreview;

    backgroundMusic = new ZzFXMusic(BACKGROUND_MUSIC);
    backgroundMusic.playMusic(backgroundMusicVolume, true);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
    worldScale = min(mainCanvasSize.x / WORLD_WIDTH, mainCanvasSize.y / WORLD_HEIGHT);
    updateWorldCamera();
    if (backgroundMusic) {
        backgroundMusic.setVolume(backgroundMusicVolume);
    }
}

function updateWorldCamera() {
    cameraPos = vec2(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    cameraScale = worldScale;
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
    // draw to overlay canvas for hud rendering
    drawTextScreen('LittleJS JS13K Demo', vec2(mainCanvasSize.x / 2, worldScale * 2.2), worldScale * 2.5);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
setCanvasFixedSize(vec2(WORLD_WIDTH, WORLD_HEIGHT));
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, IMAGE_SOURCES);
