import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileClock,
  Link as LinkIcon,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

type WorkflowStatus = "Draft" | "Submitted" | "Under Review" | "Approved" | "Published" | "Archived";

const workflowSteps: WorkflowStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Approved",
  "Published",
  "Archived",
];

const editorExtensions = [
  StarterKit,
  Placeholder.configure({ placeholder: "Start writing your story..." }),
  Link.configure({ openOnClick: false }),
  Image,
];

const categories = ["AI/ML", "Cyber", "Web", "Mobile", "Data", "Cloud", "DevOps"];

const Write = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [title, setTitle] = useState("Designing a writing workflow that scales");
  const [subtitle, setSubtitle] = useState("From draft to archive with an editorial pipeline.");
  const [status, setStatus] = useState<WorkflowStatus>("Published");
  const [category, setCategory] = useState(categories[0]);
  const [tags, setTags] = useState("editorial, workflow");
  const [bloggerName, setBloggerName] = useState("");
  const [timeline, setTimeline] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageData, setCoverImageData] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [autosaveStatus, setAutosaveStatus] = useState("Last saved just now");
  const [scheduledAt, setScheduledAt] = useState("2026-02-14T10:30");
  const [featuredImage, setFeaturedImage] = useState("/placeholder.svg");
  const [gallery, setGallery] = useState([
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
  ]);
  const [metaTitle, setMetaTitle] = useState("Writing Workflow | BlogHub");
  const [metaDescription, setMetaDescription] = useState(
    "Track drafts, approvals, and publishing schedules with rich editorial tooling.",
  );
  const [slug, setSlug] = useState("writing-workflow" );
  const [canonicalUrl, setCanonicalUrl] = useState("https://bloghub.com/writing-workflow");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());
  const [wordCount, setWordCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastPostId, setLastPostId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setBloggerName(user.fullName || user.username || "");
    }
  }, [user]);

  const editor = useEditor({
    extensions: editorExtensions,
    content: `
      <h2>Structure the editorial flow</h2>
      <p>Capture every stage of your blog lifecycle—from draft to archive—so writers and editors are always aligned.</p>
      <ul>
        <li>Use a clear status workflow to track progress.</li>
        <li>Schedule publishing windows and manage approvals.</li>
        <li>Store version history for edits and revisions.</li>
      </ul>
    `,
  });

  useEffect(() => {
    if (!editor) return;

    const handler = () => {
      const words = editor.getText().trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);
      setAutosaveStatus("Saving changes...");
      setTimeout(() => {
        setAutosaveStatus("All changes saved");
        setLastSavedAt(new Date());
      }, 500);
    };

    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor]);

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  const handleSave = async () => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to publish your story.");
      return;
    }

    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    if (!bloggerName.trim()) {
      toast.error("Blogger name is required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          name: user.fullName || user.username || "Unknown",
          email: user.primaryEmailAddress?.emailAddress || "",
          title,
          status: "Published",
          category,
          tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          timeline,
          description,
          coverImageUrl,
          coverImageData,
          content: editor?.getHTML() || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save post");
      }

      const data = await response.json();
      setLastPostId(data.id);
      toast.success("Post uploaded successfully!");
    } catch (error) {
      toast.error("Unable to save post. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!lastPostId) {
      toast.error("Upload the blog first before sharing.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/posts/${lastPostId}/share`,
        { method: "POST" }
      );
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
      <main className="flex-1 bg-background">
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Blog Writing & Publishing Workflow
                  </p>
                  <h1 className="heading-title mt-1">Write & Publish</h1>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button className="gap-2" onClick={handleSave} disabled={!isSignedIn || saving}>
                    <CheckCircle2 className="h-4 w-4" />
                    {saving ? "Uploading..." : "Upload Blog"}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={!isSignedIn || !lastPostId}
                    onClick={handleShare}
                  >
                    <Send className="h-4 w-4" />
                    Share Blog
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1">
                  <Clock className="h-4 w-4" />
                  {autosaveStatus}
                </span>
                {lastSavedAt && (
                  <span>Last saved {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                )}
                <span className="inline-flex items-center gap-2">
                  <FileClock className="h-4 w-4" />
                  {readingTime} min read · {wordCount} words
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="flex flex-col gap-6">
                <Card className="card-editorial">
                  <CardHeader>
                    <CardTitle>Story details</CardTitle>
                    <CardDescription>Capture the essentials before moving into the editor.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <Input
                        id="subtitle"
                        value={subtitle}
                        onChange={(event) => setSubtitle(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as WorkflowStatus)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {workflowSteps.map((step) => (
                              <SelectItem key={step} value={step}>
                                {step}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="blogger">Blogger name</Label>
                        <Input
                          id="blogger"
                          value={bloggerName}
                          onChange={(event) => setBloggerName(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timeline">Timeline</Label>
                        <Input
                          id="timeline"
                          placeholder="e.g. 10 min read · Feb 14, 2026"
                          value={timeline}
                          onChange={(event) => setTimeline(event.target.value)}
                        />
                      </div>
                    </div>
                    <Card className="card-editorial">
                      <CardHeader>
                        <CardTitle>Blog description</CardTitle>
                        <CardDescription>Write the main content of your blog here.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => editor?.chain().focus().toggleBold().run()}
                          >
                            Bold
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => editor?.chain().focus().toggleItalic().run()}
                          >
                            Italic
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => editor?.chain().focus().toggleBulletList().run()}
                          >
                            Bullet List
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                          >
                            Ordered List
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => editor?.chain().focus().setParagraph().run()}
                          >
                            Paragraph
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                          >
                            H2
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                          >
                            H3
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                          >
                            Divider
                          </Button>
                        </div>
                        <div className="tiptap-editor">
                          <EditorContent editor={editor} />
                        </div>
                      </CardContent>
                    </Card>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma separated)</Label>
                      <Input
                        id="tags"
                        value={tags}
                        onChange={(event) => setTags(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverUrl">Blog photo URL (optional)</Label>
                      <Input
                        id="coverUrl"
                        placeholder="https://..."
                        value={coverImageUrl}
                        onChange={(event) => {
                          const url = event.target.value;
                          setCoverImageUrl(url);
                          setCoverPreview(url);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverUpload">Upload blog photo (optional)</Label>
                      <Input
                        id="coverUpload"
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const result = reader.result?.toString() || "";
                            setCoverImageData(result);
                            setCoverPreview(result);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>
                    {coverPreview && (
                      <div className="space-y-2">
                        <Label>Photo preview</Label>
                        <img
                          src={coverPreview}
                          alt="Blog preview"
                          className="h-40 w-full rounded-md object-cover border"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Write;