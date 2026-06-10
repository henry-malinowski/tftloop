/**
 * Migration functions for Actor data models
 * @module data/actor/migration
 */

/**
 * Migrate flat attribute/skill/condition fields to nested schema
 * Shared migration logic for Kid and Teen actors
 * @param {object} source - The source data object to migrate
 * @returns {object} The migrated source object
 */
export function migratePlayerCharacterData(source) {
  // Ensure nested containers exist
  source.attributes = source.attributes || {};
  source.skills = source.skills || {};
  source.skills.body = source.skills.body || {};
  source.skills.tech = source.skills.tech || {};
  source.skills.heart = source.skills.heart || {};
  source.skills.mind = source.skills.mind || {};
  source.conditions = source.conditions || {};

  // Migrate attributes from flat to nested
  if (source.body !== undefined) {
    source.attributes.body = source.body;
    delete source.body;
  }
  if (source.tech !== undefined) {
    source.attributes.tech = source.tech;
    delete source.tech;
  }
  if (source.heart !== undefined) {
    source.attributes.heart = source.heart;
    delete source.heart;
  }
  if (source.mind !== undefined) {
    source.attributes.mind = source.mind;
    delete source.mind;
  }

  // Migrate body skills from flat to nested
  if (source.sneak !== undefined) {
    source.skills.body.sneak = source.sneak;
    delete source.sneak;
  }
  if (source.force !== undefined) {
    source.skills.body.force = source.force;
    delete source.force;
  }
  if (source.move !== undefined) {
    source.skills.body.move = source.move;
    delete source.move;
  }

  // Migrate tech skills from flat to nested
  if (source.tinker !== undefined) {
    source.skills.tech.tinker = source.tinker;
    delete source.tinker;
  }
  if (source.program !== undefined) {
    source.skills.tech.program = source.program;
    delete source.program;
  }
  if (source.calculate !== undefined) {
    source.skills.tech.calculate = source.calculate;
    delete source.calculate;
  }

  // Migrate heart skills from flat to nested
  if (source.contact !== undefined) {
    source.skills.heart.contact = source.contact;
    delete source.contact;
  }
  if (source.charm !== undefined) {
    source.skills.heart.charm = source.charm;
    delete source.charm;
  }
  if (source.lead !== undefined) {
    source.skills.heart.lead = source.lead;
    delete source.lead;
  }

  // Migrate mind skills from flat to nested
  if (source.investigate !== undefined) {
    source.skills.mind.investigate = source.investigate;
    delete source.investigate;
  }
  if (source.comprehend !== undefined) {
    source.skills.mind.comprehend = source.comprehend;
    delete source.comprehend;
  }
  if (source.empathize !== undefined) {
    source.skills.mind.empathize = source.empathize;
    delete source.empathize;
  }

  // Migrate conditions from flat to nested (only if nested is missing)
  if (source.upset !== undefined && source.conditions.upset === undefined) {
    source.conditions.upset = source.upset;
    delete source.upset;
  }
  if (source.scared !== undefined && source.conditions.scared === undefined) {
    source.conditions.scared = source.scared;
    delete source.scared;
  }
  if (source.exhausted !== undefined && source.conditions.exhausted === undefined) {
    source.conditions.exhausted = source.exhausted;
    delete source.exhausted;
  }
  if (source.injured !== undefined && source.conditions.injured === undefined) {
    source.conditions.injured = source.injured;
    delete source.injured;
  }
  if (source.broken !== undefined) {
    delete source.broken;
  }
  if (source.conditions?.broken !== undefined) {
    delete source.conditions.broken;
  }

  // Delete removed/deprecated fields
  delete source.dicePool;
  delete source.curLuck;
  if (source.luck) {
    delete source.luck.max;
  }

  return source;
}
