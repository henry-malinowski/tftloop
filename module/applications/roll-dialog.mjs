/**
 * RollDialog - A modern ApplicationV2-based roll dialog for Tales from the Loop.
 * Replaces the legacy _poolBuilder method with a cleaner, maintainable implementation.
 * @module applications/roll-dialog
 */

// Access Foundry's ApplicationV2 and HandlebarsApplicationMixin
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { renderTemplate } = foundry.applications.handlebars;
const { FormDataExtended } = foundry.applications.ux;

/**
 * RollDialog - A modern ApplicationV2-based roll dialog for Tales from the Loop.
 * Replaces the legacy _poolBuilder method with a cleaner, maintainable implementation.
 * @extends {ApplicationV2}
 * @mixes HandlebarsApplication
 */
export default class RollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(actor, rollOptions, options = {}) {
    // Determine theme class based on actor type
    const themeClass = actor.type === "teen" ? "theme-flood" : "theme-loop";

    // Merge theme class into options, ensuring we include default classes
    const defaultClasses = RollDialog.DEFAULT_OPTIONS.classes || [];
    const optionClasses = options.classes || [];
    const mergedOptions = foundry.utils.mergeObject(options, {
      classes: [...defaultClasses, ...optionClasses, themeClass],
    });

    super(mergedOptions);
    this.actor = actor;
    this.rollOptions = rollOptions;
    this.rolled = rollOptions.rolled;
    this.themeClass = themeClass; // Store for later reference
    this.poolData = this.constructor._calculatePool(rollOptions);
  }

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    id: "roll-dialog-{id}",
    tag: "form",
    classes: ["tftloop", "roll-dialog"],
    window: {
      title: "tftloop.diceRoll",
      icon: "fas fa-dice",
    },
    position: {
      width: 300,
      height: "auto",
    },
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
    },
  };

  /** @override */
  static PARTS = {
    form: {
      id: "form",
      template: "systems/tftloop/templates/ui/roll-dialog.hbs",
    },
  };

  /**
   * Static entry point to show the roll dialog.
   * @param {Actor} actor - The actor making the roll
   * @param {object} rollOptions - The roll configuration
   * @param {string} rollOptions.rolled - The stat/skill key (e.g. "body" or "body.sneak")
   * @param {number} rollOptions.attributeValue - The attribute value
   * @param {number} [rollOptions.skillValue] - The skill value (for skill rolls)
   * @param {string[]} [rollOptions.conditions] - Active condition keys (excluding "broken")
   * @returns {Promise<void>}
   */
  static async show(actor, rollOptions) {
    const data = actor.system;

    // If broken, show notification instead of dialog
    if (data.isBroken) {
      ui.notifications.info(game.i18n.localize("tftloop.brokeFail"));
      return;
    }

    const dialog = new RollDialog(actor, rollOptions);
    await dialog.render(true);
  }

  /**
   * Calculate the initial dice pool based on the rolled stat/skill.
   * @param {object} rollOptions - The roll configuration
   * @param {number} [itemBonus=0] - Bonus dice from item selection
   * @param {number} [bonusDice=0] - Additional bonus dice
   * @returns {Object} Pool data with details for display
   */
  static _calculatePool(rollOptions, itemBonus = 0, bonusDice = 0) {
    const { rolled, attributeValue, skillValue, conditions = [] } = rollOptions;
    let pool = Number(attributeValue) + (Number(skillValue) || 0);
    const details = [];

    // Base pool details (attribute + optional skill)
    if (rolled.includes(".")) {
      const [attrId, skillId] = rolled.split(".");
      details.push({
        label: game.i18n.localize(`tftloop.${attrId}`),
        value: Number(attributeValue),
        modifier: `+${Number(attributeValue)}`,
      });
      details.push({
        label: game.i18n.localize(`tftloop.${skillId}`),
        value: Number(skillValue) || 0,
        modifier: `+${Number(skillValue) || 0}`,
      });
    } else {
      details.push({
        label: game.i18n.localize(`tftloop.${rolled}`),
        value: Number(attributeValue),
        modifier: `+${Number(attributeValue)}`,
      });
    }

    const conditionDetails = [];
    for (const conditionKey of conditions) {
      pool -= 1;
      conditionDetails.push({
        label: game.i18n.localize(`tftloop.${conditionKey}`),
        value: -1,
        modifier: "-1",
        isPenalty: true,
      });
    }

    // Add bonuses from items and bonus dice
    pool += itemBonus + bonusDice;

    // Ensure minimum pool of 1
    const finalPool = pool <= 0 ? 1 : pool;

    return {
      pool: finalPool,
      basePool: pool,
      details: [...details, ...conditionDetails],
    };
  }

  /**
   * Prepare context data for the template.
   * @param {ApplicationRenderOptions} _options - Render options (unused)
   * @returns {Promise<Object>}
   */
  async _prepareContext(_options) {
    const data = this.actor.system;
    const items = this.actor.items.filter((item) => item.type === "item");

    // Extract the key for localization (last part after splitting on '.')
    // "body" -> "body", "body.sneak" -> "sneak"
    const rolledKey = this.rolled.split(".").pop();

    return {
      rolled: this.rolled,
      rolledLabel: game.i18n.localize(`tftloop.${rolledKey}`),
      poolData: this.poolData,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        bonus: item.system.bonus || 0,
      })),
      iconicItem: {
        desc: data.iconicItem?.desc || "",
        bonus: data.iconicItem?.bonus || 2,
      },
      systemTheme: this.themeClass,
    };
  }

  /**
   * Handle form field changes to update pool count display.
   * @param {ApplicationFormConfiguration} formConfig - Form configuration
   * @param {Event} event - Change event
   * @returns {void}
   */
  _onChangeForm(formConfig, event) {
    // Only update if the changed field is one we care about
    if (event.target.name !== "useItem" && event.target.name !== "bonusDice") {
      return;
    }

    // Get form data using FormDataExtended
    const form = event.target.form;
    const formData = new FormDataExtended(form);
    const data = formData.object;
    const itemBonus = Number(data.useItem) || 0;
    const bonusDice = Number(data.bonusDice) || 0;

    // Recalculate pool with bonuses
    this.poolData = this.constructor._calculatePool(this.rollOptions, itemBonus, bonusDice);

    // Update the pool count display
    const formPart = this.parts?.form;
    if (formPart) {
      const poolCountElement = formPart.querySelector(".pool-count");
      if (poolCountElement) {
        const currentPoolLabel = game.i18n.localize("tftloop.currentPool");
        const diceLabel = game.i18n.localize("tftloop.dice");
        poolCountElement.textContent = `${currentPoolLabel}: ${this.poolData.pool} ${diceLabel}`;
      }
    }
  }

  /**
   * Handle form submission.
   * @param {ApplicationFormConfiguration} formConfig - Form configuration
   * @param {SubmitEvent} event - Submit event
   * @returns {Promise<void>}
   */
  async _onSubmitForm(formConfig, event) {
    // Prevent default form submission (which would cause URL navigation)
    event.preventDefault();

    // Use the pool data that's already been kept up to date by _onChangeForm
    const finalPool = this.poolData.pool;
    const actor = this.actor;
    const rolled = this.rolled;

    // Create and evaluate the roll
    const rollFormula = `${finalPool}d6cs6`;
    const r = new Roll(rollFormula, actor.system);
    await r.evaluate();

    // Determine success text using nested keys with language-aware plural selection
    const rollValue = r.total;
    // Use Intl.PluralRules to get the correct plural category for the language
    // Supports all ICU plural categories (zero, one, two, few, many, other)
    const pluralKey = this._getPluralKey(rollValue, game.i18n.lang);
    const key = `tftloop.rollResult.${pluralKey}`;
    // Fall back to "other" if the specific category key doesn't exist
    const fallbackKey = "tftloop.rollResult.other";
    const successText = game.i18n.format(game.i18n.localize(key) !== key ? key : fallbackKey, {
      count: rollValue,
    });

    // Calculate reroll pool (remaining dice)
    const reRollDiceFormula = Number(finalPool - rollValue);

    // Generate chat message HTML
    const rollTooltip = await Promise.resolve(r.getTooltip());
    const chatHTML = await this.constructor._generateChatMessage(
      actor,
      rolled,
      r,
      rollTooltip,
      successText,
      reRollDiceFormula,
    );

    await r.toMessage(
      {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: chatHTML,
      },
      {
        create: true,
        rollMode: game.settings.get("core", "rollMode"),
      },
    );

    // Close the dialog
    this.close();
  }

  /**
   * Generate the chat message HTML for the roll result.
   * @param {Actor} actor - The actor making the roll
   * @param {string} rolled - The stat/skill rolled
   * @param {Roll} roll - The evaluated roll
   * @param {string} tooltip - The roll tooltip HTML
   * @param {string} successText - The success/failure text
   * @param {number} reRollDiceFormula - Remaining dice for reroll
   * @param {boolean} isReroll - Whether this is a reroll (default: false)
   * @returns {Promise<string>}
   */
  static async _generateChatMessage(
    actor,
    rolled,
    roll,
    tooltip,
    successText,
    reRollDiceFormula,
    isReroll = false,
  ) {
    const rollValue = roll.total;
    const systemTheme = actor.type === "teen" ? "theme-flood" : "theme-loop";

    // Extract the key for localization (last part after splitting on '.')
    // "body" -> "body", "body.sneak" -> "sneak"
    rolled = rolled.split(".").pop();

    const context = {
      actor: {
        id: actor.id,
        img: actor.img,
        systemTheme: systemTheme,
      },
      rolled,
      formula: roll._formula,
      tooltip: tooltip,
      successText: successText,
      reRollDiceFormula: reRollDiceFormula,
      isReroll: isReroll,
      rollValue: rollValue, // Pass roll value to template for conditional plus sign
    };

    return await renderTemplate("systems/tftloop/templates/ui/roll-chat-message.hbs", context);
  }

  /**
   * Get the plural key for a count value based on language plural rules.
   * Uses Intl.PluralRules to select the appropriate plural form for the language.
   * Supports all ICU plural categories: zero, one, two, few, many, other
   * Translators can add keys for any category their language needs (e.g., Russian needs few/many).
   * @param {number} count - The count value
   * @param {string} lang - The language code (e.g., "en", "ru")
   * @returns {string} The plural key ("0", "one", "few", "many", "other", etc.)
   * @private
   */
  _getPluralKey(count, lang) {
    if (count === 0) return "0";

    // Use Intl.PluralRules to get the correct plural category for the language
    const pr = new Intl.PluralRules(lang);
    const category = pr.select(count);

    // Map ICU plural categories to our key structure
    // Supports: zero (handled as "0"), one, two, few, many, other
    // Translators can add keys for any category (e.g., Russian: few, many)
    // If a specific category key doesn't exist, fall back to "other"
    return category;
  }
}
