/**
 * Data model for "item" type Items (equipment with bonus)
 * @module documents/item/item-data-model
 */

import { BaseItemSchema } from "./base-item-schema.mjs";

const { NumberField } = foundry.data.fields;

/**
 * Data model for "item" type Items (equipment with bonus)
 */
export class ItemDataModel extends BaseItemSchema {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      bonus: new NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 1,
      }),
    };
  }
}
