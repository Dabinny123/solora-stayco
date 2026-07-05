// Admin Wallet Management Page for Solora StayCo
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllUsers } from '../../services/usersService';
import { getAllWithdrawalRequests, approveWithdrawalRequest, rejectWithdrawalRequest } from '../../services/withdrawalService';
import { getWalletTransactions } from '../../services/walletService';
import { getDocuments } from '../../firebase/firestoreService';

function WalletManagement() {
  const { currentUser } = useAuth();
  const [hosts, setHosts] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hosts'); // 'hosts', 'withdrawals', 'transactions'
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'completed', 'rejected'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'hosts') {
        const allUsers = await getAllUsers(null, 1000);
        const hostsList = allUsers.filter(u => u.role === 'host');
        setHosts(hostsList);
      } else if (activeTab === 'withdrawals') {
        const requests = await getAllWithdrawalRequests(filter === 'all' ? null : filter, 100);
        setWithdrawalRequests(requests);
      } else if (activeTab === 'transactions') {
        const allTransactions = await getDocuments('wallet_transactions', [], 'createdAt', 'desc', 200);
        setTransactions(allTransactions);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Approve this withdrawal request and process payout?')) {
      return;
    }

    try {
      if (!currentUser) {
        alert('You must be signed in to approve withdrawals');
        return;
      }
      await approveWithdrawalRequest(requestId, currentUser.uid);
      alert('Withdrawal approved and payout processed!');
      loadData();
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      alert(`Failed to approve withdrawal: ${err.message}`);
    }
  };

  const handleReject = async (requestId) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      if (!currentUser) {
        alert('You must be signed in to reject withdrawals');
        return;
      }
      await rejectWithdrawalRequest(requestId, currentUser.uid, reason);
      alert('Withdrawal request rejected.');
      loadData();
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
      alert(`Failed to reject withdrawal: ${err.message}`);
    }
  };

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-muted text-foreground'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">
        Wallet Management
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('hosts')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'hosts'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Host Balances
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'withdrawals'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Withdrawal Requests
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'transactions'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Transaction History
        </button>
      </div>

      {/* Filters for withdrawals */}
      {activeTab === 'withdrawals' && (
        <div className="flex gap-2 mb-4">
          {['all', 'pending', 'processing', 'completed', 'rejected', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-white text-foreground/80 hover:bg-muted'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          {/* Host Balances Tab */}
          {activeTab === 'hosts' && (
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Host</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Wallet Balance</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">PayPal Connected</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">PayPal Email</th>
                  </tr>
                </thead>
                <tbody>
                  {hosts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-muted-foreground">
                        No hosts found
                      </td>
                    </tr>
                  ) : (
                    hosts.map((host) => (
                      <tr key={host.uid} className="border-b border-gray-100 hover:bg-background">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {host.profilePhoto ? (
                              <img
                                src={host.profilePhoto}
                                alt={host.displayName}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/100 flex items-center justify-center text-white font-medium">
                                {host.displayName?.charAt(0).toUpperCase() || 'H'}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground">{host.displayName || 'No name'}</p>
                              <p className="text-sm text-muted-foreground">{host.uid.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{host.email}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-green-600">
                            {formatPrice(host.walletBalance || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {host.paypalAccount?.isConnected ? (
                            <span className="text-green-600 font-medium">✓ Connected</span>
                          ) : (
                            <span className="text-red-600 font-medium">✗ Not Connected</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {host.paypalAccount?.email || 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Withdrawal Requests Tab */}
          {activeTab === 'withdrawals' && (
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Host</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">PayPal Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Requested</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-muted-foreground">
                        No withdrawal requests found
                      </td>
                    </tr>
                  ) : (
                    withdrawalRequests.map((request) => (
                      <tr key={request.id} className="border-b border-gray-100 hover:bg-background">
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground">{request.hostId?.slice(0, 8)}...</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-foreground">
                            {formatPrice(request.amount, request.currency)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{request.hostPayPalEmail}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDate(request.requestedAt)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="py-3 px-4">
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {request.status === 'completed' && request.payout_batch_id && (
                            <span className="text-xs text-muted-foreground">
                              Batch: {request.payout_batch_id.slice(0, 8)}...
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Transaction History Tab */}
          {activeTab === 'transactions' && (
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Balance After</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-background">
                        <td className="py-3 px-4">
                          <p className="text-sm text-muted-foreground">{transaction.userId?.slice(0, 8)}...</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'deposit' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${
                            transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : '-'}
                            {formatPrice(Math.abs(transaction.amount))}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatPrice(transaction.balanceAfter || 0)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {transaction.description || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {formatDate(transaction.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default WalletManagement;

