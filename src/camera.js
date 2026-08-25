'use strict';

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
