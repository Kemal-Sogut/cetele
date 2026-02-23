import { useState } from 'react';
import Button from '../common/Button';
import { toLocalDateString, parseLocalDate } from '../../utils/calculations';

export default function TarawehForm({ onSubmit, onCancel, initialDate = new Date() }) {
    const [date, setDate] = useState(toLocalDateString(initialDate));
    const [rakats, setRakats] = useState(20);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        await onSubmit({ date: parseLocalDate(date), value: parseInt(rakats) });
        setLoading(false);
    }

    const presetRakats = [8, 10, 12, 20];

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
                <label className="block text-sm font-medium text-dark-300 mb-3">Number of Rakats</label>
                <div className="flex gap-2 mb-3">
                    {presetRakats.map((num) => (
                        <button
                            key={num}
                            type="button"
                            onClick={() => setRakats(num)}
                            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${rakats === num
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                : 'bg-dark-700/50 text-dark-300 hover:bg-dark-600/50'
                                }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>
                <input
                    type="number"
                    value={rakats}
                    onChange={(e) => setRakats(e.target.value)}
                    className="input-field"
                    min="1"
                    max="100"
                    placeholder="Or enter custom amount"
                />
                {rakats < 10 && (
                    <p className="text-amber-400 text-sm mt-2">
                        ⚠ Note: Only entries with ≥10 rakats count toward total
                    </p>
                )}
            </div>

            <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </form>
    );
}
