/*
    LittleJS JS13K Starter Game
    - For size limited projects
    - Includes all core engine features
    - Builds to 7kb zip file
*/

'use strict';

// game variables
let backgroundMusic;
let backgroundMusicVolume = 0.9;

// WebGL can be removed to save ~963 bytes - see "Disabling WebGL" in README.md

///////////////////////////////////////////////////////////////////////////////
let rainbowCellPreview;
let rainbowCellMousePreview;

async function gameInit() {
  await loadLevel(0);
  updateWorldCamera();
  gravity.y = -0.01;

  rainbowCellMousePreview = new RainbowCellMousePreview;
  rainbowCellPreview = new RainbowCellPreview;

  backgroundMusic = new ZzFXMusic(THEME);
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
