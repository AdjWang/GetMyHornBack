'use strict';

function updateWorldCamera() {
  if (player) {
    cameraPos = vec2(player.pos.x, VIEW_HEIGHT / 2);
  } else {
    cameraPos = vec2(VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
  }
  cameraScale = worldScale;
}
