"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { subdivisions } from "@/data/site";

export function SubdivisionTabs() {
  const [active, setActive] = useState(subdivisions[0]);
  const router = useRouter();

  return (
    <div className="tabs">
      <div className="tab-list" role="tablist" aria-label="Alektra subdivisions">
        {subdivisions.map((item) => (
          <button
            className={`tab-button ${active.key === item.key ? "active" : ""}`}
            key={item.key}
            onClick={() => item.key === "thermal" ? router.push("/thermal") : setActive(item)}
            role="tab"
            aria-selected={active.key === item.key}
          >
            <span>
              <strong>{item.name}</strong>
              <br />
              <small>{item.label}</small>
            </span>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </div>
      <div className="tab-panel" role="tabpanel">
        <p className="eyebrow">{active.label}</p>
        <h2>{active.headline}</h2>
        <p style={{ color: "rgba(255,255,255,.78)", maxWidth: 680 }}>{active.body}</p>
        <div className="pill-row">
          {active.services.map((service) => (
            <span className="pill" key={service}>
              {service}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
