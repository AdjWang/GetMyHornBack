/*
    LittleJS JS13K Starter Game
    - For size limited projects
    - Includes all core engine features
    - Builds to 7kb zip file
*/

'use strict';

// game variables
let backgroundMusic;
let backgroundMusicVolume = 0.0;

// WebGL can be removed to save ~963 bytes - see "Disabling WebGL" in README.md

///////////////////////////////////////////////////////////////////////////////
async function gameInit() {
  await loadLevel(3);
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
  background.updatePos(cameraPos);
  foreground.updatePos(cameraPos);
  if (backgroundMusic) {
    backgroundMusic.setVolume(backgroundMusicVolume);
  }
  if (mouseIsDown(0)) {
    // const speed = 0.25;
    // new RainbowBeam(mousePos, undefined, speed, PRISM_TILE_DIR_RIGHT, 0, 50);
    // const pos = vec2(cameraPos.x - VIEW_WIDTH / 2, 6.5);
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
  if (currentLevel == 0) {
    const spriteColor = new Color(1, 1, 1, 0.5);
    const textColor = new Color(0, 0, 0);
    const unicornRes = createAsepriteResource(unicornAsepriteData, TEXTURE_INDEX_UNICORN, ['bag', 'body', 'head']);
    let pos1 = vec2(31, 5);
    drawAsepriteFrame(unicornRes.head[0], pos1, 1, spriteColor, PI / 2, false, false);
    drawAsepriteFrame(unicornRes.body[0], pos1, 1, spriteColor, PI / 2, false, false);
    drawTextOverlay('z', pos1.add(vec2(1.2, 0.5)), 0.5, textColor);
    drawTextOverlay('z', pos1.add(vec2(1.5, 0.8)), 0.6, textColor);
    drawTextOverlay('z', pos1.add(vec2(1.8, 1.1)), 0.7, textColor);

    const dragonPos2 = vec2(40, 5.5);
    const unicornPos2 = vec2(38, 5);
    const dragonRes = createAsepriteResource(slimeAsepriteData, TEXTURE_INDEX_SLIME, ['body', 'wing']);
    drawAsepriteFrame(dragonRes.wing[0], dragonPos2, 1, spriteColor, 0, false, false);
    drawAsepriteFrame(dragonRes.body[0], dragonPos2, 1, spriteColor, 0, false, false);
    drawAsepriteFrame(unicornRes.head[0], unicornPos2, 1, spriteColor, PI / 2, false, false);
    drawAsepriteFrame(unicornRes.body[0], unicornPos2, 1, spriteColor, PI / 2, false, false);
    // TODO
  }
  // TODO
  drawTextScreen('Rainbow Defense', vec2(mainCanvasSize.x / 2, worldScale * 2.2), worldScale * 2.5);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
setCanvasFixedSize(vec2(VIEW_WIDTH, VIEW_HEIGHT));
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, IMAGE_SOURCES);
