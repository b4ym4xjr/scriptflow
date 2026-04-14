"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteScript } from "@/actions/scripts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteScriptButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteScript(taskId);
      if (result.success) {
        toast.success("Script deleted successfully");
        setOpen(false);
        router.push("/");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete script");
      }
    } catch (error) {
      console.error("Error deleting script: ", error);
      toast.error("An error occurred while deleting the script");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
        >
          <Trash2 className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Script</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this script? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2 w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
