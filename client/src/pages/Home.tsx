import { Sidebar } from "@/components/Sidebar";
import { FontCard } from "@/components/FontCard";
import { useFonts, useRescanFonts } from "@/hooks/use-fonts";
import { useCollections } from "@/hooks/use-collections";
import { Search, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export default function Home() {
  const [search, setSearch] = useState("");
  const [previewText, setPreviewText] = useState("The quick brown fox jumps over the lazy dog");
  const [location] = useLocation();
  const [previewSize, setPreviewSize] = useState(32);
  
  // Parse filters from location or props could be better, but simple logic for now
  // / -> all
  // /favorites -> favorites=true
  // /categories/:id -> categoryId=id
  // /collections/:id -> collectionId=id
  
  const isFavorites = location === "/favorites";
  const categoryMatch = location.match(/\/categories\/([^\/]+)/);
  const collectionMatch = location.match(/\/collections\/([^\/]+)/);
  
  const filters = {
    q: search,
    favorites: isFavorites ? "true" : undefined,
    categoryId: categoryMatch ? categoryMatch[1] : undefined,
    collectionId: collectionMatch ? collectionMatch[1] : undefined,
  };

  const { data, isLoading } = useFonts(filters);
  const { mutate: rescan, isPending: isRescanPending } = useRescanFonts();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl px-8 flex items-center justify-between shrink-0 z-20">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              className="pl-10 bg-secondary/50 border-transparent focus:bg-background transition-all" 
              placeholder="Search fonts..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <Input 
                 value={previewText}
                 onChange={(e) => setPreviewText(e.target.value)}
                 className="w-64 h-9 bg-transparent border-border hover:border-primary/50 focus:border-primary transition-colors text-sm"
                 placeholder="Type something to preview..."
               />
            </div>

            <Button 
              variant="outline" 
              size="icon"
              onClick={() => rescan()}
              disabled={isRescanPending}
              className="relative"
            >
              <RefreshCw className={`w-4 h-4 ${isRescanPending ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[280px] rounded-2xl bg-card animate-pulse border border-border/50" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-xl font-medium text-foreground">
                  {isFavorites ? "Favorites" : 
                   categoryMatch ? "Folder Fonts" : 
                   collectionMatch ? "Collection" : "All Fonts"}
                  <span className="ml-3 text-sm text-muted-foreground font-normal">
                    {data?.total || 0} families found
                  </span>
                </h2>
              </div>
              
              {data?.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No fonts found</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    Try adjusting your search or add some font folders in the sidebar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                  {data?.items.map((item) => (
                    <FontCard 
                      key={item.family}
                      family={item.family}
                      faces={item.faces}
                      previewText={previewText}
                      // In a real app we'd need to check favorite status from a proper user object or enhanced API response
                      // For now, assume if we are in Favorites view, they are favorites. 
                      // Or rely on a separate favorites list query if we want global state.
                      // Let's rely on the card logic or pass it if available.
                      // The API response for `list` doesn't currently return `isFavorite` flag on the item directly unless we modify backend.
                      // Assuming the backend has been updated or we will fetch it.
                      // Actually, let's just assume false for now unless we are in favorites view
                      isFavorite={isFavorites} 
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
