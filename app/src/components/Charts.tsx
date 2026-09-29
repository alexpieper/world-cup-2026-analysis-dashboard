import type { RegressionPoint } from "../types/data";
import { clamp, percent } from "../lib/format";
import { useMemo, useState } from "react";

export function BarList<T>({
  items,
  getLabel,
  getValue,
  getDetail,
  max,
  valuePrefix = "",
  valueSuffix = ""
}: {
  items: T[];
  getLabel: (item: T) => string;
  getValue: (item: T) => number;
  getDetail?: (item: T) => string;
  max?: number;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  const chartMax = max ?? Math.max(...items.map(getValue), 1);

  return (
    <div className="bar-list">
      {items.map((item) => {
        const value = getValue(item);
        return (
          <div className="bar-row" key={getLabel(item)}>
            <div className="bar-row-top">
              <span>{getLabel(item)}</span>
              <strong>
                {valuePrefix}
                {value}
                {valueSuffix}
              </strong>
            </div>
            <div className="bar-track" aria-hidden="true">
              <span style={{ width: `${percent(value, chartMax)}%` }} />
            </div>
            {getDetail ? <small>{getDetail(item)}</small> : null}
          </div>
        );
      })}
    </div>
  );
}

export function SortableBarList<T>({
  items,
  options,
  getLabel,
  getDetail,
  valuePrefix = "",
  valueSuffix = ""
}: {
  items: T[];
  options: Array<{
    label: string;
    valueSuffix?: string;
    valuePrefix?: string;
    getValue: (item: T) => number;
  }>;
  getLabel: (item: T) => string;
  getDetail?: (item: T) => string;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = options[selectedIndex] ?? options[0];
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const delta = selected.getValue(a) - selected.getValue(b);
      return -delta;
    });
  }, [items, selected]);

  return (
    <div className="sortable-list">
      <label className="sort-control compact-sort">
        <span>Sort</span>
        <select value={selectedIndex} onChange={(event) => setSelectedIndex(Number(event.target.value))}>
          {options.map((option, index) => (
            <option value={index} key={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <BarList
        items={sortedItems}
        getLabel={getLabel}
        getValue={selected.getValue}
        getDetail={getDetail}
        valuePrefix={selected.valuePrefix ?? valuePrefix}
        valueSuffix={selected.valueSuffix ?? valueSuffix}
      />
    </div>
  );
}

export function SplitBar({
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  suffix = ""
}: {
  leftLabel: string;
  rightLabel: string;
  leftValue: number;
  rightValue: number;
  suffix?: string;
}) {
  const total = Math.max(leftValue + rightValue, 1);
  return (
    <div className="split-bar">
      <div className="split-bar-labels">
        <span>
          {leftLabel} <strong>{leftValue}{suffix}</strong>
        </span>
        <span>
          <strong>{rightValue}{suffix}</strong> {rightLabel}
        </span>
      </div>
      <div className="split-track" aria-hidden="true">
        <span className="split-left" style={{ width: `${(leftValue / total) * 100}%` }} />
        <span className="split-right" style={{ width: `${(rightValue / total) * 100}%` }} />
      </div>
    </div>
  );
}

export function PositionMix({ counts }: { counts: Record<string, number> }) {
  const keys = ["GK", "DEF", "MID", "FWD"];
  const total = keys.reduce((sum, key) => sum + (counts[key] ?? 0), 0);
  return (
    <div className="position-mix" aria-label="Squad position mix">
      {keys.map((key) => (
        <span
          key={key}
          className={`position-segment position-${key.toLowerCase()}`}
          style={{ width: `${percent(counts[key] ?? 0, total)}%` }}
          title={`${key}: ${counts[key] ?? 0}`}
        >
          {key}
        </span>
      ))}
    </div>
  );
}

export function ScatterPlot({
  points,
  slope,
  intercept,
  xLabel,
  yLabel
}: {
  points: RegressionPoint[];
  slope: number;
  intercept: number;
  xLabel: string;
  yLabel: string;
}) {
  const [hoveredPoint, setHoveredPoint] = useState<(RegressionPoint & { sx: number; sy: number }) | null>(null);
  const width = 620;
  const height = 340;
  const padding = 46;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 1);

  const scaleX = (value: number) =>
    padding + ((value - minX) / Math.max(maxX - minX, 1)) * (width - padding * 2);
  const scaleY = (value: number) =>
    height - padding - ((value - minY) / Math.max(maxY - minY, 1)) * (height - padding * 2);

  const lineStartY = slope * minX + intercept;
  const lineEndY = slope * maxX + intercept;

  const enrichedPoints = points.map((point) => ({
    ...point,
    sx: scaleX(point.x),
    sy: scaleY(point.y)
  }));

  return (
    <svg className="scatter-plot" viewBox={`0 0 ${width} ${height}`} role="img">
      <title>
        Regression scatter plot: {xLabel} against {yLabel}
      </title>
      <rect x="0" y="0" width={width} height={height} rx="8" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
      <line
        className="regression-line"
        x1={scaleX(minX)}
        y1={scaleY(clamp(lineStartY, minY, maxY))}
        x2={scaleX(maxX)}
        y2={scaleY(clamp(lineEndY, minY, maxY))}
      />
      {enrichedPoints.map((point) => (
        <g
          className="scatter-point"
          key={`${point.id}-${point.label}`}
          tabIndex={0}
          onMouseEnter={() => setHoveredPoint(point)}
          onMouseLeave={() => setHoveredPoint(null)}
          onFocus={() => setHoveredPoint(point)}
          onBlur={() => setHoveredPoint(null)}
          aria-label={`${point.label}: ${xLabel} ${point.x}, ${yLabel} ${point.y}`}
        >
          <circle cx={point.sx} cy={point.sy} r="5" />
        </g>
      ))}
      {hoveredPoint ? (
        <g
          className="scatter-tooltip"
          transform={`translate(${clamp(hoveredPoint.sx + 12, 54, width - 230)}, ${clamp(
            hoveredPoint.sy - 54,
            28,
            height - 92
          )})`}
        >
          <rect width="210" height="74" rx="8" />
          <text x="12" y="22" className="scatter-tooltip-title">
            {hoveredPoint.label}
          </text>
          <text x="12" y="43">
            {xLabel}: {hoveredPoint.x}
          </text>
          <text x="12" y="62">
            {yLabel}: {hoveredPoint.y}
          </text>
        </g>
      ) : null}
      <text x={width / 2} y={height - 12} textAnchor="middle">
        {xLabel}
      </text>
      <text x="15" y={height / 2} transform={`rotate(-90 15 ${height / 2})`} textAnchor="middle">
        {yLabel}
      </text>
    </svg>
  );
}
