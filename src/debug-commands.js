/**
 * The Tribunal - Debug Slash Commands
 * For testing compartment on mobile without console access
 * 
 * Add to index.js: import './src/debug-commands.js';
 */

import { 
    revealCompartment, 
    updateCrackStage, 
    updateFortune,
    updateBadgeInfo 
} from './ui/ledger-template.js';

// Register slash commands when SillyTavern is ready
function registerDebugCommands() {
    // Check if SlashCommandParser exists
    if (typeof SlashCommandParser === 'undefined') {
        console.warn('[The Tribunal] SlashCommandParser not available, retrying...');
        setTimeout(registerDebugCommands, 1000);
        return;
    }

    // /tribunal-reveal - Reveal the secret compartment
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

    // /tribunal-crack [stage] - Set crack stage 0-3
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'tribunal-crack',
        callback: (args, value) => {
            const stage = parseInt(value) || 0;
            if (stage < 0 || stage > 3) {
                toastr.warning('Stage must be 0-3', 'The Tribunal');
                return '';
            }
            updateCrackStage(stage);
            toastr.info(`Crack stage set to ${stage}`, 'The Tribunal');
            return '';
        },
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({
                description: 'Crack stage (0-3)',
                isRequired: true,
            }),
        ],
        helpString: 'Set the compartment crack stage (0=none, 1=hairline, 2=spreading, 3=full)',
    }));

    // /tribunal-fortune [text] - Set fortune text
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'tribunal-fortune',
        callback: (args, value) => {
            const text = value || 'The fortune is blank. How fitting.';
            updateFortune(text, 'The Damaged Ledger');
            toastr.info('Fortune updated', 'The Tribunal');
            return '';
        },
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({
                description: 'Fortune text',
                isRequired: false,
            }),
        ],
        helpString: 'Set the fortune text in the compartment',
    }));

    // /tribunal-badge - Set badge info
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'tribunal-badge',
        callback: (args) => {
            updateBadgeInfo({
                name: args.name || 'HARRY DU BOIS',
                rank: args.rank || 'LIEUTENANT',
                badgeNumber: args.badge || 'LTN-2JFR',
                sessions: parseInt(args.sessions) || 5,
            });
            toastr.info('Badge updated', 'The Tribunal');
            return '';
        },
        namedArgumentList: [
            SlashCommandNamedArgument.fromProps({
                name: 'name',
                description: 'Officer name',
                isRequired: false,
            }),
            SlashCommandNamedArgument.fromProps({
                name: 'rank',
                description: 'Officer rank',
                isRequired: false,
            }),
            SlashCommandNamedArgument.fromProps({
                name: 'badge',
                description: 'Badge number',
                isRequired: false,
            }),
            SlashCommandNamedArgument.fromProps({
                name: 'sessions',
                description: 'Session count (affects dots)',
                isRequired: false,
            }),
        ],
        helpString: 'Set badge info. Usage: /tribunal-badge name="JOHN DOE" rank="SERGEANT" sessions=7',
    }));

    // /tribunal-hide - Hide the compartment again (for re-testing)
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'tribunal-hide',
        callback: () => {
            const secretTab = document.querySelector('.ledger-subtab-secret');
            const subtabsContainer = document.querySelector('.ledger-subtabs');
            const crackLine = document.querySelector('.ledger-crack-line');
            
            secretTab?.classList.remove('revealed', 'cracking');
            subtabsContainer?.classList.remove('compartment-revealed');
            crackLine?.classList.remove('stage-1', 'stage-2', 'stage-3');
            
            // Switch back to cases if on compartment
            const casesTab = document.querySelector('[data-ledger-tab="cases"]');
            casesTab?.click();
            
            toastr.info('Compartment hidden', 'The Tribunal');
            return '';
        },
        helpString: 'Hide the secret compartment (for re-testing reveal)',
    }));

    console.log('[The Tribunal] Debug slash commands registered');
    toastr.success('Debug commands ready: /tribunal-reveal, /tribunal-crack, /tribunal-hide', 'The Tribunal', { timeOut: 3000 });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(registerDebugCommands, 2000));
} else {
    setTimeout(registerDebugCommands, 2000);
}
