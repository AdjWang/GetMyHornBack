'use strict';

// Random float of [min, max]
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function randomSelect(arr, count = 1) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count)[0];
}

// Random int of [min, max]
function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
