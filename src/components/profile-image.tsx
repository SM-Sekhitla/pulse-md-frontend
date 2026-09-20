import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { ActionButton } from "@/components/action-feedback";
import { toast } from "sonner";

export function ProfileImage({
  src,
  alt,
  className = "",
  fallback,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  return src && failed !== src ? (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(src)}
    />
  ) : (
    <>{fallback}</>
  );
}

export function ProfileImageField({
  label,
  value,
  name,
  onChange,
  onBusy,
}: {
  label: string;
  value: string;
  name: string;
  onChange: (value: string, name: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-navy">{label}</h3>
      <div className="my-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
        <ProfileImage
          src={value}
          alt={`${label} preview`}
          className={`h-full w-full ${label.includes("logo") ? "object-contain p-2" : "object-cover"}`}
          fallback={<ImagePlus className="h-8 w-8 text-muted-foreground" />}
        />
      </div>
      <label className="block text-xs text-muted-foreground">
        Choose PNG, JPEG or WebP (up to 2 MB)
        <input
          type="file"
          aria-label={label}
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          className="mt-2 block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (
              !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
              file.size > 2 * 1024 * 1024
            ) {
              toast.error("Choose a PNG, JPEG or WebP image under 2 MB.");
              return;
            }
            setBusy(true);
            onBusy(true);
            try {
              const data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () =>
                  reject(new Error("Could not read image"));
                reader.readAsDataURL(file);
              });
              await new Promise<void>((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve();
                image.onerror = () => reject(new Error("Invalid image"));
                image.src = data;
              });
              onChange(data, file.name);
            } catch {
              toast.error("Could not read this image. Try another file.");
            } finally {
              setBusy(false);
              onBusy(false);
            }
          }}
        />
      </label>
      <p className="mt-2 truncate text-xs text-muted-foreground" role="status">
        {busy ? "Reading image…" : name || "No image selected"}
      </p>
      {value && (
        <ActionButton
          type="button"
          onClick={() => onChange("", "")}
          className="mt-3 text-xs font-medium text-red-700"
        >
          Remove image
        </ActionButton>
      )}
    </div>
  );
}
