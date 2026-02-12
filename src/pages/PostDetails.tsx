import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BadgeCheck, Pause, Play, Square } from "lucide-react";

type PostDetail = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  coverImageUrl: string;
  coverImageData?: string;
  timeline?: string;
  status?: string;
  views?: number;
  originalLanguage?: string;
  translations?: Array<{
    language: string;
    title?: string;
    description?: string;
    content?: string;
  }>;
  audioEnabled?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  editHistoryCount?: number;
  createdAt: string;
  author: { clerkId: string; name: string; isVerified?: boolean } | null;
  canDelete?: boolean;
};

type HistoryItem = {
  editedAt: string;
  editedBy: { name: string; clerkId: string } | null;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
};

const PostDetails = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { postId } = useParams();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editCoverImageUrl, setEditCoverImageUrl] = useState("");
  const [editCoverImageData, setEditCoverImageData] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "hi", label: "Hindi" },
    { value: "pa", label: "Punjabi" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
  ];

  const languageLabel = (code: string) =>
    languageOptions.find((item) => item.value === code)?.label || code.toUpperCase();

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return;
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const params = new URLSearchParams();
        if (user?.id) params.set("viewerClerkId", user.id);
        if (selectedLanguage) params.set("language", selectedLanguage);

        const query = params.toString();
        const response = await fetch(`${baseUrl}/api/posts/${postId}${query ? `?${query}` : ""}`);
        if (!response.ok) throw new Error("Failed to fetch post");
        const data = await response.json();
        setPost(data);
        if (!selectedLanguage) {
          setSelectedLanguage(data.originalLanguage || "en");
        }
        setEditTitle(data.title || "");
        setEditDescription(data.description || "");
        setEditContent(data.content || "");
        setEditCategory(data.category || "");
        setEditTags((data.tags || []).join(", "));
        setEditCoverImageUrl(data.coverImageUrl || "");
        setEditCoverImageData(data.coverImageData || "");
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId, user?.id, selectedLanguage]);

  const readAloud = () => {
    if (!post) return;
    const text = `${post.title || ""}. ${post.description || ""}. ${(post.content || "").replace(/<[^>]*>/g, " ")}`
      .replace(/\s+/g, " ")
      .trim();

    if (!text) {
      toast.error("No readable content found for audio mode.");
      return;
    }

    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage || post.originalLanguage || "en";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis?.speak(utterance);
  };

  const pauseAudio = () => {
    window.speechSynthesis?.pause();
    setIsSpeaking(false);
  };

  const stopAudio = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const handleDeletePost = async () => {
    if (!post || !user) return;
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/posts/${post.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user.id }),
      });
      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Post archived successfully.");
      setPost((prev) => (prev ? { ...prev, isDeleted: true, status: "Archived" } : prev));
    } catch {
      toast.error("Unable to delete post.");
    }
  };

  const handleRecoverPost = async () => {
    if (!post || !user) return;
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/posts/${post.id}/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user.id }),
      });
      if (!response.ok) throw new Error("Failed to recover");
      const data = await response.json();
      setPost(data);
      toast.success("Post recovered successfully.");
    } catch {
      toast.error("Unable to recover post.");
    }
  };

  const loadHistory = async () => {
    if (!post || !user) return;
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(
        `${baseUrl}/api/posts/${post.id}/history?clerkId=${encodeURIComponent(user.id)}`
      );
      if (!response.ok) throw new Error("Failed to load history");
      const data = await response.json();
      setHistory(data.history || []);
      setHistoryOpen(true);
    } catch {
      toast.error("Unable to load edit history.");
    }
  };

  const handleUpdatePost = async () => {
    if (!post || !user) return;
    setSaving(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          title: editTitle,
          description: editDescription,
          content: editContent,
          category: editCategory,
          tags: editTags.split(",").map((tag) => tag.trim()).filter(Boolean),
          coverImageUrl: editCoverImageUrl,
          coverImageData: editCoverImageData,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update post");
      }

      setPost(data);
      setEditMode(false);
      toast.success("Post updated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          {loading ? (
            <p className="text-muted-foreground">Loading blog...</p>
          ) : !post ? (
            <p className="text-muted-foreground">Post not found.</p>
          ) : (
            <Card>
              <CardHeader className="space-y-3">
                <CardTitle className="text-3xl">{post.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
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
                  {" · "}
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  👀 {post.views || 0} views {post.editHistoryCount ? `· ${post.editHistoryCount} edits` : ""}
                </p>
                {post.translations && post.translations.length > 0 && (
                  <div className="max-w-[240px]">
                    <Select value={selectedLanguage || post.originalLanguage || "en"} onValueChange={setSelectedLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={post.originalLanguage || "en"}>
                          {languageLabel(post.originalLanguage || "en")} (Original)
                        </SelectItem>
                        {(post.translations || []).map((item) => (
                          <SelectItem key={item.language} value={item.language}>
                            {languageLabel(item.language)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                {post.audioEnabled !== false && (
                  <div className="flex flex-wrap items-center gap-2 rounded-md border p-3">
                    <p className="text-sm font-medium mr-2">🔊 Audio mode</p>
                    <Button size="sm" variant="outline" onClick={readAloud}>
                      <Play className="h-4 w-4 mr-1" />
                      Play
                    </Button>
                    <Button size="sm" variant="outline" onClick={pauseAudio} disabled={!isSpeaking}>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button size="sm" variant="outline" onClick={stopAudio}>
                      <Square className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  </div>
                )}
                {post.isDeleted && (
                  <p className="text-sm text-amber-600">This post is archived (soft deleted).</p>
                )}
                {editMode ? (
                  <div className="space-y-3">
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
                    />
                    <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="Category" />
                    <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="Tags comma separated" />
                    <Input
                      value={editCoverImageUrl}
                      onChange={(e) => setEditCoverImageUrl(e.target.value)}
                      placeholder="Cover image URL"
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setEditCoverImageData(reader.result?.toString() || "");
                        reader.readAsDataURL(file);
                      }}
                    />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="HTML content"
                      className="min-h-[260px]"
                    />
                  </div>
                ) : (
                  <>
                {post.coverImageUrl && (
                  <img src={post.coverImageUrl} alt={post.title} className="w-full max-h-[420px] rounded-lg object-cover" />
                )}
                {post.description && <p className="text-lg text-muted-foreground">{post.description}</p>}
                <div className="flex flex-wrap gap-2">
                  {post.category && <span className="rounded-full bg-secondary px-3 py-1 text-xs">{post.category}</span>}
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-border/60 px-3 py-1 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>

                <article
                  className="prose prose-neutral max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: post.content || "" }}
                />
                  </>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link to="/explore">Back to Explore</Link>
                  </Button>
                  {post.canDelete && !editMode && !post.isDeleted && (
                    <Button variant="secondary" onClick={() => setEditMode(true)}>Edit Post</Button>
                  )}
                  {post.canDelete && !editMode && (
                    <Button variant="outline" onClick={loadHistory}>Edit History</Button>
                  )}
                  {post.canDelete && editMode && (
                    <>
                      <Button variant="outline" onClick={() => setEditMode(false)} disabled={saving}>Cancel</Button>
                      <Button onClick={handleUpdatePost} disabled={saving}>{saving ? "Updating..." : "Update Post"}</Button>
                    </>
                  )}
                  {post.canDelete && !post.isDeleted && (
                    <Button variant="destructive" onClick={handleDeletePost}>Archive Post</Button>
                  )}
                  {post.canDelete && post.isDeleted && (
                    <Button variant="default" onClick={handleRecoverPost}>Recover Post</Button>
                  )}
                </div>

                {historyOpen && (
                  <div className="rounded-md border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Edit History</p>
                      <Button size="sm" variant="outline" onClick={() => setHistoryOpen(false)}>Close</Button>
                    </div>
                    {history.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No edits yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {history.map((item, index) => (
                          <div key={`${item.editedAt}-${index}`} className="rounded border p-2 text-xs">
                            <p>
                              {new Date(item.editedAt).toLocaleString()} by {item.editedBy?.name || "Unknown"}
                            </p>
                            <p className="text-muted-foreground">Title: {item.title || "-"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PostDetails;
