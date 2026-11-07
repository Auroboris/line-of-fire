!function() {
  "use strict";

  const EXTENSION_ID = "line-of-fire";
  const SETTINGS_STORAGE_KEY = EXTENSION_ID + "-settings";
  const DEFAULTS = {
    enabled: true,
    toggleKey: "L",
    showEnemies: true,
    showTeammates: false,
    showBots: true,
    threatOnly: false,
    lineLength: 3000,
    lineWidth: 3,
    lineBrightness: 45,
    maxDistance: 6000,
    fadeWithDistance: true,
    warningRadius: 250,
    dangerRadius: 100,
    normalColorPreset: "#ffffff",
    normalCustomColor: "#ffffff",
    warningColorPreset: "#ffcc00",
    warningCustomColor: "#ffcc00",
    dangerColorPreset: "#ff3b30",
    dangerCustomColor: "#ff3b30"
  };

  const COLOR_OPTIONS = {
    "#ffffff": "White",
    "#00ffff": "Cyan",
    "#007aff": "Blue",
    "#34c759": "Green",
    "#ffcc00": "Yellow",
    "#ff9500": "Orange",
    "#ff3b30": "Red",
    "#af52de": "Purple",
    custom: "Custom HEX color"
  };

  function loadSavedSettings() {
    try {
      if (typeof localStorage === "undefined") return {};
      const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved)
        ? saved
        : {};
    } catch (error) {
      return {};
    }
  }

  let settings = Object.assign({}, DEFAULTS, loadSavedSettings());
  let extensionActive = true;
  let gameReady = false;
  let animationFrame = null;
  const lines = new Map();

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value)));
  }

  function parseHexColor(value) {
    const normalized = String(value || "")
      .trim()
      .replace(/^0x/i, "")
      .replace(/^#/, "");

    if (/^[0-9a-f]{3}$/i.test(normalized)) {
      return parseInt(normalized.split("").map(function(char) {
        return char + char;
      }).join(""), 16);
    }

    if (/^[0-9a-f]{6}$/i.test(normalized)) {
      return parseInt(normalized, 16);
    }

    return null;
  }

  function getConfiguredColor(presetKey, customKey, fallback) {
    const preset = settings[presetKey];
    const selected = preset === "custom" ? settings[customKey] : preset;
    const parsed = parseHexColor(selected);
    return parsed === null ? parseHexColor(fallback) : parsed;
  }

  function getNormalColor() {
    return getConfiguredColor(
      "normalColorPreset",
      "normalCustomColor",
      DEFAULTS.normalColorPreset
    );
  }

  function getWarningColor() {
    return getConfiguredColor(
      "warningColorPreset",
      "warningCustomColor",
      DEFAULTS.warningColorPreset
    );
  }

  function getDangerColor() {
    return getConfiguredColor(
      "dangerColorPreset",
      "dangerCustomColor",
      DEFAULTS.dangerColorPreset
    );
  }

  function getPlayers() {
    try {
      if (typeof Players.all === "function") return Players.all();

      if (typeof Players.getIDs === "function" && typeof Players.get === "function") {
        const players = {};
        Object.keys(Players.getIDs()).forEach(function(id) {
          const player = Players.get(id);
          if (player) players[id] = player;
        });
        return players;
      }

      return {};
    } catch (error) {
      return {};
    }
  }

  function getMe() {
    try {
      return Players.getMe();
    } catch (error) {
      return null;
    }
  }

  function removeLine(id) {
    const entry = lines.get(String(id));
    if (!entry) return;

    try {
      if (entry.sprite.parent) entry.sprite.parent.removeChild(entry.sprite);
      entry.sprite.destroy();
    } catch (error) {
      // The game may already have destroyed the old plane sprite.
    }

    lines.delete(String(id));
  }

  function removeAllLines() {
    Array.from(lines.keys()).forEach(removeLine);
  }

  function createLine(player) {
    const owner = player && player.sprites ? player.sprites.sprite : null;
    if (!owner) return null;

    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.name = EXTENSION_ID + "-" + player.id;
    sprite.rotation = Math.PI;
    sprite.roundPixels = true;

    if (sprite.anchor && sprite.anchor.set) {
      sprite.anchor.set(0.5, 0);
    }

    if (sprite.position && sprite.position.set) {
      sprite.position.set(0, 0);
    }

    owner.addChild(sprite);
    const entry = {owner: owner, sprite: sprite};
    lines.set(String(player.id), entry);
    return entry;
  }

  function ensureLine(player) {
    const id = String(player.id);
    const owner = player && player.sprites ? player.sprites.sprite : null;
    let entry = lines.get(id);

    if (!owner) {
      removeLine(id);
      return null;
    }

    if (!entry || entry.owner !== owner || entry.sprite.parent !== owner) {
      removeLine(id);
      entry = createLine(player);
    }

    return entry;
  }

  function isTeammate(player, me) {
    return Number(me.team) > 0 && Number(player.team) > 0 &&
      String(player.team) === String(me.team);
  }

  function passesTypeFilter(player, me) {
    if (player.bot) return settings.showBots;
    return isTeammate(player, me)
      ? settings.showTeammates
      : settings.showEnemies;
  }

  function isPlayerVisible(player) {
    const owner = player && player.sprites ? player.sprites.sprite : null;
    if (!owner || player.status !== 0 || player.hidden || player.culled ||
      player.timedout || player.stealthed || player.render === false ||
      owner.visible === false) {
      return false;
    }

    return player.alpha === undefined || Number(player.alpha) > 0.05;
  }

  function getDistance(player, me) {
    const dx = Number(me.pos.x) - Number(player.pos.x);
    const dy = Number(me.pos.y) - Number(player.pos.y);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getThreatLevel(player, me) {
    const rotation = Number(player.rot) || 0;
    const directionX = Math.sin(rotation);
    const directionY = -Math.cos(rotation);
    const toMeX = Number(me.pos.x) - Number(player.pos.x);
    const toMeY = Number(me.pos.y) - Number(player.pos.y);
    const forwardDistance = toMeX * directionX + toMeY * directionY;

    if (forwardDistance <= 0 || forwardDistance > clamp(settings.lineLength, 250, 10000)) {
      return 0;
    }

    const perpendicularDistance = Math.abs(
      toMeX * directionY - toMeY * directionX
    );
    const dangerRadius = clamp(settings.dangerRadius, 20, 500);
    const warningRadius = Math.max(
      dangerRadius,
      clamp(settings.warningRadius, 40, 1000)
    );

    if (perpendicularDistance <= dangerRadius) return 2;
    if (perpendicularDistance <= warningRadius) return 1;
    return 0;
  }

  function styleLine(entry, distance, threatLevel) {
    const ownerScaleX = entry.owner.scale && Number(entry.owner.scale.x);
    const ownerScaleY = entry.owner.scale && Number(entry.owner.scale.y);
    const scaleX = Math.max(0.1, Math.abs(ownerScaleX || 1));
    const scaleY = Math.max(0.1, Math.abs(ownerScaleY || 1));
    const maxDistance = clamp(settings.maxDistance, 500, 15000);
    const distanceFade = settings.fadeWithDistance
      ? clamp(1 - distance / maxDistance * 0.75, 0.25, 1)
      : 1;
    const baseAlpha = clamp(settings.lineBrightness, 10, 100) / 100 * distanceFade;

    entry.sprite.width = clamp(settings.lineWidth, 1, 30) / scaleX;
    entry.sprite.height = clamp(settings.lineLength, 250, 10000) / scaleY;
    entry.sprite.alpha = threatLevel === 2
      ? 1
      : threatLevel === 1
        ? Math.max(0.8, baseAlpha)
        : baseAlpha;
    entry.sprite.tint = threatLevel === 2
      ? getDangerColor()
      : threatLevel === 1
        ? getWarningColor()
        : getNormalColor();
  }

  function hideAllLines() {
    lines.forEach(function(entry) {
      entry.sprite.visible = false;
    });
  }

  function updateLines() {
    const players = getPlayers();
    const me = getMe();

    lines.forEach(function(entry, id) {
      if (!players[id] && !players[Number(id)]) removeLine(id);
    });

    if (!gameReady || !settings.enabled || !extensionActive || !me || !me.pos) {
      hideAllLines();
      return;
    }

    const maxDistance = clamp(settings.maxDistance, 500, 15000);

    Object.keys(players).forEach(function(id) {
      const player = players[id];
      if (!player || String(player.id) === String(me.id)) return;

      const entry = ensureLine(player);
      if (!entry) return;

      const hasPosition = player.pos && Number.isFinite(Number(player.pos.x)) &&
        Number.isFinite(Number(player.pos.y));
      const distance = hasPosition ? getDistance(player, me) : Infinity;
      const visible = hasPosition && isPlayerVisible(player) &&
        passesTypeFilter(player, me) && distance <= maxDistance;

      if (!visible) {
        entry.sprite.visible = false;
        return;
      }

      const threatLevel = getThreatLevel(player, me);
      if (settings.threatOnly && threatLevel === 0) {
        entry.sprite.visible = false;
        return;
      }

      styleLine(entry, distance, threatLevel);
      entry.sprite.visible = true;
    });
  }

  function animate() {
    updateLines();
    animationFrame = requestAnimationFrame(animate);
  }

  function start() {
    gameReady = true;
    if (!animationFrame) animationFrame = requestAnimationFrame(animate);
    updateLines();
  }

  function stop() {
    gameReady = false;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    removeAllLines();
  }

  function normalizeKey(value) {
    let key = String(value || "").trim().toLowerCase();
    if (key === "spacebar") key = "space";
    if (/^key[a-z]$/.test(key)) key = key.slice(3);
    if (/^digit[0-9]$/.test(key)) key = key.slice(5);
    return key;
  }

  function isTyping(event) {
    const target = event && event.target;
    const tagName = target && target.tagName
      ? String(target.tagName).toLowerCase()
      : "";

    if (["input", "textarea", "select"].includes(tagName) ||
      (target && target.isContentEditable)) {
      return true;
    }

    try {
      return typeof UI !== "undefined" && typeof UI.chatBoxOpen === "function" &&
        UI.chatBoxOpen();
    } catch (error) {
      return false;
    }
  }

  function handleKeyDown(event) {
    if (!event || event.repeat || isTyping(event)) return;
    const pressed = [event.key, event.code].map(normalizeKey);
    const wanted = normalizeKey(settings.toggleKey || DEFAULTS.toggleKey);

    if (pressed.includes(wanted)) {
      extensionActive = !extensionActive;
      updateLines();
    }
  }

  function settingsApplied(values) {
    settings = Object.assign({}, DEFAULTS, values || {});

    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      }
    } catch (error) {
      // StarMash still keeps its own saved copy if local storage is unavailable.
    }

    updateLines();
  }

  function addColorFields(section, prefix, label) {
    section.addValuesField(prefix + "ColorPreset", label + " color", COLOR_OPTIONS);
    section.addString(
      prefix + "CustomColor",
      "Custom " + label.toLowerCase() + " HEX color",
      {maxLength: 7}
    );
  }

  function createSettingsProvider() {
    const provider = new SettingsProvider(settings, settingsApplied);
    const displaySection = provider.addSection("Display");

    displaySection.addBoolean("enabled", "Show aim lines");
    displaySection.addString("toggleKey", "Aim-line toggle key", {maxLength: 20});
    displaySection.addBoolean("showEnemies", "Show enemy players");
    displaySection.addBoolean("showTeammates", "Show teammates");
    displaySection.addBoolean("showBots", "Show bots");
    displaySection.addBoolean("threatOnly", "Only show lines threatening my plane");

    const lineSection = provider.addSection("Lines");

    lineSection.addSliderField("lineLength", "Line length", {
      min: 250,
      max: 10000,
      step: 250
    });
    lineSection.addSliderField("lineWidth", "Line thickness", {
      min: 1,
      max: 30,
      step: 1
    });
    lineSection.addSliderField("lineBrightness", "Normal-line brightness", {
      min: 10,
      max: 100,
      step: 5
    });
    lineSection.addSliderField("maxDistance", "Maximum display distance", {
      min: 500,
      max: 15000,
      step: 500
    });
    lineSection.addBoolean("fadeWithDistance", "Fade distant lines");
    addColorFields(lineSection, "normal", "Normal line");

    const threatSection = provider.addSection("Threat Warnings");

    threatSection.addSliderField("warningRadius", "Warning corridor radius", {
      min: 40,
      max: 1000,
      step: 20
    });
    threatSection.addSliderField("dangerRadius", "Danger corridor radius", {
      min: 20,
      max: 500,
      step: 10
    });
    addColorFields(threatSection, "warning", "Warning");
    addColorFields(threatSection, "danger", "Danger");

    return provider;
  }

  SWAM.on("gameRunning", start);
  SWAM.on("gamePrep", start);
  SWAM.on("gameWipe", stop);
  SWAM.on("keydown", handleKeyDown);
  SWAM.on("playerDestroyed", function(player) {
    if (player) removeLine(player.id);
  });

  SWAM.registerExtension({
    name: "Line of Fire",
    id: EXTENSION_ID,
    description: "Aim vectors and threat warnings for nearby planes in StarMash.",
    author: "Auroboris",
    version: "1.0.0",
    settingsProvider: createSettingsProvider()
  });
}();
