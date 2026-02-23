import { useState, useEffect } from 'react';
import Button from '../common/Button';
import { PRAYER_NAMES } from '../../services/activityService';
import { toLocalDateString, parseLocalDate } from '../../utils/calculations';

export default function PrayerForm({ onSubmit, onCancel, initialDate = new Date(), activities = [] }) {
    const [date, setDate] = useState(toLocalDateString(initialDate));
    const [selectedPrayers, setSelectedPrayers] = useState([]);
    const [loading, setLoading] = useState(false);

    // When date changes, pre-populate from existing activities for that date
    useEffect(() => {
        const existing = activities.find(a => {
            const actDate = toLocalDateString(a.date instanceof Date ? a.date : new Date(a.date));
            return actDate === date;
        });
        if (existing) {
            setSelectedPrayers(Array.isArray(existing.value) ? [...existing.value] : [existing.value]);
        } else {
            setSelectedPrayers([]);
        }
    }, [date, activities]);

    function togglePrayer(prayer) {
        setSelectedPrayers(prev =>
            prev.includes(prayer)
                ? prev.filter(p => p !== prayer)
                : [...prev, prayer]
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (selectedPrayers.length === 0) return;
        setLoading(true);
        await onSubmit({ date: parseLocalDate(date), value: selectedPrayers });
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Date</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-field"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-dark-300 mb-3">Select Prayers</label>
                <div className="grid grid-cols-5 gap-2">
                    {PRAYER_NAMES.map((prayer) => (
                        <button
                            key={prayer}
                            type="button"
                            onClick={() => togglePrayer(prayer)}
                            className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${selectedPrayers.includes(prayer)
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                : 'bg-dark-700/50 text-dark-300 hover:bg-dark-600/50'
                                }`}
                        >
                            {prayer}
                        </button>
                    ))}
                </div>
                {selectedPrayers.length > 0 && (
                    <p className="text-dark-400 text-sm mt-2">
                        Selected: {selectedPrayers.join(', ')}
                    </p>
                )}
            </div>

            <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
                    Cancel
                </Button>
                <Button type="submit" disabled={loading || selectedPrayers.length === 0} className="flex-1">
                    {loading ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </form>
    );
}
