export const thermalAnomalies = [
  ["Cell Hot Spot", "Single-cell overheating caused by a defect, micro-crack, shading or mismatch.", "High", "cell"],
  ["Multi-Cell Hot Spot", "Multiple overheated cells indicating a broader module defect or degradation.", "High", "grid"],
  ["Bypass Diode Activation", "One-third or two-thirds of a module appears abnormal when a bypass diode activates.", "High", "diode"],
  ["String Anomaly", "Several modules in one string show abnormal behavior, indicating a string-level electrical issue.", "Critical", "string"],
  ["Offline Module", "A complete module appears abnormal, suggesting a disconnected or non-performing module.", "Critical", "offline"],
  ["Junction Box Heating", "Concentrated heat near the junction box can reveal connection or component problems.", "Critical", "junction"],
  ["Cracked Module", "Thermal patterns can reveal cracked cells or physical surface damage.", "High", "crack"],
  ["Delamination / Degradation", "Aging or module defects create abnormal heat signatures and reduced performance.", "Medium", "layers"],
  ["Soiling", "Dust, dirt, bird droppings or debris create local heating and reduce output.", "Medium", "soiling"],
  ["Vegetation Shading", "Plant growth blocks irradiance and creates repeatable shaded thermal patterns.", "Medium", "leaf"],
  ["Shadowing", "Structures, rows or nearby objects create underperforming shaded areas.", "Low", "shadow"],
  ["Missing / Damaged Module", "RGB and thermal review identifies missing or physically compromised modules.", "Critical", "missing"],
  ["Suspected PID", "A repeating pattern can indicate potential-induced degradation or system-level underperformance.", "High", "pid"],
  ["Inverter / Combiner Issue", "Array-wide imbalance can indicate an upstream inverter, combiner or electrical issue.", "Critical", "inverter"]
] as const;

export const standardPoints = [
  "Most common aerial inspection level for PV systems globally.",
  "Infrared imagery at 5-6 cm/px and RGB imagery at 1.5-2 cm/px.",
  "Balances inspection speed, cost and useful operating detail.",
  "Detects sub-module anomalies while retaining full-site context.",
  "Guides field visits, truck rolls and maintenance priorities.",
  "A drone can typically cover around 30 MW per day, subject to site and flight conditions.",
  "Ideal for quarterly, semi-annual and annual O&M inspections.",
  "Suitable for commissioning, EPC handover and baseline assessment.",
  "Temperature readings may vary by a few degrees due to sensor limitations."
];

export const comprehensivePoints = [
  "IEC-aligned detailed aerial infrared inspection level.",
  "Infrared imagery at 3 cm/px and RGB imagery at 1 cm/px.",
  "Lower-altitude, slower flight for granular sub-module insight.",
  "Supports absolute temperature accuracy and temperature-based prioritization.",
  "Helps document severe and warranty-relevant anomalies.",
  "Reveals junction-box heating, abnormal cells, diode faults, cracks and delamination.",
  "Ideal for warranty claims, due diligence, commissioning and underperformance diagnosis.",
  "Creates a high-detail baseline for the 20+ year life of the asset.",
  "Requires more on-site time and analysis than a Standard inspection."
];
