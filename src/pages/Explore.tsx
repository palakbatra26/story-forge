import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";

type PostSummary = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    clerkId: string;
    name: string;
    username: string;
    avatarUrl: string;
    isVerified?: boolean;
  } | null;
  status: string;
  createdAt: string;
  likes: number;
  likedByClerkIds: string[];
  commentsCount: number;
  coverImageUrl: string;
  timeline: string;
  description: string;
  content: string;
  isRepost: boolean;
  originalPost: { id: string; title: string } | null;
  repostedBy: { id: string; clerkId: string; name: string } | null;
  canDelete?: boolean;
  isBookmarked?: boolean;
};

type CommentItem = {
  id: string;
  author: string;
  authorClerkId: string;
  authorIsVerified?: boolean;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  parentCommentId: string | null;
  likes?: number;
  likedByClerkIds?: string[];
  dislikes?: number;
  dislikedByClerkIds?: string[];
  canDelete: boolean;
};

const categories = ["All", "AI/ML", "Cyber", "Web", "Mobile", "Data", "Cloud", "DevOps", "General"];

const Explore = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommentItem[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "trending">("latest");
  const [tagFilter, setTagFilter] = useState("");
  const [feedMode, setFeedMode] = useState<"all" | "following">("all");

  const filteredPosts = useMemo(() => {
    if (activeCategory === "All") return posts;
    return posts.filter((post) => post.category === activeCategory);
  }, [activeCategory, posts]);

  useEffect(() => {
    const categoryFromUrl = (searchParams.get("category") || "").trim();
    if (!categoryFromUrl) {
      setActiveCategory("All");
      return;
    }

    if (categories.includes(categoryFromUrl)) {
      setActiveCategory(categoryFromUrl);
    } else {
      setActiveCategory("All");
    }
  }, [searchParams]);

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
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const params = new URLSearchParams();

        if (user?.id) params.set("viewerClerkId", user.id);
        if (activeCategory !== "All") params.set("category", activeCategory);
        if (searchTerm.trim()) params.set("q", searchTerm.trim());
        if (tagFilter.trim()) params.set("tag", tagFilter.trim());
        if (feedMode === "following") params.set("feed", "following");
        params.set("sort", sortBy);

        const query = params.toString();
        const url = activeCategory === "All"
          ? `${baseUrl}/api/posts${query ? `?${query}` : ""}`
          : `${baseUrl}/api/posts?${query}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [activeCategory, user?.id, searchTerm, tagFilter, sortBy, feedMode]);

  const handleBookmarkToggle = async (postId: string) => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to bookmark posts.");
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/posts/${postId}/bookmark`, {
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

      if (!response.ok) throw new Error("Bookmark failed");
      const data = await response.json();

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, isBookmarked: !!data.isBookmarked } : post
        )
      );
    } catch {
      toast.error("Unable to update bookmark.");
    }
  };

  const loadComments = async (postId: string) => {
    setCommentLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const query = user?.id ? `?clerkId=${encodeURIComponent(user.id)}` : "";
      const response = await fetch(`${baseUrl}/api/posts/${postId}/comments${query}`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = await response.json();
      setCommentsByPost((prev) => ({ ...prev, [postId]: data }));
    } catch (error) {
      setCommentsByPost((prev) => ({ ...prev, [postId]: [] }));
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleLike = async (postId: string) => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to like posts.");
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/posts/${postId}/like`, {
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
      if (!response.ok) {
        throw new Error("Failed to update");
      }
      const data = await response.json();
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: data.likes ?? post.likes,
                likedByClerkIds: data.likedByClerkIds ?? post.likedByClerkIds,
                commentsCount: data.commentsCount ?? post.commentsCount,
              }
            : post
        )
      );
    } catch (error) {
      toast.error("Unable to update like. Please try again.");
    }
  };

  const handleCommentSubmit = async (postId: string, parentCommentId?: string | null) => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to comment.");
      return;
    }

    const inputKey = parentCommentId ? `${postId}:${parentCommentId}` : postId;
    const content = parentCommentId
      ? replyInputs[inputKey]?.trim()
      : commentInputs[postId]?.trim();

    if (!content) {
      toast.error("Please write a comment first.");
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) {
        throw new Error("API base URL is missing");
      }
      const response = await fetch(`${baseUrl}/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          name: user.fullName || user.username || "",
          email: user.primaryEmailAddress?.emailAddress || "",
          username: user.username || "",
          avatarUrl: user.imageUrl || "",
          content,
          parentCommentId: parentCommentId || null,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to comment");
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                commentsCount: data.commentsCount ?? post.commentsCount,
              }
            : post
        )
      );
      if (parentCommentId) {
        setReplyInputs((prev) => ({ ...prev, [inputKey]: "" }));
      } else {
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      }

      if (data.comment) {
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: [data.comment, ...(prev[postId] || [])],
        }));
      } else {
        await loadComments(postId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add comment.";
      if (message.includes("Failed to fetch")) {
        toast.error("Backend API is not running. Start API server first.");
      } else if (message.includes("API base URL is missing")) {
        toast.error("VITE_API_BASE_URL missing in .env");
      } else {
        toast.error(message);
      }
    }
  };

  const handleCommentReaction = async (
    postId: string,
    commentId: string,
    type: "like" | "dislike"
  ) => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to react on comments.");
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/posts/${postId}/comments/${commentId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          type,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to react on comment");
      }

      if (data?.comment) {
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: (prev[postId] || []).map((comment) =>
            comment.id === commentId ? { ...comment, ...data.comment } : comment
          ),
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to react on comment.";
      toast.error(message);
    }
  };

  const getCommentAvatar = (comment: CommentItem) => {
    if (comment.authorAvatarUrl?.trim()) return comment.authorAvatarUrl;
    return "";
  };

  const getCommentInitial = (comment: CommentItem) => {
    return (comment.author || "U").trim().charAt(0).toUpperCase() || "U";
  };

  const isCommentLikedByViewer = (comment: CommentItem) => {
    return (comment.likedByClerkIds || []).includes(user?.id || "");
  };

  const isCommentDislikedByViewer = (comment: CommentItem) => {
    return (comment.dislikedByClerkIds || []).includes(user?.id || "");
  };

  const handleShare = async (postId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/posts/${postId}/share`, { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to share");
      }
      toast.success("Post shared successfully!");
    } catch (error) {
      toast.error("Unable to share post. Please try again.");
    }
  };

  const handleRepost = async (postId: string) => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to repost.");
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/posts/${postId}/repost`, {
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

      if (!response.ok) {
        throw new Error("Failed to repost");
      }

      const data = await response.json();
      if (data.repost) {
        setPosts((prev) => [data.repost, ...prev]);
      }
      toast.success("Reposted successfully!");
    } catch {
      toast.error("Unable to repost right now.");
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in first.");
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      const data = await response.json();
      const existing = commentsByPost[postId] || [];
      const deletedIds = new Set<string>([commentId]);
      existing.forEach((comment) => {
        if (comment.parentCommentId === commentId) {
          deletedIds.add(comment.id);
        }
      });

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((comment) => !deletedIds.has(comment.id)),
      }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, commentsCount: data.commentsCount ?? Math.max(0, post.commentsCount - 1) }
            : post
        )
      );
      toast.success("Comment deleted.");
    } catch {
      toast.error("Unable to delete comment.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!isSignedIn || !user) {
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
      toast.success("Post deleted.");
    } catch {
      toast.error("Unable to delete post.");
    }
  };

  const getThreadedComments = (postId: string) => {
    const allComments = commentsByPost[postId] || [];
    const topLevel = allComments.filter((comment) => !comment.parentCommentId);
    const repliesByParent = allComments.reduce<Record<string, CommentItem[]>>((acc, comment) => {
      if (!comment.parentCommentId) return acc;
      if (!acc[comment.parentCommentId]) acc[comment.parentCommentId] = [];
      acc[comment.parentCommentId].push(comment);
      return acc;
    }, {});

    return { topLevel, repliesByParent };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h1 className="heading-title">Explore</h1>
              <p className="text-muted-foreground">Browse the latest stories by category.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={feedMode === "all" ? "default" : "outline"}
                onClick={() => setFeedMode("all")}
              >
                All feed
              </Button>
              <Button
                variant={feedMode === "following" ? "default" : "outline"}
                onClick={() => setFeedMode("following")}
                disabled={!isSignedIn}
              >
                Following feed
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Input
                placeholder="Search by title, description, tags..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <Input
                placeholder="Filter by tag (e.g. AI/ML)"
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
              />
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as "latest" | "trending") }>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading posts...</p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-muted-foreground">No posts found for this category yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="card-editorial">
                    <CardHeader>
                      {post.isRepost && post.repostedBy && (
                        <p className="text-xs text-muted-foreground">🔁 Reposted by {post.repostedBy.name}</p>
                      )}
                      <CardTitle>{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      {post.coverImageUrl && (
                        <img
                          src={post.coverImageUrl}
                          alt={post.title}
                          className="h-40 w-full rounded-md object-cover border"
                        />
                      )}
                      {post.description && <p className="text-foreground/90">{post.description}</p>}
                      <div className="flex flex-wrap gap-2">
                        {post.category && (
                          <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                            {post.category}
                          </span>
                        )}
                        {post.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-border/60 px-3 py-1 text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p>
                        By{" "}
                        {post.author?.clerkId ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Link className="text-primary hover:underline" to={`/profile/${post.author.clerkId}`}>
                              {post.author.name}
                            </Link>
                            {post.author.isVerified && <BadgeCheck className="h-4 w-4 text-sky-500" />}
                          </span>
                        ) : (
                          "Unknown"
                        )}
                      </p>
                      {post.isRepost && post.originalPost && (
                        <p className="text-xs">Original post: {post.originalPost.title}</p>
                      )}
                      {post.timeline && <p>{post.timeline}</p>}
                      <p>Status: {post.status}</p>
                      <p>{new Date(post.createdAt).toLocaleDateString()}</p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button size="sm" variant="secondary" asChild>
                          <Link to={`/post/${post.id}`}>📖 Read</Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleLike(post.id)}>
                          {post.likedByClerkIds.includes(user?.id || "") ? "💔 Unlike" : "👍 Like"} ({post.likes})
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadComments(post.id)}
                        >
                          💬 Comment ({post.commentsCount})
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleShare(post.id)}>
                          🔗 Share
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRepost(post.id)}>
                          🔁 Repost
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBookmarkToggle(post.id)}>
                          {post.isBookmarked ? "🔖 Bookmarked" : "📌 Bookmark"}
                        </Button>
                        {post.canDelete && (
                          <Button size="sm" variant="destructive" onClick={() => handleDeletePost(post.id)}>
                            🗑 Delete
                          </Button>
                        )}
                      </div>
                      <div className="mt-4 space-y-3">
                        <Textarea
                          placeholder={isSignedIn ? "Write a comment..." : "Sign in to comment"}
                          value={commentInputs[post.id] || ""}
                          onChange={(event) =>
                            setCommentInputs((prev) => ({ ...prev, [post.id]: event.target.value }))
                          }
                          disabled={!isSignedIn}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {commentLoading[post.id]
                              ? "Loading comments..."
                              : `${commentsByPost[post.id]?.length ?? 0} comments`}
                          </span>
                          <Button size="sm" onClick={() => handleCommentSubmit(post.id)} disabled={!isSignedIn}>
                            Post Comment
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {(() => {
                            const { topLevel, repliesByParent } = getThreadedComments(post.id);

                            return topLevel.map((comment) => {
                              const replyInputKey = `${post.id}:${comment.id}`;
                              const replies = repliesByParent[comment.id] || [];

                              return (
                                <div
                                  key={comment.id}
                                  className={`rounded-md border p-3 ${
                                    isCommentLikedByViewer(comment)
                                      ? "border-primary/40 bg-primary/5"
                                      : "border-border/60"
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="inline-flex items-center gap-2">
                                      <div className="h-6 w-6 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-[10px] font-semibold text-foreground">
                                        {getCommentAvatar(comment) ? (
                                          <img
                                            src={getCommentAvatar(comment)}
                                            alt={comment.author}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          getCommentInitial(comment)
                                        )}
                                      </div>
                                      <span className="inline-flex items-center gap-1.5">
                                        {comment.authorClerkId ? (
                                          <Link
                                            className="text-primary hover:underline"
                                            to={`/profile/${comment.authorClerkId}`}
                                          >
                                            {comment.author}
                                          </Link>
                                        ) : (
                                          comment.author
                                        )}
                                        {comment.authorIsVerified && (
                                          <BadgeCheck className="h-3.5 w-3.5 text-sky-500" />
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                                      {comment.canDelete && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleDeleteComment(post.id, comment.id)}
                                        >
                                          Delete
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="mt-1 text-sm text-foreground">{comment.content}</p>
                                  {isCommentLikedByViewer(comment) && (
                                    <p className="mt-1 text-[11px] text-primary">You liked this</p>
                                  )}

                                  <div className="mt-2 flex justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleCommentReaction(post.id, comment.id, "like")}
                                      disabled={!isSignedIn}
                                    >
                                      {comment.likedByClerkIds?.includes(user?.id || "") ? "💔 Unlike" : "👍 Like"} ({comment.likes || 0})
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleCommentReaction(post.id, comment.id, "dislike")}
                                      disabled={!isSignedIn}
                                    >
                                      {isCommentDislikedByViewer(comment) ? "💚 Undislike" : "👎 Dislike"} ({comment.dislikes || 0})
                                    </Button>
                                  </div>

                                  <div className="mt-2 flex justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        setReplyInputs((prev) => ({
                                          ...prev,
                                          [replyInputKey]: prev[replyInputKey] || `@${comment.author} `,
                                        }))
                                      }
                                    >
                                      Reply
                                    </Button>
                                  </div>

                                  {replyInputKey in replyInputs && (
                                    <div className="mt-3 space-y-2">
                                      <Textarea
                                        placeholder="Write a reply..."
                                        value={replyInputs[replyInputKey] || ""}
                                        onChange={(event) =>
                                          setReplyInputs((prev) => ({
                                            ...prev,
                                            [replyInputKey]: event.target.value,
                                          }))
                                        }
                                      />
                                      <div className="flex justify-end">
                                        <Button
                                          size="sm"
                                          onClick={() => handleCommentSubmit(post.id, comment.id)}
                                        >
                                          Post Reply
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {replies.length > 0 && (
                                    <div className="mt-3 space-y-2 border-l pl-3">
                                      {replies.map((reply) => (
                                        <div
                                          key={reply.id}
                                          className={`rounded-md border p-2 ${
                                            isCommentLikedByViewer(reply)
                                              ? "border-primary/40 bg-primary/5"
                                              : "border-border/40"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="inline-flex items-center gap-2">
                                              <div className="h-5 w-5 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-[9px] font-semibold text-foreground">
                                                {getCommentAvatar(reply) ? (
                                                  <img
                                                    src={getCommentAvatar(reply)}
                                                    alt={reply.author}
                                                    className="h-full w-full object-cover"
                                                  />
                                                ) : (
                                                  getCommentInitial(reply)
                                                )}
                                              </div>
                                              <span className="inline-flex items-center gap-1.5">
                                                {reply.authorClerkId ? (
                                                  <Link
                                                    className="text-primary hover:underline"
                                                    to={`/profile/${reply.authorClerkId}`}
                                                  >
                                                    {reply.author}
                                                  </Link>
                                                ) : (
                                                  reply.author
                                                )}
                                                {reply.authorIsVerified && (
                                                  <BadgeCheck className="h-3.5 w-3.5 text-sky-500" />
                                                )}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span>{new Date(reply.createdAt).toLocaleString()}</span>
                                              {reply.canDelete && (
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => handleDeleteComment(post.id, reply.id)}
                                                >
                                                  Delete
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                          <p className="mt-1 text-sm text-foreground">{reply.content}</p>
                                          {isCommentLikedByViewer(reply) && (
                                            <p className="mt-1 text-[11px] text-primary">You liked this</p>
                                          )}
                                          <div className="mt-2 flex justify-end gap-1">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleCommentReaction(post.id, reply.id, "like")}
                                              disabled={!isSignedIn}
                                            >
                                              {reply.likedByClerkIds?.includes(user?.id || "") ? "💔 Unlike" : "👍 Like"} ({reply.likes || 0})
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleCommentReaction(post.id, reply.id, "dislike")}
                                              disabled={!isSignedIn}
                                            >
                                              {isCommentDislikedByViewer(reply) ? "💚 Undislike" : "👎 Dislike"} ({reply.dislikes || 0})
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Explore;