/**
 * Data model for "specialCharacteristic" type Items (NPC traits)
 * @module documents/item/special-characteristic-data-model
 */

import { BaseItemSchema } from "./base-item-schema.mjs";

const { NumberField } = foundry.data.fields;

/**
 * Data model for "specialCharacteristic" type Items (NPC traits)
 */
export class SpecialCharacteristicDataModel extends BaseItemSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      number: new NumberField({
        required: true,
        integer: true,
        min: 1,
        initial: 1,
      }),
    };
  }
}
