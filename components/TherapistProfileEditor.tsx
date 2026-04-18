import React, { useState, useEffect } from 'react';
import { getTherapistProfile, updateTherapistProfile } from '../services/therapistService';

interface TherapistProfileEditorProps {
  onSaved?: () => void;
  onCancel?: () => void;
}

export const TherapistProfileEditor: React.FC<TherapistProfileEditorProps> = ({ onSaved, onCancel }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    specialization: '',
    bio: '',
    qualifications: '',
    experience: '',
    languages: '',
    availability: 'online',
    availabilitySchedule: '',
    sessionPrice: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await getTherapistProfile();
      if (result.success) {
        setProfile(result.data);
        setForm({
          name: result.data.name || '',
          phone: result.data.phone || '',
          specialization: result.data.specialization || '',
          bio: result.data.bio || '',
          qualifications: result.data.qualifications || '',
          experience: result.data.experience || '',
          languages: Array.isArray(result.data.languages) ? result.data.languages.join(', ') : (result.data.languages || ''),
          availability: result.data.availability || 'online',
          availabilitySchedule: result.data.availabilitySchedule || '',
          sessionPrice: result.data.sessionPrice || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateTherapistProfile(form);
      onSaved?.();
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-unity-200 border-t-unity-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-unity-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-unity-black">My Professional Profile</h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required className="w-full p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
          <input name="specialization" value={form.specialization} onChange={handleChange} required placeholder="e.g. Anxiety, Depression, Trauma" className="w-full p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio *</label>
          <textarea name="bio" value={form.bio} onChange={handleChange} required rows={4} className="w-full p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400 resize-none" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
            <input name="qualifications" value={form.qualifications} onChange={handleChange} placeholder="Degrees, certifications" className="w-full p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
            <input name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 5+ years" className="w-full p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Languages (comma-separated)</label>
            <input name="languages" value={form.languages} onChange={handleChange} placeholder="English, Swahili" className="w-full p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select name="availability" value={form.availability} onChange={handleChange} className="w-full p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400">
              <option value="online">Online only</option>
              <option value="in-person">In-person only</option>
              <option value="both">Both online & in-person</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Availability Schedule</label>
          <textarea name="availabilitySchedule" value={form.availabilitySchedule} onChange={handleChange} rows={3} placeholder="e.g. Mon-Fri 9am-5pm, Sat 10am-2pm" className="w-full p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400 resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Session Price / Cost per hour</label>
          <input name="sessionPrice" value={form.sessionPrice} onChange={handleChange} placeholder="e.g. $50 / hour or $5 chat / $10 video" className="w-full p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400" />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-unity-500 text-white rounded-full font-semibold hover:bg-unity-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-full font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
