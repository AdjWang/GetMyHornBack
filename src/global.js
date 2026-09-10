'use strict';

const TILE_SIZE = 16;  // pixels

const VIEW_WIDTH = 28;  // cells
const VIEW_HEIGHT = 16;  // cells

const IMAGE_SOURCES = [
  'assets/tileset.png',
  'assets/character.png',
];

const STORAGE_PREFIX = 'gmhb_0_0_0_';

const THEME_INDEX_ROCK = 0;
const THEME_INDEX_GRASS = 1;
const THEME_INDEX_CLOUD = 2;

const TEXTURE_INDEX_TILESET = 0;
const TEXTURE_INDEX_CLOUD = 0;
const TEXTURE_INDEX_RAINBOW = 0;
const TEXTURE_INDEX_LEAF = 0;
const TEXTURE_INDEX_UNICORN = 1;
const TEXTURE_INDEX_SLIME = 1;

const SPIKEWEED_TILE_ID = 5;
const DESTROYABLE_TILE_ID = SPIKEWEED_TILE_ID;
const SAVEPOINT_TILE_ID = 6;
const PRISM_TILE_ID = 3;
const PRISM_TILE_DIR_UP = 0;
const PRISM_TILE_DIR_DOWN = 2;
const PRISM_TILE_DIR_LEFT = 3;
const PRISM_TILE_DIR_RIGHT = 1;
const PRISM_TILE_DIR_COUNT = 4;
const TNT_TILE_ID = 4;

const RENDER_ORDER_BACKGROUND = -1e4;
const RENDER_ORDER_TILE_LAYER = 0;
const RENDER_ORDER_CHARACTER = 10;
const RENDER_ORDER_BULLET = 11;
const RENDER_ORDER_FOREGROUND = 110;

// Remap colors to change theme.
const TILE_COLOR_REMAP = [
  // Tiles.
  [0x322b28, 0x59c135, 0xb9bffb],
  [0x4a5462, 0x14a02e, 0xffffff],
  [0x333941, 0x1a7a3e, 0xffffff],
  [0x221c1a, 0x24523b, 0x249fde],
  // Rainbow.
  [0xb4202a, 0x4d4d4d, 0x4d4d4d],
  [0xfa6a0a, 0x8a8a8a, 0x8a8a8a],
  [0xfffc40, 0xe7e7e7, 0xe7e7e7],
  [0x59c135, 0x929292, 0x929292],
  [0x20d6c7, 0x9e9e9e, 0x9e9e9e],
  [0x285cc4, 0x585858, 0x585858],
  [0x143464, 0x303030, 0x303030],
  // Clouds.
  [0x793a80, 0xffffff, 0xffffff],
  [0x403353, 0xdae0ea, 0xdae0ea],
];

const RAINBOW_COLORS = [
  new Color(1.0, 0.2, 0.0),
  new Color(1.0, 0.5, 0.0),
  new Color(1.0, 1.0, 0.0),
  new Color(0.0, 0.8, 0.2),
  new Color(0.0, 0.8, 1.0),
  new Color(0.1, 0.2, 1.0),
  new Color(0.6, 0.0, 1.0),
];

const INPUT_KEY_UP = 'ArrowUp';
const INPUT_KEY_DOWN = 'ArrowDown';
const INPUT_KEY_LEFT = 'ArrowLeft';
const INPUT_KEY_RIGHT = 'ArrowRight';
const INPUT_KEY_RESET = 'KeyR';
const INPUT_KEY_CLEAR_PROGRESS = 'KeyB';

const BOSS_LEVEL = 3;

let worldScale = TILE_SIZE;
let currentLevel = 0;
let player = undefined;
let dragon = undefined;
let foreground = undefined;
let background = undefined;
let tileLayer = undefined;
let characterRes = undefined;
let savePointEnableTileInfo = undefined;
let savePointDisableTileInfo = undefined;
