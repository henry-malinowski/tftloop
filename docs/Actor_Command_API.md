# Actor Command API

The `TftloopActor` document exposes actor-focused commands for integrations such as Token Action HUD. External modules should call these methods instead of reading sheet state or recomputing Tales from the Loop rules.

Rules and bounds are owned by the system data model and actor document. The actor API validates actor type, data-model keys, derived values, and update paths before mutating state.

## Rolling

- `actor.rollAttribute(attributeId)` opens the system roll flow for a player-character attribute.
- `actor.rollSkill(attributeId, skillId)` opens the system roll flow for a player-character skill.

Both methods return `true` when a roll flow is started and `false` when the actor or key is unsupported.

## State Commands

- `actor.toggleCondition(conditionId)` toggles a player-character condition key.
- `actor.togglePrideCheck()` toggles the kid pride-use marker.
- `actor.toggleShameCheck()` toggles the teen shame-use marker.
- `actor.adjustExperience(delta)` adjusts experience by a positive or negative delta within data-model bounds.
- `actor.adjustLuck(delta)` adjusts spent luck by a positive or negative delta within kid luck bounds.
- `actor.resetLuck()` resets spent luck to the data-model minimum.

These commands return `true` when they apply an update and `false` when the command does not apply to the actor.

## Read Surface

- `actor.canUseLuck` reports whether the actor currently has spendable luck under derived system state.
- `actor.experienceMax` reports the player-character experience maximum exposed by the data model.

Integrations may use these read properties for presentation, but command methods remain the authority for whether a state mutation is legal.
