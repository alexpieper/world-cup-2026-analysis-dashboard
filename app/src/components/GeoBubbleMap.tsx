import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { geoCentroid, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import countries110m from "world-atlas/countries-110m.json";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import { percent } from "../lib/format";

const mapWidth = 900;
const mapHeight = 500;

export interface GeoBubble {
  id: string | number;
  longitude: number;
  latitude: number;
  value: number;
  label: string;
  detail?: string;
  flagCode?: string;
}

export interface GeoViewport {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

function countryId(featureItem: Feature<Geometry>) {
  return String(featureItem.id ?? "").padStart(3, "0");
}

function viewportPolygon(viewport: GeoViewport): FeatureCollection<Geometry> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [viewport.minLon, viewport.minLat],
              [viewport.maxLon, viewport.minLat],
              [viewport.maxLon, viewport.maxLat],
              [viewport.minLon, viewport.maxLat],
              [viewport.minLon, viewport.minLat]
            ]
          ]
        }
      }
    ]
  };
}

function featureTouchesViewport(featureItem: Feature<Geometry>, viewport: GeoViewport) {
  const [longitude, latitude] = geoCentroid(featureItem);
  const margin = 12;
  return (
    longitude >= viewport.minLon - margin &&
    longitude <= viewport.maxLon + margin &&
    latitude >= viewport.minLat - margin &&
    latitude <= viewport.maxLat + margin
  );
}

export function GeoBubbleMap({
  bubbles,
  viewport,
  highlightedCountryIds = [],
  ariaLabel,
  selectedBubbleId,
  onSelectBubble,
  labelCountries = false,
  legend
}: {
  bubbles: GeoBubble[];
  viewport: GeoViewport;
  highlightedCountryIds?: string[];
  ariaLabel: string;
  selectedBubbleId?: string | number;
  onSelectBubble?: (bubble: GeoBubble) => void;
  labelCountries?: boolean;
  legend?: ReactNode;
}) {
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const highlighted = useMemo(() => new Set(highlightedCountryIds), [highlightedCountryIds]);
  const maxValue = Math.max(...bubbles.map((bubble) => bubble.value), 1);
  const { countries, path, projection } = useMemo(() => {
    const topology = countries110m as unknown as Topology;
    const object = topology.objects.countries;
    const collection = feature(topology, object) as FeatureCollection<Geometry>;
    const visibleCountries = collection.features.filter((country) => featureTouchesViewport(country, viewport));
    const mapProjection = geoMercator()
      .fitExtent(
        [
          [28, 24],
          [mapWidth - 28, mapHeight - 24]
        ],
        viewportPolygon(viewport)
      )
      .clipExtent([
        [0, 0],
        [mapWidth, mapHeight]
      ]);
    return {
      countries: visibleCountries,
      projection: mapProjection,
      path: geoPath(mapProjection)
    };
  }, [viewport]);

  const projectedBubbles = bubbles
    .map((bubble) => {
      const projected = projection([bubble.longitude, bubble.latitude]);
      if (!projected) return null;
      const [x, y] = projected;
      if (x < -10 || x > mapWidth + 10 || y < -10 || y > mapHeight + 10) return null;
      return { ...bubble, x, y };
    })
    .filter((bubble): bubble is GeoBubble & { x: number; y: number } => bubble !== null);
  const hovered = projectedBubbles.find((bubble) => bubble.id === hoveredId);

  return (
    <div className="map-panel">
      <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} role="img" aria-label={ariaLabel}>
        <defs>
          <linearGradient id="mapOcean" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#102823" />
            <stop offset="100%" stopColor="#08110f" />
          </linearGradient>
          <clipPath id="geo-map-clip">
            <rect x="0" y="0" width={mapWidth} height={mapHeight} rx="8" />
          </clipPath>
        </defs>
        <rect width={mapWidth} height={mapHeight} rx="8" fill="url(#mapOcean)" />
        <g clipPath="url(#geo-map-clip)">
          {countries.map((country) => {
            const id = countryId(country);
            return (
              <path
                className={highlighted.has(id) ? "map-land map-land-host" : "map-land map-land-muted"}
                d={path(country) ?? undefined}
                key={id}
              />
            );
          })}
          <path className="map-line" d="M72 375 C226 303 368 298 493 265 C619 232 722 241 844 305" />
          <path className="map-line" d="M105 156 C251 196 405 202 540 184 C676 166 761 125 838 84" />
        </g>
        {labelCountries
          ? countries
              .filter((country) => highlighted.has(countryId(country)))
              .map((country) => {
                const projected = projection(geoCentroid(country));
                if (!projected) return null;
                const [x, y] = projected;
                return (
                  <text className="map-country-label" x={x} y={y} key={`label-${countryId(country)}`}>
                    {countryId(country) === "840" ? "USA" : countryId(country) === "484" ? "MEX" : "CAN"}
                  </text>
                );
              })
          : null}
        {projectedBubbles.map((bubble) => {
          const radius = 7 + percent(bubble.value, maxValue) / 5.4;
          const selected = bubble.id === selectedBubbleId;
          return (
            <g
              className="map-hotspot"
              key={bubble.id}
              onClick={() => onSelectBubble?.(bubble)}
              onMouseEnter={() => setHoveredId(bubble.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(bubble.id)}
              onBlur={() => setHoveredId(null)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelectBubble?.(bubble);
              }}
              transform={`translate(${bubble.x}, ${bubble.y})`}
              tabIndex={0}
              role="button"
              aria-label={bubble.label}
            >
              <circle className={selected ? "venue-pulse is-selected" : "venue-pulse"} r={radius + 7} />
              <circle className="venue-dot" r={radius} />
            </g>
          );
        })}
        {hovered ? (
          <foreignObject
            className="map-tooltip"
            x={Math.min(Math.max(hovered.x + 14, 12), mapWidth - 230)}
            y={Math.min(Math.max(hovered.y - 66, 12), mapHeight - 90)}
            width="220"
            height="82"
          >
            <div>
              <strong>{hovered.label}</strong>
              {hovered.detail ? <span>{hovered.detail}</span> : null}
            </div>
          </foreignObject>
        ) : null}
      </svg>
      {legend ? <div className="map-legend">{legend}</div> : null}
    </div>
  );
}
