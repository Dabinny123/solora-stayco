// Service Fee Control Page for Solora StayCo
import React, { useState, useEffect } from 'react';
import { getDocuments, updateDocument } from '../../firebase/firestoreService';

function ServiceFee() {
  const [serviceFee, setServiceFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadServiceFee();
  }, []);

  const loadServiceFee = async () => {
    try {
      // In a real app, you'd have a settings collection
      // For now, we'll use a default or fetch from a settings document
      const settings = await getDocuments('settings', [], 'createdAt', 'desc', 1);
      if (settings.length > 0) {
        setServiceFee(settings[0].serviceFee || 0);
      } else {
        setServiceFee(10); // Default 10%
      }
    } catch (err) {
      console.error('Error loading service fee:', err);
      setServiceFee(10); // Default fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Update or create settings document
      const settings = await getDocuments('settings', [], 'createdAt', 'desc', 1);
      
      if (settings.length > 0) {
        await updateDocument('settings', settings[0].id, {
          serviceFee: parseFloat(serviceFee),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new settings document
        const { createDocument } = await import('../../firebase/firestoreService');
        await createDocument('settings', {
          serviceFee: parseFloat(serviceFee),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      setMessage({ type: 'success', text: 'Service fee updated successfully' });
    } catch (err) {
      console.error('Error saving service fee:', err);
      setMessage({ type: 'error', text: 'Failed to update service fee' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">
        Service Fee Control
      </h1>

      <div className="max-w-2xl">
        <div className="card">
          <h2 className="text-xl font-display font-semibold mb-4">Platform Service Fee</h2>
          
          {message.text && (
            <div className={`mb-4 px-4 py-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Service Fee Percentage (%)
              </label>
              <input
                type="number"
                className="input"
                min="0"
                max="100"
                step="0.1"
                value={serviceFee}
                onChange={(e) => setServiceFee(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-sm text-muted-foreground mt-2">
                This percentage will be applied to all bookings as a platform service fee.
              </p>
            </div>

            <div className="bg-background p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Example Calculation</h3>
              <p className="text-sm text-muted-foreground">
                For a booking of $100 per night:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>Base price: $100</li>
                <li>Service fee ({serviceFee || 0}%): ${((100 * (serviceFee || 0)) / 100).toFixed(2)}</li>
                <li>Total: ${(100 + (100 * (serviceFee || 0)) / 100).toFixed(2)}</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving || loading}
                className="btn btn-primary px-8 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        <div className="card mt-6">
          <h2 className="text-xl font-display font-semibold mb-4">Important Notes</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Changes to service fee will apply to new bookings only</li>
            <li>• Existing bookings will retain their original service fee</li>
            <li>• Service fee is calculated as a percentage of the base booking price</li>
            <li>• Consider the impact on host earnings before making changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ServiceFee;

