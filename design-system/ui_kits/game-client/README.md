# UI kit — The Hollow March game client

A click-through recreation of the browser client's five real surfaces, composed
from the design system's primitives. It is a **visual and interaction**
recreation, not production code: no save schema, no networking, no combat
resolution.

Open `index.html`. Flow:

1. **Title** — Begin the March
2. **Creator** — stage 1 of 6 (identity + origin); Next advances
3. **World HUD** — the anchored in-world interface
4. **Panels** — the side nav opens Skills and Bestiary in a GamePanel
5. **Dialogue** — the interaction prompt opens the conversation box
6. **Defeat** — the death overlay

Recreated from `index.html` and `styles.css` in `Ostrowidzki1989/sable-reach`.

## Deliberate omissions

| Omitted | Why |
| --- | --- |
| Canvas / WebGL2 world | A region keyframe stands in. The real client renders nine 32x32m chunks. |
| Origin art for 4 of 8 origins | Only four renders exist. The remaining stages show a labelled empty alcove. |
| Morph sliders driving geometry | The live morph profile is a prototype rig; the kit shows the controls only. |
| Real-time combat | The direction has moved to turn-based. The action bar shell is shown; its bindings are not endorsed. |
| Inventory, journal, atlas panel bodies | Same GamePanel shell as Skills and Bestiary; not duplicated here. |

## Screens

- `TitleScreen.jsx`
- `CreatorScreen.jsx`
- `WorldHud.jsx` — also hosts the panel, dialogue and defeat states
- `App.jsx` — the click-through state machine
