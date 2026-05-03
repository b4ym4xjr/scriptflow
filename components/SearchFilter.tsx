"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "WRITING", label: "Writing" },
  { value: "REVIEW", label: "Review" },
  { value: "READY_TO_FILM", label: "Ready to Film" },
  { value: "FILMING", label: "Filming" },
  { value: "EDITING", label: "Editing" },
  { value: "READY_TO_PUBLISH", label: "Ready to Publish" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const TYPES = [
  { value: "TUTORIAL", label: "Tutorial" },
  { value: "REVIEW", label: "Review" },
  { value: "VLOG", label: "Vlog" },
  { value: "EDUCATIONAL", label: "Educational" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "OTHER", label: "Other" },
];

export function SearchFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const scriptType = searchParams.get("type") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [searchParams, pathname, router],
  );

  const hasFilters = q || status || scriptType;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative w-full sm:flex-1 sm:min-w-48 sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          aria-label="search scripts"
          placeholder="Search scripts..."
          defaultValue={q}
          onChange={(e) => updateParam("q", e.target.value)}
          className="pl-9 h-9 text-sm rounded-lg"
        />
      </div>

      <Select
        value={status}
        onValueChange={(v) => updateParam("status", v === "ALL" ? "" : v)}
      >
        <SelectTrigger className="h-9 text-sm rounded-lg flex-1 sm:flex-none sm:w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent className="p-2">
          <SelectItem value="ALL">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={scriptType}
        onValueChange={(v) => updateParam("type", v === "ALL" ? "" : v)}
      >
        <SelectTrigger className="h-9 text-sm rounded-lg flex-1 sm:flex-none sm:w-36">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent className="p-2">
          <SelectItem value="ALL">All types</SelectItem>
          {TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2 text-gray-500"
          onClick={() => startTransition(() => router.push(pathname))}
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
