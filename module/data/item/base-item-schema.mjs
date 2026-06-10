/**
 * Base schema shared by all Item types
 * @module documents/item/base-item-schema
 */

const { StringField, HTMLField } = foundry.data.fields;

/**
 * Base schema shared by all Item types
 */
export class BaseItemSchema extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new StringField({ initial: "" }),
      notes: new HTMLField({ initial: "" }),
    };
  }
}
