"use client";

import { useState } from "react";
import { AlertTriangle, Aperture, CircuitBoard, Grid3X3, Leaf, ScanLine, Unplug, Waves } from "lucide-react";

export type ThermalAnomaly = {
  id: string;
  name: string;
  description: string;
  severity: string;
  icon?: string | null;
  inspectionValue?: string;
};

const iconMap = {
  cell: Aperture,
  grid: Grid3X3,
  diode: CircuitBoard,
  string: Waves,
  offline: Unplug,
  junction: CircuitBoard,
  crack: ScanLine,
  layers: Waves,
  soiling: Aperture,
  leaf: Leaf,
  shadow: Waves,
  missing: Grid3X3,
  pid: AlertTriangle,
  inverter: CircuitBoard
};

const fallbackIcons = [Aperture, Grid3X3, CircuitBoard, Waves, Unplug, CircuitBoard, ScanLine, Waves, Aperture, Leaf, Waves, Grid3X3, AlertTriangle, CircuitBoard];

export function ThermalAnomalyGrid({ anomalies }: { anomalies: ThermalAnomaly[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return <div className="thermal-anomaly-grid">{anomalies.map((anomaly, index) => {
    const Icon = iconMap[anomaly.icon as keyof typeof iconMap] ?? fallbackIcons[index % fallbackIcons.length];
    const name = anomaly.name;
    const expanded = open === name;
    return <button type="button" className={`thermal-anomaly-card ${expanded ? "expanded" : ""}`} onClick={() => setOpen(expanded ? null : name)} key={name} aria-expanded={expanded}>
      <span className={`severity severity-${anomaly.severity.toLowerCase()}`}>{anomaly.severity}</span>
      <Icon size={28} />
      <h3>{name}</h3>
      <p>{anomaly.description}</p>
      <small>Tap or hover for inspection value</small>
      <div className="anomaly-value">{anomaly.inspectionValue ?? "Thermal and RGB evidence helps the O&M team confirm priority and plan targeted field action."}</div>
    </button>;
  })}</div>;
}
