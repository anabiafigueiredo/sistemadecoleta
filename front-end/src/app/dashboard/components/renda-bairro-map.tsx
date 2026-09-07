"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
} from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import L from "leaflet";
import {
  matchGeoBairroName,
  normalizeBairroName,
} from "@/lib/bairro-aliases";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";

import "leaflet/dist/leaflet.css";

type RendaItem = DashboardStats["rendaPorBairro"][number];

type GeoProps = { nome: string };

const NO_DATA_FILL = "#e5ebe7";
const NO_DATA_STROKE = "#b7c4bc";
const HAS_DATA_STROKE = "#0f3d38";

/** Escala: renda baixa (vulnerável) → quente; renda alta → teal. */
function colorForRenda(value: number, min: number, max: number): string {
  if (!Number.isFinite(value) || max <= min) return "#0f766e";
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // invertido: baixo = vermelho/âmbar, alto = teal
  const stops = [
    [190, 18, 60], // #be123c
    [194, 65, 12], // #c2410c
    [202, 138, 4], // #ca8a04
    [14, 116, 144], // #0e7490
    [15, 118, 110], // #0f766e
  ];
  const scaled = t * (stops.length - 1);
  const i = Math.floor(scaled);
  const f = scaled - i;
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const r = Math.round(a[0] + (b[0] - a[0]) * f);
  const g = Math.round(a[1] + (b[1] - a[1]) * f);
  const bl = Math.round(a[2] + (b[2] - a[2]) * f);
  return `rgb(${r},${g},${bl})`;
}

function FitBounds({ geo }: { geo: FeatureCollection }) {
  const map = useMap();
  useEffect(() => {
    try {
      const layer = L.geoJSON(geo as Parameters<typeof L.geoJSON>[0]);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [12, 12], maxZoom: 12 });
      }
    } catch {
      map.setView([-3.1, -60.0], 11);
    }
  }, [geo, map]);
  return null;
}

function Legend({
  min,
  max,
  hasData,
}: {
  min: number;
  max: number;
  hasData: boolean;
}) {
  if (!hasData) return null;
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-md border border-border bg-white/95 px-2.5 py-2 text-[10px] shadow-sm sm:text-[11px]">
      <p className="mb-1 font-medium text-foreground">Renda média</p>
      <div
        className="mb-1 h-2 w-28 rounded-sm sm:w-36"
        style={{
          background:
            "linear-gradient(90deg,#be123c,#c2410c,#ca8a04,#0e7490,#0f766e)",
        }}
      />
      <div className="flex justify-between text-muted-foreground">
        <span>{formatCurrency(min)}</span>
        <span>{formatCurrency(max)}</span>
      </div>
      <p className="mt-1 text-muted-foreground">← mais vulnerável</p>
    </div>
  );
}

export function RendaBairroMap({
  rendaPorBairro,
}: {
  rendaPorBairro: RendaItem[];
}) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/geo/manaus-bairros.geojson")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: FeatureCollection) => {
        if (!cancelled) setGeo(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Não foi possível carregar o mapa.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { byGeoName, min, max, unmatched } = useMemo(() => {
    if (!geo) {
      return {
        byGeoName: new Map<string, RendaItem>(),
        min: 0,
        max: 0,
        unmatched: [] as string[],
      };
    }
    const geoNames = geo.features
      .map((f) => String((f.properties as GeoProps | null)?.nome ?? ""))
      .filter(Boolean);

    const map = new Map<string, RendaItem>();
    const missed: string[] = [];
    for (const item of rendaPorBairro) {
      const matched = matchGeoBairroName(item.bairro, geoNames);
      if (matched) {
        map.set(normalizeBairroName(matched), item);
      } else {
        missed.push(item.bairro);
      }
    }
    const values = [...map.values()].map((v) => v.rendaMedia);
    return {
      byGeoName: map,
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
      unmatched: missed,
    };
  }, [geo, rendaPorBairro]);

  if (loadError) {
    return (
      <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
        {loadError}
      </p>
    );
  }

  if (!geo) {
    return (
      <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Carregando mapa…
      </p>
    );
  }

  const styleFeature = (feature?: Feature<Geometry, GeoProps>): PathOptions => {
    const nome = feature?.properties?.nome ?? "";
    const data = byGeoName.get(normalizeBairroName(nome));
    if (!data) {
      return {
        fillColor: NO_DATA_FILL,
        fillOpacity: 0.85,
        color: NO_DATA_STROKE,
        weight: 0.8,
      };
    }
    return {
      fillColor: colorForRenda(data.rendaMedia, min, max),
      fillOpacity: 0.88,
      color: HAS_DATA_STROKE,
      weight: 1.4,
    };
  };

  const onEachFeature = (feature: Feature<Geometry, GeoProps>, layer: Layer) => {
    const nome = feature.properties?.nome ?? "Bairro";
    const data = byGeoName.get(normalizeBairroName(nome));
    const label = data
      ? `<strong>${nome}</strong><br/>Renda média: ${formatCurrency(data.rendaMedia)}<br/>Famílias: ${data.familias}`
      : `<strong>${nome}</strong><br/><span style="opacity:.75">Sem dados nesta coleta</span>`;

    // Hover no desktop; popup no toque/clique (mobile não tem hover).
    layer.bindTooltip(label, {
      sticky: true,
      className: "bairro-map-tooltip",
      opacity: 0.96,
    });
    layer.bindPopup(label, { className: "bairro-map-popup", maxWidth: 240 });

    layer.on({
      mouseover: (e) => {
        const target = e.target as L.Path;
        target.setStyle({ weight: 2.2, fillOpacity: 0.95 });
        target.bringToFront();
      },
      mouseout: (e) => {
        const target = e.target as L.Path;
        target.setStyle(styleFeature(feature));
      },
      click: (e) => {
        const target = e.target as L.Layer & { openPopup?: () => void };
        target.openPopup?.();
      },
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-md">
      <MapContainer
        center={[-3.1, -60.02]}
        zoom={11}
        scrollWheelZoom={false}
        className="h-full w-full bg-[#eef3f0]"
        style={{ height: "100%", width: "100%", minHeight: 220 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.55}
        />
        <FitBounds geo={geo} />
        <GeoJSON
          key={`${rendaPorBairro.map((r) => `${r.bairro}:${r.rendaMedia}`).join("|")}`}
          data={geo}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
      <Legend min={min} max={max} hasData={byGeoName.size > 0} />
      {unmatched.length > 0 && (
        <p className="absolute right-2 top-2 z-[1000] max-w-[min(12rem,55%)] break-words rounded bg-white/90 px-2 py-1 text-[10px] leading-snug text-muted-foreground shadow-sm sm:max-w-[45%]">
          Sem polígono: {unmatched.join(", ")}
        </p>
      )}
    </div>
  );
}
