/*
    LittleJS JS13K Starter Game
    - For size limited projects
    - Includes all core engine features
    - Builds to 7kb zip file
*/

'use strict';

// game variables
let backgroundMusic;
let backgroundMusicVolume = 0.1;

// WebGL can be removed to save ~963 bytes - see "Disabling WebGL" in README.md

///////////////////////////////////////////////////////////////////////////////
async function gameInit() {
  await loadLevel(1);
  initWorldCamera();
  background.updatePos(cameraPos);
  foreground.updatePos(cameraPos);
  gravity.y = -0.01;

  backgroundMusic = new ZzFXMusic(THEME);
  backgroundMusic.playMusic(backgroundMusicVolume, true);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  worldScale = min(mainCanvasSize.x / VIEW_WIDTH, mainCanvasSize.y / VIEW_HEIGHT);
  updateWorldCamera();
  updateLevelEvent();
  background.updatePos(cameraPos);
  foreground.updatePos(cameraPos);
  if (backgroundMusic) {
    backgroundMusic.setVolume(backgroundMusicVolume);
  }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
  // TODO
  // drawTile(player.pos.add(vec2(2, 0)), vec2(1.6, 0.7).multiply(vec2(5)), tile(0, vec2(16, 7), TEXTURE_INDEX_CLOUD, 0));
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // TODO
  drawTextScreen('Rainbow Defense', vec2(mainCanvasSize.x / 2, worldScale * 2.2), worldScale * 2.5);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
setCanvasFixedSize(vec2(VIEW_WIDTH, VIEW_HEIGHT));
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, IMAGE_SOURCES);
