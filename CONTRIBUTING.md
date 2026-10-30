# Contributing

Thanks for helping. The project is deliberately small: plain HTML, CSS and JavaScript, no build
step and no dependencies to install. Please keep it that way, so anyone can download it and open
`index.html`.

## Where things are

| File | What's in it |
|---|---|
| `index.html` | Page markup: the panel and the help box |
| `src/app.js` | Zones, the panel, keyboard shortcuts, export / import, the render loop |
| `src/effects/` | The built-in effects, one file each, plus `core.js` with the shared helpers. **Most contributions go here.** |
| `src/lib.js` | Small pure helpers (link parsing for YouTube and direct video / image links, checking saved zones), covered by tests |
| `src/style.css` | Styles |
| `vendor/` | Bundled third-party libraries (maptastic, lottie-web). maptastic carries a few small patches, listed at the top of the file; add any new one to that list |
| `CONTENT.md` | Free animations and videos that project well |

## Adding an effect

Create `src/effects/ring.js` and add `<script src="src/effects/ring.js"></script>` to `index.html` after the other effects. The function is called once per frame:

```js
// a ring that breathes in and out
EFFECTS.ring = (c, w, h, t, s, col) => {
  clear(c, w, h);                                   // start each frame from black
  const r = Math.min(w, h) * (0.3 + 0.05 * Math.sin(t * 3));
  c.strokeStyle = col; c.lineWidth = 12; c.shadowColor = col; c.shadowBlur = 30;
  c.beginPath(); c.arc(w / 2, h / 2, r, 0, 7); c.stroke();
  c.shadowBlur = 0;                                 // leave the canvas as you found it
};
```

- `c` is a 2D canvas context, always 800×600 (`w`, `h`); the zone is warped onto the wall afterwards.
- `t` is time in seconds, `col` the zone's colour from the panel.
- `s` is state that persists between frames for this zone (it starts as `{ p: [] }`). The
  `particles(c, s, gravity)` helper moves and draws anything you push onto `s.p`; see `anar`
  and `fireworks`.
- Use `fade(c, w, h, 0.2)` instead of `clear` to leave trails.
- Draw bright things on black. Black is "no light" on a projector.
- Reset anything you change on the context (`shadowBlur`, `globalAlpha`, `globalCompositeOperation`).
- Keep it fast: several zones run at 60 fps at once.

The new name appears in the panel's dropdown, in the order the script tags are listed.

## Testing

```bash
node --test
```

runs the checks for `src/lib.js`. Then open the page and try your change for real: press **P**, pick
your effect, and look at it in edit mode and out of it. If you can, check on an actual projector.

## Sharing content

Found free animations or videos that look great on a wall? Add them to `CONTENT.md` with the link
and the licence they're under. Only content that's free to use, please.

## Pull requests

Keep them focused on one thing, describe what you tested, and include a screenshot or short clip
for anything visual.
