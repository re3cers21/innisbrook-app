// All Supabase/database functions
// Example: fetchPlayers, fetchAllRounds, fetchRecentRounds, fetchNetLeaderboard, fetchPlayerCourseHandicaps, etc.

export async function fetchPlayers(supabase) {
    const { data, error } = await supabase.from('Players').select('*').order('name');
    if (error) throw error;
    return data;
}

export async function fetchAllRounds(supabase) {
    const { data, error } = await supabase
        .from('Rounds')
        .select(`round_id, round_date, round_number, tee_id, Tees (tee_name, tee_rating, tee_slope), course_id, Courses (course_name, total_par)`)
        .order('round_date', { ascending: true });
    if (error) throw error;
    return data;
}

export async function fetchRecentRounds(supabase) {
    const { data, error } = await supabase
        .from('recent_rounds_view')
        .select('*');
    if (error) throw error;
    return data;
}

export async function fetchNetLeaderboard(supabase) {
    const { data, error } = await supabase
        .from('player_round_net_scores')
        .select('*')
        .order('total_net_score', { ascending: true });
    if (error) throw error;
    return data;
}

export async function fetchPlayerCourseHandicaps(supabase, playerId) {
    const { data, error } = await supabase
        .from('course_handicap_view')
        .select('*')
        .eq('player_id', playerId);
    if (error) throw error;
    return data;
}

// Add more as needed...
