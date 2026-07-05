// Host Wallet Dashboard for Solora StayCo
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getWalletBalance, getWalletTransactions } from '../../services/walletService';
import { createWithdrawalRequest, getHostWithdrawalRequests } from '../../services/withdrawalService';
import { getUser } from '../../services/usersService';

function HostWallet() {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'withdraw', 'history'
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [paypalConnected, setPaypalConnected] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadWalletData();
    }
  }, [currentUser]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletBalance, walletTransactions, requests, userData] = await Promise.all([
        getWalletBalance(currentUser.uid),
        getWalletTransactions(currentUser.uid, 50),
        getHostWithdrawalRequests(currentUser.uid, 20),
        getUser(currentUser.uid),
      ]);
      
      setBalance(walletBalance);
      setTransactions(walletTransactions);
      setWithdrawalRequests(requests);
      setPaypalConnected(userData?.paypalAccount?.isConnected || false);
    } catch (err) {
      console.error('Error loading wallet data:', err);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > balance) {
      setError('Insufficient balance');
      return;
    }

    if (!paypalConnected) {
      setError('Please connect your PayPal account first in Settings');
      return;
    }

    setSubmitting(true);
    try {
      await createWithdrawalRequest(currentUser.uid, amount);
      alert('Withdrawal request submitted! Admin will process it shortly.');
      setWithdrawAmount('');
      setActiveTab('overview');
      loadWalletData();
    } catch (err) {
      console.error('Error creating withdrawal request:', err);
      setError(err.message || 'Failed to create withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">My Wallet</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'withdraw'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Request Withdrawal
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Transaction History
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm mb-2">Available Balance</p>
                <p className="text-4xl font-bold">{formatPrice(balance)}</p>
              </div>
              <div className="text-right">
                <p className="text-primary-100 text-sm mb-2">PayPal Status</p>
                {paypalConnected ? (
                  <span className="text-green-300 font-medium">✓ Connected</span>
                ) : (
                  <span className="text-yellow-300 font-medium">✗ Not Connected</span>
                )}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{transaction.description || 'Transaction'}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {formatPrice(Math.abs(transaction.amount))}
                      </p>
                      <p className="text-sm text-muted-foreground">Balance: {formatPrice(transaction.balanceAfter || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Withdrawals */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Pending Withdrawals</h2>
            {withdrawalRequests.filter(r => r.status === 'pending' || r.status === 'processing').length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending withdrawals</p>
            ) : (
              <div className="space-y-3">
                {withdrawalRequests
                  .filter(r => r.status === 'pending' || r.status === 'processing')
                  .map((request) => (
                    <div key={request.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{formatPrice(request.amount)}</p>
                        <p className="text-sm text-muted-foreground">Requested: {formatDate(request.requestedAt)}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 'withdraw' && (
        <div className="card max-w-md">
          <h2 className="text-xl font-semibold mb-4">Request Withdrawal</h2>
          
          {!paypalConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                Please connect your PayPal account in Settings before requesting a withdrawal.
              </p>
            </div>
          )}

          <form onSubmit={handleWithdraw}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Available Balance
              </label>
              <p className="text-2xl font-bold text-primary">{formatPrice(balance)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Withdrawal Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={balance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="input w-full"
                placeholder="0.00"
                required
                disabled={!paypalConnected || submitting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: {formatPrice(balance)}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!paypalConnected || submitting || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
              className="btn btn-primary w-full"
            >
              {submitting ? 'Submitting...' : 'Request Withdrawal'}
            </button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Balance After</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-background">
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HostWallet;

