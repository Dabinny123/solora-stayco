import React from 'react';

function NotificationsPanel({ title, notifications = [], loading = false, onMarkAllRead }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-display font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">Latest updates and alerts</p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-primary text-sm font-medium hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>
      {loading ? (
        <p className="text-muted-foreground py-4">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="text-muted-foreground py-4">You’re all caught up.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-xl border text-sm ${
                notification.isRead ? 'border-border bg-white' : 'border-primary-200 bg-primary/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">{notification.title}</p>
                  <p className="text-muted-foreground">{notification.message}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPanel;

