// E-Wallet Page for Solora StayCo
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getWalletBalance, addFunds, getWalletTransactions } from '../../services/walletService';

function Wallet() {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingFunds, setAddingFunds] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (currentUser) {
      loadWalletData();
    }
  }, [currentUser]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletBalance, walletTransactions] = await Promise.all([
        getWalletBalance(currentUser.uid),
        getWalletTransactions(currentUser.uid, 20),
      ]);
      setBalance(walletBalance);
      setTransactions(walletTransactions);
    } catch (err) {
      console.error('Error loading wallet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    setAddingFunds(true);
    setMessage({ type: '', text: '' });

    try {
      await addFunds(currentUser.uid, parseFloat(amount), 'card');
      setMessage({ type: 'success', text: 'Funds added successfully!' });
      setAmount('');
      loadWalletData();
    } catch (err) {
      console.error('Error adding funds:', err);
      setMessage({ type: 'error', text: 'Failed to add funds. Please try again.' });
    } finally {
      setAddingFunds(false);
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

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">My E-Wallet</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wallet Balance & Add Funds */}
        <div className="lg:col-span-1">
          <div className="card mb-6">
            <h2 className="text-xl font-display font-semibold mb-4">Wallet Balance</h2>
            <div className="text-center py-6">
              {loading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              ) : (
                <>
                  <p className="text-4xl font-bold text-primary mb-2">
                    {formatPrice(balance)}
                  </p>
                  <p className="text-sm text-muted-foreground">Available balance</p>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-display font-semibold mb-4">Add Funds</h2>
            
            {message.text && (
              <div className={`mb-4 px-4 py-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAmount('50')}
                  className="btn btn-outline text-sm py-2"
                >
                  $50
                </button>
                <button
                  type="button"
                  onClick={() => setAmount('100')}
                  className="btn btn-outline text-sm py-2"
                >
                  $100
                </button>
                <button
                  type="button"
                  onClick={() => setAmount('200')}
                  className="btn btn-outline text-sm py-2"
                >
                  $200
                </button>
              </div>

              <button
                type="submit"
                disabled={addingFunds}
                className="w-full btn btn-primary disabled:opacity-50"
              >
                {addingFunds ? 'Processing...' : 'Add Funds'}
              </button>
            </form>

            <p className="text-xs text-muted-foreground mt-4">
              Funds will be added instantly to your wallet
            </p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-display font-semibold mb-4">Transaction History</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'deposit'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'deposit' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {formatPrice(Math.abs(transaction.amount))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Balance: {formatPrice(transaction.balanceAfter)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Wallet;

