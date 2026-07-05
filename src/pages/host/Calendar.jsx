// Host Calendar Page for managing listing availability
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getListingsByHost, updateListing } from '../../services/listingsService';

function HostCalendar() {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);

  useEffect(() => {
    if (currentUser) {
      loadListings();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedListing) {
      loadListingCalendar();
    }
  }, [selectedListing]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const hostListings = await getListingsByHost(currentUser.uid);
      setListings(hostListings);
      if (hostListings.length > 0 && !selectedListing) {
        setSelectedListing(hostListings[0]);
      }
    } catch (err) {
      console.error('Error loading listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadListingCalendar = () => {
    if (selectedListing?.calendar) {
      setBlockedDates(selectedListing.calendar.blockedDates || []);
      setAvailableDates(selectedListing.calendar.availableDates || []);
    }
  };

  const handleBlockDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const newBlocked = [...blockedDates, { start: dateStr, end: dateStr }];
    setBlockedDates(newBlocked);
    saveCalendar({ blockedDates: newBlocked });
  };

  const handleUnblockDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const newBlocked = blockedDates.filter(
      range => !(range.start <= dateStr && range.end >= dateStr)
    );
    setBlockedDates(newBlocked);
    saveCalendar({ blockedDates: newBlocked });
  };

  const saveCalendar = async (updates) => {
    if (!selectedListing) return;
    try {
      await updateListing(selectedListing.id, {
        calendar: {
          ...selectedListing.calendar,
          ...updates,
        },
      });
      await loadListings();
    } catch (err) {
      console.error('Error saving calendar:', err);
      alert('Failed to save calendar changes');
    }
  };

  const isDateBlocked = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDates.some(range => 
      dateStr >= range.start && dateStr <= range.end
    );
  };

  const isDateBooked = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return selectedListing?.calendar?.bookedDates?.some(range =>
      dateStr >= range.start && dateStr <= range.end
    );
  };

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold text-foreground/80 py-2">
            {day}
          </div>
        ))}
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-10"></div>;
          }
          const isBlocked = isDateBlocked(date);
          const isBooked = isDateBooked(date);
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
          
          return (
            <button
              key={index}
              onClick={() => {
                if (!isPast && !isBooked) {
                  if (isBlocked) {
                    handleUnblockDate(date);
                  } else {
                    handleBlockDate(date);
                  }
                }
              }}
              disabled={isPast || isBooked}
              className={`h-10 rounded-lg text-sm transition-colors ${
                isBooked
                  ? 'bg-red-200 text-red-800 cursor-not-allowed'
                  : isBlocked
                  ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                  : isPast
                  ? 'bg-muted text-muted-foreground/70 cursor-not-allowed'
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">Calendar Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Listing Selector */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Select Listing</h2>
            <div className="space-y-2">
              {listings.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => setSelectedListing(listing)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedListing?.id === listing.id
                      ? 'bg-primary/10 text-primary border-2 border-primary-500'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  <p className="font-semibold">{listing.title}</p>
                  <p className="text-sm text-muted-foreground">{listing.category}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="lg:col-span-3">
          {selectedListing ? (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-display font-semibold">{selectedListing.title}</h2>
                  <p className="text-muted-foreground">Manage availability calendar</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setSelectedDate(newDate);
                    }}
                    className="btn btn-outline"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setSelectedDate(newDate);
                    }}
                    className="btn btn-outline"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                {renderCalendar()}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold mb-3">Legend</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-200 rounded"></div>
                    <span>Blocked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-200 rounded"></div>
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-muted rounded"></div>
                    <span>Past</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Click on available dates to block them. Click on blocked dates to unblock.
                </p>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-muted-foreground">No listings found. Create a listing to manage its calendar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HostCalendar;

