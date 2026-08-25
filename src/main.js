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
  updateWorldCamera();
  gravity.y = -0.01;

  backgroundMusic = new ZzFXMusic(THEME);
  backgroundMusic.playMusic(backgroundMusicVolume, true);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  worldScale = min(mainCanvasSize.x / VIEW_WIDTH, mainCanvasSize.y / VIEW_HEIGHT);
  updateWorldCamera();
  if (backgroundMusic) {
    backgroundMusic.setVolume(backgroundMusicVolume);
  }
}

function updateWorldCamera() {
  if (player) {
    cameraPos = vec2(player.pos.x, VIEW_HEIGHT / 2);
    foreground.pos.x = player.pos.x;
    background.pos.x = player.pos.x;
  } else {
    cameraPos = vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
  }
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
  // TODO
  drawTextScreen('Rainbow Defense', vec2(mainCanvasSize.x / 2, worldScale * 2.2), worldScale * 2.5);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
setCanvasFixedSize(vec2(VIEW_WIDTH, VIEW_HEIGHT));
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, IMAGE_SOURCES);
