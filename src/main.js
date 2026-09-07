/*
    LittleJS JS13K Starter Game
    - For size limited projects
    - Includes all core engine features
    - Builds to 7kb zip file
*/

'use strict';

// game variables
// Space seems not enough to put music in.
// let backgroundMusic;
// let backgroundMusicVolume = 0.0;

// WebGL can be removed to save ~963 bytes - see "Disabling WebGL" in README.md

///////////////////////////////////////////////////////////////////////////////
async function gameInit() {
  setGLEnable(false);
  setFontDefault('Lucida Console');
  characterRes = createAsepriteResource();
  // Actually not remaping, just copy a unremaped image out to draw savepoint with
  // original color later in map. Normal tile(...) would get the grey one in game.
  const rainbowColored = await createRemappedTextureInfo(TEXTURE_INDEX_TILESET, 0, 0);
  const rainbowGrey = await createRemappedTextureInfo(TEXTURE_INDEX_TILESET, 1, 0);
  savePointEnableTileInfo = new TileInfo(vec2(16, 23), vec2(16, 9), rainbowColored);
  savePointDisableTileInfo = new TileInfo(vec2(16, 23), vec2(16, 9), rainbowGrey);
  await loadLevel(0);
  initWorldCamera();
  background.updatePos(cameraPos);
  foreground.updatePos(cameraPos);
  gravity.y = -0.01;

  // backgroundMusic = new ZzFXMusic(THEME);
  // backgroundMusic.playMusic(backgroundMusicVolume, true);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  worldScale = min(mainCanvasSize.x / VIEW_WIDTH, mainCanvasSize.y / VIEW_HEIGHT);
  updateWorldCamera();
  background.updatePos(cameraPos);
  foreground.updatePos(cameraPos);
  // if (backgroundMusic) {
  //   backgroundMusic.setVolume(backgroundMusicVolume);
  // }
  updateLevelEvent();
}

function gameUpdatePost() {
}

function gameRender() {
}

function gameRenderPost() {
  if (currentLevel == 0) {
    const spriteColor = new Color(1, 1, 1, 0.6);
    const textColor = new Color(0, 0, 0, 0.5);

    const drawUnicorn = function (basePos, hasHorn, mirror, bodyFrame = 0) {
      const pos = basePos.add(UNICORN_DRAW_OFFSET).add(vec2(0, -0.5));
      drawAsepriteFrame(characterRes.unicorn_head[0], pos, 1, spriteColor, 0, mirror);
      if (hasHorn) {
        drawAsepriteFrame(characterRes.unicorn_horn[0], pos, 1, spriteColor, 0, mirror);
      }
      drawAsepriteFrame(characterRes.unicorn_body[bodyFrame], pos, 1, spriteColor, 0, mirror);
    };
    const drawDragon = function(basePos, hasHorn, mirror) {
      const pos = basePos.add(vec2(DRAGON_SLIME_DRAW_X_OFFSETS[0] * mirror ? 1 : -1,
                                   DRAGON_SLIME_DRAW_Y_OFFSETS[0]));
      drawAsepriteFrame(characterRes.slime_wing[DRAGON_SLIME_DRAW_BASE_FRAME], pos, 1, spriteColor, 0, mirror);
      drawAsepriteFrame(characterRes.slime_body[DRAGON_SLIME_DRAW_BASE_FRAME], pos, 1, spriteColor, 0, mirror);
      if (hasHorn) {
        const hornPos = basePos.add(DRAGON_SLIME_HORN_OFFSET).add(vec2(1.0, -1.1));
        drawAsepriteFrame(characterRes.unicorn_horn[0], hornPos, 1, spriteColor, 0, mirror);
      }
    };
    const drawSleepHint = function (basePos) {
      drawTextOverlay('z', basePos.add(vec2(-0.9, 0.5)), 0.5, textColor);
      drawTextOverlay('z', basePos.add(vec2(-1.2, 0.8)), 0.6, textColor);
      drawTextOverlay('z', basePos.add(vec2(-1.5, 1.1)), 0.7, textColor);
    };
    const drawMoveHint = function (basePos, mirror) {
      const offsets = [1.5, 1.8, 2.1];
      const scales = [0.7, 0.6, 0.5];
      const char = mirror ? '(' : ')';
      const offsetSign = mirror ? -1 : 1;
      offsets.forEach((offset, i) => {
        drawTextOverlay(char, basePos.add(vec2(offsetSign * offset, 0.0)), scales[i], textColor);
      });
    };

    const storyBaseX = 0;
    const storyBaseY = 5;
    // Comic cut lines.
    [storyBaseX + 4, storyBaseX + 13, storyBaseX + 21.5].forEach(x => {
      drawLine(vec2(x, storyBaseY), vec2(x, storyBaseY + 4), 0.1, new Color(0, 0, 0, 0.2));
    });
    // Comic scene1.
    let unicornPos1 = vec2(storyBaseX + 2, storyBaseY + 2);
    drawUnicorn(unicornPos1, true, false);
    drawSleepHint(unicornPos1);
    // Comic scene2.
    const dragonPos2 = vec2(storyBaseX + 9, storyBaseY + 2.5);
    const unicornPos2 = vec2(storyBaseX + 7, storyBaseY + 2);
    drawDragon(dragonPos2, false, false);
    drawMoveHint(dragonPos2, false);
    drawUnicorn(unicornPos2, true, false);
    drawSleepHint(unicornPos2);
    drawTextOverlay('Horn == Power!', dragonPos2.add(vec2(0.1, 1.2)), 0.5, textColor);
    // Comic scene3.
    const dragonPos3 = vec2(storyBaseX + 19, storyBaseY + 2.5);
    const unicornPos3 = vec2(storyBaseX + 16, storyBaseY + 2);
    drawDragon(dragonPos3, true, true);
    drawMoveHint(dragonPos3, true);
    drawUnicorn(unicornPos3, false, false);
    drawTextOverlay('What?!', unicornPos3.add(vec2(-0.9, 0.6)), 0.5, textColor);
    // Comic scene4.
    const unicornPos4 = vec2(storyBaseX + 23, storyBaseY + 2);
    drawUnicorn(unicornPos4, false, true, 1);
    drawMoveHint(unicornPos4.add(vec2(2.5, -0.3)), true);
    drawTextOverlay('Get my horn back!', unicornPos4.add(vec2(2.0, 0.6)), 0.5, textColor);

    const entryBaseX = 30;
    const entryBaseY = 4;
    const entryHintOffset = [0.0, 6.0, 12.0];
    drawTextOverlay("LEVEL1", vec2(entryBaseX + entryHintOffset[0], entryBaseY), 0.7, textColor);
    drawTextOverlay("LEVEL2", vec2(entryBaseX + entryHintOffset[1], entryBaseY), 0.7, textColor);
    drawTextOverlay("LEVEL3", vec2(entryBaseX + entryHintOffset[2], entryBaseY), 0.7, textColor);
    entryHintOffset.forEach(x => {
      drawTextOverlay("🔻", vec2(entryBaseX + x, entryBaseY - 0.7), 0.5, textColor);
    });
  }
  if (currentLevel == 0) {
    drawTextScreen('GET MY HORN BACK', vec2(mainCanvasSize.x / 2, worldScale * 2.2), worldScale * 2.5);
  }
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
setCanvasFixedSize(vec2(VIEW_WIDTH, VIEW_HEIGHT));
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, IMAGE_SOURCES);
