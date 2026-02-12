import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified?: boolean;
  createdAt: string;
};

type AdminPost = {
  _id: string;
  title: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  status?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  likes?: number;
  commentsCount?: number;
  author?: {
    _id?: string;
    name?: string;
    email?: string;
    clerkId?: string;
    isVerified?: boolean;
  };
};

type AuditLog = {
  _id: string;
  action: string;
  entity: string;
  actor?: { name: string };
  createdAt: string;
};

const Admin = () => {
  const { user } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentSearch, setContentSearch] = useState("");
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [reasonByPostId, setReasonByPostId] = useState<Record<string, string>>({});
  const [moderatingPostId, setModeratingPostId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const loadAdminData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [usersRes, contentRes, logsRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/users?clerkId=${encodeURIComponent(user.id)}`),
        fetch(
          `${baseUrl}/api/admin/content?includeDeleted=true&limit=250&search=${encodeURIComponent(
            contentSearch
          )}&clerkId=${encodeURIComponent(user.id)}`
        ),
        fetch(`${baseUrl}/api/admin/audit-logs?clerkId=${encodeURIComponent(user.id)}`),
      ]);

      if ([usersRes, contentRes, logsRes].some((response) => response.status === 403)) {
        setIsAdmin(false);
        setUsers([]);
        setPosts([]);
        setAuditLogs([]);
        return;
      }

      setUsers(await usersRes.json());
      setPosts(await contentRes.json());
      setAuditLogs(await logsRes.json());
    } catch (error) {
      console.error("Failed to load admin data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setAuthChecked(true);
        return;
      }

      try {
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
        const allowed = !!data?.isAdmin;
        setIsAdmin(allowed);
      } catch {
        setIsAdmin(false);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAdmin();
  }, [baseUrl, user?.id]);

  useEffect(() => {
    if (!isAdmin) return;
    loadAdminData();
  }, [isAdmin, contentSearch]);

  const moderatePost = async (post: AdminPost, action: "archive" | "restore") => {
    if (!post?._id || !user?.id) return;

    const reason = String(reasonByPostId[post._id] || "").trim();

    if (action === "archive" && !reason) {
      toast.error("Please add a reason before removing blog");
      return;
    }

    setModeratingPostId(post._id);
    try {
      const response = await fetch(`${baseUrl}/api/admin/moderation/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason,
          actorClerkId: user?.id,
          clerkId: user?.id,
        }),
      });

      if (!response.ok) throw new Error("Post moderation failed");

      toast.success(action === "archive" ? "Blog removed and user notified" : "Blog restored and user notified");
      await loadAdminData();

      if (action === "archive") {
        setReasonByPostId((prev) => ({ ...prev, [post._id]: "" }));
      }
    } catch (error) {
      console.error("Failed post moderation action", error);
      toast.error("Unable to complete moderation action");
    } finally {
      setModeratingPostId(null);
    }
  };

  const toggleVerification = async (targetUser: User) => {
    try {
      const response = await fetch(`${baseUrl}/api/admin/users/${targetUser._id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isVerified: !targetUser.isVerified,
          actorClerkId: user?.id,
          clerkId: user?.id,
        }),
      });

      if (!response.ok) throw new Error("Verification update failed");
      await loadAdminData();
    } catch (error) {
      console.error("Failed to update verification", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-10 space-y-6">
          {!authChecked ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking admin access...
            </div>
          ) : !isAdmin ? (
            <Card className="card-editorial">
              <CardHeader>
                <CardTitle>Admin access only</CardTitle>
                <CardDescription>
                  This page is visible only to authorized admin account.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Admin Panel</p>
              <h1 className="heading-title mt-1">Platform Oversight</h1>
            </div>
            <Button variant="outline">Update site settings</Button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading admin data...
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card className="card-editorial">
              <CardHeader>
                <CardTitle>User management</CardTitle>
                <CardDescription>Ban/unban and assign roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {users.map((user) => (
                  <div key={user._id} className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.isActive ? "secondary" : "destructive"}>
                        {user.isActive ? "Active" : "Banned"}
                      </Badge>
                      <Badge variant={user.isVerified ? "default" : "outline"}>
                        {user.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                      <Select defaultValue={user.role}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="author">Author</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        Toggle status
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleVerification(user)}>
                        {user.isVerified ? "Remove verify" : "Verify"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="card-editorial">
              <CardHeader>
                <CardTitle>All Blogs Moderation</CardTitle>
                <CardDescription>
                  List view with expandable details. Remove/restore with reason + user notification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-end">
                  <Input
                    placeholder="Search by title/category"
                    value={contentSearch}
                    onChange={(event) => setContentSearch(event.target.value)}
                    className="max-w-xs"
                  />
                </div>
                {posts.map((post) => {
                  const expanded = expandedPostId === post._id;
                  const reasonValue = reasonByPostId[post._id] || "";

                  return (
                    <div key={post._id} className="rounded-md border border-border/60 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{post.title || "Untitled post"}</p>
                          <p className="text-xs text-muted-foreground">
                            by {post.author?.name || "Unknown author"} · {new Date(post.createdAt || "").toLocaleString()}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant={post.isDeleted ? "destructive" : "secondary"}>
                              {post.isDeleted ? "Removed" : "Live"}
                            </Badge>
                            <Badge variant="outline">{post.status || "Unknown"}</Badge>
                            <Badge variant="outline">👁 {post.views || 0}</Badge>
                            <Badge variant="outline">❤️ {post.likes || 0}</Badge>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/post/${post._id}`}>Go to blog</Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedPostId((prev) => (prev === post._id ? null : post._id))}
                          >
                            {expanded ? "Hide details" : "Open details"}
                          </Button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="mt-3 space-y-3 rounded-md bg-secondary/30 p-3">
                          <div className="rounded-md border border-border/50 bg-background p-4">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Blog preview</p>
                            <h3 className="mt-1 text-base font-semibold">{post.title || "Untitled post"}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {post.description || "No description provided."}
                            </p>
                            <div className="mt-3 max-h-52 overflow-auto rounded bg-secondary/40 p-3">
                              <article
                                className="prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    post.content && String(post.content).trim()
                                      ? post.content
                                      : "<p>No content available.</p>",
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-medium">Reason for moderation (shown to user in notification)</p>
                            <Textarea
                              rows={3}
                              placeholder="Write clear reason for remove/restore"
                              value={reasonValue}
                              onChange={(event) =>
                                setReasonByPostId((prev) => ({
                                  ...prev,
                                  [post._id]: event.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
                            <Button variant="secondary" size="sm" asChild>
                              <Link to={`/post/${post._id}`}>Open full blog page</Link>
                            </Button>

                            {!post.isDeleted ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={moderatingPostId === post._id}
                                onClick={() => moderatePost(post, "archive")}
                              >
                                {moderatingPostId === post._id ? "Removing..." : "Remove blog"}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={moderatingPostId === post._id}
                                onClick={() => moderatePost(post, "restore")}
                              >
                                {moderatingPostId === post._id ? "Restoring..." : "Restore blog"}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Card className="card-editorial">
            <CardHeader>
              <CardTitle>Audit log</CardTitle>
              <CardDescription>Track key admin actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log._id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.actor?.name ?? "System"} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary">{log.entity}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;