/**
 * TFTLOOP Actor document class
 * @module documents/actor/actor
 */

import { BasePcDataModel, PC_RULES } from "../../data/actor/base-pc-data-model.mjs";
import RollDialog from "../../applications/roll-dialog.mjs";

const ROLL_ACTOR_TYPES = new Set(["kid", "teen"]);

/**
 * Check if an actor type is a Player Character type
 * @param {string} actorType - The actor type (e.g., "kid", "teen", "npc")
 * @returns {boolean} True if the actor type uses a PC data model
 */
function isPlayerCharacterType(actorType) {
  const dataModel = CONFIG.Actor.dataModels[actorType];
  return dataModel.prototype instanceof BasePcDataModel;
}

function getActiveRollConditions(actor) {
  return Object.entries(actor.system?.conditions ?? {})
    .filter(([key, value]) => key !== "broken" && value)
    .map(([key]) => key);
}

function hasOwnKey(object, key) {
  return Object.prototype.hasOwnProperty.call(object ?? {}, key);
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

export default class TftloopActor extends Actor {
  /**
   * Whether this actor can spend luck under the current data-model state.
   * @returns {boolean}
   */
  get canUseLuck() {
    return (
      this.type === "kid" &&
      typeof this.system?.luck?.value === "number" &&
      Number(this.system?.luck?.max) > PC_RULES.luck.min
    );
  }

  /**
   * Maximum experience supported by the player-character data model.
   * @returns {number}
   */
  get experienceMax() {
    return PC_RULES.experience.max;
  }

  /**
   * @override
   */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    const isPlayerCharacter = isPlayerCharacterType(this.type);
    const displayName = isPlayerCharacter
      ? CONST.TOKEN_DISPLAY_MODES.HOVER
      : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER;

    let actorDefaults = {
      "prototypeToken.displayName": displayName,
      "prototypeToken.displayBars": CONST.TOKEN_DISPLAY_MODES.NONE,
      "prototypeToken.disposition": CONST.TOKEN_DISPOSITIONS.FRIENDLY,
      "prototypeToken.actorLink": isPlayerCharacter,
      "prototypeToken.name": `${data.name}`,
      "prototypeToken.sight.enabled": true,
      "prototypeToken.sight.range": 30,
    };

    this.updateSource(actorDefaults);
  }

  async rollAttribute(attrId) {
    if (!ROLL_ACTOR_TYPES.has(this.type) || !attrId) {
      return false;
    }

    const attributes = this.system?.attributes;
    if (!hasOwnKey(attributes, attrId)) {
      return false;
    }

    await RollDialog.show(this, {
      rolled: attrId,
      attributeValue: Number(attributes[attrId]),
      conditions: getActiveRollConditions(this),
    });

    return true;
  }

  async rollSkill(attrId, skillId) {
    if (!ROLL_ACTOR_TYPES.has(this.type) || !attrId || !skillId) {
      return false;
    }

    const attributes = this.system?.attributes;
    const skills = this.system?.skills?.[attrId];

    if (!hasOwnKey(attributes, attrId) || !hasOwnKey(skills, skillId)) {
      return false;
    }

    await RollDialog.show(this, {
      rolled: `${attrId}.${skillId}`,
      attributeValue: Number(attributes[attrId]),
      skillValue: Number(skills[skillId]),
      conditions: getActiveRollConditions(this),
    });

    return true;
  }

  /**
   * Toggle one player-character condition.
   * @param {string} conditionId - Condition key from the actor data model.
   * @returns {Promise<boolean>} Whether the condition was toggled.
   */
  async toggleCondition(conditionId) {
    if (!ROLL_ACTOR_TYPES.has(this.type) || !hasOwnKey(this.system?.conditions, conditionId)) {
      return false;
    }

    await this.update({
      [`system.conditions.${conditionId}`]: !this.system.conditions[conditionId],
    });

    return true;
  }

  /**
   * Toggle the kid pride use marker.
   * @returns {Promise<boolean>} Whether the marker was toggled.
   */
  async togglePrideCheck() {
    if (this.type !== "kid" || typeof this.system?.prideCheck !== "boolean") {
      return false;
    }

    await this.update({ "system.prideCheck": !this.system.prideCheck });
    return true;
  }

  /**
   * Toggle the teen shame use marker.
   * @returns {Promise<boolean>} Whether the marker was toggled.
   */
  async toggleShameCheck() {
    if (this.type !== "teen" || typeof this.system?.shameCheck !== "boolean") {
      return false;
    }

    await this.update({ "system.shameCheck": !this.system.shameCheck });
    return true;
  }

  /**
   * Adjust earned experience within the system data-model bounds.
   * @param {number} delta - Positive or negative amount to apply.
   * @returns {Promise<boolean>} Whether experience was adjusted.
   */
  async adjustExperience(delta) {
    if (!ROLL_ACTOR_TYPES.has(this.type) || !Number.isFinite(delta)) {
      return false;
    }

    const currentExp = Number(this.system?.exp);
    if (!Number.isFinite(currentExp)) {
      return false;
    }

    const nextExp = clampNumber(
      currentExp + delta,
      PC_RULES.experience.min,
      PC_RULES.experience.max,
    );
    await this.update({ "system.exp": nextExp });
    return true;
  }

  /**
   * Adjust spent luck within the kid data-model bounds.
   * @param {number} delta - Positive or negative amount to apply.
   * @returns {Promise<boolean>} Whether luck was adjusted.
   */
  async adjustLuck(delta) {
    if (!this.canUseLuck || !Number.isFinite(delta)) {
      return false;
    }

    const currentLuck = Number(this.system?.luck?.value);
    const maxLuck = Number(this.system?.luck?.max);
    if (!Number.isFinite(currentLuck) || !Number.isFinite(maxLuck)) {
      return false;
    }

    const nextLuck = clampNumber(currentLuck + delta, PC_RULES.luck.min, maxLuck);
    await this.update({ "system.luck.value": nextLuck });
    return true;
  }

  /**
   * Reset spent luck to zero.
   * @returns {Promise<boolean>} Whether luck was reset.
   */
  async resetLuck() {
    if (this.type !== "kid" || typeof this.system?.luck?.value !== "number") {
      return false;
    }

    await this.update({ "system.luck.value": PC_RULES.luck.min });
    return true;
  }
}
