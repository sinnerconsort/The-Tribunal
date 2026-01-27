/**
 * The Tribunal - Debug Slash Commands
 * For testing compartment on mobile without console access
 * 
 * Uses event listener to wait for ST to be ready
 */

import { 
    revealCompartment, 
    updateCrackStage, 
    updateFortune,
    updateBadgeInfo 
} from './ui/ledger-template.js';

// Wait for SillyTavern to be fully loaded, then register commands
jQuery(async () => {
    // Give ST a moment to initialize slash commands
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (typeof SlashCommandParser === 'undefined') {
        console.error('[The Tribunal] SlashCommandParser not available');
        return;
    }
    
    try {
        // /tribunal-reveal
        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'tribunal-reveal',
            callback: () => {
                updateCrackStage(3);
                setTimeout(() => revealCompartment(), 500);
                toastr.success('Secret compartment revealed', 'The Tribunal');
                return '';
            },
            helpString: 'Reveal the secret compartment in the Ledger tab',
        }));

        // /tribunal-crack [stage]
        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'tribunal-crack',
            callback: (args, value) => {
                const stage = parseInt(value) || 0;
                updateCrackStage(Math.max(0, Math.min(3, stage)));
                toastr.info(`Crack stage: ${stage}`, 'The Tribunal');
                return '';
            },
            unnamedArgumentList: [
                SlashCommandArgument.fromProps({
                    description: 'Crack stage (0-3)',
                    isRequired: false,
                }),
            ],
            helpString: 'Set crack stage (0-3)',
        }));

        // /tribunal-fortune [text]
        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'tribunal-fortune',
            callback: (args, value) => {
                updateFortune(value || 'The fortune is blank.', 'The Damaged Ledger');
                toastr.info('Fortune updated', 'The Tribunal');
                return '';
            },
            unnamedArgumentList: [
                SlashCommandArgument.fromProps({
                    description: 'Fortune text',
                    isRequired: false,
                }),
            ],
            helpString: 'Set fortune text',
        }));

        // /tribunal-hide
        SlashCommandParser.addCommandObject(SlashCommand.fromProps({
            name: 'tribunal-hide',
            callback: () => {
                const secretTab = document.querySelector('.ledger-subtab-secret');
                const subtabsContainer = document.querySelector('.ledger-subtabs');
                const crackLine = document.querySelector('.ledger-crack-line');
                
                secretTab?.classList.remove('revealed', 'cracking');
                subtabsContainer?.classList.remove('compartment-revealed');
                crackLine?.classList.remove('stage-1', 'stage-2', 'stage-3');
                
                document.querySelector('[data-ledger-tab="cases"]')?.click();
                toastr.info('Compartment hidden', 'The Tribunal');
                return '';
            },
            helpString: 'Hide the secret compartment',
        }));

        console.log('[The Tribunal] Debug commands registered: /tribunal-reveal, /tribunal-hide, /tribunal-crack, /tribunal-fortune');
        
    } catch (error) {
        console.error('[The Tribunal] Failed to register commands:', error);
    }
});
