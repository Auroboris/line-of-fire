# Line of Fire

A [StarMash](https://starmash.airmash.rocks) / SWAM extension that shows where everyone else's nose is pointing before the missiles explain it for them.

Install URL: `EXTENSION_URL_AFTER_FIRST_PUBLISH`

## What it does

Line of Fire attaches a live aim vector to every selected plane. The line moves and rotates with the plane, fades with distance, and changes color when its projected path approaches you.

- White: normal aim line.
- Yellow: the projected line passes through your warning corridor.
- Red: the projected line passes through your danger corridor.

The warning colors indicate aim direction, not a confirmed missile path or hit.

## Usage

Install the extension, reload StarMash, then open **Mod Settings → Line of Fire**.

- Toggle all aim lines with any chosen key (`L` by default).
- Show or hide enemies, teammates, and bots independently.
- Use **Threats only** to hide lines that are not currently aimed near you.
- Adjust line length, thickness, brightness, color, and maximum display distance.
- Adjust the warning and danger corridor sizes and colors.
- Hidden, stealthed, dead, and off-screen planes do not receive visible aim lines.

Settings are saved after you apply them and restored after reloading the game.
