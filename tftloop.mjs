import { tftloop } from "./module/config.mjs";
import * as Chat from "./module/chat.mjs";
import tftloopActorSheet from "./module/applications/actor/character-sheet.mjs";
import tftloopActorSheetV2 from "./module/applications/actor/character-sheet-v2.mjs";
import tftloopNpcSheet from "./module/applications/actor/npc-sheet.mjs";
import TftloopActor from "./module/documents/actor/actor.mjs";
import { registerSystemSettings } from "./module/settings.mjs";
import tftloopItemSheet from "./module/applications/item/item-sheet.mjs";
// Data Models (v13+)
import { KidDataModel, TeenDataModel, NpcDataModel } from "./module/data/actor/_module.mjs";
import {
  ItemDataModel,
  RelationshipDataModel,
  ScarDataModel,
  SpecialCharacteristicDataModel,
} from "./module/data/item/_module.mjs";

//dice so nice hooks for us to use the custom dice
Hooks.once("diceSoNiceReady", (dice3d) => {
  console.log("TFTLOOP STARTER - Dice init");
  dice3d.addSystem({ id: "tftloop", name: "Tales from the Loop" }, "force");

  dice3d.addDicePreset({
    type: "d6",
    modelFile: "systems/tftloop/models/d6.glb",
    system: "tftloop",
  });

  dice3d.addColorset({
    name: "loop-orange",
    description: "Tales from the Loop Dice",
    category: "Tales From the Loop",
    foreground: "#000000",
    background: "#fe7100",
    outline: "#fe7100",
    edge: "#fe7100",
    texture: "#fe7100",
    material: "plastic",
  });

  dice3d.addDicePreset(
    {
      type: "d6",
      atlas: "systems/tftloop/img/dice/loop-faces.json",
      labels: ["face1.png", "face2.png", "face3.png", "face4.png", "face5.png", "face6.png"],
      colorset: "loop-orange",
      system: "tftloop",
    },
    "d6",
  );

  dice3d.addSystem({ id: "tftflood", name: "Things from the Flood" }, "force");

  dice3d.addDicePreset({
    type: "d6",
    modelFile: "systems/tftloop/models/d6.glb",
    system: "tftflood",
  });

  dice3d.addColorset({
    name: "flood-violet",
    description: "Things from the Flood Dice",
    category: "Things from the Flood",
    foreground: "#ffffff",
    background: "#8F2C49",
    outline: "#8F2C49",
    edge: "#8F2C49",
    texture: "#8F2C49",
    material: "plastic",
  });

  dice3d.addDicePreset(
    {
      type: "d6",
      atlas: "systems/tftloop/img/dice/flood-faces.json",
      labels: ["face1.png", "face2.png", "face3.png", "face4.png", "face5.png", "face6.png"],
      colorset: "flood-violet",
      system: "tftflood",
    },
    "d6",
  );
});

Hooks.on("preCreateItem", (createData) => {
  if (!createData.img) {
    createData.img = "systems/tftloop/img/riks_logo.jpg";
  }
});

Hooks.on("renderChatMessageHTML", (app, html, data) => Chat.applyChatMessageTheme(app, html, data));
Hooks.on("renderChatMessageHTML", (app, html, _data) => Chat.addChatListeners(html));
Hooks.on("renderChatMessageHTML", (app, html, data) => Chat.hideChatActionButtons(app, html, data));

Hooks.once("init", function () {
  console.log("TFTLOOP | Initializing Tales From the Loop");

  game.tftloop = {
    applications: {
      tftloopActor: TftloopActor,
      tftloopActorSheet,
      tftloopActorSheetV2,
      tftloopNpcSheet,
      tftloopItemSheet,
    },
    config: tftloop,
    entities: {
      tftloopActor: TftloopActor,
    },
  };

  CONFIG.tftloop = tftloop;
  CONFIG.Actor.documentClass = TftloopActor;

  // Register Data Models (v13+)
  CONFIG.Actor.dataModels = {
    kid: KidDataModel,
    teen: TeenDataModel,
    npc: NpcDataModel,
  };
  CONFIG.Item.dataModels = {
    item: ItemDataModel,
    relationship: RelationshipDataModel,
    scar: ScarDataModel,
    specialCharacteristic: SpecialCharacteristicDataModel,
  };

  // Register System Settings
  registerSystemSettings();

  // Check Foundry version - skip appv1 sheet registration if version > 16.0
  const isFoundryV16OrLower = !foundry.utils.isNewerVersion(game.version, "16.0");

  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);

  // Only register appv1 sheet if Foundry version is 16.0 or lower
  if (isFoundryV16OrLower) {
    foundry.documents.collections.Actors.registerSheet("tftloop", tftloopActorSheet);
  }

  foundry.documents.collections.Actors.registerSheet("tftloop", tftloopActorSheetV2, {
    types: ["kid", "teen"],
    label: "TFTLOOP.SheetV2",
    makeDefault: true,
  });
  foundry.documents.collections.Actors.registerSheet("tftloop", tftloopNpcSheet, {
    types: ["npc"],
    label: "TFTLOOP.NpcSheet",
    makeDefault: true,
  });

  foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet("tftloop", tftloopItemSheet, {
    makeDefault: true,
  });

  Handlebars.registerHelper("times", function (n, content) {
    let result = "";
    for (let i = 0; i < n; ++i) {
      content.data.index = i + 1;
      result = result + content.fn(i);
    }

    return result;
  });

  Handlebars.registerHelper(
    "checkboxToggle",
    function (
      condition,
      toggleName,
      actionType = "toggleBoolean",
      dataAttr = "toggle",
      readonly = false,
    ) {
      const checked = condition ? "checked" : "not_checked";
      const toggle = toggleName || "";
      const readonlyClass = readonly ? " readonly" : "";

      return new Handlebars.SafeString(
        `<label class="imgCheck${readonlyClass}" data-action="${actionType}" data-${dataAttr}="${toggle}">
						<img class="toggle-boolean" data-${dataAttr}="${toggle}" src="systems/tftloop/img/box_${checked}.png" height="18px" width="18px">
				</label>`,
      );
    },
  );

  // Range helper: generates array from start to end (inclusive)
  Handlebars.registerHelper("range", function (start, end) {
    const result = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  });
});

Hooks.once("setup", function () {
  // Apply UI theme class to body on load
  const uiTheme = game.settings.get("tftloop", "uiTheme");
  document.body.classList.add(uiTheme);
});
