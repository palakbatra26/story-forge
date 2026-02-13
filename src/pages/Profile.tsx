import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BadgeCheck } from "lucide-react";

type ProfileData = {
  clerkId: string;
  name: string;
  username: string;
  bio: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified?: boolean;
  isFollowing: boolean;
  canEdit: boolean;
  readingGoals?: {
    dailyMinutes: number;
    weeklyPosts: number;
  };
  readingStats?: {
    currentStreak: number;
    longestStreak: number;
    totalReadPosts: number;
    weeklyReadPosts: number;
  };
  badges?: Array<{
    key: string;
    label: string;
    earnedAt: string;
  }>;
};

type ProfilePost = {
  id: string;
  title: string;
  coverImageUrl: string;
  description: string;
  createdAt: string;
  likes: number;
  commentsCount: number;
  isRepost: boolean;
  isDeleted?: boolean;
  canDelete?: boolean;
};

type ConnectionUser = {
  id: string;
  clerkId: string;
  name: string;
  username: string;
  avatarUrl: string;
  bio: string;
  isFollowing: boolean;
};

const Profile = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { clerkId: routeClerkId } = useParams();
  const targetClerkId = routeClerkId || user?.id || "";

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [connectionsType, setConnectionsType] = useState<"followers" | "following">("followers");
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connections, setConnections] = useState<ConnectionUser[]>([]);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(15);
  const [weeklyGoalPosts, setWeeklyGoalPosts] = useState(5);

  const loadProfile = async () => {
    if (!targetClerkId) {
      setProfile(null);
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const viewer = user?.id ? `?viewerClerkId=${encodeURIComponent(user.id)}` : "";
      const [profileRes, postsRes] = await Promise.all([
        fetch(`${baseUrl}/api/users/${targetClerkId}${viewer}`),
        fetch(
          `${baseUrl}/api/posts?authorClerkId=${encodeURIComponent(targetClerkId)}${
            user?.id ? `&viewerClerkId=${encodeURIComponent(user.id)}` : ""
          }${user?.id === targetClerkId ? "&includeDeleted=true" : ""}`
        ),
      ]);

      if (profileRes.status === 404 && user?.id === targetClerkId) {
        await fetch(`${baseUrl}/api/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            name: user.fullName || user.username || "",
            email: user.primaryEmailAddress?.emailAddress || "",
            username: user.username || "",
            avatarUrl: user.imageUrl || "",
          }),
        });

        const retryProfileRes = await fetch(`${baseUrl}/api/users/${targetClerkId}${viewer}`);
        if (!retryProfileRes.ok) throw new Error("Failed profile fetch");
        const profileData = await retryProfileRes.json();
        if (!postsRes.ok) throw new Error("Failed posts fetch");
        const postsData = await postsRes.json();

        setProfile(profileData);
        setPosts(postsData);
        setEditName(profileData.name || "");
        setEditUsername(profileData.username || "");
        setEditBio(profileData.bio || "");
        setEditAvatarUrl(profileData.avatarUrl || "");
        return;
      }

      if (!profileRes.ok) throw new Error("Failed profile fetch");
      if (!postsRes.ok) throw new Error("Failed posts fetch");

      const profileData = await profileRes.json();
      const postsData = await postsRes.json();

      setProfile(profileData);
      setPosts(postsData);
      setEditName(profileData.name || "");
      setEditUsername(profileData.username || "");
      setEditBio(profileData.bio || "");
      setEditAvatarUrl(profileData.avatarUrl || "");
      setDailyGoalMinutes(profileData?.readingGoals?.dailyMinutes || 15);
      setWeeklyGoalPosts(profileData?.readingGoals?.weeklyPosts || 5);
    } catch (error) {
      setProfile(null);
      setPosts([]);

      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        toast.error("Backend server is not reachable. Start API server first.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReadingGoals = async () => {
    if (!profile?.canEdit || !user) return;
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/users/${profile.clerkId}/reading-goals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewerClerkId: user.id,
          dailyMinutes: dailyGoalMinutes,
          weeklyPosts: weeklyGoalPosts,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Failed to update goals");

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              readingGoals: data.readingGoals || prev.readingGoals,
              readingStats: data.readingStats || prev.readingStats,
            }
          : prev
      );
      toast.success("Reading goals updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update reading goals.");
    }
  };

  useEffect(() => {
    const syncUser = async () => {
      if (!isSignedIn || !user) return;
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        await fetch(`${baseUrl}/api/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            name: user.fullName || user.username || "",
            email: user.primaryEmailAddress?.emailAddress || "",
            username: user.username || "",
            avatarUrl: user.imageUrl || "",
          }),
        });
      } catch {
        // no-op
      }
    };

    syncUser();
  }, [isSignedIn, user]);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetClerkId, user?.id]);

  useEffect(() => {
    if (!targetClerkId) return;

    const intervalId = window.setInterval(() => {
      loadProfile();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetClerkId, user?.id]);

  const handleSaveProfile = async () => {
    if (!profile?.canEdit || !user) return;
    setSaving(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/users/${profile.clerkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewerClerkId: user.id,
          name: editName,
          username: editUsername,
          bio: editBio,
          avatarUrl: editAvatarUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed update");
      const data = await response.json();
      setProfile(data);
      toast.success("Profile updated.");
    } catch {
      toast.error("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile || !user) {
      toast.error("Please sign in first.");
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/users/${profile.clerkId}/follow`, {
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

      if (!response.ok) throw new Error("Follow failed");
      const data = await response.json();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: data.isFollowing,
              followersCount: data.followersCount,
            }
          : prev
      );
    } catch {
      toast.error("Unable to update follow status.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) {
      toast.error("Please sign in first.");
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user.id }),
      });
      if (!response.ok) throw new Error("Delete failed");
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      setProfile((prev) =>
        prev
          ? { ...prev, postsCount: Math.max(0, prev.postsCount - 1) }
          : prev
      );
      toast.success("Post deleted.");
    } catch {
      toast.error("Unable to delete post.");
    }
  };

  const handleRecoverPost = async (postId: string) => {
    if (!user) {
      toast.error("Please sign in first.");
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/posts/${postId}/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user.id }),
      });
      if (!response.ok) throw new Error("Recover failed");
      const data = await response.json();
      setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, ...data } : post)));
      toast.success("Post recovered.");
    } catch {
      toast.error("Unable to recover post.");
    }
  };

  const openConnections = async (type: "followers" | "following") => {
    if (!targetClerkId) return;

    setConnectionsType(type);
    setConnectionsOpen(true);
    setConnectionsLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const viewer = user?.id ? `&viewerClerkId=${encodeURIComponent(user.id)}` : "";
      const response = await fetch(
        `${baseUrl}/api/users/${encodeURIComponent(targetClerkId)}/connections?type=${type}${viewer}`
      );
      if (!response.ok) throw new Error("Failed to fetch connections");

      const data = await response.json();
      setConnections(data.users || []);
    } catch {
      setConnections([]);
      toast.error("Unable to load followers/following list.");
    } finally {
      setConnectionsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-10 space-y-6">
          {loading ? (
            <p className="text-muted-foreground">Loading profile...</p>
          ) : !profile ? (
            <p className="text-muted-foreground">
              {isSignedIn ? "Profile not found." : "Please sign in to view your profile."}
            </p>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={profile.avatarUrl || "/placeholder.svg"}
                        alt={profile.name}
                        className="h-20 w-20 rounded-full object-cover border"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h1 className="text-2xl font-semibold">{profile.name}</h1>
                          {profile.isVerified && <BadgeCheck className="h-5 w-5 text-sky-500" />}
                        </div>
                        <p className="text-muted-foreground">@{profile.username || "user"}</p>
                        <p className="text-sm mt-2">{profile.bio || "No bio yet."}</p>
                        {profile.badges && profile.badges.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {profile.badges.map((badge) => (
                              <span key={badge.key} className="rounded-full border px-2 py-1 text-xs bg-secondary">
                                🏅 {badge.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex gap-4 text-sm">
                        <span><b>{profile.postsCount}</b> posts</span>
                        <button
                          type="button"
                          className="hover:underline"
                          onClick={() => openConnections("followers")}
                        >
                          <b>{profile.followersCount}</b> followers
                        </button>
                        <button
                          type="button"
                          className="hover:underline"
                          onClick={() => openConnections("following")}
                        >
                          <b>{profile.followingCount}</b> following
                        </button>
                      </div>
                      {!profile.canEdit && isSignedIn && (
                        <Button onClick={handleFollowToggle}>
                          {profile.isFollowing ? "Unfollow" : "Follow"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {profile.canEdit && (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Name"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                    />
                    <Input
                      placeholder="Username"
                      value={editUsername}
                      onChange={(event) => setEditUsername(event.target.value)}
                    />
                    <Textarea
                      placeholder="Bio"
                      value={editBio}
                      onChange={(event) => setEditBio(event.target.value)}
                    />
                    <Input
                      placeholder="Profile photo URL"
                      value={editAvatarUrl}
                      onChange={(event) => setEditAvatarUrl(event.target.value)}
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setEditAvatarUrl(reader.result?.toString() || "");
                        reader.readAsDataURL(file);
                      }}
                    />
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? "Saving..." : "Save Profile"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {profile.canEdit && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reading Goals & Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <Input
                        type="number"
                        min={1}
                        value={dailyGoalMinutes}
                        onChange={(event) => setDailyGoalMinutes(Number(event.target.value || 1))}
                        placeholder="Daily reading minutes"
                      />
                      <Input
                        type="number"
                        min={1}
                        value={weeklyGoalPosts}
                        onChange={(event) => setWeeklyGoalPosts(Number(event.target.value || 1))}
                        placeholder="Weekly posts target"
                      />
                    </div>
                    <Button variant="outline" onClick={handleSaveReadingGoals}>Save Goals</Button>

                    <div className="rounded-md border p-3 text-sm">
                      <p>🔥 Current streak: <b>{profile.readingStats?.currentStreak || 0}</b> day(s)</p>
                      <p>🏆 Longest streak: <b>{profile.readingStats?.longestStreak || 0}</b> day(s)</p>
                      <p>📚 Total posts read: <b>{profile.readingStats?.totalReadPosts || 0}</b></p>
                      <p>🗓 Weekly posts read: <b>{profile.readingStats?.weeklyReadPosts || 0}</b></p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {connectionsOpen && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="capitalize">{connectionsType}</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setConnectionsOpen(false)}>
                      Close
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {connectionsLoading ? (
                      <p className="text-muted-foreground text-sm">Loading {connectionsType}...</p>
                    ) : connections.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No {connectionsType} yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {connections.map((connection) => (
                          <div
                            key={connection.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={connection.avatarUrl || "/placeholder.svg"}
                                alt={connection.name}
                                className="h-10 w-10 rounded-full object-cover border"
                              />
                              <div className="min-w-0">
                                <p className="font-medium truncate">{connection.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  @{connection.username || "user"}
                                </p>
                              </div>
                            </div>

                            <Link
                              to={`/profile/${connection.clerkId}`}
                              className="text-sm text-primary hover:underline"
                              onClick={() => setConnectionsOpen(false)}
                            >
                              View profile
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                {posts.length === 0 ? (
                  <p className="text-muted-foreground">No posts yet.</p>
                ) : (
                  posts.map((post) => (
                    <Card key={post.id} className="overflow-hidden">
                      {post.coverImageUrl && (
                        <img src={post.coverImageUrl} alt={post.title} className="h-36 w-full object-cover" />
                      )}
                      <CardContent className="p-4">
                        {post.isRepost && <p className="text-xs text-muted-foreground mb-1">🔁 Repost</p>}
                        <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                        {post.isDeleted && (
                          <p className="text-xs text-amber-600 mt-1">Archived (soft deleted)</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.description}</p>
                        <div className="text-xs text-muted-foreground mt-2">
                          ❤️ {post.likes} · 💬 {post.commentsCount}
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center gap-3">
                            <Link to={`/post/${post.id}`} className="text-primary text-sm hover:underline">
                              Read blog
                            </Link>
                            {post.canDelete && !post.isDeleted && (
                              <button
                                className="text-sm text-destructive hover:underline"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                Delete
                              </button>
                            )}
                            {post.canDelete && post.isDeleted && (
                              <button
                                className="text-sm text-primary hover:underline"
                                onClick={() => handleRecoverPost(post.id)}
                              >
                                Recover
                              </button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
