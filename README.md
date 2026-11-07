# Line of Fire

A [StarMash](https://starmash.airmash.rocks) / SWAM extension that shows where everyone else's nose is pointing before the missiles explain it for them.

Install URL: `https://cdn.jsdelivr.net/gh/Auroboris/line-of-fire@991509041e8f97e87666bf011ed73db27e7a038a/extension.js`

## What it does

Line of Fire attaches a live aim vector to every selected plane. The line moves and rotates with the plane, fades with distance and weapon energy, and pulses when its projected path approaches you.

- A steady line shows where a plane is aiming.
- A brighter line indicates more available weapon energy.
- A flashing glow means the plane is pointing toward your warning or danger corridor.
- The line temporarily disappears when the plane lacks enough energy or is still waiting to fire again.
- The line returns as soon as that plane is estimated to be able to shoot.

All states use your chosen line color. The flashing warning indicates aim direction and estimated firing readiness, not a confirmed missile path or hit.

## Usage

Install the extension, reload StarMash, then open **Mod Settings → Line of Fire**.

- Toggle all aim lines with any chosen key (`L` by default).
- Show or hide enemies, teammates, and bots independently.
- Use **Threats only** to hide lines that are not currently aimed near you.
- Adjust line length, thickness, brightness, color, and maximum display distance.
- Choose whether line brightness follows weapon energy and whether unready lines disappear.
- Adjust the warning and danger corridor sizes, pulse speed, and pulse brightness.
- Hidden, stealthed, dead, and off-screen planes do not receive visible aim lines.

Settings are saved after you apply them and restored after reloading the game.

Weapon readiness is estimated from the energy and firing information available to the game client. Network delay may cause a brief difference between the indicator and the server.
