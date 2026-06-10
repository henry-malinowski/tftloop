/**
 * Data model for "scar" type Items
 * @module documents/item/scar-data-model
 */
import { BaseItemSchema } from "./base-item-schema.mjs";

const { BooleanField } = foundry.data.fields;

/**
 * Data model for "scar" type Items
 */
export class ScarDataModel extends BaseItemSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      accepted: new BooleanField({ initial: false }),
    };
  }

  /**
   * Migrate legacy scar data
   * @param {object} source - The source data to migrate
   * @returns {object} The migrated data
   */
  static migrateData(source) {
    // Fix the typo from legacy template.json
    if ("accpted" in source) {
      source.accepted = source.accpted;
      delete source.accpted;
    }
    return super.migrateData(source);
  }
}
