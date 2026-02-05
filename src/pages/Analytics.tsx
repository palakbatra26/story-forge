import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type Totals = { views: number; likes: number; comments: number };
type TopPost = { id: string; title: string; views: number; likes: number; comments: number };
type TopTag = { tag: string; count: number };
type Engagement = { label: string; views: number; likes: number; comments: number };

type AnalyticsResponse = {
  totals: Totals;
  topPosts: TopPost[];
  topTags: TopTag[];
  engagement: Engagement[];
};

const Analytics = () => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const authorId = import.meta.env.VITE_ANALYTICS_AUTHOR_ID;
        const response = await fetch(`${baseUrl}/api/analytics/author/${authorId}`);
        const payload = await response.json();
        setData(payload);
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Analytics Dashboard</p>
              <h1 className="heading-title mt-1">Author Insights</h1>
            </div>
            <Button variant="outline">Export report</Button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading analytics...
            </div>
          )}

          {data && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="card-editorial">
                  <CardHeader>
                    <CardTitle>Total Views</CardTitle>
                    <CardDescription>Lifetime post views</CardDescription>
                  </CardHeader>
                  <CardContent className="text-3xl font-semibold">{data.totals.views}</CardContent>
                </Card>
                <Card className="card-editorial">
                  <CardHeader>
                    <CardTitle>Total Likes</CardTitle>
                    <CardDescription>Across all posts</CardDescription>
                  </CardHeader>
                  <CardContent className="text-3xl font-semibold">{data.totals.likes}</CardContent>
                </Card>
                <Card className="card-editorial">
                  <CardHeader>
                    <CardTitle>Total Comments</CardTitle>
                    <CardDescription>Community engagement</CardDescription>
                  </CardHeader>
                  <CardContent className="text-3xl font-semibold">{data.totals.comments}</CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <Card className="card-editorial">
                  <CardHeader>
                    <CardTitle>Top posts</CardTitle>
                    <CardDescription>Highest performing content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.topPosts.map((post) => (
                      <div key={post.id} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-sm">{post.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {post.views} views · {post.likes} likes · {post.comments} comments
                          </p>
                        </div>
                        <Badge variant="secondary">Top</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="card-editorial">
                  <CardHeader>
                    <CardTitle>Top tags</CardTitle>
                    <CardDescription>Trending across your posts</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {data.topTags.map((tag) => (
                      <Badge key={tag.tag} variant="outline">
                        {tag.tag} ({tag.count})
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="card-editorial">
                <CardHeader>
                  <CardTitle>Engagement over time</CardTitle>
                  <CardDescription>Weekly activity snapshot</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                  {data.engagement.map((point) => (
                    <div key={point.label} className="rounded-lg border border-border/60 p-4">
                      <p className="text-xs text-muted-foreground">{point.label}</p>
                      <p className="text-lg font-semibold">{point.views} views</p>
                      <p className="text-sm text-muted-foreground">
                        {point.likes} likes · {point.comments} comments
                      </p>
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

export default Analytics;