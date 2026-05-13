import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Database, Search, Loader2, Play } from 'lucide-react';
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
    <Card className="border-f1-border bg-f1-black h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-f1-white flex items-center gap-2 uppercase tracking-widest">
          <Database className="w-4 h-4 text-f1-red" />
          Real-Session Data (FastF1)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-f1-muted uppercase font-bold">Year</label>
            <select 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full bg-f1-dark border border-f1-border text-xs text-white p-2 rounded focus:border-f1-red outline-none"
            >
              {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-f1-muted uppercase font-bold">Driver</label>
            <input 
              value={driver}
              onChange={(e) => setDriver(e.target.value.toUpperCase())}
              placeholder="VER, HAM, LEC..."
              className="w-full bg-f1-dark border border-f1-border text-xs text-white p-2 rounded focus:border-f1-red outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-f1-muted uppercase font-bold">Event</label>
            <input 
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="Monza, Silverstone..."
              className="w-full bg-f1-dark border border-f1-border text-xs text-white p-2 rounded focus:border-f1-red outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-f1-muted uppercase font-bold">Session</label>
            <select 
              value={sessionType} 
              onChange={(e) => setSessionType(e.target.value as any)}
              className="w-full bg-f1-dark border border-f1-border text-xs text-white p-2 rounded focus:border-f1-red outline-none"
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
          className="w-full mt-4 py-2 bg-f1-red text-white text-[10px] font-bold uppercase tracking-widest hover:bg-f1-red-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          {loading ? 'Bootstrapping...' : 'Pull Official Data'}
        </button>

        {error && (
          <p className="mt-2 text-[10px] text-f1-red uppercase font-medium">{error}</p>
        )}
        
        <p className="mt-3 text-[9px] text-f1-muted leading-tight uppercase">
          Note: Outbound connection required. First load of an event may take 30-60s to bootstrap the F1 timing cache.
        </p>
      </CardContent>
    </Card>
  );
};
