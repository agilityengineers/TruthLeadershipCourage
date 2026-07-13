import { useRef, useState } from "react";
import { toast } from "sonner";
import { useUploadContentImage } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ImageValue = { src: string; alt: string };

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1)); // strip data: prefix
    };
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload-or-paste image field. Drag/drop or pick a file to upload (stored in
 * the database, or the S3 bucket when one is configured); or paste an image
 * URL (works for existing /brand/* assets). Shows a live thumbnail + alt text.
 */
export function ImageField({
  label,
  value,
  onChange,
  help,
}: {
  label: string;
  value: ImageValue;
  onChange: (v: ImageValue) => void;
  help?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const upload = useUploadContentImage();

  async function doUpload(file: File) {
    try {
      const dataBase64 = await readAsBase64(file);
      const res = await upload.mutateAsync({ data: { contentType: file.type, dataBase64 } });
      onChange({ ...value, src: res.url });
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-[11px] border border-hair-2 p-3">
      <Label>{label}</Label>
      {help && <p className="text-[11.5px] text-muted-2">{help}</p>}
      <div className="flex gap-3">
        <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-hair-1 bg-soft-1">
          {value.src ? (
            <img src={value.src} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-muted-3">No image</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input
            value={value.src}
            onChange={(e) => onChange({ ...value, src: e.target.value })}
            placeholder="Paste an image URL, or upload below"
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) doUpload(file);
            }}
            className={`flex items-center gap-2 rounded-[8px] border border-dashed px-3 py-2 text-[12px] ${
              dragging ? "border-eq bg-[#eaf2fc]" : "border-hair-1"
            }`}
          >
            <button
              type="button"
              disabled={upload.isPending}
              onClick={() => inputRef.current?.click()}
              className="rounded-[7px] border border-hair-1 bg-white px-2.5 py-1 font-semibold text-ink hover:bg-soft-1 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {upload.isPending ? "Uploading…" : "Upload"}
            </button>
            <span className="text-muted-2">or drag an image here</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) doUpload(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </div>
      <Input
        value={value.alt}
        onChange={(e) => onChange({ ...value, alt: e.target.value })}
        placeholder="Alt text — describe the image for screen readers"
      />
    </div>
  );
}
