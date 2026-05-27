import {
  LOCATION_SEARCH_RESULT_LIMIT,
  NOMINATIM_GEOCODING_BASE_URL,
  OPEN_METEO_REQUEST_TIMEOUT_MS
} from "../constants";
import type { LocationConfig } from "../types";

interface NominatimItem {
  place_id?: number;
  lat?: string;
  lon?: string;
  category?: string;
  type?: string;
  name?: string;
  display_name?: string;
}

// 全国地址搜索入口，why：Open-Meteo Geocoding 偏城市库，湖泊/景区等 POI 覆盖不足
export async function searchChinaLocations(query: string): Promise<LocationConfig[]> {
  const normalized = query.trim();
  if (normalized.length < 2) {
    return [];
  }

  const url = new URL(NOMINATIM_GEOCODING_BASE_URL);
  url.searchParams.set("q", normalized);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "cn");
  url.searchParams.set("limit", String(LOCATION_SEARCH_RESULT_LIMIT));
  url.searchParams.set("accept-language", "zh-CN");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPEN_METEO_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim 要求可识别 User-Agent，why：公共地理编码服务需要限流和来源识别
        "User-Agent": "project-starwalk/0.3.0"
      },
      signal: controller.signal,
      next: { revalidate: 86400 }
    });
    if (!res.ok) {
      throw new Error(`nominatim http ${res.status}`);
    }
    const data = (await res.json()) as NominatimItem[];
    return data.map(toLocation).filter((location): location is LocationConfig => Boolean(location));
  } finally {
    clearTimeout(timeout);
  }
}

// 将地理编码结果收口为内部地点模型，why：后续天气/月相计算只依赖 LocationConfig
function toLocation(item: NominatimItem): LocationConfig | null {
  if (item.place_id === undefined || !item.lat || !item.lon) {
    return null;
  }

  const latitude = Number(item.lat);
  const longitude = Number(item.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const name = item.display_name ?? item.name ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  return {
    id: `osm-cn-${item.place_id}`,
    name,
    groupId: "search",
    latitude,
    longitude,
    elevation: 0,
    timezone: "Asia/Shanghai",
    source: "geocoding"
  };
}
