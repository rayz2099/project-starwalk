import { PRECIP_THRESHOLDS, RATING_THRESHOLDS, WINDOW_SCORING_THRESHOLDS } from "../constants";
import type {
  BestObservationWindow,
  HourlyObservationSlot,
  LocationConfig,
  MoonInfo,
  MoonlightImpact,
  NightlyWindowAnalysis,
  ObservationTarget
} from "../types";
import type { OpenMeteoHourlyResponse } from "./open-meteo";
import { collectNightHourIndexes } from "./aggregate";
import { computeMoonAltitudeDeg, localMidnightUtcMs } from "./moon";

// 构建小时级观测窗口，why：月亮升落和云量都是小时级变化，整夜均值会误杀可用时段
export function analyzeNightWindow(
  hourly: OpenMeteoHourlyResponse,
  businessDate: string,
  location: LocationConfig,
  moon: MoonInfo
): NightlyWindowAnalysis {
  const idxs = collectNightHourIndexes(hourly, businessDate);
  const slots = idxs.map((idx) => buildSlot(hourly, idx, location, moon));
  return {
    slots,
    bestWindow: findBestWindow(slots)
  };
}

function buildSlot(
  hourly: OpenMeteoHourlyResponse,
  idx: number,
  location: LocationConfig,
  moon: MoonInfo
): HourlyObservationSlot {
  const localTime = hourly.time[idx];
  const utcMs = localHourUtcMs(localTime, location.timezone);
  const moonAltitudeDeg = computeMoonAltitudeDeg(location, utcMs);
  const moonAboveHorizon = moonAltitudeDeg > 0;
  const moonlightImpact = computeMoonlightImpact(
    moon.illumination,
    moonAltitudeDeg,
    moonAboveHorizon
  );
  const temperature = hourly.temperature_2m[idx];
  const dewPointSpread = temperature - hourly.dew_point_2m[idx];
  const precipitationMm = hourly.precipitation[idx] ?? 0;
  const precipitationProbability = hourly.precipitation_probability[idx] ?? 0;
  // 实质降水小时直接剔除，why：湿段不应进入 best window 候选
  const wetKilled = precipitationMm > PRECIP_THRESHOLDS.windowKillMm;
  const baseScore = computeSlotScore({
    cloudCover: hourly.cloud_cover[idx],
    cloudCoverLow: hourly.cloud_cover_low[idx],
    cloudCoverHigh: hourly.cloud_cover_high[idx],
    dewPointSpread,
    moonIllumination: moon.illumination,
    moonAltitudeDeg,
    moonAboveHorizon
  });

  return {
    localTime,
    cloudCover: hourly.cloud_cover[idx],
    cloudCoverLow: hourly.cloud_cover_low[idx],
    cloudCoverHigh: hourly.cloud_cover_high[idx],
    temperature,
    dewPointSpread,
    precipitationMm,
    precipitationProbability,
    wetKilled,
    moonAltitudeDeg,
    moonIllumination: moon.illumination,
    moonAboveHorizon,
    moonlightImpact,
    score: wetKilled ? 0 : baseScore
  };
}

function computeSlotScore(args: {
  cloudCover: number;
  cloudCoverLow: number;
  cloudCoverHigh: number;
  dewPointSpread: number;
  moonIllumination: number;
  moonAltitudeDeg: number;
  moonAboveHorizon: boolean;
}): number {
  const cloudPenalty = args.cloudCover * 0.7 + args.cloudCoverLow * 0.4 + args.cloudCoverHigh * 0.2;
  const moonPenalty = computeMoonPenalty(
    args.moonIllumination,
    args.moonAltitudeDeg,
    args.moonAboveHorizon
  );
  const dewPenalty =
    Number.isFinite(args.dewPointSpread) &&
    args.dewPointSpread < RATING_THRESHOLDS.dewPointSpreadFair
      ? 15
      : 0;
  return clamp(100 - cloudPenalty - moonPenalty - dewPenalty, 0, 100);
}

function computeMoonPenalty(
  illumination: number,
  altitudeDeg: number,
  aboveHorizon: boolean
): number {
  if (!aboveHorizon) return 0;
  if (altitudeDeg < 15) return illumination * 20;
  if (altitudeDeg < 40) return illumination * 30;
  return illumination * 40;
}

function computeMoonlightImpact(
  illumination: number,
  altitudeDeg: number,
  aboveHorizon: boolean
): MoonlightImpact {
  if (!aboveHorizon) return "LOW";
  const penalty = computeMoonPenalty(illumination, altitudeDeg, aboveHorizon);
  if (penalty < 12) return "LOW";
  if (penalty < 28) return "MEDIUM";
  return "HIGH";
}

function findBestWindow(slots: HourlyObservationSlot[]): BestObservationWindow | null {
  let best: BestObservationWindow | null = null;
  for (let start = 0; start < slots.length; start++) {
    for (let end = start + WINDOW_SCORING_THRESHOLDS.minCandidateHours; end <= slots.length; end++) {
      const segment = slots.slice(start, end);
      if (!isCandidate(segment)) continue;
      const candidate = summarizeWindow(segment);
      if (!best || isBetterWindow(candidate, best)) {
        best = candidate;
      }
    }
  }
  return best;
}

function isCandidate(slots: HourlyObservationSlot[]): boolean {
  // 湿小时打断连续段，why：观星窗口必须是干段
  if (slots.some((slot) => slot.wetKilled)) return false;
  if (slots.some((slot) => slot.score < WINDOW_SCORING_THRESHOLDS.minCandidateScore)) return false;
  return avg(slots.map((slot) => slot.cloudCover)) <= WINDOW_SCORING_THRESHOLDS.maxCandidateCloudAvg;
}

function summarizeWindow(slots: HourlyObservationSlot[]): BestObservationWindow {
  const avgScore = avg(slots.map((slot) => slot.score));
  const avgCloudCover = avg(slots.map((slot) => slot.cloudCover));
  const maxCloudCover = Math.max(...slots.map((slot) => slot.cloudCover));
  const moonlightImpact = summarizeMoonlight(slots);
  return {
    startLocalTime: slots[0].localTime,
    endLocalTime: addOneHour(slots[slots.length - 1].localTime),
    hours: slots.length,
    avgScore,
    avgCloudCover,
    maxCloudCover,
    moonlightImpact,
    targetSuitability: pickTargets(avgScore, avgCloudCover, moonlightImpact)
  };
}

function summarizeMoonlight(slots: HourlyObservationSlot[]): MoonlightImpact {
  const order: Record<MoonlightImpact, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  const max = Math.max(...slots.map((slot) => order[slot.moonlightImpact]));
  if (max === 0) return "LOW";
  if (max === 1) return "MEDIUM";
  return "HIGH";
}

function pickTargets(
  avgScore: number,
  avgCloudCover: number,
  moonlightImpact: MoonlightImpact
): ObservationTarget[] {
  const targets: ObservationTarget[] = ["BRIGHT_STARS", "PLANETS"];
  if (avgScore >= 58 && avgCloudCover <= 45 && moonlightImpact !== "HIGH") {
    targets.push("METEORS");
  }
  if (avgScore >= 75 && avgCloudCover <= 25 && moonlightImpact === "LOW") {
    targets.push("MILKY_WAY", "DEEP_SKY");
  }
  return targets;
}

function isBetterWindow(next: BestObservationWindow, current: BestObservationWindow): boolean {
  if (next.avgScore > current.avgScore + 5) return true;
  if (next.avgScore >= current.avgScore - 5 && next.hours > current.hours) return true;
  return false;
}

function localHourUtcMs(localTime: string, timezone: string): number {
  const date = localTime.slice(0, 10);
  const hour = Number(localTime.slice(11, 13));
  return localMidnightUtcMs(date, timezone) + hour * 3600_000;
}

function addOneHour(localTime: string): string {
  const date = localTime.slice(0, 10);
  const hour = Number(localTime.slice(11, 13));
  if (hour < 23) {
    return `${date}T${String(hour + 1).padStart(2, "0")}:00`;
  }
  return `${addDays(date, 1)}T00:00`;
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const ts = Date.UTC(y, m - 1, d) + days * 24 * 3600_000;
  const dt = new Date(ts);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(
    dt.getUTCDate()
  ).padStart(2, "0")}`;
}

function avg(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
