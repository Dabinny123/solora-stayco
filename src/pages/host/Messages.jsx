// Host Messages Page for Solora StayCo
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserConversations, getConversationMessages, markConversationAsRead, createMessage } from '../../services/messagesService';
import { getUser } from '../../services/usersService';

function HostMessages() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convs = await getUserConversations(currentUser.uid);
      
      // Load user data for each conversation
      const convsWithUsers = await Promise.all(
        convs.map(async (conv) => {
          const otherUserId = conv.senderId === currentUser.uid ? conv.receiverId : conv.senderId;
          const user = await getUser(otherUserId);
          return { ...conv, otherUser: user };
        })
      );
      
      setConversations(convsWithUsers);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      const msgs = await getConversationMessages(selectedConversation.conversationId);
      setMessages(msgs);
      
      // Mark as read
      await markConversationAsRead(selectedConversation.conversationId, currentUser.uid);
      loadConversations(); // Refresh to update unread count
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const otherUserId = selectedConversation.senderId === currentUser.uid 
        ? selectedConversation.receiverId 
        : selectedConversation.senderId;

      await createMessage({
        senderId: currentUser.uid,
        receiverId: otherUserId,
        content: newMessage.trim(),
        listingId: selectedConversation.listingId || null,
      });

      setNewMessage('');
      loadMessages();
      loadConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <div className="lg:col-span-1 card overflow-hidden flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Conversations</h2>
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.conversationId}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedConversation?.conversationId === conv.conversationId
                      ? 'bg-primary/10 border border-primary-200'
                      : 'hover:bg-background'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/100 flex items-center justify-center text-white font-medium">
                      {conv.otherUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {conv.otherUser?.displayName || 'User'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{conv.content}</p>
                    </div>
                    {!conv.read && conv.receiverId === currentUser.uid && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col">
          {selectedConversation ? (
            <>
              <div className="border-b border-border pb-4 mb-4">
                <h3 className="font-semibold text-lg">
                  {selectedConversation.otherUser?.displayName || 'User'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.otherUser?.email}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.senderId === currentUser.uid
                          ? 'bg-primary text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.senderId === currentUser.uid ? 'text-primary-100' : 'text-muted-foreground'
                      }`}>
                        {formatDate(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="btn btn-primary disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a conversation to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HostMessages;

