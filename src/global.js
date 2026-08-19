'use strict';

const TILE_SIZE = 16;  // pixels

const WORLD_WIDTH = 30;  // cells
const WORLD_HEIGHT = 20;  // cells

const IMAGE_SOURCES = [
  'assets/tileset.png',
  'assets/unicorn.png',
  'assets/leaf.png',
];

const THEME_INDEX_ROCK = 0;
const THEME_INDEX_GRASS = 1;
const THEME_INDEX_CLOUD = 2;

const RENDER_ORDER_BACKGROUND = -1e4;
const RENDER_ORDER_BACKGROUND_STAR = RENDER_ORDER_BACKGROUND - 1;
const RENDER_ORDER_TILE_LAYER = 0;
const RENDER_ORDER_BULLET = 100;

const TILE_COLOR_REMAP = [
  [0x322b28, 0x59c135, 0xb9bffb],
  [0x4a5462, 0x14a02e, 0xffffff],
  [0x333941, 0x1a7a3e, 0xffffff],
  [0x221c1a, 0x24523b, 0x249fde],
  [0x221c1a, 0x423934, 0xe3e6ff],
];

const INPUT_KEY_UP = 'ArrowUp';
const INPUT_KEY_DOWN = 'ArrowDown';
const INPUT_KEY_LEFT = 'ArrowLeft';
const INPUT_KEY_RIGHT = 'ArrowRight';
const INPUT_KEY_FIRE = 'KeyJ';

let worldScale = TILE_SIZE;
