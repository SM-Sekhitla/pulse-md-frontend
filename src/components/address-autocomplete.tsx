import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPin } from "lucide-react";
import { SA_PROVINCES } from "@/lib/sa-suburbs";
import { preserveStreetNumber } from "@/lib/address-number";

type Suggestion = {
  id: string;
  address: string;
  province: string;
  title: string;
  numberRetained: boolean;
};
const key = import.meta.env.VITE_GEOAPIFY_API_KEY?.trim();
const photon =
  import.meta.env.VITE_ADDRESS_SEARCH_URL || "https://photon.komoot.io/api/";
function provinceName(value: string) {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/province/g, "")
      .replace(/[^a-z]/g, "");
  return SA_PROVINCES.find((p) => normalize(p) === normalize(value)) || "";
}
export function AddressAutocomplete({
  value,
  province,
  onChange,
  onSelect,
}: {
  value: string;
  province: string;
  onChange: (value: string) => void;
  onSelect: (address: string, province: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(-1);
  const cache = useRef(new Map<string, Suggestion[]>());
  useEffect(() => {
    const text = value.trim();
    setActive(-1);
    setItems([]);
    setError("");
    setBusy(false);
    if (!open || text.length < 3) return;
    const cacheKey = `${province}:${text.toLowerCase()}`;
    const cached = cache.current.get(cacheKey);
    if (cached) {
      setItems(cached);
      return;
    }
    const controller = new AbortController();
    let live = true;
    setBusy(true);
    let timeout: ReturnType<typeof setTimeout>;
    const timer = setTimeout(async () => {
      timeout = setTimeout(() => controller.abort(), 6000);
      try {
        const query =
          province && !text.toLowerCase().includes(province.toLowerCase())
            ? `${text}, ${province}`
            : text;
        const params = key
          ? new URLSearchParams({
              text: query,
              filter: "countrycode:za",
              lang: "en",
              format: "json",
              limit: "6",
              apiKey: key,
            })
          : new URLSearchParams({
              q: `${query}, South Africa`,
              lang: "en",
              limit: "8",
            });
        const endpoint = key
          ? "https://api.geoapify.com/v1/geocode/autocomplete"
          : photon;
        const response = await fetch(
          `${endpoint}${endpoint.includes("?") ? "&" : "?"}${params}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("lookup failed");
        const data = await response.json();
        const results: Suggestion[] = key
          ? (data.results || [])
              .filter((p: any) => p.country_code === "za" && p.street)
              .map((p: any) => ({
                id: p.place_id || p.formatted,
                ...preserveStreetNumber(text, {
                  address: p.formatted,
                  title: p.address_line1 || p.street,
                  houseNumber: p.housenumber,
                }),
                province: provinceName(p.state || ""),
              }))
          : (data.features || [])
              .map((f: any) => f.properties)
              .filter(
                (p: any) =>
                  p?.countrycode?.toLowerCase() === "za" &&
                  (p.street ||
                    p.osm_value === "residential" ||
                    p.osm_key === "highway"),
              )
              .map((p: any) => {
                const street = [p.housenumber, p.street || p.name]
                  .filter(Boolean)
                  .join(" ");
                const address = [
                  street,
                  p.suburb || p.district,
                  p.city,
                  p.postcode,
                  p.state,
                  "South Africa",
                ]
                  .filter(Boolean)
                  .join(", ");
                return {
                  id: `${p.osm_type}-${p.osm_id}`,
                  ...preserveStreetNumber(text, {
                    address,
                    title: street,
                    houseNumber: p.housenumber,
                  }),
                  province: provinceName(p.state || ""),
                };
              });
        const unique = results
          .filter(
            (p, i, all) =>
              p.address &&
              all.findIndex((other) => other.address === p.address) === i,
          )
          .slice(0, 6);
        if (live) {
          cache.current.set(cacheKey, unique);
          if (cache.current.size > 40)
            cache.current.delete(cache.current.keys().next().value!);
          setItems(unique);
        }
      } catch {
        if (live)
          setError(
            "Address suggestions are unavailable. You can enter your full address and select the province manually.",
          );
      } finally {
        clearTimeout(timeout);
        if (live) setBusy(false);
      }
    }, 200);
    return () => {
      live = false;
      clearTimeout(timer);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [value, province, open]);
  const choose = (item: Suggestion) => {
    onSelect(item.address, item.province);
    setOpen(false);
  };
  const visible = open && value.trim().length >= 3;
  return (
    <div className="relative md:col-span-2">
      <label
        htmlFor="practice-address"
        className="text-[12.5px] font-medium text-navy"
      >
        Physical address
      </label>
      <div className="relative mt-1.5">
        <MapPin
          size={16}
          className="pointer-events-none absolute left-3 top-4 text-muted-foreground"
        />
        <input
          id="practice-address"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={visible}
          aria-controls={visible ? "practice-address-results" : undefined}
          aria-activedescendant={
            visible && active >= 0
              ? `practice-address-option-${active}`
              : undefined
          }
          aria-describedby="practice-address-help"
          autoComplete="off"
          value={value}
          placeholder="Start typing a street name or street address"
          onFocus={() => setOpen(true)}
          onBlur={(e) => {
            if (
              !e.currentTarget.parentElement?.parentElement?.contains(
                e.relatedTarget as Node,
              )
            )
              setOpen(false);
          }}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, items.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            }
            if (e.key === "Enter" && visible && active >= 0 && items[active]) {
              e.preventDefault();
              choose(items[active]);
            }
          }}
          className="block w-full rounded-md border border-border bg-white pl-9 pr-10 py-2.5 text-[13.5px]"
        />
        {busy && (
          <LoaderCircle
            aria-label="Searching addresses"
            size={16}
            className="absolute right-3 top-4 animate-spin text-muted-foreground"
          />
        )}
      </div>
      <p
        id="practice-address-help"
        className="mt-2 text-xs text-muted-foreground"
      >
        Type at least 3 characters. Add a town or select a province to narrow
        the search. Check the street number before continuing.
      </p>
      {visible && (
        <div className="absolute z-30 mt-2 w-full rounded-lg border border-border bg-white shadow-lg overflow-hidden">
          <ul
            id="practice-address-results"
            role="listbox"
            aria-label="Suggested addresses"
            className="max-h-72 overflow-auto"
          >
            {!busy &&
              !error &&
              items.map((item, index) => (
                <li
                  key={item.id}
                  id={`practice-address-option-${index}`}
                  role="option"
                  aria-selected={active === index}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(item)}
                  className={`cursor-pointer px-4 py-3 border-b last:border-0 text-sm ${active === index ? "bg-amber-50" : "hover:bg-amber-50"}`}
                >
                  <span className="block font-medium text-navy">
                    {item.title}
                  </span>
                  <span className="block mt-1 text-xs text-muted-foreground">
                    {item.address}
                  </span>
                  {item.numberRetained && (
                    <span className="block mt-1 text-xs text-muted-foreground">
                      Street number from your input — please confirm it is correct.
                    </span>
                  )}
                </li>
              ))}
          </ul>
          {(busy || error || !items.length) && (
            <p role="status" className="p-4 text-sm text-muted-foreground">
              {busy
                ? "Searching street addresses…"
                : error ||
                  "No matching street addresses. Add a town or enter the full address manually."}
            </p>
          )}
          <div className="px-4 py-2 bg-surface text-[10px] text-muted-foreground">
            {key ? (
              <a
                href="https://www.geoapify.com/"
                target="_blank"
                rel="noreferrer"
              >
                Powered by Geoapify
              </a>
            ) : (
              <span>
                Photon ·{" "}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noreferrer"
                >
                  © OpenStreetMap contributors
                </a>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
