/**
 * ═══ AI STRATEGY DOCUMENTATION ═══
 * 
 * The AI logic for Políglota Hambriento bots.
 * 
 * Note: The AI functions (runAITurn, doAIFinish) are defined inside the main
 * PoliglotaHambriento component because they need direct access to React state
 * (players, cp, deck, discard, etc.) and state setters. Extracting them would
 * require passing 15+ parameters which would make the code harder to maintain.
 * 
 * ═══ STRATEGY OVERVIEW ═══
 * 
 * The AI follows a priority-based decision system:
 * 
 * 1. PLAY NEEDED INGREDIENT (highest priority)
 *    - Checks hand for ingredients that match the current burger objective
 *    - Only plays if the ingredient's language matches a main hat
 *    - Wildcards (perritos) are used for the most needed non-pan ingredient
 * 
 * 2. PLAY ACTION CARD (if no ingredient available)
 *    - Skips negacion (saved for defense) and basurero (low value)
 *    - Mass removal cards (milanesa, ensalada, pizza, parrilla): affects all opponents
 *    - Targeted cards: targets the player with the most table ingredients
 *    - Cambio sombrero: switches to a hat matching needed ingredient languages
 *    - Ladron: steals from random opponent, handles victim hat replacement
 * 
 * 3. DISCARD (if nothing can be played)
 *    - Discards the least valuable card (prefers discarding action cards)
 *    - Logs the discard
 * 
 * ═══ TIMING ═══
 * 
 * - AI turn starts after 1000ms delay from transition dismiss
 * - AI actions resolve with 1400ms delay before finishing turn
 * - Between consecutive AI turns, there's a 1000ms pause
 * - Human player sees transition screen between their turns
 * 
 * ═══ HAT STEALING ═══
 * 
 * When AI steals a human's last main hat:
 * - AI turn pauses
 * - Human sees modal to pick replacement from perchero
 * - After selection, AI turn continues with doAIFinish
 * 
 * When AI steals another AI's last hat:
 * - Victim auto-picks first perchero hat
 * - No pause needed
 */

export const AI_STRATEGY_VERSION = "1.0";
