// Admin Moods Management Page
import React, { useEffect, useState } from 'react';
import { createMood, updateMood, deleteMood, getAllMoods, seedDefaultMoods } from '../../services/moodsService';
import { useAuth } from '../../contexts/AuthContext';

function AdminMoods() {
  const { currentUser } = useAuth();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ambienceTags: '',
    lighting: '',
    colorPalettes: '',
  });
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadMoods();
  }, []);

  const loadMoods = async () => {
    try {
      setLoading(true);
      const moodList = await getAllMoods(true);
      setMoods(moodList);
    } catch (err) {
      console.error('Error loading moods:', err);
      setError('Failed to load moods.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateMood = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Mood name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createMood({
        name: formData.name.trim(),
        description: formData.description.trim(),
        ambienceTags: formData.ambienceTags ? formData.ambienceTags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        lighting: formData.lighting ? formData.lighting.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        colorPalettes: formData.colorPalettes ? formData.colorPalettes.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      });
      setFormData({
        name: '',
        description: '',
        ambienceTags: '',
        lighting: '',
        colorPalettes: '',
      });
      await loadMoods();
    } catch (err) {
      console.error('Error creating mood:', err);
      setError('Failed to create mood.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMood = async (moodId, isActive) => {
    try {
      await updateMood(moodId, { isActive: !isActive });
      await loadMoods();
    } catch (err) {
      console.error('Error updating mood:', err);
    }
  };

  const handleDeleteMood = async (moodId) => {
    if (!window.confirm('Delete this mood?')) return;
    try {
      await deleteMood(moodId);
      await loadMoods();
    } catch (err) {
      console.error('Error deleting mood:', err);
    }
  };

  const handleSeedMoods = async () => {
    if (!window.confirm('Seed 8 default mood categories (Relaxed, Romantic, Adventurous, etc.)? Existing moods will be skipped.')) return;
    setSeeding(true);
    setError('');
    try {
      const { created, skipped } = await seedDefaultMoods();
      await loadMoods();
      alert(`Seeded ${created} new moods. Skipped ${skipped} existing.`);
    } catch (err) {
      console.error('Error seeding moods:', err);
      setError('Failed to seed moods.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary font-semibold">Admin</p>
          <h1 className="text-3xl font-display font-bold text-foreground">Mood Library</h1>
          <p className="text-muted-foreground">Control the curated moods used throughout Solora.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card lg:col-span-1">
          <h2 className="text-xl font-display font-semibold mb-4">Create Mood</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateMood} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Mood Name *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Description</label>
              <textarea
                className="input"
                rows="3"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Ambience Tags</label>
              <input
                type="text"
                className="input"
                placeholder="Comma separated (e.g., warm light, artisanal)"
                value={formData.ambienceTags}
                onChange={(e) => handleInputChange('ambienceTags', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Lighting Styles</label>
              <input
                type="text"
                className="input"
                placeholder="Comma separated"
                value={formData.lighting}
                onChange={(e) => handleInputChange('lighting', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Color Palettes</label>
              <input
                type="text"
                className="input"
                placeholder="Comma separated"
                value={formData.colorPalettes}
                onChange={(e) => handleInputChange('colorPalettes', e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={saving}>
              {saving ? 'Saving...' : 'Add Mood'}
            </button>
          </form>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold">Existing Moods</h2>
            <button
              type="button"
              onClick={handleSeedMoods}
              disabled={seeding}
              className="btn btn-outline text-sm"
            >
              {seeding ? 'Seeding...' : 'Seed Default Moods'}
            </button>
          </div>
          {loading ? (
            <p className="text-muted-foreground">Loading moods...</p>
          ) : moods.length === 0 ? (
            <p className="text-muted-foreground">No moods defined yet.</p>
          ) : (
            <div className="space-y-4">
              {moods.map((mood) => (
                <div key={mood.id} className="border border-border rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-foreground">{mood.name}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            mood.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {mood.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1">{mood.description}</p>
                      <div className="text-sm text-muted-foreground mt-2 flex flex-wrap gap-2">
                        {mood.ambienceTags?.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleMood(mood.id, mood.isActive)}
                        className="btn btn-outline text-sm"
                      >
                        {mood.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteMood(mood.id)}
                        className="btn btn-outline text-sm text-red-600 border-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminMoods;

