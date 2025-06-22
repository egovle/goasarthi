
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { supabase } from '@/lib/supabaseClient.js';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!supabase) {
        console.log("Supabase client not available. Skipping NotificationContext fetch.");
        setLoading(false);
        return;
      }
      setLoading(true);
      if (user) {
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          setNotifications(data || []);
        } catch (error) {
          console.error("Error fetching notifications from Supabase:", error);
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
      setLoading(false);
    };
    fetchNotifications();
  }, [user]);

  const addNotification = useCallback(async (targetUserId, message, type = 'info', link = null, title = 'New Notification') => {
    if (!supabase) return;

    let finalTargetUserId = targetUserId;

    if (targetUserId === 'admin' || targetUserId === 'admin-1') {
      try {
        const { data: adminProfile, error: adminError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
          .limit(1)
          .single();

        if (adminError || !adminProfile) {
          console.error("Could not find admin user to send notification:", adminError);
          return;
        }
        finalTargetUserId = adminProfile.id;
      } catch (e) {
        console.error("Exception while finding admin user:", e);
        return;
      }
    }
    
    const { data: newNotification, error } = await supabase
      .from('notifications')
      .insert({
          user_id: finalTargetUserId,
          title,
          message,
          type,
          link,
          read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding notification to Supabase:", error);
      return;
    }

    if (targetUserId === user?.id || ((targetUserId === 'admin' || targetUserId === 'admin-1') && user?.role === 'admin')) {
        setNotifications(prev => [newNotification, ...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!supabase || !user) return;
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id) 
      .select()
      .single();
    
    if (error) {
      console.error("Error marking notification as read in Supabase:", error);
      return;
    }
    setNotifications(prev => prev.map(n => n.id === notificationId ? data : n));
  }, [user]);

  const markAllAsRead = useCallback(async (targetUserId) => {
    if (!supabase || targetUserId !== user?.id) return; 

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', targetUserId)
      .eq('read', false)
      .select();

    if (error) {
      console.error("Error marking all notifications as read in Supabase:", error);
      return;
    }
    if (data) {
        setNotifications(prev => prev.map(n => n.user_id === targetUserId ? { ...n, read: true } : n));
    }
  }, [user]);

  const getNotificationsForUser = useCallback((targetUserId) => {
    if (targetUserId !== user?.id) return [];
    return notifications; 
  }, [user, notifications]);

  const getUnreadCountForUser = useCallback((targetUserId) => {
    if (targetUserId !== user?.id) return 0;
    return notifications.filter(n => !n.read).length;
  }, [user, notifications]);
  
  const clearNotificationsForUser = useCallback(async (targetUserId) => {
    if (!supabase || targetUserId !== user?.id) return;
    
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', targetUserId);
    if (error) {
        console.error("Error clearing notifications for user from Supabase:", error);
    } else {
        setNotifications([]);
    }
  }, [user]);

  const clearAllNotifications = useCallback(async () => { 
    if (!user || !supabase) return;
    if (user.role === 'admin') {
      const { error } = await supabase.from('notifications').delete().neq('id', '0'); 
      if (error) {
          console.error("Error clearing all notifications (admin) from Supabase:", error);
      } else {
          setNotifications([]);
      }
    } else {
      await clearNotificationsForUser(user.id);
    }
  }, [user, clearNotificationsForUser]);

  const value = useMemo(() => ({
    notifications,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    getNotificationsForUser,
    getUnreadCountForUser,
    clearNotificationsForUser,
    clearAllNotifications
  }), [notifications, loading, addNotification, markAsRead, markAllAsRead, getNotificationsForUser, getUnreadCountForUser, clearNotificationsForUser, clearAllNotifications]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
