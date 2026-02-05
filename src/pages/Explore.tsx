import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

type PostSummary = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  author: string;
  status: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
  commentsCount: number;
  coverImageUrl: string;
  timeline: string;
};

type CommentItem = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

const categories = ["All", "AI/ML", "Cyber", "Web", "Mobile", "Data", "Cloud", "DevOps"];

const Explore = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [activeCategory, setActiveCategory] = useState("All");
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommentItem[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});

  const filteredPosts = useMemo(() => {
    if (activeCategory === "All") return posts;
    return posts.filter((post) => post.category === activeCategory);
  }, [activeCategory, posts]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const url = activeCategory === "All"
          ? `${baseUrl}/api/posts`
          : `${baseUrl}/api/posts?category=${encodeURIComponent(activeCategory)}`;
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
  }, [activeCategory]);

  const loadComments = async (postId: string) => {
    setCommentLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/posts/${postId}/comments`);
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
                likedBy: data.likedBy ?? post.likedBy,
                commentsCount: data.commentsCount ?? post.commentsCount,
              }
            : post
        )
      );
    } catch (error) {
      toast.error("Unable to update like. Please try again.");
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to comment.");
      return;
    }

    const content = commentInputs[postId]?.trim();
    if (!content) {
      toast.error("Please write a comment first.");
      return;
    }

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          name: user.fullName || user.username || "",
          email: user.primaryEmailAddress?.emailAddress || "",
          content,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to comment");
      }
      const data = await response.json();
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
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      if (data.comment) {
        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: [data.comment, ...(prev[postId] || [])],
        }));
      } else {
        loadComments(postId);
      }
    } catch (error) {
      toast.error("Unable to add comment. Please try again.");
    }
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

            {loading ? (
              <p className="text-muted-foreground">Loading posts...</p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-muted-foreground">No posts found for this category yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="card-editorial">
                    <CardHeader>
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
                      <p>By {post.author || "Unknown"}</p>
                      {post.timeline && <p>{post.timeline}</p>}
                      <p>Status: {post.status}</p>
                      <p>{new Date(post.createdAt).toLocaleDateString()}</p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => handleLike(post.id)}>
                          {post.likedBy.includes(user?.id || "") ? "💔 Unlike" : "👍 Like"} ({post.likes})
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
                          {(commentsByPost[post.id] || []).map((comment) => (
                            <div key={comment.id} className="rounded-md border border-border/60 p-3">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{comment.author}</span>
                                <span>{new Date(comment.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="mt-1 text-sm text-foreground">{comment.content}</p>
                            </div>
                          ))}
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