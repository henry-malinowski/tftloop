export default class tftloopActorSheet extends foundry.appv1.sheets.ActorSheet {
  static get defaultOptions() {
    let loopOptions = super.defaultOptions;

    loopOptions.template = "systems/tftloop/templates/actors/character.hbs";
    loopOptions.classes.push("tftloop");
    loopOptions.classes.push("sheet");
    loopOptions.classes.push("actor");
    loopOptions.classes.push("character");
    loopOptions.classes.push("kid");
    loopOptions.width = 800;
    loopOptions.height = 950;
    loopOptions.tabs = [
      {
        navSelector: ".sheet-tabs",
        contentSelector: ".sheet-body",
        initial: "main",
      },
    ];

    return loopOptions;
  }

  get template() {
    return `systems/tftloop/templates/actors/${this.actor.type}.hbs`;
  }

  /** @override */
  async _renderInner(data) {
    // Conditionally load partials based on actor type before rendering
    const actorType = this.actor.type;
    const partials =
      actorType === "kid"
        ? [
            "systems/tftloop/templates/actors/parts/core-info.hbs",
            "systems/tftloop/templates/actors/parts/conditions-list-v1.hbs",
            "systems/tftloop/templates/actors/parts/conditions.hbs",
            "systems/tftloop/templates/actors/parts/relationships.hbs",
            "systems/tftloop/templates/actors/parts/item-hideout.hbs",
          ]
        : [
            "systems/tftloop/templates/actors/parts/core-teen.hbs",
            "systems/tftloop/templates/actors/parts/conditions-list-v1.hbs",
            "systems/tftloop/templates/actors/parts/conditions-teen.hbs",
            "systems/tftloop/templates/actors/parts/relationships-teen.hbs",
            "systems/tftloop/templates/actors/parts/teen-item-notes.hbs",
          ];

    await foundry.applications.handlebars.loadTemplates(partials);
    return super._renderInner(data);
  }

  getData() {
    const sheet = super.getData();
    sheet.config = CONFIG.tftloop;
    const actor = this.actor;

    // Schema-backed conditions partial (same shape as CharacterSheetV2 _prepareContext)
    sheet.model = actor.system;
    sheet.fields = actor.system.schema.fields;

    // Add theme class based on actor type
    const themeClass = actor.type === "teen" ? "theme-flood" : "theme-loop";
    if (!this.options.classes.includes(themeClass)) {
      this.options.classes.push(themeClass);
    }
    // Ensure cssClass includes the theme class
    sheet.cssClass = this.options.classes.join(" ");

    sheet.relationships = sheet.items.filter(function (item) {
      return item.type == "relationship";
    });

    sheet.bonusItems = sheet.items.filter(function (item) {
      return item.type == "item";
    });

    if (actor.type == "teen") {
      sheet.scars = sheet.items.filter(function (item) {
        return item.type == "scar";
      });
    }

    // Computed luck values for kid (do not persist derived values)
    if (actor.type == "kid") {
      sheet.luckMax = actor.system.luck.max;
      sheet.luckCurrent = actor.system.luck.value;
      sheet.luckRemaining = actor.system.curLuck;
    }

    sheet.francein80s = game.settings.get("tftloop", "francein80s") ? true : false;
    sheet.polishedition = game.settings.get("tftloop", "polishedition") ? true : false;

    let kidSet = {};

    kidSet = { ...sheet.config.kidTypes };

    if (sheet.francein80s) {
      kidSet = { ...kidSet, ...sheet.config.franceKids };
    }

    if (sheet.polishedition) {
      kidSet = { ...kidSet, ...sheet.config.polishKids };
    }

    sheet.kidSet = kidSet;
    sheet.selectedKidType = actor.system.type;

    sheet.teenSet = { ...sheet.config.teenTypes };
    sheet.selectedTeenType = actor.system.type;

    sheet.kidAgeSet = sheet.config.kidAgeList;
    sheet.teenAgeSet = sheet.config.teenAgeList;
    sheet.selectedAge = actor.system.age;

    return sheet;
  }

  activateListeners(html) {
    if (this.isEditable) {
      html.find(".reset-luck").click(this._resetLuck.bind(this));
      html.find(".use-luck").click(this._onUseLuck.bind(this));
      html.find(".toggle-boolean").click(this._onToggleClick.bind(this));
      html.find(".item-create").click(this._onItemCreate.bind(this));
      html.find(".inline-edit").change(this._onItemEdit.bind(this));
      html.find(".item-delete").click(this._onItemDelete.bind(this));
      html.find(".exp-boxes").on("click contextmenu", this._onExpChange.bind(this));
      html.find(".item-open").click(this._onItemOpen.bind(this));
      html.find(".sheet-body").on("drop", this._onItemDrop.bind(this));
      html.find(".item").on("drag", this._onItemDrag.bind(this));
    }

    if (this.actor.isOwner) {
      html.find('[data-action="rollAttribute"]').click(this._onRollAttribute.bind(this));
      html.find('[data-action="rollSkill"]').click(this._onRollSkill.bind(this));
    }

    super.activateListeners(html);
  }

  _onItemDrag(event) {
    event.preventDefault();

    game.data.item = this.actor.getEmbeddedDocument(
      "Item",
      event.currentTarget.closest(".item").dataset.itemId,
    );
  }

  _onItemDrop(event) {
    event.preventDefault();

    //let actor = this.actor;
    let storedItem = game.data.item;

    // remove the item from the original actor unless it is the same actor
    let originalActor = storedItem.actor;

    if (originalActor.id === this.actor.id) {
      console.log("tftloop| item dropped on self");
      return;
    }

    originalActor.deleteEmbeddedDocuments("Item", [storedItem.id]);

    console.log("tftloop| item dropped on another actor" + this.actor.id, storedItem.id);
    return;
  }

  async _onRollAttribute(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const attrId = element.dataset.attr;
    if (!attrId) return;

    await this.actor.rollAttribute(attrId);
  }

  async _onRollSkill(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const attrId = element.dataset.attr;
    const skillId = element.dataset.skill;
    if (!attrId || !skillId) return;

    await this.actor.rollSkill(attrId, skillId);
  }

  async _onExpChange(event) {
    event.preventDefault();

    const delta = event.type === "click" ? 1 : -1;
    await this.actor.adjustExperience(delta);
  }

  async _resetLuck(event) {
    event.preventDefault();

    await this.actor.resetLuck();
  }

  async _onUseLuck(event) {
    event.preventDefault();

    await this.actor.adjustLuck(1);
  }

  _onItemOpen(event) {
    event.preventDefault();

    let item = this.actor.getEmbeddedDocument(
      "Item",
      event.currentTarget.closest(".item").dataset.itemId,
    );
    item.sheet.render(true);
  }

  _onItemEdit(event) {
    event.preventDefault();
    // console.log(event);
    let element = event.currentTarget;
    let item = this.actor.getEmbeddedDocument("Item", element.closest(".item").dataset.itemId);

    // console.log(item);
    let field = element.dataset.field;
    // console.log(field);

    return item.update({ [field]: element.value });
  }

  _onItemDelete(event) {
    event.preventDefault();
    let deleteId = [event.currentTarget.closest(".info-item").dataset.itemId];

    return this.actor.deleteEmbeddedDocuments("Item", deleteId);
  }

  _onItemCreate(event) {
    event.preventDefault();

    let itemData = [
      {
        name: game.i18n.localize("tftloop.new"),
        type: event.currentTarget.dataset.type,
      },
    ];

    return this.actor.createEmbeddedDocuments("Item", itemData);
  }

  _onToggleClick(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const key = element.dataset.toggle;

    let item;
    if (element.closest(".item")) {
      item = this.actor.getEmbeddedDocument("Item", element.closest(".item").dataset.itemId);
    }

    switch (key) {
      case "accepted":
        if (item) {
          item.update({ "system.accepted": !item.system.accepted });
        }
        break;
    }
  }
}
