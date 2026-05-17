import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  payload: Record<string, unknown>;
  size?: number;
}

export function DocumentQR({ payload, size = 128 }: Props) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(JSON.stringify(payload), { width: size, margin: 1, errorCorrectionLevel: "M" })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [JSON.stringify(payload), size]);
  if (!src) return <div style={{ width: size, height: size }} className="rounded bg-surface" />;
  return <img src={src} width={size} height={size} alt="Verification QR code" className="rounded bg-white" />;
}
