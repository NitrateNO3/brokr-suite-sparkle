import { useEffect, useRef } from "react";
import { Bold, Italic, Heading2, List, Link2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Minimal dependency-free rich text editor built on contentEditable.
 * Supports headings, bold, italic, bullet lists, links and images.
 */
export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML ?? "");
    ref.current?.focus();
  };

  const tools = [
    { icon: Heading2, label: "Heading", run: () => exec("formatBlock", "<h3>") },
    { icon: Bold, label: "Bold", run: () => exec("bold") },
    { icon: Italic, label: "Italic", run: () => exec("italic") },
    { icon: List, label: "Bullet list", run: () => exec("insertUnorderedList") },
    {
      icon: Link2,
      label: "Link",
      run: () => {
        const url = window.prompt("Link URL");
        if (url) exec("createLink", url);
      },
    },
    {
      icon: ImageIcon,
      label: "Image",
      run: () => {
        const url = window.prompt("Image URL");
        if (url) exec("insertImage", url);
      },
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-input">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/50 p-1.5">
        {tools.map((tool) => (
          <Button
            key={tool.label}
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label={tool.label}
            onClick={tool.run}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        className="min-h-40 bg-background px-4 py-3 text-sm leading-relaxed outline-none [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_img]:my-3 [&_img]:rounded-lg [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-2"
      />
    </div>
  );
}
