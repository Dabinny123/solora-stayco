// Reports Generation Page for Solora StayCo
import React, { useState } from 'react';
import { getDocuments } from '../../firebase/firestoreService';
import { getAllPayments } from '../../services/paymentsService';
import { getAllUsers } from '../../services/usersService';
import { getActiveListings } from '../../services/listingsService';

function Reports() {
  const [reportType, setReportType] = useState('bookings');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  const generateReport = async () => {
    setGenerating(true);
    setReportData(null);

    try {
      let data = null;

      switch (reportType) {
        case 'bookings':
          const bookings = await getDocuments('bookings', [], 'createdAt', 'desc', 1000);
          data = {
            type: 'Bookings Report',
            total: bookings.length,
            byStatus: bookings.reduce((acc, b) => {
              acc[b.status] = (acc[b.status] || 0) + 1;
              return acc;
            }, {}),
            totalRevenue: bookings
              .filter(b => b.status === 'confirmed' || b.status === 'completed')
              .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
            bookings: bookings.slice(0, 50), // Limit for display
          };
          break;

        case 'payments':
          const payments = await getAllPayments(null, 1000);
          data = {
            type: 'Payments Report',
            total: payments.length,
            byStatus: payments.reduce((acc, p) => {
              acc[p.status] = (acc[p.status] || 0) + 1;
              return acc;
            }, {}),
            totalAmount: payments
              .filter(p => p.status === 'completed')
              .reduce((sum, p) => sum + (p.totalAmount || 0), 0),
            payments: payments.slice(0, 50),
          };
          break;

        case 'users':
          const users = await getAllUsers(null, 1000);
          data = {
            type: 'Users Report',
            total: users.length,
            byRole: users.reduce((acc, u) => {
              acc[u.role] = (acc[u.role] || 0) + 1;
              return acc;
            }, {}),
            users: users.slice(0, 50),
          };
          break;

        case 'listings':
          const listings = await getActiveListings({}, 1000);
          data = {
            type: 'Listings Report',
            total: listings.length,
            byCategory: listings.reduce((acc, l) => {
              acc[l.category] = (acc[l.category] || 0) + 1;
              return acc;
            }, {}),
            listings: listings.slice(0, 50),
          };
          break;

        default:
          break;
      }

      setReportData(data);
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">
        Reports Generation
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Configuration */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-display font-semibold mb-4">Generate Report</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Report Type
                </label>
                <select
                  className="input"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="bookings">Bookings Report</option>
                  <option value="payments">Payments Report</option>
                  <option value="users">Users Report</option>
                  <option value="listings">Listings Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  className="input"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  className="input"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>

              <button
                onClick={generateReport}
                disabled={generating}
                className="w-full btn btn-primary disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Results */}
        <div className="lg:col-span-2">
          {reportData ? (
            <div className="card">
              <h2 className="text-xl font-display font-semibold mb-4">{reportData.type}</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-background p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{reportData.total}</p>
                </div>
                {reportData.totalRevenue !== undefined && (
                  <div className="bg-background p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatPrice(reportData.totalRevenue)}
                    </p>
                  </div>
                )}
                {reportData.totalAmount !== undefined && (
                  <div className="bg-background p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatPrice(reportData.totalAmount)}
                    </p>
                  </div>
                )}
              </div>

              {/* Breakdown */}
              {reportData.byStatus && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Breakdown by Status</h3>
                  <div className="space-y-2">
                    {Object.entries(reportData.byStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="capitalize">{status}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.byRole && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Breakdown by Role</h3>
                  <div className="space-y-2">
                    {Object.entries(reportData.byRole).map(([role, count]) => (
                      <div key={role} className="flex justify-between items-center">
                        <span className="capitalize">{role}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportData.byCategory && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Breakdown by Category</h3>
                  <div className="space-y-2">
                    {Object.entries(reportData.byCategory).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span>{category}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing first 50 results. Export functionality coming soon.
                </p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-12 text-muted-foreground">
                <p>Select report type and click "Generate Report" to view data</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;

