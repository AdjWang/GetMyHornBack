/*
    LittleJS JS13K Starter Game
    - For size limited projects
    - Includes all core engine features
    - Builds to 7kb zip file
*/

'use strict';

// sound effects
const sound_click = new Sound([1, .5]);

// game variables
let particleEmitter;
let unicornResource;
let background;

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

async function gameInit() {
    // Remap scene theme.
    const sceneTheme = THEME_INDEX_GRASS;
    await remapTilesetColor(0, sceneTheme);
    background = new Background();

    // Create tile collision and visible tile layer.
    initTileCollision(vec2(WORLD_WIDTH, WORLD_HEIGHT));
    const pos = vec2(0, 0);
    const tileLayer = new TileLayer(pos, tileCollisionSize);

    // Get level data from the tiles image.
    const tileImage = textureInfos[0].image;
    mainContext.drawImage(tileImage, 0, 0);
    const imageData = mainContext.getImageData(0, 0, tileImage.width, tileImage.height).data;

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
    tileLayer.tileInfo = tile(0, 16, 0, 0);
    tileLayer.redraw();
    // Setup camera.
    updateWorldCamera();
    // Enable gravity.
    gravity.y = -0.01;

    unicornResource = createAsepriteResource(unicornAsepriteData, 1);
    player = new Unicorn(vec2(20, 18));

    // Create particle emitter.
    particleEmitter = new ParticleEmitter(
        vec2(16, 9), 0,      // emitPos, emitAngle
        1, 0, 500, PI,      // emitSize, emitTime, emitRate, emiteCone
        tile(0, 16, 0, 1),  // tileIndex, tileSize
        new Color(1, 1, 1), new Color(0, 0, 0),   // colorStartA, colorStartB
        new Color(0, 0, 0, 0), new Color(0, 0, 0, 0), // colorEndA, colorEndB
        2, .2, .2, .1, .05, // time, sizeStart, sizeEnd, speed, angleSpeed
        .99, 1, 1, PI,      // damping, angleDamping, gravityScale, cone
        .05, .5, true, true       // fadeRate, randomness, collide, additive
    );
    particleEmitter.restitution = .3; // bounce when it collides
    particleEmitter.trailScale = 2;  // stretch in direction of motion
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
    worldScale = min(mainCanvasSize.x / WORLD_WIDTH, mainCanvasSize.y / WORLD_HEIGHT);
    updateWorldCamera();

    if (mouseWasPressed(0)) {
        // play sound when mouse is pressed
        sound_click.play(mousePos);

        // change particle color and set to fade out
        particleEmitter.colorStartA = new Color;
        particleEmitter.colorStartB = randColor();
        particleEmitter.colorEndA = particleEmitter.colorStartA.scale(1, 0);
        particleEmitter.colorEndB = particleEmitter.colorStartB.scale(1, 0);
    }

    // move particles to mouse location if on screen
    // if (mousePosScreen.x)
    //     particleEmitter.pos = mousePos;
    particleEmitter.pos = vec2(33, 15);
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
