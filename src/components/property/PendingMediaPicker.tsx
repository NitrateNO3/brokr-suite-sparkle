import { useEffect, useMemo, useRef, useState } from "react";
import { Star, Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NativeMediaSourceButtons } from "@/components/property/NativeMediaSourceButtons";
import { cn } from "@/lib/utils";

/** Stages images locally (before the listing exists) so they can be uploaded on create. */
export function PendingMediaPicker({
  files,
  onChange,
  coverIndex,
  onCoverIndexChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  coverIndex: number;
  onCoverIndexChange: (index: number) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const add = (list: FileList | null) => {
    if (!list?.length) return;
    onChange([...files, ...Array.from(list)]);
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...files];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    onChange(next);
    if (coverIndex === from) onCoverIndexChange(to);
  };

  const remove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
    if (coverIndex === index) onCoverIndexChange(0);
    else if (coverIndex > index) onCoverIndexChange(coverIndex - 1);
  };

  return (
    <div className="space-y-4">
      <NativeMediaSourceButtons onFiles={(picked) => onChange([...files, ...picked])} />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          add(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        )}
      >
        <UploadCloud className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">Drag &amp; drop images, videos or PDFs</p>
        <p className="text-xs text-muted-foreground">
          They upload automatically as soon as you create the listing · drag tiles to reorder
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) reorder(dragIndex, index);
                setDragIndex(null);
              }}
              className="group relative cursor-grab overflow-hidden rounded-xl border border-border active:cursor-grabbing"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={previews[index]}
                  alt={file.name}
                  className="aspect-4/3 w-full object-cover"
                />
              ) : (
                <div className="flex aspect-4/3 w-full items-center justify-center bg-muted px-2 text-center text-xs text-muted-foreground">
                  {file.name}
                </div>
              )}
              {index === coverIndex && (
                <span className="absolute left-2 top-2 rounded-full bg-brass px-2 py-0.5 text-[10px] font-semibold text-brass-foreground">
                  Cover
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-foreground/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7"
                  onClick={() => onCoverIndexChange(index)}
                  aria-label="Set cover"
                >
                  <Star className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => remove(index)}
                  aria-label="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
