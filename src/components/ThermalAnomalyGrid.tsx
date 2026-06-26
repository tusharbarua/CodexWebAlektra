"use client";

import { useState } from "react";
import { AlertTriangle, Aperture, CircuitBoard, Grid3X3, Leaf, ScanLine, Unplug, Waves } from "lucide-react";
import { thermalAnomalies } from "@/data/thermal";

const icons = [Aperture, Grid3X3, CircuitBoard, Waves, Unplug, CircuitBoard, ScanLine, Waves, Aperture, Leaf, Waves, Grid3X3, AlertTriangle, CircuitBoard];

export function ThermalAnomalyGrid() {
  const [open, setOpen] = useState<string | null>(null);
  return <div className="thermal-anomaly-grid">{thermalAnomalies.map(([name, description, severity], index) => {
    const Icon = icons[index];
    const expanded = open === name;
    return <button type="button" className={`thermal-anomaly-card ${expanded ? "expanded" : ""}`} onClick={() => setOpen(expanded ? null : name)} key={name} aria-expanded={expanded}>
      <span className={`severity severity-${severity.toLowerCase()}`}>{severity}</span>
      <Icon size={28} />
      <h3>{name}</h3>
      <p>{description}</p>
      <small>Tap or hover for inspection value</small>
      <div className="anomaly-value">Thermal and RGB evidence helps the O&M team confirm priority and plan targeted field action.</div>
    </button>;
  })}</div>;
}
