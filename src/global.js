'use strict';

const TILE_SIZE = 16;  // pixels

const VIEW_WIDTH = 28;  // cells
const VIEW_HEIGHT = 16;  // cells

const IMAGE_SOURCES = [
  'assets/tileset.png',
  'assets/objects.png',
  'assets/unicorn.png',
  'assets/slime.png',
];

const THEME_INDEX_ROCK = 0;
const THEME_INDEX_GRASS = 1;
const THEME_INDEX_CLOUD = 2;

const TEXTURE_INDEX_TILESET = 0;
const TEXTURE_INDEX_LEAF = 1;
const TEXTURE_INDEX_FIREBALL = 1;
const TEXTURE_INDEX_UNICORN = 2;
const TEXTURE_INDEX_SLIME = 3;

const LEAF_SIZE = 8;
const FIREBALL_SIZE = 8;

const SPIKEWEED_TILE_ID = 4;
const DESTROYABLE_TILE_ID = SPIKEWEED_TILE_ID;
const PRISM_TILE_ID = 7;
const PRISM_TILE_DIR_UP = 0;
const PRISM_TILE_DIR_DOWN = 2;
const PRISM_TILE_DIR_LEFT = 3;
const PRISM_TILE_DIR_RIGHT = 1;
const PRISM_TILE_DIR_COUNT = 4;
const WATER_TILE_ID = 15;
const WATER_TILE_INDEX = WATER_TILE_ID - 1;

const RENDER_ORDER_BACKGROUND = -1e4;
const RENDER_ORDER_TILE_LAYER = 0;
const RENDER_ORDER_CHARACTER = 10;
const RENDER_ORDER_BULLET = 11;
const RENDER_ORDER_FOREGROUND = 110;

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
const INPUT_KEY_FIRE = 0;

let worldScale = TILE_SIZE;
let currentLevel = 0;
let player = undefined;
let foreground = undefined;
let background = undefined;
let tileLayer = undefined;
