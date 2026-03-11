import { calculateTotalPoints } from '../services/activityService';
// Calculation utilities for activity statistics

/**
 * Calculate total fasting days
 */
export function calculateTotalFastingDays(activities) {
    return activities.filter(a => a.type === 'fasting' && a.value === true).length;
}

/**
 * Calculate total prayers in the last 7 days
 */
export function calculateWeeklyPrayers(activities) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    return activities
        .filter(a => {
            if (a.type !== 'prayer') return false;
            const activityDate = a.date instanceof Date ? a.date : new Date(a.date);
            return activityDate >= sevenDaysAgo;
        })
        .reduce((count, a) => {
            // Support both old format (string) and new format (array)
            if (Array.isArray(a.value)) {
                return count + a.value.length;
            }
            return count + 1;
        }, 0);
}

/**
 * Calculate total prayers across ALL time (counts individual prayers, not entries)
 * e.g. if someone prayed all 5 prayers in a day, that adds 5 to the count
 */
export function calculateTotalPrayers(activities) {
    return activities
        .filter(a => a.type === 'prayer')
        .reduce((count, a) => {
            if (Array.isArray(a.value)) {
                return count + a.value.length;
            }
            return count + 1;
        }, 0);
}

/**
 * Calculate total Taraweh where rakats >= 10
 */
export function calculateTotalTaraweh(activities) {
    return activities.filter(a => a.type === 'taraweh' && a.value >= 10).length;
}

/**
 * Calculate total pages read for a specific reading type
 */
export function calculateTotalPages(activities, type) {
    return activities
        .filter(a => a.type === type)
        .reduce((sum, a) => sum + (parseInt(a.value) || 0), 0);
}

/**
 * Calculate total Nafile prayers
 */
export function calculateTotalNafile(activities) {
    return activities
        .filter(a => a.type === 'nafile')
        .reduce((sum, a) => sum + (parseInt(a.value) || 0), 0);
}


/**
 * Format a Date as YYYY-MM-DD using LOCAL timezone (not UTC).
 * This avoids the off-by-one bug caused by toISOString() converting to UTC.
 */
export function toLocalDateString(date) {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string as local midnight (not UTC).
 * new Date('2026-02-18') parses as UTC midnight, which is Feb 17 at 7PM in Ottawa.
 * This function ensures the date is treated as local time.
 */
export function parseLocalDate(dateStr) {
    if (!dateStr) return new Date(NaN);
    // If it's already a Date, return it
    if (dateStr instanceof Date) return dateStr;
    // Only append T00:00:00 for plain YYYY-MM-DD strings
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + 'T00:00:00');
    }
    // Otherwise parse as-is (ISO strings, etc.)
    return new Date(dateStr);
}

/**
 * Get activities grouped by date
 */
export function groupActivitiesByDate(activities) {
    return activities.reduce((groups, activity) => {
        const date = toLocalDateString(
            activity.date instanceof Date ? activity.date : new Date(activity.date)
        );

        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(activity);
        return groups;
    }, {});
}

/**
 * Get today's date string
 */
export function getTodayString() {
    return toLocalDateString(new Date());
}

/**
 * Format date for display
 */
export function formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Calculate all stats for a user including total points
 */
export function calculateAllStats(activities) {
    return {
        totalFasting: calculateTotalFastingDays(activities),
        totalPrayers: calculateTotalPrayers(activities),
        weeklyPrayers: calculateWeeklyPrayers(activities),
        totalTaraweh: calculateTotalTaraweh(activities),
        risalePages: calculateTotalPages(activities, 'risale'),
        pirlantaPages: calculateTotalPages(activities, 'pirlanta'),
        quranPages: calculateTotalPages(activities, 'quran'),
        quranMealPages: calculateTotalPages(activities, 'quran_meal'),
        totalNafile: calculateTotalNafile(activities),
        totalPoints: calculateTotalPoints(activities)
    };
}
