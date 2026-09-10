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

// Never die.
const DEBUG_MODE = false;
const STORY_BASE_X = 0;
const STORY_BASE_Y = 5;
let comicUnicorns = []
let comicDragons = []

///////////////////////////////////////////////////////////////////////////////
async function gameInit() {
  setGLEnable(false);
  // Set as const in engine.
  // setFontDefault('Lucida Console');
  characterRes = createAsepriteResource();
  await loadLevel();
  initWorldCamera();
  background.updatePos(cameraPos);
  foreground.updatePos(cameraPos);
  gravity.y = -0.01;

  // backgroundMusic = new ZzFXMusic(THEME);
  // backgroundMusic.playMusic(backgroundMusicVolume, true);
  if (currentLevel == 0) {
    const alpha = 0.6;
    [2, 7, 16, 25.2].forEach(x => {
      const unicorn = new Unicorn(vec2(STORY_BASE_X + x, STORY_BASE_Y + 1.4), alpha);
      unicorn.setHasHorn(true);
      unicorn.setStatic(true);
      unicorn.mirror = false;
      comicUnicorns.push(unicorn);
    });
    [8.6, 19.4].forEach(x => {
      comicDragons.push(new DragonSlime(vec2(STORY_BASE_X + x, STORY_BASE_Y + 2.5), vec2(), 1, alpha));
    });
    comicUnicorns[2].setHasHorn(false);
    comicUnicorns[3].setHasHorn(false);
    comicUnicorns[3].mirror = true;
    comicDragons[0].mirror = false;
    comicDragons[0].setHasHorn(false);
  }
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
  // Test level 0 switch level triggers.
  if (DEBUG_MODE && currentLevel == 0) {
    drawRect(vec2(30.5, 0.5), vec2(3, 1), new Color(0, 0, 0));
    drawRect(vec2(36.5, 0.5), vec2(3, 1), new Color(0, 0, 0));
    drawRect(vec2(42.5, 0.5), vec2(3, 1), new Color(0, 0, 0));
  }
  // Draw level 0 story.
  const spriteColor = new Color(1, 1, 1, 0.6);
  const textColor = new Color(0, 0, 0, 0.5);
  if (currentLevel == 0) {
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

    // Comic cut lines.
    [STORY_BASE_X + 4, STORY_BASE_X + 13, STORY_BASE_X + 21.5].forEach(x => {
      drawLine(vec2(x, STORY_BASE_Y), vec2(x, STORY_BASE_Y + 4), 0.1, new Color(0, 0, 0, 0.2));
    });
    // Comic scene1.
    let unicornPos1 = vec2(STORY_BASE_X + 2, STORY_BASE_Y + 2);
    drawSleepHint(unicornPos1);
    // Comic scene2.
    const dragonPos2 = vec2(STORY_BASE_X + 9, STORY_BASE_Y + 2.5);
    const unicornPos2 = vec2(STORY_BASE_X + 7, STORY_BASE_Y + 2);
    drawMoveHint(dragonPos2, false);
    drawSleepHint(unicornPos2);
    drawTextOverlay('Horn == Power!', dragonPos2.add(vec2(0.1, 1.2)), 0.5, textColor);
    // Comic scene3.
    const dragonPos3 = vec2(STORY_BASE_X + 19, STORY_BASE_Y + 2.5);
    const unicornPos3 = vec2(STORY_BASE_X + 16, STORY_BASE_Y + 2);
    drawMoveHint(dragonPos3, true);
    drawTextOverlay('What?!', unicornPos3.add(vec2(-0.9, 0.6)), 0.5, textColor);
    // Comic scene4.
    const unicornPos4 = vec2(STORY_BASE_X + 23, STORY_BASE_Y + 2);
    drawMoveHint(unicornPos4.add(vec2(2.5, -0.3)), true);
    drawTextOverlay('Get my horn back!', unicornPos4.add(vec2(2.0, 0.6)), 0.5, textColor);

    const entryBaseX = 30.5;
    const entryBaseY = 4;
    const entryHintOffset = [0.0, 6.0, 12.0];
    entryHintOffset.forEach((x, i) => {
      drawTextOverlay(`LEVEL${i + 1}`, vec2(entryBaseX + x, entryBaseY), 0.7, textColor);
      drawTextOverlay("🔻", vec2(entryBaseX + x, entryBaseY - 0.7), 0.5, textColor);
    });
  }
  if (currentLevel == 0) {
    drawTextOverlay('GET MY HORN BACK', vec2(14, 13), 2.5, textColor);
    if (!player) {
      drawTextOverlay('Press S to start', vec2(14, 11), 0.8, textColor);
    }
  } else if (currentLevel == BOSS_LEVEL) {
    if (player && player.hasHorn()) {
      drawTextOverlay('Thanks for playing!', vec2(14, 14), 0.8);
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
setCanvasFixedSize(vec2(VIEW_WIDTH, VIEW_HEIGHT));
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, IMAGE_SOURCES);
