import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Database, Loader2, Play } from 'lucide-react';
import { postLoadFastF1, type TelemetryPayload } from '../../services/api';
import { auth } from '../../lib/firebase';

interface FastF1LoaderProps {
  onDataLoaded: (payload: TelemetryPayload) => void;
}

export const FastF1Loader: React.FC<FastF1LoaderProps> = ({ onDataLoaded }) => {
  const [year, setYear] = useState(2023);
  const [event, setEvent] = useState('Monza');
  const [sessionType, setSessionType] = useState<'R' | 'Q' | 'S' | 'FP1' | 'FP2' | 'FP3'>('R');
  const [driver, setDriver] = useState('VER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const data = await postLoadFastF1({
        year,
        event,
        session_type: sessionType,
        driver_code: driver
      }, token);
      onDataLoaded(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load FastF1 data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-[#38383F] bg-[#1F1F27] rounded-none h-full shadow-2xl">
      <CardHeader className="pb-3 border-b border-[#38383F] mb-4">
        <CardTitle className="text-[12px] font-display font-extrabold text-white flex items-center gap-2 uppercase tracking-[0.2em]">
          <Database className="w-4 h-4 text-f1-red" />
          REAL-SESSION DATA (FastF1)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#67676D] uppercase font-bold tracking-wider">Year</label>
            <select 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full"
            >
              {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#67676D] uppercase font-bold tracking-wider">Driver</label>
            <input 
              value={driver}
              onChange={(e) => setDriver(e.target.value.toUpperCase())}
              placeholder="VER"
              className="w-full bg-[#2D2D35] border border-[#38383F] text-[13px] text-white p-2 rounded-none focus:border-f1-red outline-none font-display font-semibold uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#67676D] uppercase font-bold tracking-wider">Event</label>
            <input 
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="Monza"
              className="w-full bg-[#2D2D35] border border-[#38383F] text-[13px] text-white p-2 rounded-none focus:border-f1-red outline-none font-display font-semibold uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#67676D] uppercase font-bold tracking-wider">Session</label>
            <select 
              value={sessionType} 
              onChange={(e) => setSessionType(e.target.value as any)}
              className="w-full"
            >
              <option value="R">Race</option>
              <option value="Q">Qualifying</option>
              <option value="S">Sprint</option>
              <option value="FP1">Practice 1</option>
              <option value="FP2">Practice 2</option>
              <option value="FP3">Practice 3</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleLoad}
          disabled={loading}
          className="w-full mt-6 h-12 bg-f1-red text-white text-[12px] font-display font-extrabold uppercase tracking-[0.2em] hover:bg-f1-red-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 rounded-none shadow-[0_10px_20px_rgba(225,6,0,0.2)]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>BOOTSTRAPPING...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>PULL OFFICIAL DATA</span>
            </>
          )}
        </button>

        {error && (
          <p className="mt-4 text-[10px] text-f1-red uppercase font-black text-center bg-f1-red/10 py-2 border border-f1-red/20">{error}</p>
        )}
        
        <p className="mt-4 text-[10px] text-[#67676D] leading-relaxed uppercase font-medium italic">
          Note: Outbound connection required. First load of an event may take 30-60s to bootstrap the F1 timing cache.
        </p>
      </CardContent>
    </Card>
  );
};
