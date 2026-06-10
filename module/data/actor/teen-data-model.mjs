/**
 * Data model for "teen" type Actors
 * @module documents/actor/teen-data-model
 */

const { StringField, NumberField, BooleanField } = foundry.data.fields;

import { BasePcDataModel } from "./base-pc-data-model.mjs";
import { migratePlayerCharacterData } from "./migration.mjs";

/**
 * Data model for "teen" type Actors
 */
export class TeenDataModel extends BasePcDataModel {
  static defineSchema() {
    return {
      // Inherit shared PC schema (attributes, skills, conditions)
      ...super.defineSchema(),

      // Age (teen-specific initial value)
      age: new NumberField({
        required: true,
        integer: true,
        min: 14,
        max: 19,
        initial: 14,
        label: "tftloop.age",
      }),

      // Teen-specific narrative fields
      shame: new StringField({ initial: "Shame", label: "tftflood.shame" }),
      shameCheck: new BooleanField({ initial: false }),
      friction: new StringField({
        initial: "Friction",
        label: "tftflood.friction",
      }),
    };
  }

  /**
   * Migrate legacy teen data to v5 schema
   * @param {object} source - The source data to migrate
   * @returns {object} The migrated data
   */
  static migrateData(source) {
    migratePlayerCharacterData(source);
    return super.migrateData(source);
  }
}
