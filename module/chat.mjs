/*
 * Apply theme class to the chat message based on the chat-card theme
 * @param {ChatMessage} _message - The message object
 * @param {HTMLElement} html - li.chat-message.message.flexcol
 * @param {Object} _data - The data object
 * @returns {void}
 */
export const applyChatMessageTheme = function (_message, html, _data) {
  const card = html.querySelector("div.tftloop.chat-card");

  if (card) {
    // Check if chat-card has a theme class
    const themeClass = card.classList.contains("theme-loop")
      ? "theme-loop"
      : card.classList.contains("theme-flood")
        ? "theme-flood"
        : null;

    if (themeClass) {
      // Add theme class to the message element (li.message)
      html.classList.add(themeClass);
    }
  }
};

export const hideChatActionButtons = function (_message, html, _data) {
  const card = html.querySelectorAll("div.tftloop.chat-card");

  if (card.length > 0) {
    let actor = game.actors.get(card[0].dataset.actorId);
    if (actor && !actor.isOwner) {
      const button = html.querySelectorAll("button.reroll");
      for (let i = 0; i < button.length; i++) {
        button[i].style.display = "none";
      }
    }
  }
};

export function addChatListeners(html) {
  const button = html.querySelectorAll("button.reroll");
  for (let i = 0; i < button.length; i++) {
    button[i].addEventListener("click", onReroll);
  }
}

//TODO add the sucesses from the first roll to the push
async function onReroll(event) {
  const card = event.currentTarget;
  let actor = game.actors.get(card.dataset.ownerId);

  let dicePool = card.dataset.dicepool;
  let rollFormula = dicePool + "d6cs6";

  let rolled = card.dataset.tested;

  let r = new Roll(rollFormula, actor.system);
  await r.evaluate();

  let rollValue = r.total;
  let rollTooltip = await Promise.resolve(r.getTooltip());

  // Determine success text using nested keys with language-aware plural selection.
  // Prefer Foundry V14's shared i18n plural rules when available, and fall back for V13.
  const pluralRules = game.i18n.pluralRules ?? new Intl.PluralRules(game.i18n.lang);
  const pluralKey = rollValue === 0 ? "0" : pluralRules.select(rollValue);
  const key = `tftloop.rollResult.${pluralKey}`;
  const fallbackKey = "tftloop.rollResult.other";
  const sucessText = game.i18n.format(game.i18n.has(key) ? key : fallbackKey, {
    count: rollValue,
  });

  let reRollDiceFormula = Number(dicePool - r.total);

  // Generate chat message using shared template
  const RollDialogModule = await import("./applications/roll-dialog.mjs");
  const chatHTML = await RollDialogModule.default._generateChatMessage(
    actor,
    rolled,
    r,
    rollTooltip,
    sucessText,
    reRollDiceFormula,
    true,
  );

  await r.toMessage(
    {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      content: chatHTML,
    },
    {
      create: true,
      rollMode: game.settings.get("core", "rollMode"),
    },
  );
}
