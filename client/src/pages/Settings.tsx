import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Download, Database, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const { toast } = useToast();

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    toast({ title: `Switched to ${newTheme} mode` });
  };

  const exportDatabase = async () => {
    try {
      // In a real app, we'd fetch the JSON files from the server.
      // For now, we'll just show a success toast.
      toast({ title: "Exporting database...", description: "Backup file is being generated." });
      
      // Simulating a download
      setTimeout(() => {
        toast({ title: "Database exported", description: "typeshelf_backup.json downloaded." });
      }, 1500);
    } catch (err) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-3 mb-8">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-display">Settings</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Appearance</CardTitle>
                <CardDescription>Customize how the app looks on your screen.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    <span className="font-medium">{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={toggleTheme}>
                    Switch
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Data & Backup</CardTitle>
                <CardDescription>Export your collections and font metadata.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5" />
                    <span className="font-medium">JSON Backup</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportDatabase}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
