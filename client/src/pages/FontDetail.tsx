import { useFont, useToggleFavorite } from "@/hooks/use-fonts";
import { Sidebar } from "@/components/Sidebar";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Heart, Download, Info, Type, Code, Share2, Plus, Globe, Settings, Database, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCollections, useAddFontToCollection } from "@/hooks/use-collections";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { type FontFace, type FontFile } from "@shared/schema";

type FontFaceWithFile = FontFace & { file: FontFile };

export default function FontDetail() {
  const [, params] = useRoute("/fonts/:family");
  const familyName = decodeURIComponent(params?.family || "");
  const { data: font, isLoading } = useFont(familyName);
  const { mutate: toggleFavorite } = useToggleFavorite();
  const { mutate: addToCollection } = useAddFontToCollection();
  const { data: collections } = useCollections();
  const { toast } = useToast();

  const [previewText, setPreviewText] = useState("A wizard's job is to vex chumps quickly in fog.");
  const [fontSize, setFontSize] = useState([64]);

  const handleToggleFavorite = () => {
    toggleFavorite({ targetType: "family", targetId: familyName }, {
      onSuccess: () => {
        toast({ title: "Updated favorites" });
      }
    });
  };

  const handleAddToCollection = (collectionId: string) => {
    addToCollection({ collectionId, targetType: "family", targetId: familyName }, {
      onSuccess: () => {
        toast({ title: "Added to collection" });
      }
    });
  };

  // Inject styles for all faces
  useEffect(() => {
    if (!font?.faces) return;
    
    const style = document.createElement('style');
    let css = '';
    
    font.faces.forEach((face: FontFaceWithFile) => {
      const url = `/fonts-static/${face.file.urlKey}/${face.file.filename}`;
      css += `
        @font-face {
          font-family: 'Font-${face.id}';
          src: url('${url}');
        }
      `;
    });
    
    style.innerHTML = css;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [font]);

  if (isLoading || !font) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative border-r border-border">
        {/* Detail Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold font-display">{font.family}</h1>
            <span className="px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">
              {font.faces.length} styles
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToggleFavorite}>
              <Heart className={cn("w-4 h-4 mr-2", font.isFavorite && "fill-current")} />
              {font.isFavorite ? "Favorited" : "Favorite"}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Collection
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {collections?.map(col => (
                  <DropdownMenuItem key={col.id} onClick={() => handleAddToCollection(col.id)}>
                    {col.name}
                  </DropdownMenuItem>
                ))}
                {(!collections || collections.length === 0) && (
                  <DropdownMenuItem disabled>No collections found</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
          <div className="max-w-4xl mx-auto p-8 space-y-12">
            {/* Interactive Preview Controls */}
            <div className="grid grid-cols-2 gap-8 items-end border-b border-border/50 pb-8">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Preview Text</label>
                <input 
                  type="text" 
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="bg-secondary/50 px-4 py-2 rounded-lg text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary border border-border"
                  placeholder="Type to preview..."
                />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    <label>Size</label>
                    <span>{fontSize}px</span>
                  </div>
                  <Slider 
                    value={fontSize} 
                    onValueChange={setFontSize} 
                    min={12} 
                    max={200} 
                    step={1}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-16 py-8">
              {font.faces.map((face: FontFaceWithFile) => (
                <div key={face.id} className="space-y-4 group">
                  <div className="flex items-center justify-between text-xs text-muted-foreground/60">
                    <span className="font-medium uppercase tracking-widest">{face.subfamily}</span>
                  </div>
                  <p 
                    style={{ 
                      fontFamily: `'Font-${face.id}', sans-serif`,
                      fontSize: `${fontSize}px`,
                      lineHeight: 1.2
                    }}
                    className="break-words outline-none text-foreground"
                    contentEditable
                    suppressContentEditableWarning
                  >
                    {previewText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Inspector */}
      <aside className="w-80 h-full flex flex-col bg-card border-l border-border shrink-0">
        <Tabs defaultValue="info" className="flex flex-col h-full">
          <div className="p-4 border-b border-border bg-card/50 backdrop-blur">
            <TabsList className="grid grid-cols-3 w-full bg-secondary/30">
              <TabsTrigger value="info" className="text-xs">
                <Info className="w-3.5 h-3.5 mr-1.5" />
                Info
              </TabsTrigger>
              <TabsTrigger value="download" className="text-xs">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Files
              </TabsTrigger>
              <TabsTrigger value="code" className="text-xs">
                <Code className="w-3.5 h-3.5 mr-1.5" />
                Code
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <TabsContent value="info" className="mt-0 space-y-8">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {font.family} is a professional typeface family designed for high-quality typography. This demo version includes multiple weights and styles for your projects.
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Metadata</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-secondary/20 p-3 rounded-lg border border-border/50">
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Family</span>
                    <span className="text-sm font-medium">{font.family}</span>
                  </div>
                  <div className="bg-secondary/20 p-3 rounded-lg border border-border/50">
                    <span className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Styles</span>
                    <span className="text-sm font-medium">{font.faces.length} total</span>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Category</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded text-xs font-medium">Sans Serif</span>
                  <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded text-xs font-medium">Variable</span>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="download" className="mt-0 space-y-4">
              <h3 className="text-sm font-semibold mb-4">Font Files</h3>
              <div className="space-y-2">
                {font.faces.map((face: FontFaceWithFile) => (
                  <div key={face.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/10 group hover:bg-secondary/20 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{face.subfamily}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">{face.file.ext} • {Math.round(face.file.sizeBytes / 1024)}KB</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={`/fonts-static/${face.file.urlKey}/${face.file.filename}`} download>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="code" className="mt-0 space-y-6">
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Web Integration</h4>
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-black text-[11px] font-mono text-muted-foreground overflow-x-auto border border-border">
                    {`@font-face {
  font-family: '${font.family}';
  src: url('/fonts/${font.faces[0]?.file.filename}') format('woff2');
  font-weight: normal;
  font-style: normal;
}`}
                  </pre>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground">
                    <Code className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">CSS Usage</h4>
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-black text-[11px] font-mono text-muted-foreground border border-border">
                    {`body {
  font-family: '${font.family}', sans-serif;
}`}
                  </pre>
                </div>
              </section>
            </TabsContent>
          </div>
          
          <div className="p-6 border-t border-border mt-auto flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Open Font License</span>
            </div>
            <Button className="w-full h-11" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download Family
            </Button>
          </div>
        </Tabs>
      </aside>
    </div>
  );
}
