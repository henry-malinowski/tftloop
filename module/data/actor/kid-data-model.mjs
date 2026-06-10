/**
 * Data model for "kid" type Actors
 * @module documents/actor/kid-data-model
 */

const { SchemaField, StringField, NumberField, BooleanField } = foundry.data.fields;

import { BasePcDataModel, PC_RULES } from "./base-pc-data-model.mjs";
import { migratePlayerCharacterData } from "./migration.mjs";

/**
 * Data model for "kid" type Actors
 */
export class KidDataModel extends BasePcDataModel {
  static defineSchema() {
    return {
      // Inherit shared PC schema (attributes, skills, conditions)
      ...super.defineSchema(),

      // Age (kid-specific initial value)
      age: new NumberField({
        required: true,
        integer: true,
        min: 10,
        max: 15,
        initial: 10,
        label: "tftloop.age",
      }),

      // Kid-specific narrative fields
      pride: new StringField({ initial: "Pride", label: "tftloop.pride" }),
      prideCheck: new BooleanField({ initial: false }),
      hideout: new StringField({ initial: "Hideout Notes" }),

      // Luck (no max field - computed)
      luck: new SchemaField({
        value: new NumberField({
          required: true,
          integer: true,
          min: PC_RULES.luck.min,
          initial: 0,
        }),
      }),
    };
  }

  /**
   * Migrate legacy kid data to v5 schema
   * @param {object} source - The source data to migrate
   * @returns {object} The migrated data
   */
  static migrateData(source) {
    migratePlayerCharacterData(source);
    return super.migrateData(source);
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    // set the updated value here for use on the check boxes on the kid character sheet
    this.luck.max = 15 - Number(this.age);
    this.curLuck = Math.max(PC_RULES.luck.min, this.luck.max - this.luck.value);
  }
}
