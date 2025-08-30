// Utility/helper functions (optional)

export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Add more helpers as needed...
