import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Crosshair, ExternalLink, Loader2, MapPin, Minus, Plus, Search, X } from "lucide-react";
import * as z from "zod";
import { Station } from "@features/station/stationTypes";

const DEFAULT_COORDS = { lat: 10.7769, lng: 106.7009 };
const DEFAULT_ZOOM = 15;
const TILE_SIZE = 256;

const coordinateSchema = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `Vui lòng nhập ${label}`)
    .refine((value) => Number.isFinite(Number(value)), `${label} phải là số`)
    .refine((value) => {
      const numericValue = Number(value);
      return numericValue >= min && numericValue <= max;
    }, `${label} không hợp lệ`);

const schema = z.object({
  name: z.string().min(2, "Tên ga phải có ít nhất 2 ký tự"),
  zone: z.string().min(1, "Vui lòng nhập khu vực"),
  lat: coordinateSchema(-90, 90, "vĩ độ (LAT)"),
  lng: coordinateSchema(-180, 180, "kinh độ (LONG)"),
  status: z.enum(["active", "inactive"]),
});

type FormData = z.infer<typeof schema>;

type Coordinate = {
  lat: number;
  lng: number;
};

type PlaceResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  station: Station | null;
  onSubmit: (data: Omit<Station, "id" | "code">) => Promise<void>;
}

function clampLat(lat: number) {
  return Math.max(-85, Math.min(85, lat));
}

function lngToTileX(lng: number, zoom: number) {
  return ((lng + 180) / 360) * 2 ** zoom;
}

function latToTileY(lat: number, zoom: number) {
  const latRad = (clampLat(lat) * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * 2 ** zoom;
}

function tileXToLng(tileX: number, zoom: number) {
  return (tileX / 2 ** zoom) * 360 - 180;
}

function tileYToLat(tileY: number, zoom: number) {
  const n = Math.PI - (2 * Math.PI * tileY) / 2 ** zoom;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

function parseCoordinate(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function MiniMapPicker({
  coordinate,
  zoom,
  onZoomChange,
  onPick,
}: {
  coordinate: Coordinate;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onPick: (coordinate: Coordinate) => void;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const centerX = lngToTileX(coordinate.lng, zoom);
  const centerY = latToTileY(coordinate.lat, zoom);
  const centerTileX = Math.floor(centerX);
  const centerTileY = Math.floor(centerY);
  const maxTile = 2 ** zoom;

  const tiles = useMemo(() => {
    const items: Array<{ key: string; x: number; y: number; left: number; top: number; url: string }> = [];
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const rawX = centerTileX + dx;
        const x = ((rawX % maxTile) + maxTile) % maxTile;
        const y = centerTileY + dy;
        if (y < 0 || y >= maxTile) continue;

        items.push({
          key: `${zoom}-${x}-${y}`,
          x,
          y,
          left: 128 + (rawX - centerX) * TILE_SIZE,
          top: 96 + (y - centerY) * TILE_SIZE,
          url: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
        });
      }
    }
    return items;
  }, [centerTileX, centerTileY, centerX, centerY, maxTile, zoom]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    const rect = mapElement.getBoundingClientRect();
    const deltaX = (event.clientX - rect.left - rect.width / 2) / TILE_SIZE;
    const deltaY = (event.clientY - rect.top - rect.height / 2) / TILE_SIZE;
    const pickedTileX = centerX + deltaX;
    const pickedTileY = centerY + deltaY;

    onPick({
      lat: tileYToLat(pickedTileY, zoom),
      lng: tileXToLng(pickedTileX, zoom),
    });
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-slate-100">
      <div ref={mapRef} onClick={handleClick} className="relative h-48 w-full cursor-crosshair overflow-hidden">
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            className="absolute h-64 w-64 select-none"
            draggable={false}
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_18px,rgba(15,23,42,0.08)_19px,transparent_20px)]" />
        <MapPin className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-full fill-blue-600 text-white drop-shadow" />
      </div>
      <div className="absolute right-3 top-3 flex overflow-hidden rounded-lg border border-white/70 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => onZoomChange(Math.min(18, zoom + 1))}
          className="flex h-8 w-8 items-center justify-center text-slate-700 hover:bg-slate-50"
          aria-label="Phóng to bản đồ"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(11, zoom - 1))}
          className="flex h-8 w-8 items-center justify-center border-l border-slate-100 text-slate-700 hover:bg-slate-50"
          aria-label="Thu nhỏ bản đồ"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
      <div className="absolute bottom-2 right-3 rounded bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-500">
        OpenStreetMap
      </div>
    </div>
  );
}

export default function StationFormModal({
  isOpen,
  onClose,
  station,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      zone: "",
      lat: "",
      lng: "",
      status: "active",
    },
  });

  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [placeSearchError, setPlaceSearchError] = useState("");
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

  const isEdit = !!station;
  const currentStatus = watch("status");
  const latValue = watch("lat");
  const lngValue = watch("lng");

  const selectedCoordinate = useMemo(
    () => ({
      lat: parseCoordinate(latValue, DEFAULT_COORDS.lat),
      lng: parseCoordinate(lngValue, DEFAULT_COORDS.lng),
    }),
    [latValue, lngValue]
  );

  useEffect(() => {
    if (isOpen) {
      setPlaceQuery(station?.name ?? "");
      setPlaceResults([]);
      setPlaceSearchError("");
      setMapZoom(DEFAULT_ZOOM);

      if (station) {
        const [locationLat = "", locationLng = ""] = station.location.split(",");
        const lat = station.lat || locationLat.trim();
        const lng = station.lng || locationLng.trim();

        reset({
          name: station.name,
          zone: station.zone,
          lat,
          lng,
          status: station.status,
        });
      } else {
        reset({
          name: "",
          zone: "",
          lat: "",
          lng: "",
          status: "active",
        });
      }
    }
  }, [isOpen, station, reset]);

  useEffect(() => {
    if (!isOpen) return;

    const trimmedQuery = placeQuery.trim();
    if (trimmedQuery.length < 3) {
      setPlaceResults([]);
      setPlaceSearchError("");
      setIsSearchingPlace(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearchingPlace(true);
      setPlaceSearchError("");

      try {
        const searchParams = new URLSearchParams({
          q: trimmedQuery,
          format: "json",
          limit: "5",
          addressdetails: "1",
          countrycodes: "vn",
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${searchParams.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Search failed");

        const data = (await response.json()) as PlaceResult[];
        setPlaceResults(data);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setPlaceSearchError("Không tìm được địa điểm lúc này. Bạn vẫn có thể nhập hoặc dán tọa độ trực tiếp.");
      } finally {
        setIsSearchingPlace(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, placeQuery]);

  if (!isOpen) return null;

  const setCoordinates = (coordinate: Coordinate) => {
    setValue("lat", formatCoordinate(coordinate.lat), { shouldDirty: true, shouldValidate: true });
    setValue("lng", formatCoordinate(coordinate.lng), { shouldDirty: true, shouldValidate: true });
  };

  const applyCoordinatePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData("text");
    const match = pastedText.match(/(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)/);
    if (!match) return;

    const lat = match[1].replace(",", ".");
    const lng = match[2].replace(",", ".");
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return;

    event.preventDefault();
    setValue("lat", lat, { shouldDirty: true, shouldValidate: true });
    setValue("lng", lng, { shouldDirty: true, shouldValidate: true });
  };

  const choosePlace = (place: PlaceResult) => {
    const coordinate = {
      lat: Number(place.lat),
      lng: Number(place.lon),
    };
    if (!Number.isFinite(coordinate.lat) || !Number.isFinite(coordinate.lng)) return;

    setCoordinates(coordinate);
    setPlaceQuery(place.display_name);
    setPlaceResults([]);
  };

  const openGoogleMaps = () => {
    const query = `${selectedCoordinate.lat},${selectedCoordinate.lng}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  };

  const submitHandler = async (data: FormData) => {
    await onSubmit({
      name: data.name,
      line: station?.line ?? "L1",
      zone: data.zone,
      lat: data.lat.trim(),
      lng: data.lng.trim(),
      location: `${data.lat.trim()}, ${data.lng.trim()}`,
      status: data.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? "Chỉnh sửa nhà ga" : "Thêm nhà ga mới"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6">
          <form id="station-form" onSubmit={handleSubmit(submitHandler)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Tên nhà ga</label>
              <input
                type="text"
                {...register("name")}
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  errors.name ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                }`}
                placeholder="Ví dụ: Ga Bến Thành"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Khu vực (Zone)</label>
              <div className="relative">
                <input
                  type="text"
                  {...register("zone")}
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-10 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    errors.zone ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                  }`}
                  placeholder="Khu vực 1"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-gray-100 p-1 text-gray-400">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
              </div>
              {errors.zone && <p className="mt-1 text-xs text-red-500">{errors.zone.message}</p>}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">Tìm & chọn tọa độ</label>
                  <p className="mt-1 text-xs text-gray-500">Tìm theo tên địa điểm hoặc click trực tiếp trên bản đồ.</p>
                </div>
                <button
                  type="button"
                  onClick={openGoogleMaps}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Google Maps
                </button>
              </div>

              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={placeQuery}
                  onChange={(event) => setPlaceQuery(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Tìm địa điểm, ví dụ: Ga Bến Thành"
                />
                {isSearchingPlace && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-600" />}
              </div>

              {placeSearchError && <p className="mb-3 text-xs leading-5 text-amber-600">{placeSearchError}</p>}

              {placeResults.length > 0 && (
                <div className="mb-3 max-h-36 overflow-y-auto rounded-xl border border-gray-200 bg-white">
                  {placeResults.map((place) => (
                    <button
                      key={place.place_id}
                      type="button"
                      onClick={() => choosePlace(place)}
                      className="flex w-full items-start gap-2 border-b border-gray-100 px-3 py-2.5 text-left text-xs text-gray-600 last:border-b-0 hover:bg-blue-50"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      <span className="line-clamp-2">{place.display_name}</span>
                    </button>
                  ))}
                </div>
              )}

              <MiniMapPicker
                coordinate={selectedCoordinate}
                zoom={mapZoom}
                onZoomChange={setMapZoom}
                onPick={setCoordinates}
              />

              <button
                type="button"
                onClick={() => setCoordinates(DEFAULT_COORDS)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Crosshair className="h-3.5 w-3.5" />
                Đặt về trung tâm TP.HCM
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Tọa độ GPS</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">LAT</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    {...register("lat")}
                    onPaste={applyCoordinatePaste}
                    className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                      errors.lat ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                    }`}
                    placeholder="10.7769"
                  />
                  {errors.lat && <p className="mt-1 text-xs text-red-500">{errors.lat.message}</p>}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">LONG</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    {...register("lng")}
                    onPaste={applyCoordinatePaste}
                    className={`w-full rounded-xl border bg-white py-2.5 pl-12 pr-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                      errors.lng ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                    }`}
                    placeholder="106.7009"
                  />
                  {errors.lng && <p className="mt-1 text-xs text-red-500">{errors.lng.message}</p>}
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-500">
                Có thể dán trực tiếp cặp tọa độ từ bản đồ, ví dụ: 10.7769, 106.7009.
              </p>
            </div>

            <hr className="my-4 border-gray-100" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">Trạng thái</p>
                <p className="mt-0.5 text-xs text-gray-500">Kích hoạt nhà ga ngay khi thêm</p>
              </div>

              <button
                type="button"
                onClick={() => setValue("status", currentStatus === "active" ? "inactive" : "active")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${currentStatus === "active" ? "bg-blue-600" : "bg-gray-200"}`}
                aria-label="Đổi trạng thái nhà ga"
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${currentStatus === "active" ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 rounded-b-2xl px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl bg-transparent px-6 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="station-form"
            disabled={isSubmitting}
            className="flex min-w-[120px] items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : isEdit ? "Lưu thay đổi" : "Thêm ga"}
          </button>
        </div>
      </div>
    </div>
  );
}
