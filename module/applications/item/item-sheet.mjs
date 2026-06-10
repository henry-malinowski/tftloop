const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
const { ImagePopout, FilePicker } = foundry.applications.apps;
const { TextEditor } = foundry.applications.ux;

export default class tftloopItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["tftloop", "sheet", "item"],
    position: {
      width: 615,
      height: 415,
    },
    window: {
      resizable: true,
    },
    form: {
      tag: "form",
      submitOnChange: true,
      closeOnSubmit: false,
    },
    actions: {
      editImage: tftloopItemSheet.#onEditImage,
      viewImage: tftloopItemSheet.#onViewImage,
    },
  };

  static async #onEditImage(_event, _target) {
    const attr = "img"; // Always "img" for item image editing
    const current = this.document[attr];

    new FilePicker({
      current,
      type: "image",
      callback: async (path) => {
        // Persist the change to the document
        await this.document.update({ [attr]: path });
        // Refresh the UI from document context (reactive approach)
        await this.render({ parts: ["main"] });
      },
    }).render(true);
  }

  static async #onViewImage(_event, _target) {
    const img = this.document.img;
    if (!img) return;

    new ImagePopout({
      src: img,
      uuid: this.document.uuid,
      window: {
        title: this.document.name,
      },
    }).render(true);
  }

  /** @override */
  static PARTS = {
    main: {
      template: "systems/tftloop/templates/items/item-sheet.hbs",
    },
  };

  /** @override */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    const itemType = this.document.type;

    parts.main.templates = [`systems/tftloop/templates/items/partials/${itemType}-partial.hbs`];

    return parts;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);

    // Add theme class to form element if item has a parent actor
    if (this.document.actor && this.form) {
      const themeClass = this.document.actor.type === "teen" ? "theme-flood" : "theme-loop";
      this.form.classList.add(themeClass);
    }
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;

    // Map item type to localization key for header
    const typeToLabel = {
      item: "tftloop.item",
      relationship: "tftloop.relationship",
      scar: "tftflood.scar",
      specialCharacteristic: "TYPES.Item.specialCharacteristic",
    };
    const itemTypeLabel = game.i18n.localize(typeToLabel[item.type] || "tftloop.item");

    // Enrich notes content for display when editor is toggled off
    const notesEnriched = item.system.notes
      ? await TextEditor.implementation.enrichHTML(item.system.notes, {
          relativeTo: item,
        })
      : "";

    return {
      ...context,
      item: item,
      data: item, // Legacy mapping support for {{data.system...}} if needed
      config: CONFIG.tftloop,
      itemTypeLabel: itemTypeLabel,
      notesEnriched: notesEnriched,
    };
  }
}
