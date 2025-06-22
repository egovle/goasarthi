
import React, { useState, useEffect } from 'react';
import { Bell, Check, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function NotificationBell() {
  const { user } = useAuth();
  const { 
    getNotificationsForUser, 
    getUnreadCountForUser, 
    markAsRead, 
    markAllAsRead,
    clearNotificationsForUser 
  } = useData();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setNotifications(getNotificationsForUser(user.id));
      setUnreadCount(getUnreadCountForUser(user.id));
    }
  }, [user, getNotificationsForUser, getUnreadCountForUser, notifications]); // Added notifications to dependency array

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false); 
  };

  const handleMarkAllRead = () => {
    if (user) markAllAsRead(user.id);
  };
  
  const handleClearAll = () => {
    if (user) clearNotificationsForUser(user.id);
  };

  const getNotificationTypeStyles = (type) => {
    switch (type) {
      case 'success': return 'border-l-4 border-green-500';
      case 'error': return 'border-l-4 border-red-500';
      case 'warning': return 'border-l-4 border-yellow-500';
      default: return 'border-l-4 border-blue-500';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative notification-badge-container">
          <Bell className="h-5 w-5 text-slate-600 hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="notification-badge"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 max-h-[70vh] overflow-y-auto bg-card shadow-2xl border-border rounded-lg p-0">
        <DropdownMenuLabel className="flex justify-between items-center p-3 border-b border-border sticky top-0 bg-card z-10">
          <span className="font-semibold text-lg text-foreground">Notifications</span>
          {notifications.length > 0 && (
            <Button variant="link" size="sm" onClick={handleMarkAllRead} className="text-xs text-primary p-0 h-auto">
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        
        <AnimatePresence>
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 px-4"
            >
              <Bell className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <p className="text-sm text-muted-foreground">No new notifications.</p>
              <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
            </motion.div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DropdownMenuItem
                    className={`p-3 flex flex-col items-start cursor-pointer hover:bg-accent focus:bg-accent transition-colors duration-150 ${!notification.read ? 'bg-primary/5' : ''} ${getNotificationTypeStyles(notification.type)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="w-full flex justify-between items-start mb-1">
                      <span className={`font-medium text-sm ${!notification.read ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                        {notification.title || 'Notification'}
                      </span>
                      {!notification.read && (
                        <Badge variant="default" className="h-2 w-2 p-0 rounded-full bg-primary"></Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{notification.message}</p>
                    <div className="w-full flex justify-between items-center">
                      <span className="text-xs text-slate-400">
                        {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(notification.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                      </span>
                      {notification.link && (
                        <Button 
                          variant="link" 
                          size="xs" 
                          className="text-xs text-primary p-0 h-auto hover:underline flex items-center gap-1" 
                          onClick={(e) => { e.stopPropagation(); handleNotificationClick(notification); }}
                        >
                          View Details <ExternalLink className="h-3 w-3"/>
                        </Button>
                      )}
                    </div>
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
        
        {notifications.length > 0 && (
          <DropdownMenuSeparator className="my-0" />
        )}
        <div className="p-2 sticky bottom-0 bg-card border-t border-border z-10">
           <Button variant="outline" size="sm" className="w-full text-muted-foreground hover:text-destructive hover:border-destructive/50" onClick={handleClearAll}>
            <X className="mr-2 h-3.5 w-3.5"/> Clear All Notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
