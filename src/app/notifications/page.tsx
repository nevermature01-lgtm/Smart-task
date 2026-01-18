'use client';

import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  created_at: string;
  message: string;
  link: string;
  read: boolean;
};

export default function NotificationsPage() {
    const router = useRouter();
    const { user } = useSupabaseAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const markAsRead = async () => {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);
            if (error) {
                console.error("Failed to mark notifications as read:", error);
            }
        };

        const fetchNotifications = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) {
                console.error("Error fetching notifications:", error);
            } else if (data) {
                setNotifications(data);
            }
            setIsLoading(false);
        };
        
        fetchNotifications();
        markAsRead(); // Mark as read when page is opened

    }, [user]);

    return (
        <div className="mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-gradient-to-b from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
                <div className="w-10 h-10"></div>
            </header>
            <main className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar pb-32">
                {isLoading ? (
                     <div className="flex justify-center items-center p-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-4xl text-white/50">notifications_off</span>
                        <p className="text-lavender-muted">You have no notifications yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map(notification => (
                            <Link href={notification.link} key={notification.id} className="block">
                                <div className={cn(
                                    "glass-panel p-4 rounded-2xl flex items-start gap-4 transition-all border",
                                    !notification.read ? "border-primary/30 bg-primary/10" : "border-white/10"
                                )}>
                                    {!notification.read && (
                                        <div className="w-2 h-2 mt-1.5 rounded-full bg-primary flex-shrink-0"></div>
                                    )}
                                    <div className={cn("flex-1", notification.read && "ml-4")}>
                                        <p className="text-sm text-white/90 leading-snug">{notification.message}</p>
                                        <p className="text-xs text-lavender-muted mt-2">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
