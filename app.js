// --- Function Declarations ---
function renderTeams(data) {
    const createPlayerCard = player => {
        const captainBadge = player.is_captain ? `<span class="ml-2 text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Captain</span>` : '';
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

function renderPlayers(data) {
    playersTableBody.innerHTML = '';
    data.forEach(p => {
        const r = playersTableBody.insertRow();
        r.className = "hover:bg-gray-50";
        r.innerHTML = `<td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900 clickable-player" data-player-id="${p.player_id}">${p.name}</div></td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${p.handicap_index}</div></td>`;
    });
}

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

// Fetch all rounds with course and tee info for round selector
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
// let recentRoundsContainer = document.getElementById('recentRoundsContainer');
let allRecentRounds = [];
let selectedRoundId = null;
let allRoundsCache = null; // Add this at the top, global scope
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

// Make allPlayersData available globally for debugging
window.allPlayersData = allPlayersData;

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
    if (error) {
        console.error('Supabase fetchPlayers error:', error);
        showError('Failed to fetch players.', error.message);
    } else {
        console.log('Supabase fetchPlayers data:', data);
    }
    allPlayersData = data;
    window.allPlayers = data; // Make available globally for Team Game
    window.allPlayersData = allPlayersData; // For debugging
    renderPlayers(allPlayersData);
    renderTeams(allPlayersData);
    // Hide loader after initial data load
    loader.classList.add('hidden');
    // Also fetch hilo_matchups for Team Game player display
    const { data: matchups, error: matchupsError } = await supabase.from('hilo_matchups').select('*');
    if (!matchupsError) {
        window.hiloMatchups = matchups;
    }
    // Fetch detailed_scores for initials in Team Game
    const { data: detailedScores, error: dsError } = await supabase.from('detailed_scores').select('*');
    if (!dsError) {
        window.detailedScores = detailedScores;
    }
}

// Removed: fetchHandicaps, as handicaps section is gone


function renderRoundSelector(rounds) {
    recentRoundsContainer.innerHTML = '';
    document.querySelectorAll('#recentRoundsContainer #roundDetailsDiv').forEach(el => el.remove());

    // Use cached rounds if available, otherwise fetch and cache
    const render = (allRounds) => {
        if (!allRounds || allRounds.length === 0) {
            recentRoundsContainer.innerHTML = '<div class="card p-5 text-center text-gray-500">No rounds found.</div>';
            return;
        }
        window.allRoundsCache = allRounds;
        window.roundById = allRounds.reduce((acc, r) => {
            acc[r.round_id] = r;
            return acc;
        }, {});
        const selectorDiv = document.createElement('div');
        selectorDiv.className = 'flex flex-wrap gap-3 mb-6';
        allRounds.forEach(round => {
            const course = round.Courses || {};
            const tee = round.Tees || {};
            const btn = document.createElement('button');
            btn.className = `sub-tab-button px-4 py-2 rounded-md font-semibold${selectedRoundId === round.round_id ? ' active' : ''}`;
            const [year, month, day] = round.round_date.split('-');
            const correctDate = new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
            btn.textContent = `${course.course_name || 'Course'} (${tee.tee_name || ''}) - ${correctDate}`;
            btn.onclick = () => {
                selectedRoundId = round.round_id;
                renderRoundSelector(allRounds); // Only call this, not renderRoundDetails directly
            };
            selectorDiv.appendChild(btn);
        });
        recentRoundsContainer.appendChild(selectorDiv);
        // Remove any lingering round details
        document.querySelectorAll('#recentRoundsContainer #roundDetailsDiv').forEach(el => el.remove());
        // If a round is selected, show its details
        if (selectedRoundId) {
            renderRoundDetails(selectedRoundId);
        }
    };

    if (allRoundsCache) {
        render(allRoundsCache);
    } else {
        fetchAllRounds().then(allRounds => {
            allRoundsCache = allRounds;
            render(allRounds);
        });
    }
}

async function renderRoundDetails(roundId) {
    // Remove any previous details
    let detailsDiv = document.getElementById('roundDetailsDiv');
    if (detailsDiv) detailsDiv.remove();

    // Ensure allPlayersData is loaded before rendering
    if (!Array.isArray(allPlayersData) || allPlayersData.length === 0) {
        // Try again after a short delay
        setTimeout(() => renderRoundDetails(roundId), 100);
        return;
    }

    // Get all player results for this round
    const roundPlayers = allRecentRounds.filter(r => r.round_id === roundId);
    // Prefer round metadata from cached Rounds table (ensures course_id exists)
    let roundMeta = (window.roundById && window.roundById[roundId]) ? window.roundById[roundId] : null;
    // Fallback to recent_rounds_view row for course/tee display ONLY
    let round = roundPlayers[0] || null;
    // If still no metadata, bail out quietly
    if (!round && !roundMeta) return;
    
    // FIX: Better course_id resolution
    let courseId = null;
    if (roundMeta && roundMeta.course_id) {
        courseId = Number(roundMeta.course_id);
    } else if (round && round.course_id) {
        courseId = Number(round.course_id);
    } else {
        // Last resort: query Rounds table directly
        try {
            const { data: roundData, error: roundError } = await supabase
                .from('Rounds')
                .select('course_id')
                .eq('round_id', roundId)
                .single();
            if (!roundError && roundData) {
                courseId = Number(roundData.course_id);
            }
        } catch (e) {
            console.error('Failed to fetch round course_id:', e);
        }
    }
    
    console.log('DEBUG: renderRoundDetails meta', { roundId, courseId, roundMeta, roundFromView: roundPlayers[0] });
    
    // Fetch holes for this course
    let holes = [];
    let holesError = null;
    try {
        if (courseId) {
            console.log('DEBUG: Using course_id =', courseId, 'typeof:', typeof courseId);
            const { data: holesData, error } = await supabase
                .from('Holes')
                .select('*')
                .eq('course_id', courseId)
                .order('hole_number');
            console.log('DEBUG: Holes query result:', { course_id: courseId, holesData, error });
            holesError = error;
            if (error) {
                console.error('Supabase Holes error:', error);
            } else {
                console.log('Supabase Holes data:', holesData);
                holes = holesData || [];
            }
        } else {
            console.error('DEBUG: No course_id found for round', roundId);
            holesError = new Error('No course_id found for this round');
        }
    } catch (e) {
        holesError = e;
        console.error('Supabase Holes exception:', e);
    }
    
    // For Rounds 1 and 2, do NOT override holes array; always use Holes table for column headers
    if ((roundId === 1 || roundId === 2)) {
        if (!holes || holes.length === 0 || holesError) {
            showError(`Failed to load holes for Round ${roundId}. Course ID: ${courseId}. Please check that the Rounds table has the correct course_id and that holes exist in the Holes table for this course.`, holesError ? holesError.message : 'No holes found.');
            return;
        }
    } else {
        // For other rounds, fallback to generic holes if needed
        if (!holes || holes.length === 0) {
            holes = Array.from({ length: 18 }, (_, i) => ({
                hole_number: i + 1,
                hole_par: 4,
                hole_handicap: i + 1,
                hole_id: i + 1
            }));
        }
    }
    
    // Fetch all scores for this round for Gross/Net display - limit to only needed columns
    let scores = [];
    try {
        let scoresData = [];
        let scoresError = null;
        // Always use detailed_scores for all rounds - but project only needed columns
        const { data: dsData, error: dsError } = await supabase
            .from('detailed_scores')
            .select('player_id,hole_id,net_strokes,gross_strokes') // Only select what we need
            .eq('round_id', roundId);
        scoresData = dsData || [];
        scoresError = dsError;
        if (scoresError) throw scoresError;
        scores = scoresData || [];
    } catch (e) {
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
    
    // FIX: Always use the cached round metadata for the correct date and course name
    const displayDate = roundMeta && roundMeta.round_date
    ? (() => {
        const [year, month, day] = roundMeta.round_date.split('-');
        return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    })()
    : 'Unknown Date';
    
    const courseName = roundMeta && roundMeta.Courses ? roundMeta.Courses.course_name : 
                      (round && round.course_name ? round.course_name : 'Unknown Course');
    
    let html = `<h3 class="text-xl font-bold mb-4">${courseName} - ${displayDate}</h3>`;
    html += `<div class="flex gap-4 mb-4">`;
    scorecardTypes.forEach(type => {
        const checked = window.scorecardTypeState[roundId][type.key] ? 'checked' : '';
        html += `
  <label class="inline-flex items-center cursor-pointer mr-4">
    <span class="switch">
      <input type="checkbox" class="scorecard-type-toggle" data-type="${type.key}" ${checked}>
      <span class="slider"></span>
    </span>
    <span class="ml-3 font-semibold">${type.label}</span>
  </label>
`;
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
    async function renderScorecardTables() {
        const container = detailsDiv.querySelector('#scorecardTables');
        container.innerHTML = '';
        // Debug logging (always run)
        if (typeof window !== 'undefined' && window.console) {
            window.console.log('--- DEBUG: renderScorecardTables ---');
            window.console.log('RoundId:', roundId);
            window.console.log('Detailed scores:', scores);
            window.console.log('All players:', allPlayersData);
            window.console.log('Holes:', holes);
        }
        // GROSS
        if (window.scorecardTypeState[roundId].gross) {
            let grossHtml = `<div class="mb-8"><h4 class="text-lg font-bold mb-2">Gross</h4>`;
            if (!scores || scores.length === 0) {
                grossHtml += `<div class="text-gray-500 italic">No gross scores found for this round.</div></div>`;
                container.innerHTML += grossHtml;
            } else {
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
                        let cellClass = '', cellContent = score;
                        if (score !== null && score !== undefined && score !== '') {
                            const rel = Number(score) - Number(hole.hole_par);
                            if (rel <= -2) {
                                cellClass = 'golf-eagle';
                                cellContent = `<span class="golf-eagle-number">${score}</span>`;
                            } else if (rel === -1) {
                                cellClass = 'golf-birdie';
                            } else if (rel === 1) {
                                cellClass = 'golf-bogey';
                            } else if (rel >= 2) {
                                cellClass = 'golf-double-bogey';
                            }
                            total += Number(score);
                            if (idx < 9) out += Number(score);
                            else in9 += Number(score);
                        }
                        grossHtml += `<td class="text-center ${cellClass}">${cellContent !== undefined && cellContent !== null ? cellContent : ''}</td>`;
                    });
                    grossHtml += `<td class="text-center font-bold">${out || ''}</td><td class="text-center font-bold">${in9 || ''}</td><td class="text-center font-bold">${total || ''}</td>`;
                    grossHtml += `</tr>`;
                });
                grossHtml += `</tbody></table></div>`;
                container.innerHTML += grossHtml;
            }
        }
        // NET
        if (window.scorecardTypeState[roundId].net) {
            let netHtml = `<div class="mb-8"><h4 class="text-lg font-bold mb-2">Net</h4>`;
            if (!scores || scores.length === 0) {
                netHtml += `<div class="text-gray-500 italic">No net scores found for this round.</div></div>`;
                container.innerHTML += netHtml;
            } else {
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
                        let cellClass = '', cellContent = net;
                        if (net !== null && net !== undefined && net !== '') {
                            const rel = Number(net) - Number(hole.hole_par);
                            if (rel <= -2) {
                                cellClass = 'golf-eagle';
                                cellContent = `<span class="golf-eagle-number">${net}</span>`;
                            } else if (rel === -1) {
                                cellClass = 'golf-birdie';
                            } else if (rel === 1) {
                                cellClass = 'golf-bogey';
                            } else if (rel >= 2) {
                                cellClass = 'golf-double-bogey';
                            }
                            total += Number(net);
                            if (idx < 9) out += Number(net);
                            else in9 += Number(net);
                        }
                        netHtml += `<td class="text-center ${cellClass}">${cellContent !== undefined && cellContent !== null ? cellContent : ''}</td>`;
                    });
                    netHtml += `<td class="text-center font-bold">${out || ''}</td><td class="text-center font-bold">${in9 || ''}</td><td class="text-center font-bold">${total || ''}</td>`;
                    netHtml += `</tr>`;
                });
                netHtml += `</tbody></table></div>`;
                container.innerHTML += netHtml;
            }
        }
        // TEAM GAME (Hi-Lo)
        if (window.scorecardTypeState[roundId].team) {
            let teamHtml = `<div class="mb-8"><h4 class="text-lg font-bold mb-2">Team Game</h4>`;
            // Only show for rounds 1 and 2
            if (roundId === 1 || roundId === 2) {
                // Use hilo_results_round1 or hilo_results_round2
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

                    // Build player lists for each team in this match
                    // We'll need to fetch from hilo_matchups and Players
                    // Assume window.allPlayers is available (from initial load)
                    // If not, fallback to just showing blank
                    Object.keys(matches).forEach(matchNum => {
                        const match = matches[matchNum];
                        // Find team names
                        const team1 = match[0].team1;
                        const team2 = match[0].team2;

                        // Determine match winner by last running score (move this up!)
                        let matchWinner = '';
                        if (match.length > 0) {
                            const lastRow = match[match.length - 1];
                            if (lastRow.team1_running > lastRow.team2_running) matchWinner = lastRow.team1;
                            else if (lastRow.team2_running > lastRow.team1_running) matchWinner = lastRow.team2;
                        }

                        // Now build player lists for each team in this match, using matchWinner for highlighting
                        let team1Players = '', team2Players = '';
                        if (window.allPlayers && Array.isArray(window.allPlayers) && window.hiloMatchups && Array.isArray(window.hiloMatchups)) {
                            const t1ids = window.hiloMatchups
                                .filter(m => m.round_id == roundId && m.match_number == matchNum && m.team === team1)
                                .map(m => m.player_id);
                            const t2ids = window.hiloMatchups
                                .filter(m => m.round_id == roundId && m.match_number == matchNum && m.team === team2)
                                .map(m => m.player_id);

                            // Highlight player names if their team won the match
                            const t1Highlight = matchWinner === team1 ? 'text-emerald-600 font-bold' : '';
                            const t2Highlight = matchWinner === team2 ? 'text-emerald-600 font-bold' : '';

                            team1Players = t1ids.map(pid => {
                                const p = window.allPlayers.find(pl => pl.player_id == pid);
                                return p ? `<span class="${t1Highlight}">${p.name}</span>` : '';
                            }).filter(Boolean).join(', ');
                            team2Players = t2ids.map(pid => {
                                const p = window.allPlayers.find(pl => pl.player_id == pid);
                                return p ? `<span class="${t2Highlight}">${p.name}</span>` : '';
                            }).filter(Boolean).join(', ');
                        }

                        teamHtml += `<div class="mb-8 p-4 card border-2 ${matchWinner ? 'border-emerald-500' : 'border-gray-200'} shadow fade-in">`;
                        teamHtml += `<div class="flex items-center justify-between mb-2">`;
                        teamHtml += `<h5 class="font-semibold text-lg">Match ${matchNum}: <span class="${matchWinner === match[0].team1 ? 'text-emerald-600 font-bold' : ''}">${match[0].team1}</span> vs <span class="${matchWinner === match[0].team2 ? 'text-emerald-600 font-bold' : ''}">${match[0].team2}</span></h5>`;
                        if (matchWinner) {
                            teamHtml += `<span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-xs ml-4">Winner: ${matchWinner}</span>`;
                        }
                        teamHtml += `</div>`;
                        // Player names row
                        teamHtml += `<div class="mb-2 text-sm text-gray-600 flex flex-wrap gap-4">`;
                        teamHtml += `<span><span class="font-semibold">${match[0].team1}:</span> ${team1Players || '<i>Players not listed</i>'}</span>`;
                        teamHtml += `<span><span class="font-semibold">${match[0].team2}:</span> ${team2Players || '<i>Players not listed</i>'}</span>`;
                        teamHtml += `</div>`;
                        // Table
                        teamHtml += `<div class="overflow-x-auto"><table class="min-w-full text-xs md:text-sm scoreboard-table border">`;
                        teamHtml += `<thead class="bg-gray-50"><tr>`;
                        teamHtml += `<th class="px-2 py-1">Hole</th><th class="px-2 py-1">${match[0].team1} Low</th><th class="px-2 py-1">${match[0].team1} High</th><th class="px-2 py-1">${match[0].team2} Low</th><th class="px-2 py-1">${match[0].team2} High</th><th class="px-2 py-1">Result</th><th class="px-2 py-1">Running</th>`;
                        teamHtml += `</tr></thead><tbody>`;
                        match.forEach((row, idx) => {
                            let result = '';
                            let rowClass = '';
                            if (row.team1_hole_result === 1) {
                                result = `${row.team1} wins`;
                                rowClass = 'bg-emerald-50 font-semibold';
                            } else if (row.team2_hole_result === 1) {
                                result = `${row.team2} wins`;
                                rowClass = 'bg-blue-50 font-semibold';
                            } else {
                                result = 'Halved';
                                rowClass = 'bg-gray-50';
                            }
                            let running = '';
                            if (row.team1_running > 0) running = `${row.team1} +${row.team1_running}`;
                            else if (row.team1_running < 0) running = `${row.team2} +${-row.team1_running}`;
                            else running = 'All Square';

                            // Find initials for low/high for each team
                            let t1LowInitials = '', t1HighInitials = '', t2LowInitials = '', t2HighInitials = '';
                            if (window.hiloMatchups && window.allPlayers) {
                                // For each team, get player IDs in this match
                                const t1ids = window.hiloMatchups
                                    .filter(m => m.round_id == roundId && m.match_number == matchNum && m.team === row.team1)
                                    .map(m => m.player_id);
                                const t2ids = window.hiloMatchups
                                    .filter(m => m.round_id == roundId && m.match_number == matchNum && m.team === row.team2)
                                    .map(m => m.player_id);

                                // Use the per-round scores instead of global detailed_scores
                                if (scores && scores.length) {
                                    // Team 1
                                    const t1Scores = t1ids.map(pid => {
                                        const sc = scores.find(s => s.player_id == pid && s.hole_id == row.hole_id);
                                        return sc ? { pid, net: sc.net_strokes } : null;
                                    }).filter(Boolean);
                                    // Sort by net score, then by player id to break ties
                                    t1Scores.sort((a, b) => a.net - b.net || a.pid - b.pid);
                                    if (t1Scores.length > 0) {
                                        t1LowInitials = getInitials(t1Scores[0].pid);
                                        if (t1Scores.length > 1) {
                                            t1HighInitials = getInitials(t1Scores[t1Scores.length - 1].pid);
                                        } else {
                                            t1HighInitials = t1LowInitials;
                                        }
                                    }
                                    // Team 2
                                    const t2Scores = t2ids.map(pid => {
                                        const sc = scores.find(s => s.player_id == pid && s.hole_id == row.hole_id);
                                        return sc ? { pid, net: sc.net_strokes } : null;
                                    }).filter(Boolean);
                                    t2Scores.sort((a, b) => a.net - b.net || a.pid - b.pid);
                                    if (t2Scores.length > 0) {
                                        t2LowInitials = getInitials(t2Scores[0].pid);
                                        if (t2Scores.length > 1) {
                                            t2HighInitials = getInitials(t2Scores[t2Scores.length - 1].pid);
                                        } else {
                                            t2HighInitials = t2LowInitials;
                                        }
                                    }
                                }
                            }
                            // Add initials next to scores
                            const t1LowCell = `${row.team1_low}${t1LowInitials ? ` <span class='text-xs text-gray-500'>(${t1LowInitials})</span>` : ''}`;
                            const t1HighCell = `${row.team1_high}${t1HighInitials ? ` <span class='text-xs text-gray-500'>(${t1HighInitials})</span>` : ''}`;
                            const t2LowCell = `${row.team2_low}${t2LowInitials ? ` <span class='text-xs text-gray-500'>(${t2LowInitials})</span>` : ''}`;
                            const t2HighCell = `${row.team2_high}${t2HighInitials ? ` <span class='text-xs text-gray-500'>(${t2HighInitials})</span>` : ''}`;

                            teamHtml += `<tr class="${rowClass}"><td class="text-center">${idx + 1}</td><td class="text-center">${t1LowCell}</td><td class="text-center">${t1HighCell}</td><td class="text-center">${t2LowCell}</td><td class="text-center">${t2HighCell}</td><td class="text-center">${result}</td><td class="text-center">${running}</td></tr>`;
                        });
                        teamHtml += `</tbody></table></div></div>`;
                    });
                } catch (err) {
                    teamHtml += `<div class="text-red-500 italic">Error loading team game data: ${err.message}</div>`;
                }
            } else if (roundId !== 3 && roundId !== 4) {
                // Only show "Coming soon" for rounds other than 1, 2, 3, 4
                teamHtml += `<div class="text-gray-500 italic">Coming soon: Team game scorecard will be displayed here.</div>`;
            }
            teamHtml += `</div>`;
            container.innerHTML += teamHtml;
        }
        // SINGLES MATCHPLAY for Rounds 3 and 4
        if ((roundId === 3 || roundId === 4) && window.scorecardTypeState[roundId].team) {
            let singlesHtml = `<div class="mb-8"><h4 class="text-lg font-bold mb-2">Team Game (Singles Matchplay)</h4>`;
            const singlesView = roundId === 3 ? 'singles_results_round3' : 'singles_results_round4';
            try {
                const { data: singlesData, error: singlesError } = await supabase
                    .from(singlesView)
                    .select('*');
                if (singlesError) throw singlesError;
                if (!singlesData || singlesData.length === 0) {
                    singlesHtml += `<div class="text-gray-500 italic">No singles matchplay data available for this round.</div></div>`;
                    container.innerHTML += singlesHtml;
                    return;
                }
                // Group by match_number
                const matches = {};
                singlesData.forEach(row => {
                    if (!matches[row.match_number]) matches[row.match_number] = [];
                    matches[row.match_number].push(row);
                });

                Object.keys(matches).forEach(matchNum => {
                    const match = matches[matchNum];
                    const firstRow = match[0];
                    // Get player names
                    const player1 = window.allPlayers.find(p => p.player_id == firstRow.player1_id);
                    const player2 = window.allPlayers.find(p => p.player_id == firstRow.player2_id);
                    const player1Name = player1 ? player1.name : `Player ${firstRow.player1_id}`;
                    const player2Name = player2 ? player2.name : `Player ${firstRow.player2_id}`;

                    // Determine match winner by last running score
                    let matchWinner = '';
                    if (match.length > 0) {
                        const lastRow = match[match.length - 1];
                        if (lastRow.running > 0) matchWinner = player1Name;
                        else if (lastRow.running < 0) matchWinner = player2Name;
                    }

                    // Highlight winner
                    const p1Highlight = matchWinner === player1Name ? 'text-emerald-600 font-bold' : '';
                    const p2Highlight = matchWinner === player2Name ? 'text-emerald-600 font-bold' : '';

                    singlesHtml += `<div class="mb-8 p-4 card border-2 ${matchWinner ? 'border-emerald-500' : 'border-gray-200'} shadow fade-in">`;
                    singlesHtml += `<div class="flex items-center justify-between mb-2">`;
                    singlesHtml += `<h5 class="font-semibold text-lg">Match ${matchNum}: <span class="${p1Highlight}">${player1Name}</span> vs <span class="${p2Highlight}">${player2Name}</span></h5>`;
                    if (matchWinner) {
                        singlesHtml += `<span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-xs ml-4">Winner: ${matchWinner}</span>`;
                    }
                    singlesHtml += `</div>`;
                    // Table
                    singlesHtml += `<div class="overflow-x-auto"><table class="min-w-full text-xs md:text-sm scoreboard-table border">`;
                    singlesHtml += `<thead class="bg-gray-50"><tr>`;
                    singlesHtml += `<th class="px-2 py-1">Hole</th><th class="px-2 py-1">${player1Name}</th><th class="px-2 py-1">${player2Name}</th><th class="px-2 py-1">Result</th><th class="px-2 py-1">Running</th>`;
                    singlesHtml += `</tr></thead><tbody>`;
                    match.forEach((row, idx) => {
                        let result = '';
                        let rowClass = '';
                        if (row.hole_result === 1) {
                            result = `${player1Name} wins`;
                            rowClass = 'bg-emerald-50 font-semibold';
                        } else if (row.hole_result === -1) {
                            result = `${player2Name} wins`;
                            rowClass = 'bg-blue-50 font-semibold';
                        } else {
                            result = 'Halved';
                            rowClass = 'bg-gray-50';
                        }
                        let running = '';
                        if (row.running > 0) running = `${player1Name} +${row.running}`;
                        else if (row.running < 0) running = `${player2Name} +${-row.running}`;
                        else running = 'All Square';

                        singlesHtml += `<tr class="${rowClass}"><td class="text-center">${row.hole_id}</td><td class="text-center">${row.player1_net}</td><td class="text-center">${row.player2_net}</td><td class="text-center">${result}</td><td class="text-center">${running}</td></tr>`;
                    });
                    singlesHtml += `</tbody></table></div></div>`;
                });
            } catch (err) {
                singlesHtml += `<div class="text-red-500 italic">Error loading singles matchplay data: ${err.message}</div>`;
            }
            singlesHtml += `</div>`;
            container.innerHTML += singlesHtml;
        }
    }
    // Initial render
    renderScorecardTables();
}

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
            if (scoreToPar > 0) {
                scoreToParDisplay = `+${scoreToPar}`;
            } else if (scoreToPar < 0) {
                scoreToParDisplay = `${scoreToPar}`;
            } else {
                scoreToParDisplay = 'E';
            }
        }
        recentRoundsContainer.innerHTML += `
            <div class="card p-4 mb-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500">${round.round_date}</p>
                        <p class="text-lg font-bold text-gray-800">${round.course_name} - ${round.tee_name}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-500">Score</p>
                        <p class="text-xl font-bold text-gray-800">${score}</p>
                    </div>
                </div>
                <div class="mt-2">
                    <button class="text-sm font-semibold text-blue-600 hover:underline" onclick="showRoundDetails(${round.round_id})">View Details</button>
                </div>
            </div>`;
    });
}

// Initial Data Fetch
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch players and recent rounds in parallel
    await Promise.all([fetchPlayers(), fetchRecentRounds()]);

    // Show players view by default
    showView('players');

    // Tab navigation
    document.getElementById('tab-players').addEventListener('click', () => showView('players'));
    document.getElementById('tab-dashboard').addEventListener('click', () => {
        showView('dashboard'); // Always show dashboard view first
        fetchRecentRounds();
    });
    document.getElementById('tab-leaderboard').addEventListener('click', () => showView('leaderboard'));

    // Players sub-tab navigation
    document.getElementById('subtab-all-players').addEventListener('click', () => showPlayersSubView('all-players'));
    document.getElementById('subtab-teams').addEventListener('click', () => showPlayersSubView('teams'));

    // Back button for profile view
    document.getElementById('backButton').addEventListener('click', () => showView(lastActiveTab));

    // Event delegation for clickable players
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('clickable-player')) {
            const playerId = e.target.dataset.playerId;
            showPlayerProfile(playerId);
        }
    });

    // Hide loader after initial setup
    loader.classList.add('hidden');
});

// --- Error Handling ---
function showError(message, details = '') {
    errorMessage.innerHTML = `
        <div class="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            <span class="font-semibold">Error:</span> ${message}
            ${details ? `<br><span class="font-medium">Details:</span> ${details}` : ''}
        </div>`;
    loader.classList.add('hidden');
}

// --- Player Profile ---
async function fetchPlayerProfile(playerId) {
    try {
        const { data, error } = await supabase
            .from('Players')
            .select('*')
            .eq('player_id', playerId)
            .single();
        if (error) throw error;
        return data;
    } catch (e) {
        showError('Failed to fetch player profile.', e.message);
        return null;
    }
}

function showPlayerProfile(playerId) {
    fetchPlayerProfile(playerId).then(player => {
        if (!player) return;
        // Hide all views
        playersView.classList.add('hidden');
        dashboardView.classList.add('hidden');
        leaderboardView.classList.add('hidden');
        profileView.classList.add('hidden');
        tabNav.classList.add('hidden');

        // Show profile view
        profileView.classList.remove('hidden');

        // Populate profile data
        profileView.innerHTML = `
            <div class="card p-4">
                <h2 class="text-2xl font-bold mb-4">${player.name}</h2>
                <p class="text-sm text-gray-500 mb-2">Player ID: ${player.player_id}</p>
                <p class="text-sm text-gray-500 mb-4">Team: ${player.team || 'N/A'}</p>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Profile</h3>
                        <p class="text-sm text-gray-700">HCP: ${player.handicap_index}</p>
                        <p class="text-sm text-gray-700">Email: ${player.email || 'N/A'}</p>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Stats</h3>
                        <p class="text-sm text-gray-700">Rounds: ${player.rounds_played || 0}</p>
                        <p class="text-sm text-gray-700">Avg Score: ${player.avg_score !== null ? player.avg_score.toFixed(1) : 'N/A'}</p>
                    </div>
                </div>
                <div class="mt-4">
                    <button class="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700" onclick="editPlayerProfile(${player.player_id})">Edit Profile</button>
                </div>
            </div>`;
    });
}

// --- Edit Player Profile ---
function editPlayerProfile(playerId) {
    fetchPlayerProfile(playerId).then(player => {
        if (!player) return;
        // Hide all views
        playersView.classList.add('hidden');
        dashboardView.classList.add('hidden');
        leaderboardView.classList.add('hidden');
        profileView.classList.add('hidden');
        tabNav.classList.add('hidden');

        // Show profile view
        profileView.classList.remove('hidden');

        // Populate profile data in editable form
        profileView.innerHTML = `
            <div class="card p-4">
                <h2 class="text-2xl font-bold mb-4">Edit Profile - ${player.name}</h2>
                <p class="text-sm text-gray-500 mb-4">Player ID: ${player.player_id}</p>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="edit-name">Name</label>
                        <input type="text" id="edit-name" class="block w-full p-2 border rounded-md" value="${player.name}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="edit-team">Team</label>
                        <input type="text" id="edit-team" class="block w-full p-2 border rounded-md" value="${player.team || ''}">
                    </div>
                </div>
                <div class="mt-4">
                    <button class="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700" onclick="savePlayerProfile(${player.player_id})">Save Changes</button>
                    <button class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-400" onclick="showPlayerProfile(${player.player_id})">Cancel</button>
                </div>
            </div>`;
    });
}

async function savePlayerProfile(playerId) {
    const name = document.getElementById('edit-name').value.trim();
    const team = document.getElementById('edit-team').value.trim();

    if (!name) {
        return showError('Name is required.');
    }

    try {
        const { error } = await supabase
            .from('Players')
            .update({ name, team })
            .eq('player_id', playerId);

        if (error) throw error;

        // Refresh player profile
        showPlayerProfile(playerId);
    } catch (e) {
        showError('Failed to save profile changes.', e.message);
    }
}

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch players and recent rounds in parallel
    await Promise.all([fetchPlayers(), fetchRecentRounds()]);

    // Show players view by default
    showView('players');

    // Tab navigation
    document.getElementById('tab-players').addEventListener('click', () => showView('players'));
    document.getElementById('tab-dashboard').addEventListener('click', () => {
        showView('dashboard'); // Always show dashboard view first
        fetchRecentRounds();
    });
    document.getElementById('tab-leaderboard').addEventListener('click', () => showView('leaderboard'));

    // Players sub-tab navigation
    document.getElementById('subtab-all-players').addEventListener('click', () => showPlayersSubView('all-players'));
    document.getElementById('subtab-teams').addEventListener('click', () => showPlayersSubView('teams'));

    // Back button for profile view
    document.getElementById('backButton').addEventListener('click', () => showView(lastActiveTab));

    // Event delegation for clickable players
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('clickable-player')) {
            const playerId = e.target.dataset.playerId;
            showPlayerProfile(playerId);
        }
    });

    // Hide loader after initial setup
    loader.classList.add('hidden');
});

function getInitials(pid) {
    const p = window.allPlayers.find(pl => pl.player_id == pid);
    if (!p) return '';
    return p.name.split(' ').map(n => n[0]).join('').toUpperCase();
}
