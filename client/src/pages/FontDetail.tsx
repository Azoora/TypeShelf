import { useFont } from "@/hooks/use-fonts";
import { Sidebar } from "@/components/Sidebar";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Heart, Download, Info, Type, Code, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToggleFavorite } from "@/hooks/use-fonts";
import { useToast } from "@/hooks/use-toast";

export default function FontDetail() {
  const [, params] = useRoute("/fonts/:family");
  const familyName = decodeURIComponent(params?.family || "");
  const { data: font, isLoading } = useFont(familyName);
  const { mutate: toggleFavorite } = useToggleFavorite();
  const { toast } = useToast();

  const [previewText, setPreviewText] = useState("The quick brown fox jumps over the lazy dog.");
  const [fontSize, setFontSize] = useState([64]);

  const handleToggleFavorite = () => {
    toggleFavorite({ targetType: "family", targetId: familyName }, {
      onSuccess: (data) => {
        toast({ title: data.isFavorite ? "Added to favorites" : "Removed from favorites" });
      }
    });
  };

  // Inject styles for all faces
  useEffect(() => {
    if (!font?.faces) return;
    
    const style = document.createElement('style');
    let css = '';
    
    font.faces.forEach(face => {
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
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
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
              <Heart className="w-4 h-4 mr-2" />
              Favorite
            </Button>
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download Family
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto p-8 space-y-12">
            
            {/* Interactive Preview */}
            <section className="space-y-6">
              <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur py-4 z-10 border-b border-border/50">
                <input 
                  type="text" 
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="bg-transparent text-2xl font-medium w-full focus:outline-none placeholder:text-muted-foreground/30"
                  placeholder="Type to preview..."
                />
                <div className="flex items-center gap-4 w-64 ml-8">
                  <Type className="w-4 h-4 text-muted-foreground" />
                  <Slider 
                    value={fontSize} 
                    onValueChange={setFontSize} 
                    min={12} 
                    max={200} 
                    step={1}
                  />
                  <span className="text-sm font-mono w-12 text-right">{fontSize}px</span>
                </div>
              </div>

              <div className="space-y-12">
                {font.faces.map(face => (
                  <div key={face.id} className="space-y-2 group">
                    <div className="flex items-center justify-between text-sm text-muted-foreground border-b border-border/30 pb-2 mb-4">
                      <span>{face.subfamily}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono">
                        {face.file.ext.toUpperCase()} • {Math.round(face.file.sizeBytes / 1024)}KB
                      </span>
                    </div>
                    <p 
                      style={{ 
                        fontFamily: `'Font-${face.id}', sans-serif`,
                        fontSize: `${fontSize}px`,
                        lineHeight: 1.2
                      }}
                      className="break-words outline-none"
                      contentEditable
                      suppressContentEditableWarning
                    >
                      {previewText}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Info Tabs */}
            <section className="pt-12 border-t border-border">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="bg-secondary/50 p-1">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="glyphs">Glyphs</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="p-6 bg-card rounded-xl mt-4 border border-border">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground uppercase mb-4">File Details</h3>
                      <dl className="space-y-2 text-sm">
                        {font.faces.map(face => (
                          <div key={face.id} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                            <span>{face.subfamily}</span>
                            <span className="font-mono text-muted-foreground">{face.file.filename}</span>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground uppercase mb-4">Collections</h3>
                      <div className="flex flex-wrap gap-2">
                        {font.collections.length > 0 ? (
                          font.collections.map(colId => (
                            <span key={colId} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                              Collection {colId.slice(0, 4)}
                            </span>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-sm">Not in any collections</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="glyphs" className="p-6 bg-card rounded-xl mt-4 border border-border">
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-4">
                    {Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i)).map(char => (
                      <div key={char} className="aspect-square flex items-center justify-center bg-background rounded border border-border/50 hover:bg-primary/10 hover:border-primary/50 transition-colors">
                        <span style={{ fontFamily: `'Font-${font.faces[0].id}'` }} className="text-2xl">
                          {char}
                        </span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="code" className="p-6 bg-card rounded-xl mt-4 border border-border">
                  <pre className="font-mono text-sm text-muted-foreground bg-background p-4 rounded-lg overflow-x-auto">
                    {`@font-face {
  font-family: '${font.family}';
  src: url('/path/to/${font.faces[0].file.filename}') format('${font.faces[0].file.ext === 'ttf' ? 'truetype' : 'opentype'}');
  font-weight: ${font.faces[0].weight || 400};
  font-style: ${font.faces[0].italic ? 'italic' : 'normal'};
}`}
                  </pre>
                </TabsContent>
              </Tabs>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
