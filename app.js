// let recentRoundsContainer = document.getElementById('recentRoundsContainer');
let allRecentRounds = [];
let selectedRoundId = null;
// --- Dark Mode Toggle ---
document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const sunIconPath = "M12 4V2m0 20v-2m8-8h2M2 12H4m15.364-7.364l1.414 1.414M4.222 19.778l1.414-1.414M19.778 19.778l-1.414-1.414M4.222 4.222l1.414 1.414";
    const moonIconPath = "M21 12.79A9 9 0 1111.21 3a7 7 0 0010.59 9.79z";
    function setDarkMode(on) {
        document.body.classList.toggle('dark-mode', on);
        if (darkModeIcon) {
            darkModeIcon.innerHTML = on
                ? `<path d="${moonIconPath}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
                : `<path d="${sunIconPath}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
    }
    // Persist mode in localStorage
    const darkPref = localStorage.getItem('innisbrook-dark-mode');
    if (darkPref === 'true') setDarkMode(true);
    darkModeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        setDarkMode(isDark);
        localStorage.setItem('innisbrook-dark-mode', isDark);
    });
});
// --- Leaderboard Sub-tab Navigation ---
function showLeaderboardTab(tab) {
    const tabs = ['team', 'net', 'gross'];
    tabs.forEach(t => {
        document.getElementById(`leaderboard-tab-${t}`).classList.remove('active');
        document.getElementById(`leaderboard-${t}`).classList.add('hidden');
    });
    document.getElementById(`leaderboard-tab-${tab}`).classList.add('active');
    document.getElementById(`leaderboard-${tab}`).classList.remove('hidden');
}

// Add event listeners for leaderboard sub-tabs after DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    ['team', 'net', 'gross'].forEach(tab => {
        const btn = document.getElementById(`leaderboard-tab-${tab}`);
        if (btn) {
            btn.addEventListener('click', () => showLeaderboardTab(tab));
        }
    });
});
const SUPABASE_URL = 'https://pytfoklmefbeqdblvxcx.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dGZva2xtZWZiZXFkYmx2eGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDM4MzgsImV4cCI6MjA3MDcxOTgzOH0.fZ65egcOvVgbF0Jp_-B_VNn4qW905cpq62oU0lIL0bA';

let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    showError("Supabase initialization failed.", error.message);
}

// DOM Elements
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');
const tabNav = document.getElementById('tab-nav');

const playersView = document.getElementById('playersView');
const dashboardView = document.getElementById('dashboardView');
const leaderboardView = document.getElementById('leaderboardView');
const profileView = document.getElementById('profileView');

const allPlayersContainer = document.getElementById('allPlayersContainer');
const teamsContainer = document.getElementById('teamsContainer');
const playersTableBody = document.getElementById('playersTableBody');
const teamHomzaContainer = document.getElementById('teamHomzaContainer');
const teamKinnairdContainer = document.getElementById('teamKinnairdContainer');
const recentRoundsContainer = document.getElementById('recentRoundsContainer');
// Removed: handicapGrid and searchInput, as handicaps section is gone
const backButton = document.getElementById('backButton');

// Removed: allHandicapData, as handicaps section is gone
let allPlayersData = [];
let lastActiveTab = 'players';

// --- View & Tab Navigation ---
function showView(viewName) {
    playersView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    leaderboardView.classList.add('hidden');
    profileView.classList.add('hidden');
    tabNav.classList.remove('hidden');

    if (viewName === 'players') {
        playersView.classList.remove('hidden');
        updateActiveTab('tab-players');
        lastActiveTab = 'players';
    } else if (viewName === 'dashboard') {
        dashboardView.classList.remove('hidden');
        updateActiveTab('tab-dashboard');
        lastActiveTab = 'dashboard';
    } else if (viewName === 'leaderboard') {
        leaderboardView.classList.remove('hidden');
        updateActiveTab('tab-leaderboard');
        lastActiveTab = 'leaderboard';
    } else if (viewName === 'profile') {
        profileView.classList.remove('hidden');
        tabNav.classList.add('hidden');
    }
}

function showPlayersSubView(subViewName) {
    allPlayersContainer.classList.add('hidden');
    teamsContainer.classList.add('hidden');
    
    document.getElementById('subtab-all-players').classList.remove('active');
    document.getElementById('subtab-teams').classList.remove('active');

    if (subViewName === 'all-players') {
        allPlayersContainer.classList.remove('hidden');
        document.getElementById('subtab-all-players').classList.add('active');
    } else if (subViewName === 'teams') {
        teamsContainer.classList.remove('hidden');
        document.getElementById('subtab-teams').classList.add('active');
    }
}

function updateActiveTab(activeTabId) {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active', 'text-gray-900');
        button.classList.add('text-gray-500', 'hover:text-gray-700');
    });
    const activeButton = document.getElementById(activeTabId);
    if(activeButton) {
        activeButton.classList.add('active', 'text-gray-900');
    }
}

// --- Data Fetching ---
async function fetchPlayers() {
    const { data, error } = await supabase.from('Players').select('*').order('name');
    if (error) throw error;
    allPlayersData = data;
    renderPlayers(allPlayersData);
    renderTeams(allPlayersData);
}

// Removed: fetchHandicaps, as handicaps section is gone


function renderRoundSelector(rounds) {
    recentRoundsContainer.innerHTML = '';
    // Define all 5 rounds (static info or fallback if not in data)
    const allRounds = [
        { round_id: 1, course_name: 'South Course', round_date: '2025-09-04' },
        { round_id: 2, course_name: 'Island Course', round_date: '2025-09-05' },
        { round_id: 3, course_name: 'Copperhead', round_date: '2025-09-06' },
        { round_id: 4, course_name: 'North Course', round_date: '2025-09-07' },
        { round_id: 5, course_name: 'Island Course', round_date: '2025-09-08' }
    ];
    // Merge with actual data if present
    const roundMap = {};
    (rounds || []).forEach(r => { roundMap[r.round_id] = r; });
    const mergedRounds = allRounds.map(r => roundMap[r.round_id] ? { ...r, ...roundMap[r.round_id] } : r);
    // Render round selector buttons
    const selectorDiv = document.createElement('div');
    selectorDiv.className = 'flex flex-wrap gap-3 mb-6';
    mergedRounds.forEach(round => {
        const btn = document.createElement('button');
        btn.className = `sub-tab-button px-4 py-2 rounded-md font-semibold${selectedRoundId === round.round_id ? ' active' : ''}`;
        btn.textContent = `${round.course_name} (${new Date(round.round_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })})`;
        btn.onclick = () => {
            selectedRoundId = round.round_id;
            renderRoundSelector(rounds);
            // Only call renderRoundDetails here, not in renderRoundSelector
            renderRoundDetails(round.round_id);
        };
        selectorDiv.appendChild(btn);
    });
    recentRoundsContainer.appendChild(selectorDiv);
    // Only show a scorecard if a round is selected, and only from the tab click handler
    document.querySelectorAll('#recentRoundsContainer #roundDetailsDiv').forEach(el => el.remove());
}

async function renderRoundDetails(roundId) {
    // Remove any previous details
    let detailsDiv = document.getElementById('roundDetailsDiv');
    if (detailsDiv) detailsDiv.remove();
    // Get all player results for this round
    const roundPlayers = allRecentRounds.filter(r => r.round_id === roundId);
    // Find round info from static list if not present
    let round = roundPlayers[0];
    if (!round) {
        // fallback: use static info
        const staticRounds = [
            { round_id: 1, course_name: 'South Course', round_date: '2025-09-04' },
            { round_id: 2, course_name: 'Island Course', round_date: '2025-09-05' },
            { round_id: 3, course_name: 'Copperhead', round_date: '2025-09-06' },
            { round_id: 4, course_name: 'North Course', round_date: '2025-09-07' },
            { round_id: 5, course_name: 'Island Course', round_date: '2025-09-08' }
        ];
        round = staticRounds.find(r => r.round_id === roundId);
    }
    if (!round) return;
    // Fetch holes for this course
    let holes = [];
    try {
        if (round && round.course_id) {
            const { data: holesData, error: holesError } = await supabase
                .from('Holes')
                .select('*')
                .eq('course_id', round.course_id)
                .order('hole_number');
            if (holesError) throw holesError;
            holes = holesData;
        }
    } catch (e) {
        // fallback: show blank holes (18 holes, par 4, hdcp 1-18)
        holes = Array.from({ length: 18 }, (_, i) => ({
            hole_number: i + 1,
            hole_par: 4,
            hole_handicap: i + 1,
            hole_id: i + 1
        }));
    }
    // Fetch all scores for this round from detailed_scores view
    let scores = [];
    try {
        const { data: scoresData, error: scoresError } = await supabase
            .from('detailed_scores')
            .select('*')
            .eq('round_id', roundId);
        if (scoresError) throw scoresError;
        scores = scoresData;
    } catch (e) {
        // If error, just use blank scores
        scores = [];
    }
    // Scorecard type toggles
    let scorecardTypes = [
        { key: 'gross', label: 'Gross', checked: true },
        { key: 'net', label: 'Net', checked: false },
        { key: 'team', label: 'Team Game', checked: false }
    ];
    if (!window.scorecardTypeState) window.scorecardTypeState = {};
    if (!window.scorecardTypeState[roundId]) {
        window.scorecardTypeState[roundId] = { gross: true, net: false, team: false };
    }
    detailsDiv = document.createElement('div');
    detailsDiv.id = 'roundDetailsDiv';
    detailsDiv.className = 'card p-2 overflow-x-auto';
    const date = new Date(round.round_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let html = `<h3 class="text-xl font-bold mb-4">${round.course_name} - ${date}</h3>`;
    html += `<div class="flex gap-4 mb-4">`;
    scorecardTypes.forEach(type => {
        const checked = window.scorecardTypeState[roundId][type.key] ? 'checked' : '';
        html += `<label class="inline-flex items-center cursor-pointer"><input type="checkbox" class="scorecard-type-toggle" data-type="${type.key}" ${checked}><span class="ml-2 font-semibold">${type.label}</span></label>`;
    });
    html += `</div>`;
    html += `<div id="scorecardTables"></div>`;
    detailsDiv.innerHTML = html;
    recentRoundsContainer.appendChild(detailsDiv);

    // Handler for toggles
    detailsDiv.querySelectorAll('.scorecard-type-toggle').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const type = cb.dataset.type;
            window.scorecardTypeState[roundId][type] = cb.checked;
            renderScorecardTables();
        });
    });

    // Render scorecard tables based on toggles
    function renderScorecardTables() {
        const container = detailsDiv.querySelector('#scorecardTables');
        container.innerHTML = '';
        // GROSS
        if (window.scorecardTypeState[roundId].gross) {
            let grossHtml = `<div class="mb-8"><h4 class="text-lg font-bold mb-2">Gross</h4>`;
            grossHtml += `<table class="min-w-full text-xs md:text-sm scoreboard-table"><thead><tr>`;
            grossHtml += `<th class="px-2 py-1 text-left font-bold">Player</th>`;
            holes.forEach(hole => {
                grossHtml += `<th class="px-2 py-1 text-center font-bold">${hole.hole_number}</th>`;
            });
            grossHtml += `<th class="px-2 py-1 text-center font-bold">Out</th><th class="px-2 py-1 text-center font-bold">In</th><th class="px-2 py-1 text-center font-bold">Total</th>`;
            grossHtml += `</tr><tr>`;
            grossHtml += `<td></td>`;
            holes.forEach(hole => {
                grossHtml += `<td class="text-center text-gray-500">Par ${hole.hole_par}<br><span class="text-xs">Hdcp ${hole.hole_handicap}</span></td>`;
            });
            grossHtml += `<td colspan="3"></td>`;
            grossHtml += `</tr></thead><tbody>`;
            allPlayersData.forEach(player => {
                grossHtml += `<tr><td class="font-semibold text-gray-900 clickable-player" data-player-id="${player.player_id}">${player.name}</td>`;
                let out = 0, in9 = 0, total = 0;
                holes.forEach((hole, idx) => {
                    const scoreObj = scores.find(s => s.player_id == player.player_id && s.hole_id == hole.hole_id);
                    const score = scoreObj ? scoreObj.gross_strokes : '';
                    grossHtml += `<td class="text-center">${score !== null && score !== undefined ? score : ''}</td>`;
                    if (score !== null && score !== undefined && score !== '') {
                        total += Number(score);
                        if (idx < 9) out += Number(score);
                        else in9 += Number(score);
                    }
                });
                grossHtml += `<td class="text-center font-bold">${out || ''}</td><td class="text-center font-bold">${in9 || ''}</td><td class="text-center font-bold">${total || ''}</td>`;
                grossHtml += `</tr>`;
            });
            grossHtml += `</tbody></table></div>`;
            container.innerHTML += grossHtml;
        }
        // NET
        // Render scorecard tables based on toggles
        function renderScorecardTables() {
            const container = detailsDiv.querySelector('#scorecardTables');
            container.innerHTML = '';
            // GROSS
            if (window.scorecardTypeState[roundId].gross) {
                let grossHtml = `<div class="mb-8"><h4 class="text-lg font-bold mb-2">Gross</h4>`;
                grossHtml += `<table class="min-w-full text-xs md:text-sm scoreboard-table"><thead><tr>`;
                grossHtml += `<th class="px-2 py-1 text-left font-bold">Player</th>`;
                holes.forEach(hole => {
                    grossHtml += `<th class="px-2 py-1 text-center font-bold">${hole.hole_number}</th>`;
                });
                grossHtml += `<th class="px-2 py-1 text-center font-bold">Out</th><th class="px-2 py-1 text-center font-bold">In</th><th class="px-2 py-1 text-center font-bold">Total</th>`;
                grossHtml += `</tr><tr>`;
                grossHtml += `<td></td>`;
                holes.forEach(hole => {
                    grossHtml += `<td class="text-center text-gray-500">Par ${hole.hole_par}<br><span class="text-xs">Hdcp ${hole.hole_handicap}</span></td>`;
                });
                grossHtml += `<td colspan="3"></td>`;
                grossHtml += `</tr></thead><tbody>`;
                allPlayersData.forEach(player => {
                    grossHtml += `<tr><td class="font-semibold text-gray-900 clickable-player" data-player-id="${player.player_id}">${player.name}</td>`;
                    let out = 0, in9 = 0, total = 0;
                    holes.forEach((hole, idx) => {
                        const scoreObj = scores.find(s => s.player_id == player.player_id && s.hole_id == hole.hole_id);
                        const score = scoreObj ? scoreObj.gross_strokes : '';
                        grossHtml += `<td class="text-center">${score !== null && score !== undefined ? score : ''}</td>`;
                        if (score !== null && score !== undefined && score !== '') {
                            total += Number(score);
                            if (idx < 9) out += Number(score);
                            else in9 += Number(score);
                        }
                    });
                    grossHtml += `<td class="text-center font-bold">${out || ''}</td><td class="text-center font-bold">${in9 || ''}</td><td class="text-center font-bold">${total || ''}</td>`;
                    grossHtml += `</tr>`;
                });
                grossHtml += `</tbody></table></div>`;
                container.innerHTML += grossHtml;
            }
            // NET
            if (window.scorecardTypeState[roundId].net) {
                let netHtml = `<div class="mb-8"><h4 class="text-lg font-bold mb-2">Net</h4>`;
                netHtml += `<table class="min-w-full text-xs md:text-sm scoreboard-table"><thead><tr>`;
                netHtml += `<th class="px-2 py-1 text-left font-bold">Player</th>`;
                holes.forEach(hole => {
                    netHtml += `<th class="px-2 py-1 text-center font-bold">${hole.hole_number}</th>`;
                });
                netHtml += `<th class="px-2 py-1 text-center font-bold">Out</th><th class="px-2 py-1 text-center font-bold">In</th><th class="px-2 py-1 text-center font-bold">Total</th>`;
                netHtml += `</tr><tr>`;
                netHtml += `<td></td>`;
                holes.forEach(hole => {
                    netHtml += `<td class="text-center text-gray-500">Par ${hole.hole_par}<br><span class="text-xs">Hdcp ${hole.hole_handicap}</span></td>`;
                });
                netHtml += `<td colspan="3"></td>`;
                netHtml += `</tr></thead><tbody>`;
                allPlayersData.forEach(player => {
                    netHtml += `<tr><td class="font-semibold text-gray-900 clickable-player" data-player-id="${player.player_id}">${player.name}</td>`;
                    let out = 0, in9 = 0, total = 0;
                    holes.forEach((hole, idx) => {
                        const scoreObj = scores.find(s => s.player_id == player.player_id && s.hole_id == hole.hole_id);
                        const net = scoreObj ? scoreObj.net_strokes : '';
                        netHtml += `<td class="text-center">${net !== null && net !== undefined ? net : ''}</td>`;
                        if (net !== null && net !== undefined && net !== '') {
                            total += Number(net);
                            if (idx < 9) out += Number(net);
                            else in9 += Number(net);
                        }
                    });
                    netHtml += `<td class="text-center font-bold">${out || ''}</td><td class="text-center font-bold">${in9 || ''}</td><td class="text-center font-bold">${total || ''}</td>`;
                    netHtml += `</tr>`;
                });
                netHtml += `</tbody></table></div>`;
                container.innerHTML += netHtml;
            }
            // TEAM GAME (blank)
            if (window.scorecardTypeState[roundId].team) {
                let teamHtml = `<div class="mb-8"><h4 class="text-lg font-bold mb-2">Team Game</h4>`;
                teamHtml += `<div class="text-gray-500 italic">Coming soon: Team game scorecard will be displayed here.</div></div>`;
                container.innerHTML += teamHtml;
            }
        }
        // Initial render
        renderScorecardTables();
        const draftPick = player.draft_pick ? `<span class="text-sm font-bold text-gray-400 w-6">${player.draft_pick}.</span>` : '<span class="w-6"></span>';

        return `
            <div class="card p-4 flex items-center justify-between">

                <div class="flex items-center">
                    ${draftPick}
                    <p class="font-semibold text-gray-800 clickable-player" data-player-id="${player.player_id}">${player.name}</p>
                    ${captainBadge}
                </div>
                <p class="text-sm text-gray-600 font-medium">HCP: ${player.handicap_index}</p>
            </div>`;
    };
    
    const sortByCaptainAndPick = (a, b) => {
        if (a.is_captain && !b.is_captain) return -1;
        if (!a.is_captain && b.is_captain) return 1;
        return (a.draft_pick || 99) - (b.draft_pick || 99);
    };

    const teamHomzaHtml = data.filter(p => p.team === 'Homza').sort(sortByCaptainAndPick).map(createPlayerCard).join('');
    const teamKinnairdHtml = data.filter(p => p.team === 'Kinnaird').sort(sortByCaptainAndPick).map(createPlayerCard).join('');

    teamHomzaContainer.innerHTML = teamHomzaHtml || `<div class="card p-5 text-center text-gray-500">No players on this team.</div>`;
    teamKinnairdContainer.innerHTML = teamKinnairdHtml || `<div class="card p-5 text-center text-gray-500">No players on this team.</div>`;
}

// Removed: renderHandicaps, as handicaps section is gone

function renderRecentRounds(data) {
    recentRoundsContainer.innerHTML = '';
    if (data.length === 0) {
        recentRoundsContainer.innerHTML = `<div class="card p-5 text-center text-gray-500">No recent rounds found.</div>`;
        return;
    }
    data.forEach(round => {
        const score = round.total_score || 'N/A';
        const par = round.total_par || 'N/A';
        let scoreToParDisplay = '';
        if (score !== 'N/A' && par !== 'N/A') {
            const scoreToPar = score - par;
            if (scoreToPar > 0) scoreToParDisplay = `+${scoreToPar}`;
            else if (scoreToPar === 0) scoreToParDisplay = 'E';
            else scoreToParDisplay = `${scoreToPar}`;
        }
        const date = new Date(round.round_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const item = document.createElement('div');
        item.className = 'card p-4 flex items-center justify-between';
        item.innerHTML = `<div class="flex items-center space-x-4"><div class="flex-shrink-0"><div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center"><span class="text-xl font-bold text-emerald-700">${score}</span></div></div><div><p class="font-bold text-gray-800 clickable-player" data-player-id="${round.player_id}">${round.player_name}</p><p class="text-sm text-gray-500">${round.course_name} (${round.tee_name})</p></div></div><div class="text-right"><p class="text-lg font-semibold text-gray-700">${scoreToParDisplay}</p><p class="text-sm text-gray-500">${date}</p></div>`;
        recentRoundsContainer.appendChild(item);
    });
}

function renderProfile(player, rounds) {
    const profileHeader = document.getElementById('profileHeader');
    const profileRoundsContainer = document.getElementById('profileRoundsContainer');
    profileHeader.innerHTML = `<div class="card p-6"><h2 class="text-3xl font-bold text-gray-900">${player.name}</h2><p class="mt-1 text-lg text-emerald-600 font-semibold">Handicap Index: ${player.handicap_index}</p></div>`;
    profileRoundsContainer.innerHTML = '';
    if (rounds.length === 0) {
        profileRoundsContainer.innerHTML = `<div class="card p-5 text-center text-gray-500">No round history found for this player.</div>`;
        return;
    }
    rounds.forEach(round => {
        const score = round.total_score || 'N/A';
        const par = round.total_par || 'N/A';
        let scoreToParDisplay = '';
        if (score !== 'N/A' && par !== 'N/A') {
            const scoreToPar = score - par;
            if (scoreToPar > 0) scoreToParDisplay = `+${scoreToPar}`;
            else if (scoreToPar === 0) scoreToParDisplay = 'E';
            else scoreToParDisplay = `${scoreToPar}`;
        }
        const date = new Date(round.round_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const item = document.createElement('div');
        item.className = 'card p-4 flex items-center justify-between';
        item.innerHTML = `<div class="flex items-center space-x-4"><div class="flex-shrink-0"><div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"><span class="text-xl font-bold text-gray-700">${score}</span></div></div><div><p class="font-semibold text-gray-800">${round.course_name}</p><p class="text-sm text-gray-500">${round.tee_name}</p></div></div><div class="text-right"><p class="text-lg font-semibold text-gray-700">${scoreToParDisplay}</p><p class="text-sm text-gray-500">${date}</p></div>`;
        profileRoundsContainer.appendChild(item);
    });
}

function showError(message, details) {
    const errorDetails = document.getElementById('errorDetails');
    loader.style.display = 'none';
    document.querySelectorAll('#appContainer > div').forEach(el => el.classList.add('hidden'));
    errorMessage.classList.remove('hidden');
    document.getElementById('errorText').textContent = message;
    errorDetails.textContent = `Details: ${details}`;
}

// Removed: filterHandicaps, as handicaps section is gone

// --- Main Execution & Event Listeners ---
async function initializeApp() {
    loader.classList.remove('hidden');
    try {
        await Promise.all([fetchPlayers(), fetchRecentRounds()]);
        loader.classList.add('hidden');
        showView('players');
        showPlayersSubView('all-players');
    } catch (error) {
        showError('Failed to load initial data.', error.message);
    }
}

document.getElementById('tab-players').addEventListener('click', () => showView('players'));
document.getElementById('tab-dashboard').addEventListener('click', () => showView('dashboard'));
document.getElementById('tab-leaderboard').addEventListener('click', () => showView('leaderboard'));
document.getElementById('subtab-all-players').addEventListener('click', () => showPlayersSubView('all-players'));
document.getElementById('subtab-teams').addEventListener('click', () => showPlayersSubView('teams'));
backButton.addEventListener('click', () => showView(lastActiveTab));
// Removed: searchInput event listener, as handicaps section is gone
document.getElementById('appContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('clickable-player')) {
        const playerId = e.target.dataset.playerId;
        if (playerId) {
            showView('profile');
            loadPlayerProfile(playerId);
        }
    }
});

if (supabase) {
    initializeApp();
}
