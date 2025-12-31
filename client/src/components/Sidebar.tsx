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
  Trash2
} from "lucide-react";
import { useCollections, useCreateCollection, useDeleteCollection } from "@/hooks/use-collections";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/use-categories";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
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
        deleteCollection(onDelete);
        toast({ title: "Collection deleted" });
      } else if (deleteType === "category") {
        deleteCategory(onDelete);
        toast({ title: "Folder removed" });
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
    <Dialog open={open} onOpenChange={setOpen}>
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
            <Input 
              placeholder="System Path (e.g. /usr/share/fonts)" 
              value={path} 
              onChange={(e) => setPath(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground">
              Provide the absolute path to a directory containing font files.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Folder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
