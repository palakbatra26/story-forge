import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import { 
  Menu, 
  X, 
  Search, 
  Bell,
  PenSquare,
  Sun,
  Moon
} from "lucide-react";

type NotificationItem = {
  id: string;
  type: "follow" | "mention" | "newsletter";
  message: string;
  isRead: boolean;
  createdAt: string;
  fromUser: {
    clerkId: string;
    name: string;
    username: string;
    avatarUrl: string;
  } | null;
};

type HeaderProfile = {
  name?: string;
  avatarUrl?: string;
};

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [headerProfile, setHeaderProfile] = useState<HeaderProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const displayName = headerProfile?.name || user?.fullName || user?.username || "";
  const displayAvatar = headerProfile?.avatarUrl || user?.imageUrl || "";
  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  useEffect(() => {
    const loadHeaderProfile = async () => {
      if (!isSignedIn || !user) {
        setHeaderProfile(null);
        return;
      }

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(
          `${baseUrl}/api/users/${encodeURIComponent(user.id)}?viewerClerkId=${encodeURIComponent(user.id)}`
        );
        if (!response.ok) {
          throw new Error("Failed to load header profile");
        }

        const data = await response.json();
        setHeaderProfile({
          name: data?.name,
          avatarUrl: data?.avatarUrl,
        });
      } catch {
        setHeaderProfile(null);
      }
    };

    loadHeaderProfile();
  }, [isSignedIn, user]);

  useEffect(() => {
    const resolveAdminAccess = async () => {
      if (!isSignedIn || !user) {
        setIsAdmin(false);
        return;
      }

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        await fetch(`${baseUrl}/api/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            name: user.fullName || user.username || user.primaryPhoneNumber?.phoneNumber || "",
            email: user.primaryEmailAddress?.emailAddress || "",
            username: user.username || user.primaryPhoneNumber?.phoneNumber || "",
            avatarUrl: user.imageUrl || "",
          }),
        });

        const response = await fetch(`${baseUrl}/api/admin/me?clerkId=${encodeURIComponent(user.id)}`);
        const data = await response.json().catch(() => ({}));
        setIsAdmin(!!data?.isAdmin);
      } catch {
        setIsAdmin(false);
      }
    };

    resolveAdminAccess();
  }, [isSignedIn, user]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!isSignedIn || !user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/users/${user.id}/notifications`);
        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }
        const data = await response.json();
        const nextNotifications = data.notifications || [];
        setNotifications(nextNotifications);
        setUnreadCount(
          typeof data.unreadCount === "number"
            ? data.unreadCount
            : nextNotifications.filter((notification: NotificationItem) => !notification.isRead).length
        );
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    loadNotifications();

    const intervalId = window.setInterval(() => {
      loadNotifications();
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isSignedIn, user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      await fetch(`${baseUrl}/api/users/${user.id}/notifications/${notificationId}/read`, {
        method: "POST",
      });

      setNotifications((prev) => {
        let wasUnread = false;
        const updated = prev.map((notification) => {
          if (notification.id !== notificationId) return notification;
          wasUnread = !notification.isRead;
          return { ...notification, isRead: true };
        });
        if (wasUnread) {
          setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
        }
        return updated;
      });
    } catch {
      // no-op
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      await fetch(`${baseUrl}/api/users/${user.id}/notifications/read-all`, {
        method: "POST",
      });

      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch {
      // no-op
    }
  };

  const handleFollowBack = async (targetClerkId: string, notificationId: string) => {
    if (!user) return;

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/users/${targetClerkId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewerClerkId: user.id,
          viewerName: user.fullName || user.username || "",
          viewerEmail: user.primaryEmailAddress?.emailAddress || "",
          viewerUsername: user.username || "",
          viewerAvatarUrl: user.imageUrl || "",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to follow back");
      }

      await markAsRead(notificationId);
      toast.success("Followed back successfully.");
    } catch {
      toast.error("Unable to follow back right now.");
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Explore", href: "/explore" },
    { name: "Authors", href: "/authors" },
    { name: "Write", href: "/write" },
    ...(isAdmin ? [{ name: "Admin", href: "/admin" }] : []),
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="font-serif text-lg font-bold text-primary-foreground">B</span>
            </div>
            <span className="font-serif text-xl font-semibold tracking-tight">
              BlogSphere
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.href)
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Notifications - shown when logged in */}
            <div className="relative hidden sm:block">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => {
                  setNotificationsOpen((prev) => {
                    const next = !prev;
                    if (next && unreadCount > 0) {
                      markAllAsRead();
                    }
                    return next;
                  });
                }}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-background p-3 shadow-lg z-50">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">Notifications</p>
                    <Button variant="ghost" size="sm" onClick={() => setNotificationsOpen(false)}>
                      Close
                    </Button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-2">No notifications yet.</p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`rounded-lg border p-2 ${notification.isRead ? "opacity-80" : "bg-secondary/40"}`}
                        >
                          <div className="flex items-start gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={notification.fromUser?.avatarUrl || ""} alt={notification.fromUser?.name || ""} />
                              <AvatarFallback>
                                {(notification.fromUser?.name || "U").slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-xs leading-relaxed">{notification.message || "Someone followed you"}</p>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                {notification.fromUser?.clerkId && (
                                  <Link
                                    to={`/profile/${notification.fromUser.clerkId}`}
                                    className="text-xs text-primary hover:underline"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    View profile
                                  </Link>
                                )}
                                {notification.type === "follow" && notification.fromUser?.clerkId && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleFollowBack(notification.fromUser!.clerkId, notification.id)}
                                  >
                                    Follow back
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Write - CTA */}
            <Button variant="ghost" size="sm" className="hidden md:flex gap-2" asChild>
              <Link to="/write">
                <PenSquare className="h-4 w-4" />
                Write
              </Link>
            </Button>

            {/* Auth */}
            {isSignedIn && user ? (
              <Link to="/profile" className="hidden md:flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-secondary transition-colors">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarImage src={displayAvatar} alt={displayName || "Profile"} />
                  <AvatarFallback>{(displayName || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Profile</span>
              </Link>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden md:flex" asChild>
                  <Link to="/sign-in">Sign in</Link>
                </Button>
                <Button size="sm" className="hidden md:flex" asChild>
                  <Link to="/sign-up">Sign up</Link>
                </Button>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-down">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.href)
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
              <button
                className="px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={() => setTheme(isDark ? "light" : "dark")}
              >
                {isDark ? "☀️ Light mode" : "🌙 Dark mode"}
              </button>
              {isSignedIn && user ? (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive("/profile")
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  My Profile
                </Link>
              ) : (
                <>
                  <Link
                    to="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive("/sign-in")
                        ? "text-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive("/sign-up")
                        ? "text-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
