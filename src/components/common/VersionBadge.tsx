declare const __APP_VERSION__: string;

const version = __APP_VERSION__ || "v0.0.0";

const VersionBadge = () => {
  return (
    <div
      className="
        fixed bottom-3 right-3
        bg-black/55 text-white
        text-[11px] font-medium
        px-[10px] py-1
        rounded-full
        z-[9999]
        pointer-events-none
        tracking-[0.5px]
        backdrop-blur-sm
        font-mono
      "
    >
      {version}
    </div>
  );
};

export default VersionBadge;