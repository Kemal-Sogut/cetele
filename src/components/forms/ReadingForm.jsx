import { useState } from 'react';
import Button from '../common/Button';
import { toLocalDateString, parseLocalDate } from '../../utils/calculations';

export default function ReadingForm({ onSubmit, onCancel, type, initialDate = new Date() }) {
    const [date, setDate] = useState(toLocalDateString(initialDate));
    const [pages, setPages] = useState('');
    const [loading, setLoading] = useState(false);

    const typeLabels = {
        risale: 'Risale',
        pirlanta: 'Pirlanta',
        quran: "Qur'an",
        quran_meal: "Qur'an Meal"
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        await onSubmit({ date: parseLocalDate(date), value: parseInt(pages) });
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
                <label className="block text-sm font-medium text-dark-300 mb-2">
                    Pages Read ({typeLabels[type]})
                </label>
                <input
                    type="number"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    className="input-field"
                    placeholder="Enter number of pages"
                    min="1"
                    required
                />
            </div>

            <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
                    Cancel
                </Button>
                <Button type="submit" disabled={loading || !pages} className="flex-1">
                    {loading ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </form>
    );
}
