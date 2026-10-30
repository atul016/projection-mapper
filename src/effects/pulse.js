// solid colour breathing in and out (good for washing a whole surface)
EFFECTS.pulse = (c, w, h, t, s, col) => {
  clear(c, w, h);
  c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2);
  c.fillStyle = col; c.fillRect(0, 0, w, h);
  c.globalAlpha = 1;
};
