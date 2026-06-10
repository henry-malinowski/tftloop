/**
 * Base data model for Player Character types (Kid and Teen)
 * @module documents/actor/base-pc-data-model
 */

const { SchemaField, NumberField, BooleanField, StringField, HTMLField } = foundry.data.fields;

export const PC_RULES = Object.freeze({
  experience: {
    min: 0,
    max: 10,
  },
  luck: {
    min: 0,
  },
});

/**
 * Creates a bounded NumberField for attributes and skills
 * All have max: 5 and initial: 0, but min varies (attributes: 1, skills: 0)
 * @param {number} min - Minimum value
 * @returns {NumberField}
 */
function createBoundedNumberField(min) {
  return new NumberField({
    required: true,
    integer: true,
    min: min,
    max: 5,
    initial: min,
  });
}

/**
 * Creates a SchemaField for a skill group (body, tech, heart, or mind)
 * @param {string[]} skillNames - Array of skill names for this attribute
 * @returns {SchemaField}
 */
function createSkillGroupSchema(skillNames) {
  const skillFields = {};
  for (const skillName of skillNames) {
    skillFields[skillName] = createBoundedNumberField(0);
  }
  return new SchemaField(skillFields);
}

/**
 * Base data model for Player Character types (Kid and Teen)
 * Defines shared schema: attributes, skills, and conditions
 */
export class BasePcDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      // Attributes schema (body, tech, heart, mind)
      attributes: new SchemaField({
        body: createBoundedNumberField(1),
        tech: createBoundedNumberField(1),
        heart: createBoundedNumberField(1),
        mind: createBoundedNumberField(1),
      }),

      // Skills schema (nested by attribute)
      skills: new SchemaField({
        body: createSkillGroupSchema(["sneak", "force", "move"]),
        tech: createSkillGroupSchema(["tinker", "program", "calculate"]),
        heart: createSkillGroupSchema(["contact", "charm", "lead"]),
        mind: createSkillGroupSchema(["investigate", "comprehend", "empathize"]),
      }),

      // Conditions schema (labels used by formGroup + localize)
      conditions: new SchemaField({
        upset: new BooleanField({ initial: false, label: "tftloop.upset" }),
        scared: new BooleanField({ initial: false, label: "tftloop.scared" }),
        exhausted: new BooleanField({
          initial: false,
          label: "tftloop.exhausted",
        }),
        injured: new BooleanField({ initial: false, label: "tftloop.injured" }),
      }),

      // Common narrative fields (shared by Kid and Teen)
      type: new StringField({ label: "tftloop.type" }),
      drive: new StringField({ label: "tftloop.drive" }),
      anchor: new StringField({ label: "tftloop.anchor" }),
      problem: new StringField({ label: "tftloop.problem" }),
      description: new StringField({ label: "tftloop.description" }),
      favoriteSong: new StringField({ label: "tftloop.favSong" }),
      exp: new NumberField({
        required: true,
        integer: true,
        min: PC_RULES.experience.min,
        max: PC_RULES.experience.max,
        initial: 0,
      }),

      // Iconic item (shared structure)
      iconicItem: new SchemaField({
        desc: new StringField({ initial: "Item" }),
        bonus: new NumberField({ required: true, integer: true, initial: 2 }),
      }),

      // Notes (ProseMirror) - shared structure
      notes: new SchemaField({
        value: new HTMLField({ initial: "Notes" }),
      }),
    };
  }

  get isBroken() {
    return (
      this.conditions.upset &&
      this.conditions.scared &&
      this.conditions.exhausted &&
      this.conditions.injured
    );
  }
}
