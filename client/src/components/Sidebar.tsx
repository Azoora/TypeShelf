import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Type, 
  Heart, 
  LayoutGrid, 
  FolderOpen, 
  Plus, 
  Settings as SettingsIcon,
  Library,
  Trash2,
  ChevronRight,
  ArrowUp,
  Folder
} from "lucide-react";
import { useCollections, useCreateCollection, useDeleteCollection } from "@/hooks/use-collections";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/use-categories";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export function Sidebar() {
  const [location] = useLocation();
  const { data: collections } = useCollections();
  const { data: categories } = useCategories();

  return (
    <aside className="w-64 h-screen border-r border-border bg-card flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
      <div className="p-6">
        <h1 className="text-2xl font-bold font-display tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          TypeShelf
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-8">
        {/* Main Links */}
        <div className="space-y-1">
          <NavItem href="/" icon={<Type />} label="All Fonts" active={location === "/"} />
          <NavItem href="/favorites" icon={<Heart />} label="Favorites" active={location === "/favorites"} />
      </div>

      {/* Collections */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collections</h3>
          <CreateCollectionDialog />
        </div>
        <div className="space-y-0.5">
          {collections?.map((col) => (
            <NavItem 
              key={col.id}
              href={`/collections/${col.id}`}
              icon={<LayoutGrid className="w-4 h-4" />}
              label={col.name}
              active={location === `/collections/${col.id}`}
              count={col.count}
              onDelete={col.id}
              deleteType="collection"
            />
          ))}
          {(!collections || collections.length === 0) && (
            <p className="text-xs text-muted-foreground px-3 py-2 italic">No collections yet</p>
          )}
        </div>
      </div>

        {/* Categories (Folders) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</h3>
            <CreateCategoryDialog />
          </div>
          <div className="space-y-0.5">
            {categories?.map((cat) => (
              <NavItem
                key={cat.id}
                href={`/categories/${cat.id}`}
                icon={<FolderOpen className="w-4 h-4" />}
                label={cat.name}
                active={location === `/categories/${cat.id}`}
                onDelete={cat.id}
                deleteType="category"
              />
            ))}
            {(!categories || categories.length === 0) && (
               <p className="text-xs text-muted-foreground px-3 py-2 italic">No folders linked</p>
            )}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <NavItem href="/settings" icon={<SettingsIcon />} label="Settings" active={location === "/settings"} />
      </div>
    </aside>
  );
}

function NavItem({ 
  href, 
  icon, 
  label, 
  active, 
  count,
  onDelete,
  deleteType
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  count?: number;
  onDelete?: string;
  deleteType?: "collection" | "category";
}) {
  const { mutate: deleteCollection } = useDeleteCollection();
  const { mutate: deleteCategory } = useDeleteCategory();
  const { toast } = useToast();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onDelete) return;

    if (confirm("Are you sure you want to delete this?")) {
      if (deleteType === "collection") {
        deleteCollection(onDelete, {
          onSuccess: () => {
            toast({ title: "Collection deleted" });
          }
        });
      } else if (deleteType === "category") {
        deleteCategory(onDelete, {
          onSuccess: () => {
            toast({ title: "Folder removed" });
          }
        });
      }
    }
  };

  return (
    <div className="group relative flex items-center">
      <Link href={href} className={cn(
        "flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 pr-10",
        active 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}>
        {/* Clone icon with current color class */}
        <div className={cn("w-5 h-5 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>
          {icon}
        </div>
        <span className="truncate flex-1">{label}</span>
        {count !== undefined && (
          <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded text-muted-foreground ml-auto">{count}</span>
        )}
      </Link>
      
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:text-destructive transition-all z-10 bg-card rounded-md shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function CreateCollectionDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { mutate, isPending } = useCreateCollection();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    mutate({ name, description: "", color: "" }, {
      onSuccess: () => {
        setOpen(false);
        setName("");
        toast({ title: "Collection created" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-muted-foreground hover:text-primary transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input 
            placeholder="Collection Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            autoFocus
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const { mutate, isPending } = useCreateCategory();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !path.trim()) return;
    
    mutate({ name, path, status: "ok" }, {
      onSuccess: () => {
        setOpen(false);
        setName("");
        setPath("");
        toast({ title: "Folder added" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <button className="text-muted-foreground hover:text-primary transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Font Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Input 
              placeholder="Folder Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
            <DirectoryPicker value={path} onChange={setPath} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !path.trim()}>
              {isPending ? "Adding..." : "Add Folder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DirectoryPicker({ value, onChange }: { value: string; onChange: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const defaultHome = "/home/umbrel/umbrel/home";
  const [browsePath, setBrowsePath] = useState(value || defaultHome);
  const [entries, setEntries] = useState<{ name: string; path: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDir = useCallback(async (dirPath: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/browse?path=${encodeURIComponent(dirPath)}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Failed to browse");
      }
      const data = await res.json();
      setEntries(data.entries);
      setBrowsePath(data.currentPath);
    } catch (e: any) {
      setError(e.message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchDir(value || defaultHome);
    }
  };

  const handleSelect = (dirPath: string) => {
    onChange(dirPath);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <div className="flex items-center gap-1 h-10 px-3 rounded-lg border border-input bg-transparent text-sm text-muted-foreground truncate">
            {value ? (
              <>
                <Folder className="w-4 h-4 shrink-0 mr-1" />
                <span className="truncate">{value}</span>
              </>
            ) : (
              <span className="text-muted-foreground/60">No folder selected</span>
            )}
          </div>
        </div>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="shrink-0 h-10">
            Browse
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
            <Folder className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{browsePath}</span>
          </div>
        </div>
        {error && (
          <div className="px-3 py-2 text-xs text-destructive">{error}</div>
        )}
        <ScrollArea className="h-64">
          <div className="p-1">
            {browsePath !== "/" && (
              <button
                type="button"
                onClick={() => fetchDir(browsePath.replace(/\/[^/]+$/, "") || "/")}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-secondary transition-colors text-muted-foreground"
              >
                <ArrowUp className="w-4 h-4" />
                <span>..</span>
              </button>
            )}
            {loading ? (
              <div className="px-2 py-4 text-xs text-muted-foreground text-center">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="px-2 py-4 text-xs text-muted-foreground text-center">Empty directory</div>
            ) : (
              entries.map((entry) => (
                <button
                  key={entry.path}
                  type="button"
                  onClick={() => fetchDir(entry.path)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-secondary transition-colors"
                >
                  <Folder className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1 text-left">{entry.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="p-2 border-t border-border flex justify-between items-center">
          <span className="text-xs text-muted-foreground truncate max-w-[180px]">{browsePath}</span>
          <Button
            type="button"
            size="sm"
            onClick={() => handleSelect(browsePath)}
          >
            Select
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
