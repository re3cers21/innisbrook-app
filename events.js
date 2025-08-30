// All event listeners and UI logic
// Example: tab navigation, subtab switching, click handlers, etc.

export function setupTabNavigation(showView) {
    document.getElementById('tab-players').addEventListener('click', () => showView('players'));
    document.getElementById('tab-dashboard').addEventListener('click', () => showView('dashboard'));
    document.getElementById('tab-leaderboard').addEventListener('click', () => showView('leaderboard'));
}

export function setupSubtabNavigation(showPlayersSubView) {
    document.getElementById('subtab-all-players').addEventListener('click', () => showPlayersSubView('all-players'));
    document.getElementById('subtab-teams').addEventListener('click', () => showPlayersSubView('teams'));
}

// Add more event setup functions as needed...
