function renderPlayers(data) {
    playersTableBody.innerHTML = '';
    data.forEach(p => {
        const r = playersTableBody.insertRow();
        r.className = "hover:bg-gray-50";
        r.innerHTML = `<td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900 clickable-player" data-player-id="${p.player_id}">${p.name}</div></td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${p.handicap_index}</div></td>`;
    });
}

// Stub for renderTeams to prevent not defined errors
function renderTeams(data) {
    // TODO: Implement team rendering logic
    // This is a placeholder to prevent errors
}
async function fetchAllRounds() {
    const { data, error } = await supabase
        .from('Rounds')
        .select(`round_id, round_date, round_number, tee_id, Tees (tee_name, tee_rating, tee_slope), course_id, Courses (course_name, total_par)`)
        .order('round_date', { ascending: true });
    if (error) {
        showError('Failed to load rounds', error.message);
        return [];
    }
    return data;
}
// --- Function Declarations ---
async function fetchRecentRounds() {
    try {
        // Fetch recent rounds with course and tee info
        const { data, error } = await supabase
            .from('recent_rounds_view')
            .select('*');
        if (error) throw error;
        allRecentRounds = data;
        renderRoundSelector(data);
    } catch (e) {
        showError('Failed to fetch recent rounds.', e.message);
    }
}
// --- Function Declarations ---
    async function renderScorecardTables() {
        const container = detailsDiv.querySelector('#scorecardTables');
        container.innerHTML = '';

        // GROSS SCORECARD
        if (window.scorecardTypeState[roundId].gross) {
            let grossHtml = `<div class="mb-8"><h4 class="text-lg font-bold mb-2">Gross Scorecard</h4>`;
            if (scores.length === 0) {
                grossHtml += `<div class="text-gray-500 italic">No gross score data available for this round.</div></div>`;
            } else {
                // Group scores by player
                const players = {};
                scores.forEach(row => {
                    if (!players[row.player_id]) players[row.player_id] = { name: row.player_name, scores: [] };
                    players[row.player_id].scores[row.hole_id - 1] = row.gross_strokes;
                });
                grossHtml += `<table class="min-w-full text-xs md:text-sm scoreboard-table border rounded-lg overflow-hidden"><thead class="bg-gray-100"><tr><th class="px-2 py-1">Player</th>`;
                for (let i = 1; i <= 18; i++) grossHtml += `<th class="px-2 py-1">${i}</th>`;
                grossHtml += `<th class="px-2 py-1">Total</th></tr></thead><tbody>`;
                Object.values(players).forEach(player => {
                    const total = player.scores.reduce((a, b) => a + (b || 0), 0);
                    grossHtml += `<tr><td class="font-semibold">${player.name}</td>`;
                    for (let i = 0; i < 18; i++) grossHtml += `<td class="text-center">${player.scores[i] ?? ''}</td>`;
                    grossHtml += `<td class="font-bold text-center">${total}</td></tr>`;
                });
                grossHtml += `</tbody></table></div>`;
            }
            container.innerHTML += grossHtml;
        }

        // NET SCORECARD
        if (window.scorecardTypeState[roundId].net) {
            let netHtml = `<div class="mb-8"><h4 class="text-lg font-bold mb-2">Net Scorecard</h4>`;
            if (scores.length === 0) {
                netHtml += `<div class="text-gray-500 italic">No net score data available for this round.</div></div>`;
            } else {
                // Group scores by player
                const players = {};
                scores.forEach(row => {
                    if (!players[row.player_id]) players[row.player_id] = { name: row.player_name, scores: [] };
                    players[row.player_id].scores[row.hole_id - 1] = row.net_strokes;
                });
                netHtml += `<table class="min-w-full text-xs md:text-sm scoreboard-table border rounded-lg overflow-hidden"><thead class="bg-gray-100"><tr><th class="px-2 py-1">Player</th>`;
                for (let i = 1; i <= 18; i++) netHtml += `<th class="px-2 py-1">${i}</th>`;
                netHtml += `<th class="px-2 py-1">Total</th></tr></thead><tbody>`;
                Object.values(players).forEach(player => {
                    const total = player.scores.reduce((a, b) => a + (b || 0), 0);
                    netHtml += `<tr><td class="font-semibold">${player.name}</td>`;
                    for (let i = 0; i < 18; i++) netHtml += `<td class="text-center">${player.scores[i] ?? ''}</td>`;
                    netHtml += `<td class="font-bold text-center">${total}</td></tr>`;
                });
                netHtml += `</tbody></table></div>`;
            }
            container.innerHTML += netHtml;
        }

        // TEAM GAME (Hi-Lo)
        if (window.scorecardTypeState[roundId].team) {
            let teamHtml = `<div class="mb-8"><h4 class="text-lg font-bold mb-2">Team Game</h4>`;
            if (roundId === 1 || roundId === 2) {
                const hiloView = roundId === 1 ? 'hilo_results_round1' : 'hilo_results_round2';
                try {
                    const { data: hiloData, error: hiloError } = await supabase
                        .from(hiloView)
                        .select('*');
                    if (hiloError) throw hiloError;
                    if (!hiloData || hiloData.length === 0) {
                        teamHtml += `<div class="text-gray-500 italic">No team game data available for this round.</div></div>`;
                        container.innerHTML += teamHtml;
                        return;
                    }
                    // Group by match_number
                    const matches = {};
                    hiloData.forEach(row => {
                        if (!matches[row.match_number]) matches[row.match_number] = [];
                        matches[row.match_number].push(row);
                    });
                    Object.keys(matches).forEach(matchNum => {
                        const match = matches[matchNum];
                        // Sort by hole_id and assign display hole number 1-18
                        match.sort((a, b) => a.hole_id - b.hole_id);
                        teamHtml += `<div class="mb-6 p-4 bg-gray-50 rounded-xl shadow"><h5 class="font-semibold mb-3 text-lg">Match ${matchNum}: <span class="text-emerald-700 font-bold">${match[0].team1}</span> vs <span class="text-blue-700 font-bold">${match[0].team2}</span></h5>`;
                        teamHtml += `<table class="min-w-full text-xs md:text-sm scoreboard-table border rounded-lg overflow-hidden"><thead class="bg-emerald-100"><tr>`;
                        teamHtml += `<th class="px-2 py-1">Hole</th><th class="px-2 py-1">${match[0].team1} Low</th><th class="px-2 py-1">${match[0].team1} High</th><th class="px-2 py-1">${match[0].team2} Low</th><th class="px-2 py-1">${match[0].team2} High</th><th class="px-2 py-1">Result</th><th class="px-2 py-1">Running</th>`;
                        teamHtml += `</tr></thead><tbody>`;
                        match.forEach((row, idx) => {
                            let result = '';
                            if (row.team1_hole_result === 1) result = `<span class="text-emerald-700 font-semibold">${row.team1} wins</span>`;
                            else if (row.team2_hole_result === 1) result = `<span class="text-blue-700 font-semibold">${row.team2} wins</span>`;
                            else result = '<span class="text-gray-500">Halved</span>';
                            let running = '';
                            if (row.team1_running > 0) running = `<span class="text-emerald-700 font-bold">${row.team1} +${row.team1_running}</span>`;
                            else if (row.team1_running < 0) running = `<span class="text-blue-700 font-bold">${row.team2} +${-row.team1_running}</span>`;
                            else running = '<span class="text-gray-500">All Square</span>';
                            // Display hole number as 1-18
                            const displayHole = idx + 1;
                            teamHtml += `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}"><td class="text-center font-bold">${displayHole}</td><td class="text-center">${row.team1_low}</td><td class="text-center">${row.team1_high}</td><td class="text-center">${row.team2_low}</td><td class="text-center">${row.team2_high}</td><td class="text-center">${result}</td><td class="text-center">${running}</td></tr>`;
                        });
                        teamHtml += `</tbody></table></div>`;
                    });
                } catch (err) {
                    teamHtml += `<div class="text-red-500 italic">Error loading team game data: ${err.message}</div>`;
                }
            } else {
                teamHtml += `<div class="text-gray-500 italic">Coming soon: Team game scorecard will be displayed here.</div>`;
            }
            teamHtml += `</div>`;
            container.innerHTML += teamHtml;
        }
    }
    // Initial render
    renderScorecardTables();
// ...existing code...
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
    // Use live rounds from DB if available
    fetchAllRounds().then(allRounds => {
        if (!allRounds || allRounds.length === 0) {
            recentRoundsContainer.innerHTML = '<div class="card p-5 text-center text-gray-500">No rounds found.</div>';
            return;
        }
        const selectorDiv = document.createElement('div');
        selectorDiv.className = 'flex flex-wrap gap-3 mb-6';
        allRounds.forEach(round => {
            const course = round.Courses || {};
            const tee = round.Tees || {};
            const btn = document.createElement('button');
            btn.className = `sub-tab-button px-4 py-2 rounded-md font-semibold${selectedRoundId === round.round_id ? ' active' : ''}`;
            btn.textContent = `${course.course_name || 'Course'} (${tee.tee_name || ''}) - ${new Date(round.round_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}`;
            btn.onclick = () => {
                selectedRoundId = round.round_id;
                renderRoundSelector();
                renderRoundDetails(round.round_id);
            };
            selectorDiv.appendChild(btn);
        });
        recentRoundsContainer.appendChild(selectorDiv);
        // Only show a scorecard if a round is selected, and only from the tab click handler
        document.querySelectorAll('#recentRoundsContainer #roundDetailsDiv').forEach(el => el.remove());
    });
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
        { key: 'net', label: 'Net', checked: true },
        { key: 'team', label: 'Team Game', checked: true }
    ];
    if (!window.scorecardTypeState) window.scorecardTypeState = {};
    if (!window.scorecardTypeState[roundId]) {
        window.scorecardTypeState[roundId] = { gross: true, net: true, team: true };
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
    async function renderScorecardTables() {
        const container = detailsDiv.querySelector('#scorecardTables');
        container.innerHTML = '';
        // ...existing code for gross and net...
        // TEAM GAME (Hi-Lo)
        if (window.scorecardTypeState[roundId].team) {
            let teamHtml = `<div class="mb-8"><h4 class="text-lg font-bold mb-2">Team Game</h4>`;
            if (roundId === 1 || roundId === 2) {
                const hiloView = roundId === 1 ? 'hilo_results_round1' : 'hilo_results_round2';
                try {
                    const { data: hiloData, error: hiloError } = await supabase
                        .from(hiloView)
                        .select('*');
                    if (hiloError) throw hiloError;
                    if (!hiloData || hiloData.length === 0) {
                        teamHtml += `<div class="text-gray-500 italic">No team game data available for this round.</div></div>`;
                        container.innerHTML += teamHtml;
                        return;
                    }
                    // Group by match_number
                    const matches = {};
                    hiloData.forEach(row => {
                        if (!matches[row.match_number]) matches[row.match_number] = [];
                        matches[row.match_number].push(row);
                    });
                    Object.keys(matches).forEach(matchNum => {
                        const match = matches[matchNum];
                        // Sort by hole_id and assign display hole number 1-18
                        match.sort((a, b) => a.hole_id - b.hole_id);
                        teamHtml += `<div class="mb-6 p-4 bg-gray-50 rounded-xl shadow"><h5 class="font-semibold mb-3 text-lg">Match ${matchNum}: <span class="text-emerald-700 font-bold">${match[0].team1}</span> vs <span class="text-blue-700 font-bold">${match[0].team2}</span></h5>`;
                        teamHtml += `<table class="min-w-full text-xs md:text-sm scoreboard-table border rounded-lg overflow-hidden"><thead class="bg-emerald-100"><tr>`;
                        teamHtml += `<th class="px-2 py-1">Hole</th><th class="px-2 py-1">${match[0].team1} Low</th><th class="px-2 py-1">${match[0].team1} High</th><th class="px-2 py-1">${match[0].team2} Low</th><th class="px-2 py-1">${match[0].team2} High</th><th class="px-2 py-1">Result</th><th class="px-2 py-1">Running</th>`;
                        teamHtml += `</tr></thead><tbody>`;
                        match.forEach((row, idx) => {
                            let result = '';
                            if (row.team1_hole_result === 1) result = `<span class="text-emerald-700 font-semibold">${row.team1} wins</span>`;
                            else if (row.team2_hole_result === 1) result = `<span class="text-blue-700 font-semibold">${row.team2} wins</span>`;
                            else result = '<span class="text-gray-500">Halved</span>';
                            let running = '';
                            if (row.team1_running > 0) running = `<span class="text-emerald-700 font-bold">${row.team1} +${row.team1_running}</span>`;
                            else if (row.team1_running < 0) running = `<span class="text-blue-700 font-bold">${row.team2} +${-row.team1_running}</span>`;
                            else running = '<span class="text-gray-500">All Square</span>';
                            // Display hole number as 1-18
                            const displayHole = idx + 1;
                            teamHtml += `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}"><td class="text-center font-bold">${displayHole}</td><td class="text-center">${row.team1_low}</td><td class="text-center">${row.team1_high}</td><td class="text-center">${row.team2_low}</td><td class="text-center">${row.team2_high}</td><td class="text-center">${result}</td><td class="text-center">${running}</td></tr>`;
                        });
                        teamHtml += `</tbody></table></div>`;
                    });
                } catch (err) {
                    teamHtml += `<div class="text-red-500 italic">Error loading team game data: ${err.message}</div>`;
                }
            } else {
                teamHtml += `<div class="text-gray-500 italic">Coming soon: Team game scorecard will be displayed here.</div>`;
            }
            teamHtml += `</div>`;
            container.innerHTML += teamHtml;
        }
    }
    // Initial render
    renderScorecardTables();
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
    // Fetch and show course handicaps for this player
    fetchPlayerCourseHandicaps(player.player_id).then(handicaps => {
        if (handicaps && handicaps.length > 0) {
            profileHeader.innerHTML += `
                <div class="mt-4">
                    <h3 class="text-lg font-semibold mb-1">Course Handicaps</h3>
                    <ul class="text-sm">
                        ${handicaps.map(h => `<li>${h.course_name} (${h.tee_name}): <strong>${h.course_handicap}</strong></li>`).join('')}
                    </ul>
                </div>
            `;
        }
    });
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
// Fetch course handicaps for a player
async function fetchPlayerCourseHandicaps(playerId) {
    const { data, error } = await supabase
        .from('course_handicap_view')
        .select('*')
        .eq('player_id', playerId);
    if (error) {
        showError('Failed to load course handicaps', error.message);
        return [];
    }
    return data;
}

// Fetch net leaderboard from view
async function fetchNetLeaderboard() {
    const { data, error } = await supabase
        .from('player_round_net_scores')
        .select('*')
        .order('total_net_score', { ascending: true });
    if (error) {
        showError('Failed to load net leaderboard', error.message);
        return [];
    }
    return data;
}

// Render net leaderboard
async function renderNetLeaderboard() {
    const leaderboard = await fetchNetLeaderboard();
    const container = document.getElementById('leaderboard-net');
    if (!container) return;
    container.innerHTML = `
        <table class="min-w-full divide-y divide-gray-200">
          <thead><tr>
            <th class="px-4 py-2">Player</th><th class="px-4 py-2">Round Date</th><th class="px-4 py-2">Course</th><th class="px-4 py-2">Net Score</th>
          </tr></thead>
          <tbody>
            ${leaderboard.map(row => `
              <tr>
                <td class="font-semibold">${row.player_name}</td>
                <td>${new Date(row.round_date).toLocaleDateString('en-US')}</td>
                <td>${row.course_name}</td>
                <td class="text-center font-bold">${row.total_net_score}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
    `;
}

// Call renderNetLeaderboard when leaderboard net tab is shown
document.addEventListener('DOMContentLoaded', () => {
    const netTab = document.getElementById('leaderboard-tab-net');
    if (netTab) {
        netTab.addEventListener('click', renderNetLeaderboard);
    }
    // Optionally, render on load if net tab is default
    if (document.getElementById('leaderboard-net') && netTab && netTab.classList.contains('active')) {
        renderNetLeaderboard();
    }
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
