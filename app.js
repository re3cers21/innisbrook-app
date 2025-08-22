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
const profileView = document.getElementById('profileView');

const allPlayersContainer = document.getElementById('allPlayersContainer');
const teamsContainer = document.getElementById('teamsContainer');
const playersTableBody = document.getElementById('playersTableBody');
const teamHomzaContainer = document.getElementById('teamHomzaContainer');
const teamKinnairdContainer = document.getElementById('teamKinnairdContainer');
const recentRoundsContainer = document.getElementById('recentRoundsContainer');
const handicapGrid = document.getElementById('handicapGrid');
const searchInput = document.getElementById('searchInput');
const backButton = document.getElementById('backButton');

let allHandicapData = [];
let allPlayersData = [];
let lastActiveTab = 'players';

// --- View & Tab Navigation ---
function showView(viewName) {
    playersView.classList.add('hidden');
    dashboardView.classList.add('hidden');
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

async function fetchHandicaps() {
    const { data, error } = await supabase.from('course_handicap_view').select('*');
    if (error) throw error;
    allHandicapData = data;
    renderHandicaps(allHandicapData);
}

async function fetchRecentRounds() {
    const { data, error } = await supabase.from('recent_rounds_view').select('*');
    if (error) throw error;
    renderRecentRounds(data);
}

async function loadPlayerProfile(playerId) {
    const profileHeader = document.getElementById('profileHeader');
    profileHeader.innerHTML = `<div class="loader mx-auto"></div>`;
    const profileRoundsContainer = document.getElementById('profileRoundsContainer');
    profileRoundsContainer.innerHTML = '';
    try {
        const [playerRes, roundsRes] = await Promise.all([
            supabase.from('Players').select('name, handicap_index').eq('player_id', playerId).single(),
            supabase.rpc('get_player_rounds', { p_id: playerId })
        ]);
        if (playerRes.error) throw playerRes.error;
        if (roundsRes.error) throw roundsRes.error;
        renderProfile(playerRes.data, roundsRes.data);
    } catch (error) {
        profileHeader.innerHTML = `<div class="card p-5 text-center text-red-600 bg-red-50 border border-red-200"><p>Could not load player profile.</p><p class="text-xs mt-2 text-gray-500">${error.message}</p></div>`;
    }
}

// --- Rendering ---
function renderPlayers(data) {
    playersTableBody.innerHTML = '';
    data.forEach(p => {
        const r = playersTableBody.insertRow();
        r.className = "hover:bg-gray-50";
        r.innerHTML = `<td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900 clickable-player" data-player-id="${p.player_id}">${p.name}</div></td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${p.handicap_index}</div></td>`;
    });
}

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

function renderHandicaps(data) {
    const noResults = document.getElementById('noResults');
    handicapGrid.innerHTML = '';
    noResults.classList.toggle('hidden', data.length > 0);
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card p-5';
        card.innerHTML = `<div><div class="flex items-start justify-between"><div><h3 class="text-xl font-bold text-gray-900 clickable-player" data-player-id="${item.player_id}">${item.player_name}</h3><p class="text-sm text-gray-500">${item.course_name}</p></div><div class="text-right"><span class="text-3xl font-bold text-emerald-600">${item.course_handicap}</span><p class="text-xs text-gray-500 font-medium">Handicap</p></div></div><div class="mt-4 border-t border-gray-200 pt-4"><dl><div class="text-sm"><dt class="text-gray-500">Tee</dt><dd class="font-medium text-gray-800">${item.tee_name}</dd></div></dl></div></div>`;
        handicapGrid.appendChild(card);
    });
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

function filterHandicaps() {
    const query = searchInput.value.toLowerCase();
    const filteredData = allHandicapData.filter(item =>
        item.player_name.toLowerCase().includes(query) ||
        item.course_name.toLowerCase().includes(query) ||
        item.tee_name.toLowerCase().includes(query)
    );
    renderHandicaps(filteredData);
}

// --- Main Execution & Event Listeners ---
async function initializeApp() {
    loader.classList.remove('hidden');
    try {
        await Promise.all([fetchPlayers(), fetchRecentRounds(), fetchHandicaps()]);
        loader.classList.add('hidden');
        showView('players');
        showPlayersSubView('all-players');
    } catch (error) {
        showError('Failed to load initial data.', error.message);
    }
}

document.getElementById('tab-players').addEventListener('click', () => showView('players'));
document.getElementById('tab-dashboard').addEventListener('click', () => showView('dashboard'));
document.getElementById('subtab-all-players').addEventListener('click', () => showPlayersSubView('all-players'));
document.getElementById('subtab-teams').addEventListener('click', () => showPlayersSubView('teams'));
backButton.addEventListener('click', () => showView(lastActiveTab));
searchInput.addEventListener('input', filterHandicaps);
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
