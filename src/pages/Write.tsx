import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useAuth, useUser } from "@clerk/clerk-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

type WorkflowStatus = "Draft" | "Scheduled" | "Submitted" | "Under Review" | "Approved" | "Published" | "Archived";
type TranslationStatus = "Draft" | "Translated" | "Reviewed" | "Published";

type TranslationWorkflowItem = {
  language: string;
  status: TranslationStatus;
};

type CollaborationPresence = {
  clerkId: string;
  name: string;
  cursor?: string;
  section?: string;
  lastSeenAt?: string;
};

type CoachPayload = {
  readabilityScore: number;
  tone: string;
  suggestions: string[];
  improvedIntro: string;
};

const workflowSteps: WorkflowStatus[] = [
  "Draft",
  "Scheduled",
  "Submitted",
  "Under Review",
  "Approved",
  "Published",
  "Archived",
];

const translationStatuses: TranslationStatus[] = ["Draft", "Translated", "Reviewed", "Published"];

const languageOptions = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "pa", label: "Punjabi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];

const collaboratorRoleOptions = [
  { value: "editor", label: "Editor" },
  { value: "translator", label: "Translator" },
  { value: "reviewer", label: "Reviewer" },
];

const categories = ["AI/ML", "Cyber", "Web", "Mobile", "Data", "Cloud", "DevOps", "General"];

const editorExtensions = [
  StarterKit,
  Placeholder.configure({ placeholder: "Start writing your story..." }),
  Link.configure({ openOnClick: false }),
  Image,
];

const Write = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<WorkflowStatus>("Published");
  const [category, setCategory] = useState("General");
  const [tags, setTags] = useState("");
  const [timeline, setTimeline] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [contentLanguage, setContentLanguage] = useState("hi");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageData, setCoverImageData] = useState("");

  const [aiSummary, setAiSummary] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [translating, setTranslating] = useState(false);
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const [applyingAutoTranslation, setApplyingAutoTranslation] = useState(false);

  const [coachLoading, setCoachLoading] = useState(false);
  const [coach, setCoach] = useState<CoachPayload | null>(null);

  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translationWorkflows, setTranslationWorkflows] = useState<TranslationWorkflowItem[]>([]);

  const [collaboratorClerkIds, setCollaboratorClerkIds] = useState("");
  const [collaboratorRole, setCollaboratorRole] = useState("editor");
  const [savedPostId, setSavedPostId] = useState("");
  const [activeCollaborators, setActiveCollaborators] = useState<CollaborationPresence[]>([]);
  const [collabSyncing, setCollabSyncing] = useState(false);

  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: editorExtensions,
    content: "",
    onUpdate: ({ editor: currentEditor }) => {
      setContentHtml(currentEditor.getHTML() || "");
    },
  });

  const wordCount = useMemo(
    () => editor?.getText().trim().split(/\s+/).filter(Boolean).length || 0,
    [editor?.state]
  );

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  useEffect(() => {
    if (!autoTranslateEnabled || applyingAutoTranslation) {
      setTranslating(false);
      return;
    }

    const hasSourceText =
      title.trim().length > 0 || description.trim().length > 0 || editor?.getText().trim().length;

    if (!hasSourceText) return;

    const timer = setTimeout(async () => {
      try {
        setTranslating(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/posts/ai/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            content: contentHtml,
            originalLanguage: "auto",
            targetLanguage: contentLanguage,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "Auto translation failed");

        const nextTitle = (data?.translatedTitle || "").trim();
        const nextDescription = (data?.translatedDescription || "").trim();
        const nextContent = String(data?.translatedContent || "").trim();

        const shouldApply =
          (nextTitle && nextTitle !== title) ||
          (nextDescription && nextDescription !== description) ||
          (nextContent && nextContent !== contentHtml);

        if (shouldApply) {
          setApplyingAutoTranslation(true);
          if (nextTitle) setTitle(nextTitle);
          if (nextDescription) setDescription(nextDescription);
          if (nextContent) {
            editor?.commands.setContent(nextContent, false);
            setContentHtml(nextContent);
          }
          setTimeout(() => setApplyingAutoTranslation(false), 0);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.warn("Auto translation unavailable:", error.message);
        }
      } finally {
        setTranslating(false);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [title, description, contentHtml, contentLanguage, editor, autoTranslateEnabled, applyingAutoTranslation]);

  useEffect(() => {
    const shouldCoach =
      title.trim().length > 0 || description.trim().length > 0 || stripHtml(contentHtml).length > 80;
    if (!shouldCoach) {
      setCoach(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCoachLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/posts/ai/coach`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            content: contentHtml,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "Coach is unavailable");

        setCoach({
          readabilityScore: Number(data?.readabilityScore) || 0,
          tone: String(data?.tone || "balanced"),
          suggestions: Array.isArray(data?.suggestions)
            ? data.suggestions.map((item: unknown) => String(item)).slice(0, 5)
            : [],
          improvedIntro: String(data?.improvedIntro || ""),
        });
      } catch {
        // silent fallback
      } finally {
        setCoachLoading(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [title, description, contentHtml]);

  useEffect(() => {
    if (!savedPostId || !user?.id) return;

    const syncPresence = async () => {
      try {
        setCollabSyncing(true);
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/posts/${savedPostId}/collab/presence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            name: user.fullName || user.username || "Writer",
            cursor: `Title:${title.length} Content:${stripHtml(contentHtml).split(/\s+/).filter(Boolean).length}w`,
            section: "write-editor",
          }),
        });

        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
          setActiveCollaborators(Array.isArray(payload?.activeCollaborators) ? payload.activeCollaborators : []);
        }
      } finally {
        setCollabSyncing(false);
      }
    };

    const fetchPresence = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/posts/${savedPostId}/collab/presence`);
        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
          setActiveCollaborators(Array.isArray(payload?.activeCollaborators) ? payload.activeCollaborators : []);
        }
      } catch {
        // ignore
      }
    };

    void syncPresence();
    void fetchPresence();
    const interval = setInterval(() => {
      void syncPresence();
      void fetchPresence();
    }, 6000);

    return () => clearInterval(interval);
  }, [savedPostId, user?.id, user?.fullName, user?.username, title, contentHtml]);

  const addWorkflowLanguage = () => {
    if (!targetLanguage || targetLanguage === contentLanguage) {
      toast.error("Target language original language se alag select karo.");
      return;
    }

    const exists = translationWorkflows.some((item) => item.language === targetLanguage);
    if (exists) {
      toast.error("Workflow already added for this language.");
      return;
    }

    setTranslationWorkflows((prev) => [...prev, { language: targetLanguage, status: "Draft" }]);
  };

  const updateWorkflowStatus = (language: string, nextStatus: TranslationStatus) => {
    setTranslationWorkflows((prev) =>
      prev.map((item) => (item.language === language ? { ...item, status: nextStatus } : item))
    );
  };

  const removeWorkflowLanguage = (language: string) => {
    setTranslationWorkflows((prev) => prev.filter((item) => item.language !== language));
  };

  const handleAiSuggest = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/posts/ai/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          content: editor?.getHTML() || "",
          originalLanguage: "auto",
          targetLanguage: contentLanguage,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "AI suggestion failed");

      setTitle((prev) => prev || data.suggestedTitle || "");
      setAiSummary(data.aiSummary || "");
      setDescription((prev) => prev || data.suggestedMetaDescription || "");
      toast.success("AI suggestions generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate AI suggestions.");
    }
  };

  const handleSave = async () => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in first.");
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    setSaving(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const collaboratorPayload = collaboratorClerkIds
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((clerkId) => ({
          clerkId,
          role: collaboratorRole,
        }));

      const translationPayload = translationWorkflows.map((item) => ({
        language: item.language,
        title: "",
        description: "",
        content: "",
        status: item.status,
      }));

      const response = await fetch(`${baseUrl}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          name: user.fullName || user.username || "Unknown",
          email: user.primaryEmailAddress?.emailAddress || "",
          username: user.username || "",
          avatarUrl: user.imageUrl || "",
          title,
          description,
          status,
          category,
          tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          timeline,
          content: editor?.getHTML() || "",
          scheduledAt: status === "Scheduled" ? scheduledAt : null,
          originalLanguage: contentLanguage,
          translations: translationPayload,
          collaborators: collaboratorPayload,
          audioEnabled,
          coverImageUrl,
          coverImageData,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Failed to publish post");

      setSavedPostId(String(data?.id || ""));
      toast.success("Post published successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-10 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="heading-title">Write & Publish</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAiSuggest} className="gap-2">
                <Sparkles className="h-4 w-4" /> AI Suggest
              </Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Publish"}</Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Story Basics</CardTitle>
              <CardDescription>{readingTime} min read | {wordCount} words</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Select value={status} onValueChange={(v) => setStatus(v as WorkflowStatus)}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>{workflowSteps.map((step) => <SelectItem key={step} value={step}>{step}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
              <Input placeholder="Timeline (e.g. 8 min read)" value={timeline} onChange={(e) => setTimeline(e.target.value)} />
              {status === "Scheduled" && (
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              )}
              <Input placeholder="Cover image URL" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
              <div className="md:col-span-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setCoverImageData(reader.result?.toString() || "");
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Language & Accessibility</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <Select value={contentLanguage} onValueChange={setContentLanguage}>
                <SelectTrigger><SelectValue placeholder="Content language" /></SelectTrigger>
                <SelectContent>{languageOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
              <Label className="flex items-center justify-between border rounded-md px-3 py-2">
                <span>Enable audio mode</span>
                <Switch checked={audioEnabled} onCheckedChange={setAudioEnabled} />
              </Label>

              <Label className="flex items-center justify-between border rounded-md px-3 py-2">
                <span>Auto-translate</span>
                <Switch checked={autoTranslateEnabled} onCheckedChange={setAutoTranslateEnabled} />
              </Label>
              <p className="md:col-span-2 text-sm text-muted-foreground">
                {translating
                  ? `Auto-translating content to ${languageOptions.find((item) => item.value === contentLanguage)?.label || contentLanguage}...`
                  : "Selected language ke liye content auto-adjust hoga."}
              </p>

              <div className="md:col-span-2 border rounded-md p-3 space-y-3">
                <p className="font-medium">Multi-language Workflow</p>
                <div className="flex flex-wrap gap-2">
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="w-[220px]"><SelectValue placeholder="Target language" /></SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={addWorkflowLanguage}>Add Workflow</Button>
                </div>
                {translationWorkflows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No target languages added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {translationWorkflows.map((item) => (
                      <div key={item.language} className="flex flex-wrap items-center gap-2 border rounded-md p-2">
                        <span className="text-sm min-w-[120px]">
                          {languageOptions.find((lang) => lang.value === item.language)?.label || item.language}
                        </span>
                        <Select value={item.status} onValueChange={(value) => updateWorkflowStatus(item.language, value as TranslationStatus)}>
                          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                          <SelectContent>
                            {translationStatuses.map((statusOption) => (
                              <SelectItem key={statusOption} value={statusOption}>{statusOption}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="ghost" onClick={() => removeWorkflowLanguage(item.language)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Collaboration</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Collaborator Clerk IDs (comma separated)"
                value={collaboratorClerkIds}
                onChange={(e) => setCollaboratorClerkIds(e.target.value)}
              />
              <Select value={collaboratorRole} onValueChange={setCollaboratorRole}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Collaborator role" /></SelectTrigger>
                <SelectContent>
                  {collaboratorRoleOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Publish ke baad post collaboration heartbeat start hoga. Post ID: {savedPostId || "not created yet"}
              </p>
              {!!savedPostId && (
                <div className="rounded-md border p-3">
                  <p className="font-medium">Active collaborators {collabSyncing ? "(syncing...)" : ""}</p>
                  {activeCollaborators.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-1">No active collaborators right now.</p>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {activeCollaborators.map((item) => (
                        <p key={item.clerkId} className="text-sm">
                          {item.name || item.clerkId} | {item.section || "content"} | {item.cursor || ""}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>AI Writing Coach</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {coachLoading ? (
                <p className="text-sm text-muted-foreground">Analyzing writing...</p>
              ) : !coach ? (
                <p className="text-sm text-muted-foreground">Start writing to get inline coaching suggestions.</p>
              ) : (
                <>
                  <p className="text-sm"><b>Readability:</b> {coach.readabilityScore}/100</p>
                  <p className="text-sm"><b>Tone:</b> {coach.tone}</p>
                  <div className="text-sm">
                    <b>Suggestions:</b>
                    {(coach.suggestions || []).length === 0 ? (
                      <p className="text-muted-foreground mt-1">No suggestions right now.</p>
                    ) : (
                      <div className="mt-1 space-y-1">
                        {coach.suggestions.map((item, index) => (
                          <p key={`${item}-${index}`}>- {item}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  {coach.improvedIntro && (
                    <div className="rounded-md border p-2 bg-secondary/30">
                      <p className="text-sm"><b>Suggested Intro:</b> {coach.improvedIntro}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>AI Summary</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {aiSummary || "AI Suggest pe click karo, yaha short summary show hogi."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Content Editor</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="tiptap-editor">
                <EditorContent editor={editor} />
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export default Write;
