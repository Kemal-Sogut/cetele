import { useState } from 'react';
import Button from '../common/Button';
import { toLocalDateString, parseLocalDate } from '../../utils/calculations';

export default function NafileForm({ onSubmit, onCancel, initialDate = new Date() }) {
    const [date, setDate] = useState(toLocalDateString(initialDate));
    const [count, setCount] = useState(1);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        await onSubmit({ date: parseLocalDate(date), value: parseInt(count) });
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
                <label className="block text-sm font-medium text-dark-300 mb-2">Number of Nafile Prayers</label>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setCount(Math.max(1, count - 1))}
                        className="w-12 h-12 rounded-xl bg-dark-700/50 text-white hover:bg-dark-600/50 transition-colors text-xl font-bold"
                    >
                        −
                    </button>
                    <input
                        type="number"
                        value={count}
                        onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="input-field text-center text-xl font-bold flex-1"
                        min="1"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setCount(count + 1)}
                        className="w-12 h-12 rounded-xl bg-dark-700/50 text-white hover:bg-dark-600/50 transition-colors text-xl font-bold"
                    >
                        +
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
