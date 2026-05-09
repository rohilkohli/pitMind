import type { RaceState } from "../../hooks/useFirebaseRaceState";

export function LiveTrackMap({ raceState }: { raceState: RaceState | null }) {
  const topDrivers = raceState?.standings?.slice(0, 5) || [];

  return (
    <div className="relative w-full rounded-xl border border-pit-stroke bg-black/40 p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-pit-muted">Live Track Map</h3>
      
      <div className="relative mx-auto aspect-[16/9] w-full max-w-2xl bg-carbon rounded-lg overflow-hidden flex items-center justify-center">
        {/* Simplified SVG Circuit (e.g. Monza shape) */}
        <svg viewBox="0 0 800 450" className="w-full h-full opacity-50" preserveAspectRatio="xMidYMid meet">
          <path 
            d="M 150 250 L 250 150 L 550 150 C 650 150 700 200 650 300 L 550 350 L 200 350 C 100 350 100 300 150 250 Z" 
            fill="none" 
            stroke="var(--pit-stroke)" 
            strokeWidth="20" 
            strokeLinejoin="round"
          />
          <path 
            d="M 150 250 L 250 150 L 550 150 C 650 150 700 200 650 300 L 550 350 L 200 350 C 100 350 100 300 150 250 Z" 
            fill="none" 
            stroke="#1f1f23" 
            strokeWidth="16" 
            strokeLinejoin="round"
          />
        </svg>

        {/* Dynamic Blips for Top 5 Drivers */}
        {topDrivers.map((driver, i) => {
          // Mock positions along the SVG path based on lap percentage or gap
          // For demo purposes, spreading them out based on position
          const xOffset = 200 + (i * 80);
          const yOffset = 350;

          return (
            <div 
              key={driver.driver}
              className="absolute flex flex-col items-center justify-center transition-all duration-1000 ease-linear"
              style={{ 
                left: `${(xOffset / 800) * 100}%`, 
                top: `${(yOffset / 450) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div 
                className="h-4 w-4 rounded-full border-2 border-white shadow-lg shadow-black/50"
                style={{ backgroundColor: driver.team_color }}
              />
              <span className="mt-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                {driver.driver}
              </span>
            </div>
          );
        })}
        
        {topDrivers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-pit-muted">
            Waiting for live tracking data...
          </div>
        )}
      </div>
    </div>
  );
}
