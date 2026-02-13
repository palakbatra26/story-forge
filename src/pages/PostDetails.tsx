import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BadgeCheck, Pause, Play, Square } from "lucide-react";

type Poll = {
  id: string;
  question: string;
  options: Array<{ id: string; text: string; votes: number; votedByClerkIds: string[] }>;
};

type PostDetail = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  views: number;
  aiSummary?: string;
  readabilityScore?: number;
  seo?: { slug?: string; metaTitle?: string; metaDescription?: string };
  series?: { seriesId?: string; seriesTitle?: string; partNumber?: number };
  polls?: Poll[];
  qna?: Array<{ id: string; question: string; askedByName: string; answer?: string }>;
  amaSessions?: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    scheduledFor?: string;
    questions: Array<{ id: string; question: string; askedByName: string }>;
  }>;
  coverImageUrl?: string;
  originalLanguage?: string;
  translations?: Array<{ language: string; title?: string; description?: string; content?: string }>;
  audioEnabled?: boolean;
  author: { clerkId: string; name: string; isVerified?: boolean } | null;
  canDelete?: boolean;
};

const languageOptions = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "pa", label: "Punjabi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];

const PostDetails = () => {
  const { postId } = useParams();
  const { user } = useUser();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [recommendations, setRecommendations] = useState<PostDetail[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [fontScale, setFontScale] = useState(100);

  const [qnaQuestion, setQnaQuestion] = useState("");
  const [qnaAnswers, setQnaAnswers] = useState<Record<string, string>>({});
  const [amaQuestionInputs, setAmaQuestionInputs] = useState<Record<string, string>>({});

  const contentStyle = useMemo(() => ({ fontSize: `${fontScale}%` }), [fontScale]);

  const fetchPost = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (user?.id) params.set("viewerClerkId", user.id);
      if (selectedLanguage) params.set("language", selectedLanguage);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch post");
      const data = await response.json();
      setPost(data);
      if (!selectedLanguage) setSelectedLanguage(data.originalLanguage || "en");
    } catch {
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, user?.id, selectedLanguage]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!postId) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/recommendations`);
        if (!response.ok) return;
        const data = await response.json();
        setRecommendations(data || []);
      } catch {
        setRecommendations([]);
      }
    };
    fetchRecommendations();
  }, [postId]);

  useEffect(() => {
    const markRead = async () => {
      if (!postId || !user?.id) return;
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${postId}/mark-read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clerkId: user.id }),
        });
      } catch {
        // ignore
      }
    };
    markRead();
  }, [postId, user?.id]);

  const readAloud = () => {
    if (!post) return;
    const text = `${post.title}. ${post.description}. ${(post.content || "").replace(/<[^>]*>/g, " ")}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage || post.originalLanguage || "en";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const votePoll = async (pollIndex: number, optionIndex: number) => {
    if (!user || !post) return toast.error("Sign in required.");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/posts/${post.id}/polls/${pollIndex}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clerkId: user.id, optionIndex }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to vote");
      setPost((prev) => (prev ? { ...prev, polls: data?.post?.polls || prev.polls } : prev));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to vote.");
    }
  };

  const askQna = async () => {
    if (!user || !post || !qnaQuestion.trim()) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${post.id}/qna`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user.id, question: qnaQuestion }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to ask question");
      setPost((prev) => (prev ? { ...prev, qna: data.qna || prev.qna } : prev));
      setQnaQuestion("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to ask Q&A question.");
    }
  };

  const answerQna = async (qnaId: string) => {
    if (!user || !post) return;
    const answer = qnaAnswers[qnaId]?.trim();
    if (!answer) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${post.id}/qna/${qnaId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user.id, answer }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to answer");
      setPost((prev) => (prev ? { ...prev, qna: data.qna || prev.qna } : prev));
      setQnaAnswers((prev) => ({ ...prev, [qnaId]: "" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to answer Q&A.");
    }
  };

  const askAmaQuestion = async (amaId: string) => {
    if (!user || !post) return;
    const question = amaQuestionInputs[amaId]?.trim();
    if (!question) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/posts/${post.id}/ama/${amaId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user.id, question }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to submit AMA question");
      setPost((prev) => (prev ? { ...prev, amaSessions: data.amaSessions || prev.amaSessions } : prev));
      setAmaQuestionInputs((prev) => ({ ...prev, [amaId]: "" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit AMA question.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          {loading ? (
            <p className="text-muted-foreground">Loading post...</p>
          ) : !post ? (
            <p className="text-muted-foreground">Post not found.</p>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-3xl">{post.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    By{" "}
                    {post.author?.clerkId ? (
                      <span className="inline-flex items-center gap-1">
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
                    {" · "}
                    👀 {post.views || 0}
                  </p>
                  {post.series?.seriesTitle && (
                    <p className="text-xs text-muted-foreground">
                      Series: {post.series.seriesTitle} (Part {post.series.partNumber || 1})
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Select value={selectedLanguage || post.originalLanguage || "en"} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Language" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={post.originalLanguage || "en"}>Original</SelectItem>
                        {(post.translations || []).map((t) => (
                          <SelectItem key={t.language} value={t.language}>
                            {languageOptions.find((l) => l.value === t.language)?.label || t.language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={String(fontScale)} onValueChange={(v) => setFontScale(Number(v))}>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Font" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">Small</SelectItem>
                        <SelectItem value="100">Default</SelectItem>
                        <SelectItem value="110">Large</SelectItem>
                        <SelectItem value="120">XL</SelectItem>
                      </SelectContent>
                    </Select>
                    {post.audioEnabled !== false && (
                      <>
                        <Button variant="outline" size="sm" onClick={readAloud}><Play className="h-4 w-4 mr-1" />Play</Button>
                        <Button variant="outline" size="sm" onClick={() => { window.speechSynthesis.pause(); setIsSpeaking(false); }} disabled={!isSpeaking}>
                          <Pause className="h-4 w-4 mr-1" />Pause
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }}>
                          <Square className="h-4 w-4 mr-1" />Stop
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {post.coverImageUrl && <img src={post.coverImageUrl} alt={post.title} className="w-full max-h-[420px] rounded-lg object-cover" />}
                  {post.description && <p className="text-lg text-muted-foreground">{post.description}</p>}

                  <div className="rounded-md border p-3 bg-secondary/20 text-sm">
                    <p><b>AI Summary:</b> {post.aiSummary || "Not available"}</p>
                    <p className="mt-1"><b>Readability:</b> {post.readabilityScore || 0}/100</p>
                    {post.seo?.slug && <p className="mt-1"><b>Slug:</b> {post.seo.slug}</p>}
                  </div>

                  <article style={contentStyle} className="prose prose-neutral max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.content || "" }} />
                </CardContent>
              </Card>

              {!!post.polls?.length && (
                <Card>
                  <CardHeader><CardTitle>Polls</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {post.polls.map((poll, pollIndex) => (
                      <div key={poll.id} className="rounded-md border p-3">
                        <p className="font-medium">{poll.question}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {poll.options.map((option, optionIndex) => (
                            <Button key={option.id} variant="outline" size="sm" onClick={() => votePoll(pollIndex, optionIndex)}>
                              {option.text} ({option.votes})
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle>Q&A</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input placeholder="Ask a question..." value={qnaQuestion} onChange={(e) => setQnaQuestion(e.target.value)} />
                    <Button onClick={askQna} disabled={!user}>Ask</Button>
                  </div>
                  {(post.qna || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No questions yet.</p>
                  ) : (
                    (post.qna || []).map((item) => (
                      <div key={item.id} className="rounded-md border p-3 space-y-2">
                        <p className="text-sm"><b>{item.askedByName}:</b> {item.question}</p>
                        {item.answer ? (
                          <p className="text-sm text-muted-foreground"><b>Answer:</b> {item.answer}</p>
                        ) : post.canDelete ? (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Write answer..."
                              value={qnaAnswers[item.id] || ""}
                              onChange={(e) => setQnaAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            />
                            <Button size="sm" onClick={() => answerQna(item.id)}>Answer</Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Waiting for author response...</p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {!!post.amaSessions?.length && (
                <Card>
                  <CardHeader><CardTitle>AMA Sessions</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {(post.amaSessions || []).map((ama) => (
                      <div key={ama.id} className="rounded-md border p-3 space-y-2">
                        <p className="font-medium">{ama.title}</p>
                        <p className="text-sm text-muted-foreground">{ama.description}</p>
                        <p className="text-xs text-muted-foreground">Status: {ama.status}</p>

                        <div className="flex gap-2">
                          <Input
                            placeholder="Ask AMA question"
                            value={amaQuestionInputs[ama.id] || ""}
                            onChange={(e) => setAmaQuestionInputs((prev) => ({ ...prev, [ama.id]: e.target.value }))}
                          />
                          <Button size="sm" onClick={() => askAmaQuestion(ama.id)} disabled={!user}>Submit</Button>
                        </div>

                        {(ama.questions || []).map((q) => (
                          <p key={q.id} className="text-sm">• <b>{q.askedByName}:</b> {q.question}</p>
                        ))}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle>Related Posts</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-3">
                  {recommendations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recommendations yet.</p>
                  ) : (
                    recommendations.map((item) => (
                      <div key={item.id} className="rounded-md border p-3">
                        <h3 className="font-medium line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                        <Link to={`/post/${item.id}`} className="text-sm text-primary hover:underline mt-2 inline-block">
                          Read
                        </Link>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PostDetails;
