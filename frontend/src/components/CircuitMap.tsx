import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "260px", borderRadius: "12px" };

/** Monza-inspired bounding region for demo overlays */
const center = { lat: 45.6156, lng: 9.2811 };

type Props = {
  apiKey?: string;
};

export function CircuitMap({ apiKey }: Props) {
  if (!apiKey) {
    return (
      <div className="rounded-xl border border-dashed border-f1-border bg-black/40 p-4 text-sm text-f1-muted">
        <p className="font-semibold text-white">Circuit map</p>
        <p className="mt-2">
          Set <span className="font-mono text-xs">VITE_GOOGLE_MAPS_API_KEY</span> to enable Google Maps with pit lane and
          corner markers.
        </p>
      </div>
    );
  }

  return <CircuitMapInner apiKey={apiKey} />;
}

function CircuitMapInner({ apiKey }: { apiKey: string }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    version: "weekly",
  });

  if (loadError) {
    return (
      <div className="rounded-xl border border-f1-border bg-black/40 p-4 text-sm text-f1-muted">
        Unable to load Google Maps: {loadError.message}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="rounded-xl border border-f1-border bg-black/40 p-6 text-sm text-f1-muted">
        Loading circuit map…
      </div>
    );
  }

  return (
    <div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        options={{
          disableDefaultUI: true,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#1f1f23" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0b" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#f4f4f5" }] },
          ],
        }}
      >
        <Marker position={{ lat: 45.619, lng: 9.285 }} title="Pit lane" />
        <Marker position={{ lat: 45.618, lng: 9.27 }} title="Sector boundary A" />
        <Marker position={{ lat: 45.612, lng: 9.275 }} title="Sector boundary B" />
      </GoogleMap>
        <p className="mt-2 text-xs text-f1-muted">
        Map data © Google. Markers are illustrative anchors for UI overlays.
      </p>
    </div>
  );
}
