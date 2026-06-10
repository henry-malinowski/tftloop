/**
 * Data model for "npc" type Actors
 * NPCs use a minimal schema - only notes field
 * Special characteristics are embedded Items, not system fields
 * @module documents/actor/npc-data-model
 */

const { SchemaField, HTMLField } = foundry.data.fields;

/**
 * Data model for "npc" type Actors
 */
export class NpcDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      notes: new SchemaField({
        value: new HTMLField({ initial: "" }),
      }),
    };
  }
}
