# Line of Fire

A [StarMash](https://starmash.airmash.rocks) / SWAM extension that shows where everyone else's nose is pointing before the missiles explain it for them.

Install URL: `https://cdn.jsdelivr.net/gh/Auroboris/line-of-fire@0679c5baae195619e108b54058c9192e28bd5585/extension.js`

## What it does

Line of Fire attaches a live aim vector to every selected plane. The line begins at the plane's nose, moves and rotates with it, stops at mountains and obstacles, and reports weapon energy and incoming aim pressure without hiding the base direction line.

- A steady base line shows where a plane is aiming and always begins at its fixed nose position.
- The line stops at the first StarMash terrain collision boundary instead of passing through mountains.
- Adjustable full-, medium-, and low-energy colors show the plane's estimated weapon energy.
- A separate flashing glow appears over the base line when the plane points toward your warning or danger corridor.
- The line temporarily disappears when the plane lacks enough energy or is still waiting to fire again.
- The line returns as soon as that plane is estimated to be able to shoot.

The steady energy line remains visible underneath its threat glow. The flashing warning indicates aim direction and estimated firing readiness, not a confirmed missile path or hit.

## Usage

Install the extension, reload StarMash, then open **Mod Settings → Line of Fire**.

- Toggle all aim lines with any chosen key (`L` by default).
- Show or hide enemies, teammates, and bots independently.
- Use **Threats only** to hide lines that are not currently aimed near you.
- Adjust line length, thickness, brightness, color, and maximum display distance.
- Choose whether line brightness and color follow weapon energy and whether unready lines disappear.
- Choose preset or custom HEX colors for full, medium, and low energy.
- Adjust the warning and danger corridor sizes, pulse speed, and pulse brightness.
- Hidden, stealthed, dead, and off-screen planes do not receive visible aim lines.

Settings are saved after you apply them and restored after reloading the game.

Weapon readiness is estimated from the energy and firing information available to the game client. Network delay may cause a brief difference between the indicator and the server.
