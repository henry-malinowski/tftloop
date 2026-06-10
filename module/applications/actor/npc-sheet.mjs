const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { ImagePopout, FilePicker } = foundry.applications.apps;
const { TextEditor } = foundry.applications.ux;

/**
 * TFT Loop NPC Sheet - Narrow vertical layout for NPCs with vertical icon tabs
 * Designed as a UX exploration for potential future actor-sheet-v2 improvements
 * @extends {ActorSheetV2}
 * @mixes HandlebarsApplicationMixin
 */
export default class tftloopNpcSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["tftloop", "sheet", "actor", "npc", "vertical-tabs"],
    position: {
      width: 430,
      height: 500,
    },
    window: {
      resizable: true,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    actions: {
      editImage: tftloopNpcSheet.#onEditImage,
      viewImage: tftloopNpcSheet.#onViewImage,
      createItem: tftloopNpcSheet.#onCreateItem,
      deleteItem: tftloopNpcSheet.#onDeleteItem,
      openItem: tftloopNpcSheet.#onOpenItem,
    },
  };

  /** @override */
  static PARTS = {
    main: {
      template: "systems/tftloop/templates/actors/npc.hbs",
    },
    tabs: {
      template: "systems/tftloop/templates/ui/sidebar-tabs.hbs",
    },
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "main", label: "tftloop.main", icon: "fas fa-list" },
        { id: "notes", label: "tftloop.notes", icon: "fas fa-feather" },
      ],
      initial: "main",
    },
  };

  /** @override */
  async _prepareContext(_options) {
    const actor = this.actor;

    const context = {
      actor: actor,
      data: actor, // Legacy alias for template compatibility
      config: CONFIG.tftloop,
      tabs: this._prepareTabs("primary"),
    };

    // Filter for specialCharacteristic items only
    context.specialCharacteristics = actor.items.filter(
      (item) => item.type === "specialCharacteristic",
    );

    // Enrich notes content for display when editor is toggled off
    context.notesEnriched = actor.system.notes?.value
      ? await TextEditor.implementation.enrichHTML(actor.system.notes.value, {
          relativeTo: actor,
        })
      : "";

    // Prepare tabs array with icons for the sidebar-tabs template
    context.tabsArray = this.constructor.TABS.primary.tabs.map((tab) => ({
      ...tab,
      active: context.tabs[tab.id]?.active || false,
      cssClass: context.tabs[tab.id]?.cssClass || "",
    }));

    return context;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);

    // Theme class is inherited from body via CSS cascade (based on UI theme setting)
    // No explicit theme class needed - NPCs follow the global theme
  }

  /**
   * Open file picker to edit actor image
   * @private
   */
  static async #onEditImage(_event, _target) {
    const attr = "img";
    const current = this.actor[attr];

    new FilePicker({
      current,
      type: "image",
      callback: async (path) => {
        await this.actor.update({ [attr]: path });
        await this.render({ parts: ["main"] });
      },
    }).render(true);
  }

  /**
   * Open image popout to view actor image
   * @private
   */
  static async #onViewImage(_event, _target) {
    const img = this.actor.img;
    if (!img) return;

    new ImagePopout({
      src: img,
      uuid: this.actor.uuid,
      window: {
        title: this.actor.name,
      },
    }).render(true);
  }

  /**
   * Create a new embedded item (specialCharacteristic only)
   * @private
   */
  static async #onCreateItem(event, target) {
    const itemType = target.dataset.type || "specialCharacteristic";

    // Only allow specialCharacteristic items on NPC sheets
    if (itemType !== "specialCharacteristic") return;

    const itemData = {
      name: game.i18n.localize("tftloop.new"),
      type: itemType,
    };

    await this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  /**
   * Delete an embedded item
   * @private
   */
  static async #onDeleteItem(event, target) {
    const itemId = target.closest(".item")?.dataset.itemId;
    if (!itemId) return;

    const item = this.actor.getEmbeddedDocument("Item", itemId);
    if (!item) return;

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "AreYouSure" },
      content: `<p><strong>${game.i18n.localize("tftloop.delete")}</strong>: ${item.name}?</p>`,
      no: {
        label: "No",
        icon: "fa-solid fa-times",
      },
      yes: {
        label: "Yes",
        icon: "fa-solid fa-check",
        default: true,
      },
    });

    if (confirmed) {
      await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
    }
  }

  /**
   * Open an embedded item's sheet
   * @private
   */
  static async #onOpenItem(event, target) {
    const itemId = target.closest(".item")?.dataset.itemId;
    if (itemId) {
      const item = this.actor.getEmbeddedDocument("Item", itemId);
      item.sheet.render(true);
    }
  }
}
