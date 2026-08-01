"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ProjectRow } from "@/types/database";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import {
  FolderPlus,
  Folder,
  MoreHorizontal,
  Pencil,
  Palette,
  Trash2,
  Check,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Color presets
//
// NOT design tokens. These are the swatches a user picks from, and the chosen
// value is persisted to projects.color in Postgres — so it has to be a literal
// colour, the same way a QR foreground colour does. A `var(--chart-1)` in a
// database column would resolve to nothing the moment it left the browser.
// The render-time fallback below is styling and does use a token.
// ---------------------------------------------------------------------------

const COLOR_PRESETS = [
  { value: "#7C5CFF", label: "Purple" },
  { value: "#FF6B6B", label: "Red" },
  { value: "#4ECDC4", label: "Teal" },
  { value: "#FFD93D", label: "Yellow" },
  { value: "#6BCB77", label: "Green" },
  { value: "#4D96FF", label: "Blue" },
  { value: "#FF8C42", label: "Orange" },
  { value: "#C4B5FD", label: "Lavender" },
] as const;

// ---------------------------------------------------------------------------
// useProjects hook — shared project state
// ---------------------------------------------------------------------------

/**
 * Shared in-flight request.
 *
 * The app shell renders the sidebar twice on mobile — the desktop aside is
 * hidden with CSS but still mounted, and the sheet adds its own copy while
 * open — so two components would otherwise ask for the same list at the same
 * moment. Only concurrent calls are shared; once a request settles the next
 * one goes to the network, which keeps refetch-after-mutation honest.
 */
let projectsInFlight: Promise<ProjectRow[]> | null = null;

async function loadProjects(): Promise<ProjectRow[]> {
  if (projectsInFlight) return projectsInFlight;

  projectsInFlight = (async () => {
    const res = await fetch("/api/v1/projects");
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return (json.data ?? []) as ProjectRow[];
  })();

  try {
    return await projectsInFlight;
  } finally {
    projectsInFlight = null;
  }
}

export function useProjects() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      setProjects(await loadProjects());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load projects";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (payload: {
    name: string;
    color?: string;
    icon?: string;
  }): Promise<ProjectRow | null> => {
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error.message);
      }
      const created = json.data as ProjectRow;
      setProjects((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Project created");
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      toast.error(message);
      return null;
    }
  };

  const updateProject = async (
    id: string,
    payload: { name?: string; color?: string | null; icon?: string | null },
  ): Promise<ProjectRow | null> => {
    try {
      const res = await fetch(`/api/v1/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error.message);
      }
      const updated = json.data as ProjectRow;
      setProjects((prev) =>
        prev
          .map((p) => (p.id === id ? updated : p))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      toast.success("Project updated");
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update project";
      toast.error(message);
      return null;
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/v1/projects/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error.message);
      }
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete project";
      toast.error(message);
      return false;
    }
  };

  return {
    projects,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}

// ---------------------------------------------------------------------------
// ProjectSidebar component
// ---------------------------------------------------------------------------

interface ProjectSidebarProps {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
}

export function ProjectSidebar({
  selectedProjectId,
  onSelectProject,
}: ProjectSidebarProps) {
  const {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "rename">("create");
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
  const [dialogName, setDialogName] = useState("");
  const [dialogColor, setDialogColor] = useState<string>(COLOR_PRESETS[0].value);
  const [submitting, setSubmitting] = useState(false);

  // Color picker dialog (separate from create/rename)
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [colorProject, setColorProject] = useState<ProjectRow | null>(null);
  const [pickedColor, setPickedColor] = useState<string>(COLOR_PRESETS[0].value);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<ProjectRow | null>(null);

  // -- handlers --

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingProject(null);
    setDialogName("");
    setDialogColor(COLOR_PRESETS[0].value);
    setDialogOpen(true);
  };

  const openRenameDialog = (project: ProjectRow) => {
    setDialogMode("rename");
    setEditingProject(project);
    setDialogName(project.name);
    setDialogColor(project.color ?? COLOR_PRESETS[0].value);
    setDialogOpen(true);
  };

  const openColorDialog = (project: ProjectRow) => {
    setColorProject(project);
    setPickedColor(project.color ?? COLOR_PRESETS[0].value);
    setColorDialogOpen(true);
  };

  const openDeleteDialog = (project: ProjectRow) => {
    setDeletingProject(project);
    setDeleteDialogOpen(true);
  };

  const handleSubmitDialog = async () => {
    if (!dialogName.trim()) return;
    setSubmitting(true);

    if (dialogMode === "create") {
      const created = await createProject({
        name: dialogName.trim(),
        color: dialogColor,
      });
      if (created) {
        onSelectProject(created.id);
      }
    } else if (editingProject) {
      await updateProject(editingProject.id, {
        name: dialogName.trim(),
        color: dialogColor,
      });
    }

    setSubmitting(false);
    setDialogOpen(false);
  };

  const handleColorSubmit = async () => {
    if (!colorProject) return;
    setSubmitting(true);
    await updateProject(colorProject.id, { color: pickedColor });
    setSubmitting(false);
    setColorDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    setSubmitting(true);
    const success = await deleteProject(deletingProject.id);
    if (success && selectedProjectId === deletingProject.id) {
      onSelectProject(null);
    }
    setSubmitting(false);
    setDeleteDialogOpen(false);
  };

  // -- render --

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Projects
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={openCreateDialog}
          title="Create project"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* All QR Codes option */}
      <button
        type="button"
        onClick={() => onSelectProject(null)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          selectedProjectId === null
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <Folder className="h-4 w-4" />
        All QR Codes
      </button>

      {/* Loading state */}
      {loading && (
        <div className="space-y-1 px-3">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-3/4 rounded-lg" />
        </div>
      )}

      {/* Project list */}
      {!loading &&
        projects.map((project) => (
          <div key={project.id} className="group relative flex items-center">
            <button
              type="button"
              onClick={() => onSelectProject(project.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                selectedProjectId === project.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: project.color ?? "var(--chart-1)" }}
              />
              <span className="truncate">{project.name}</span>
            </button>

            {/* Context menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">Project actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => openRenameDialog(project)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openColorDialog(project)}>
                  <Palette className="mr-2 h-3.5 w-3.5" />
                  Change Color
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openDeleteDialog(project)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          No projects yet. Create one to organize your QR codes.
        </p>
      )}

      {/* Create / Rename dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Create Project" : "Rename Project"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "Create a new project to organize your QR codes."
                : "Update the project name and color."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="project-name"
                value={dialogName}
                onChange={(e) => setDialogName(e.target.value)}
                placeholder="My Project"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && dialogName.trim()) {
                    handleSubmitDialog();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    onClick={() => setDialogColor(preset.value)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110",
                      dialogColor === preset.value && "ring-2 ring-offset-2 ring-offset-background",
                    )}
                    style={{
                      backgroundColor: preset.value,
                      ...(dialogColor === preset.value
                        ? { ringColor: preset.value }
                        : {}),
                    }}
                  >
                    {dialogColor === preset.value && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDialog}
              disabled={!dialogName.trim() || submitting}
            >
              {submitting
                ? "Saving..."
                : dialogMode === "create"
                  ? "Create"
                  : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Color picker dialog */}
      <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Color</DialogTitle>
            <DialogDescription>
              Pick a new color for &ldquo;{colorProject?.name}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 py-4">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                title={preset.label}
                onClick={() => setPickedColor(preset.value)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110",
                  pickedColor === preset.value && "ring-2 ring-offset-2 ring-offset-background",
                )}
                style={{ backgroundColor: preset.value }}
              >
                {pickedColor === preset.value && (
                  <Check className="h-4 w-4 text-white" />
                )}
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setColorDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleColorSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deletingProject?.name}&rdquo;?
              QR codes in this project will not be deleted, but they will be
              unlinked from the project.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
