const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { ImagePopout, FilePicker } = foundry.applications.apps;
const { TextEditor } = foundry.applications.ux;

/**
 * TFT Loop Actor Sheet V2 - Modern ApplicationV2-based actor sheet
 * Supports both 'kid' and 'teen' actor types with smart template partials
 * @extends {ActorSheetV2}
 * @mixes HandlebarsApplicationMixin
 */
export default class tftloopActorSheetV2 extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tftloop", "sheet", "actor", "v2", "vertical-tabs"],
    position: {
      width: 500,
      height: 580,
    },
    window: {
      resizable: false, // todo change later, replace with minimum size in CSS
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    actions: {
      //toggleBoolean: tftloopActorSheetV2.#onToggleBoolean,
      toggleScarAccepted: tftloopActorSheetV2.#onToggleScarAccepted,
      useLuck: tftloopActorSheetV2.#onUseLuck,
      resetLuck: tftloopActorSheetV2.#onResetLuck,
      expChange: tftloopActorSheetV2.#onExpChange,
      createItem: tftloopActorSheetV2.#onCreateItem,
      deleteItem: tftloopActorSheetV2.#onDeleteItem,
      openItem: tftloopActorSheetV2.#onOpenItem,
      editItem: tftloopActorSheetV2.#onEditItem,
      rollAttribute: tftloopActorSheetV2.#onRollAttribute,
      rollSkill: tftloopActorSheetV2.#onRollSkill,
      editImage: tftloopActorSheetV2.#onEditImage,
      viewImage: tftloopActorSheetV2.#onViewImage,
    },
  };

  /** @override */
  static PARTS = {
    main: {
      template: "systems/tftloop/templates/actors/actor-sheet-v2.hbs",
    },
    tabs: {
      template: "systems/tftloop/templates/ui/sidebar-tabs.hbs",
    },
  };

  /** @override */
  static TABS = {
    primary: {
      tabs: [
        { id: "main", label: "tftloop.main", icon: "fas fa-dice-d6" },
        { id: "core", label: "tftloop.coreInfo", icon: "fas fa-user" },
        {
          id: "relationships",
          label: "tftloop.relationships",
          icon: "fas fa-users",
        },
        { id: "items", label: "tftloop.items", icon: "fas fa-suitcase" },
        { id: "scars", label: "tftflood.scars", icon: "fas fa-band-aid" }, // Teen-only
        { id: "notes", label: "tftloop.notes", icon: "fas fa-feather" },
      ],
      initial: "main",
    },
  };

  /** @override */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    const actorType = this.actor.type;

    parts.main.templates = [
      // Main tab (two-column layout)
      "systems/tftloop/templates/actors/partials-v2/main-tab.hbs",
      // Shared partials
      "systems/tftloop/templates/actors/partials-v2/sidebar.hbs",
      "systems/tftloop/templates/actors/partials-v2/luck-section.hbs",
      "systems/tftloop/templates/actors/partials-v2/conditions-section.hbs",
      "systems/tftloop/templates/actors/partials-v2/conditions-list.hbs",
      "systems/tftloop/templates/actors/partials-v2/experience.hbs",
      "systems/tftloop/templates/actors/partials-v2/pride-shame-section.hbs",
      "systems/tftloop/templates/actors/partials-v2/attributes-skills.hbs",
      "systems/tftloop/templates/actors/partials-v2/relationships-tab.hbs",
      "systems/tftloop/templates/actors/partials-v2/items-tab.hbs",
      "systems/tftloop/templates/actors/partials-v2/notes-tab.hbs",
      // Type-specific templates
      ...(actorType === "kid"
        ? ["systems/tftloop/templates/actors/partials-v2/core-info-kid-tab.hbs"]
        : [
            "systems/tftloop/templates/actors/partials-v2/core-info-teen-tab.hbs",
            "systems/tftloop/templates/actors/partials-v2/scars-tab.hbs",
          ]),
    ];

    return parts;
  }

  /** @override */
  async _prepareContext(options) {
    const actor = this.actor;
    const themeClass = actor.type === "teen" ? "theme-flood" : "theme-loop";

    // Add theme class to options so ApplicationV2 applies it to the wrapper element
    if (!this.options.classes.includes(themeClass)) {
      this.options.classes.push(themeClass);
    }

    // Get base context from DocumentSheetV2 (includes document, model, fields, etc.)
    const context = await super._prepareContext(options);

    // Override model and fields to point to actor.system (the actual DataModel)
    // This lets ApplicationV2 properly track the DataModel for reactive updates
    context.model = actor.system;
    context.fields = actor.system.schema.fields;
    context.system = actor.system;

    // Keep actor reference
    context.actor = actor;

    // Minimal system-specific context (no derived computations here)
    context.config = CONFIG.tftloop;
    context.tabs = this._prepareTabs("primary");
    context.cssClass = this.options.classes.join(" ");

    return context;
  }

  /**
   * @override
   * Prepare context specific to each part
   */
  async _preparePartContext(partId, context, options) {
    // Call super first to ensure base behavior (sets context.partId, preserves model reference)
    const partContext = await super._preparePartContext(partId, context, options);

    if (partId === "main") {
      const actor = this.actor;

      // Set tab classes for active state styling
      if (partContext.tabs) {
        for (const tabId in partContext.tabs) {
          const tab = partContext.tabs[tabId];
          tab.group = "primary";
        }
      }

      // Filter items by type (computed per-part, not per-context)
      partContext.relationships = actor.items.filter((item) => item.type === "relationship");
      partContext.bonusItems = actor.items.filter((item) => item.type === "item");
      if (actor.type === "teen") {
        partContext.scars = actor.items.filter((item) => item.type === "scar");
      }

      // Get system settings for kid types
      partContext.francein80s = game.settings.get("tftloop", "francein80s") ?? false;
      partContext.polishedition = game.settings.get("tftloop", "polishedition") ?? false;

      // Build kid type set based on settings
      let kidSet = { ...partContext.config.kidTypes };
      if (partContext.francein80s) {
        kidSet = { ...kidSet, ...partContext.config.franceKids };
      }
      if (partContext.polishedition) {
        kidSet = { ...kidSet, ...partContext.config.polishKids };
      }
      partContext.kidSet = kidSet;

      // Teen type set
      partContext.teenSet = partContext.config.teenTypes;

      // Age sets
      partContext.kidAgeSet = partContext.config.kidAgeList;
      partContext.teenAgeSet = partContext.config.teenAgeList;

      // Selected values (read from live model)
      partContext.selectedKidType = actor.system.type;
      partContext.selectedTeenType = actor.system.type;
      partContext.selectedAge = actor.system.age;

      // Computed luck values for kid (computed per-part from live model)
      if (actor.type === "kid") {
        partContext.luckMax = actor.system.luck.max;
        partContext.luckCurrent = actor.system.luck.value;
        partContext.luckRemaining = actor.system.curLuck;
      }

      // Enrich notes content for display when editor is toggled off
      partContext.notesEnriched = actor.system.notes?.value
        ? await TextEditor.implementation.enrichHTML(actor.system.notes.value, {
            relativeTo: actor,
          })
        : "";

      // Build attributes with skills structure - derived from live model schema
      partContext.attributesWithSkills = Object.keys(actor.system.attributes).map((attrId) => ({
        id: attrId,
        key: `tftloop.${attrId}`,
        value: actor.system.attributes[attrId],
        skills: Object.keys(actor.system.skills[attrId]).map((skillId) => ({
          id: skillId,
          key: `tftloop.${skillId}`,
          value: actor.system.skills[attrId][skillId],
          attrId: attrId,
          rollKey: `${attrId}.${skillId}`,
        })),
      }));

      // Prepare tabs array with icons for the sidebar-tabs template
      const tabDefs = this.constructor.TABS.primary.tabs
        .filter((tab) => actor.type === "teen" || tab.id !== "scars")
        .map((tab) => ({
          ...tab,
          active: partContext.tabs[tab.id]?.active || false,
          cssClass: partContext.tabs[tab.id]?.cssClass || "",
        }));
      partContext.tabsArray = tabDefs;
    }

    return partContext;
  }

  /** @override */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
  }

  /**
   * @override
   * Attach event listeners to rendered template parts
   * Adds contextmenu (right-click) handling for experience boxes
   */
  _attachPartListeners(partId, htmlElement, options) {
    super._attachPartListeners(partId, htmlElement, options);

    // Add contextmenu listener for experience boxes
    const expBoxes = htmlElement.querySelectorAll('[data-action="expChange"]');
    for (const box of expBoxes) {
      box.addEventListener("contextmenu", (event) => {
        tftloopActorSheetV2.#onExpChange.call(this, event, box);
      });
    }

    if (partId === "main") {
      const previews = htmlElement.querySelectorAll(".pride-shame-preview");
      for (const preview of previews) {
        const refresh = () => tftloopActorSheetV2.#updatePrideShameTruncation(preview);
        refresh();
        preview.addEventListener("mouseenter", refresh);
      }
    }
  }

  /**
   * Toggle truncation class for Pride/Shame preview text.
   * @private
   */
  static #updatePrideShameTruncation(previewElement) {
    if (!(previewElement instanceof HTMLElement)) return;
    const viewport = previewElement.querySelector(".pride-shame-preview-text");
    const track = previewElement.querySelector(".pride-shame-preview-track");
    if (!(viewport instanceof HTMLElement) || !(track instanceof HTMLElement)) return;

    const isTruncated = track.scrollWidth - viewport.clientWidth > 1;
    previewElement.classList.toggle("is-truncated", isTruncated);
  }

  /**
   * Handle form submission
   */
  // Use the default ActorSheetV2/ApplicationV2 form pipeline.

  /** @override */
  _onChangeForm(formConfig, event) {
    return super._onChangeForm(formConfig, event);
  }

  /** @override */
  async _onSubmitForm(formConfig, event) {
    return super._onSubmitForm(formConfig, event);
  }

  /** @override */
  _processFormData(event, form, formData) {
    return super._processFormData(event, form, formData);
  }

  /** @override */
  _prepareSubmitData(event, form, formData, updateData) {
    return super._prepareSubmitData(event, form, formData, updateData);
  }

  /** @override */
  async _processSubmitData(event, form, submitData, options) {
    await super._processSubmitData(event, form, submitData, options);
  }

  /**
   * Handle checkboxToggle helper clicks (for pride/shame checkboxes)
   * @private
   */
  /*
  static async #onToggleBoolean(event, target) {
    event.preventDefault();
    event.stopPropagation();
    const toggle = target.dataset.toggle;
    if (toggle) {
      const currentValue = this.actor.system[toggle];
      await this.actor.update({ [`system.${toggle}`]: !currentValue });
    }
  }
  */

  /**
   * Toggle the accepted status of a scar
   * @private
   */
  static async #onToggleScarAccepted(event, target) {
    const itemId = target.closest(".item")?.dataset.itemId;
    if (itemId) {
      const item = this.actor.getEmbeddedDocument("Item", itemId);
      const currentValue = item.system.accepted;
      await item.update({ "system.accepted": !currentValue });
    }
  }

  /**
   * Use one luck point (increment luck.value)
   * @private
   */
  static async #onUseLuck(event, _target) {
    event.preventDefault();
    event.stopPropagation();
    await this.actor.adjustLuck(1);
  }

  /**
   * Reset luck points to zero
   * @private
   */
  static async #onResetLuck(_event, _target) {
    await this.actor.resetLuck();
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
   * Handle experience box clicks (increment) and right-clicks (decrement)
   * @private
   */
  static async #onExpChange(event, _target) {
    event.preventDefault();
    const delta = event.type === "contextmenu" ? -1 : 1;
    await this.actor.adjustExperience(delta);
  }

  /**
   * Create a new embedded item
   * @private
   */
  static async #onCreateItem(event, target) {
    const itemType = target.dataset.type;
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

  /**
   * Edit an inline item field
   * @private
   */
  static async #onEditItem(event, target) {
    const itemId = target.closest(".item")?.dataset.itemId;
    const field = target.dataset.field;

    if (itemId && field) {
      const item = this.actor.getEmbeddedDocument("Item", itemId);
      await item.update({ [field]: target.value });
    }
  }

  /**
   * Roll an attribute (body, tech, heart, mind)
   * @private
   */
  static async #onRollAttribute(event, target) {
    event.preventDefault();
    const stat = target.dataset.stat;
    if (!stat) return;

    await this.actor.rollAttribute(stat);
  }

  /**
   * Roll a skill
   * @private
   */
  static async #onRollSkill(event, target) {
    event.preventDefault();
    const attrId = target.dataset.attr;
    const skillId = target.dataset.skill;
    if (!attrId || !skillId) return;

    await this.actor.rollSkill(attrId, skillId);
  }
}
