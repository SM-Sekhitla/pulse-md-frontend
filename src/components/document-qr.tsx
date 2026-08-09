interface Props {
  src?: string | null;
  size?: number;
}

export function DocumentQR({ src, size = 128 }: Props) {
  if (!src) return <div style={{ width: size, height: size }} className="rounded bg-surface" />;
  return <img src={src} width={size} height={size} alt="Verification QR code" className="rounded bg-white" />;
}
