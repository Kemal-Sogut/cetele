import { useState } from 'react';
import Button from '../common/Button';
import { toLocalDateString, parseLocalDate } from '../../utils/calculations';

export default function FastingForm({ onSubmit, onCancel, initialDate = new Date() }) {
    const [date, setDate] = useState(toLocalDateString(initialDate));
    const [fasted, setFasted] = useState(true);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        await onSubmit({ date: parseLocalDate(date), value: fasted });
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
                <label className="block text-sm font-medium text-dark-300 mb-3">Did you fast today?</label>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setFasted(true)}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${fasted
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                            : 'bg-dark-700/50 text-dark-300 hover:bg-dark-600/50'
                            }`}
                    >
                        ✓ Yes
                    </button>
                    <button
                        type="button"
                        onClick={() => setFasted(false)}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${!fasted
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                            : 'bg-dark-700/50 text-dark-300 hover:bg-dark-600/50'
                            }`}
                    >
                        ✗ No
                    </button>
                </div>
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
