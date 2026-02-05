import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type Report = {
  _id: string;
  reason: string;
  status: string;
  reporter?: { name: string; email: string };
  post?: { title: string };
};

type AuditLog = {
  _id: string;
  action: string;
  entity: string;
  actor?: { name: string };
  createdAt: string;
};

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const [usersRes, reportsRes, logsRes] = await Promise.all([
          fetch(`${baseUrl}/api/admin/users`),
          fetch(`${baseUrl}/api/admin/reports`),
          fetch(`${baseUrl}/api/admin/audit-logs`),
        ]);

        setUsers(await usersRes.json());
        setReports(await reportsRes.json());
        setAuditLogs(await logsRes.json());
      } catch (error) {
        console.error("Failed to load admin data", error);
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
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="card-editorial">
              <CardHeader>
                <CardTitle>Reported content</CardTitle>
                <CardDescription>Moderation queue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reports.map((report) => (
                  <div key={report._id} className="rounded-md border border-border/60 p-3">
                    <p className="text-sm font-medium">{report.post?.title ?? "Unknown post"}</p>
                    <p className="text-xs text-muted-foreground">{report.reason}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant="outline">{report.status}</Badge>
                      <Button variant="ghost" size="sm">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
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
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;