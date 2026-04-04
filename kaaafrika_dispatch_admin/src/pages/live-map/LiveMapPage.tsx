import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, RefreshCw, Truck, Wifi } from 'lucide-react';
import { dispatchersApi } from '../../api/dispatchers';
import { clsx } from 'clsx';

type NormalizedLocation = {
  id: number;
  name: string;
  phone_number: string;
  status: 'ONLINE' | 'OFFLINE';
  location_latitude: number;
  location_longitude: number;
  x: number;
  y: number;
};

type MapDriver = {
  id: number;
  name: string;
  phone_number: string;
  status: 'ONLINE' | 'OFFLINE';
  location_latitude: number | null;
  location_longitude: number | null;
};

export function LiveMapPage() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const { isLoaded } = useJsApiLoader({
    id: 'dispatch-admin-live-map',
    googleMapsApiKey: apiKey ?? '',
  });

  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['dispatcher-locations'],
    queryFn: () => dispatchersApi.getLocations(),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
  const { data: onlineListData, isLoading: onlineListLoading } = useQuery({
    queryKey: ['dispatchers-online'],
    queryFn: () => dispatchersApi.list({ status: 'ONLINE', per_page: 200, page: 1 }),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const locations = useMemo(() => data?.data ?? [], [data?.data]);
  const onlineDispatchers = useMemo(() => onlineListData?.data?.data ?? [], [onlineListData?.data?.data]);
  const isOnlineStatus = (status?: string | null) => status?.toString().toUpperCase() === 'ONLINE';

  const mapCandidates = useMemo<MapDriver[]>(() => {
    if (!onlineListData) {
      return locations.map((d) => ({
        id: d.id,
        name: d.name,
        phone_number: d.phone_number,
        status: (d.status ?? 'OFFLINE').toString().toUpperCase() as 'ONLINE' | 'OFFLINE',
        location_latitude: d.location_latitude ?? null,
        location_longitude: d.location_longitude ?? null,
      }));
    }
    const byId = new Map(locations.map((d) => [d.id, d]));
    return onlineDispatchers.map((d) => {
      const loc = byId.get(d.id);
      const status = (loc?.status ?? d.status ?? 'OFFLINE').toString().toUpperCase() as 'ONLINE' | 'OFFLINE';
      return {
        id: d.id,
        name: d.name,
        phone_number: d.phone_number,
        status,
        location_latitude: (loc?.location_latitude ?? d.location_latitude) ?? null,
        location_longitude: (loc?.location_longitude ?? d.location_longitude) ?? null,
      };
    });
  }, [locations, onlineDispatchers, onlineListData]);

  const mapCandidatesById = useMemo(() => new Map(mapCandidates.map((d) => [d.id, d])), [mapCandidates]);

  const { points, bounds } = useMemo(() => {
    const valid = mapCandidates.filter(
      (d) => Number.isFinite(d.location_latitude) && Number.isFinite(d.location_longitude)
    ) as Array<MapDriver & { location_latitude: number; location_longitude: number }>;
    if (valid.length === 0) {
      return { points: [] as NormalizedLocation[], bounds: null as null | { minLat: number; maxLat: number; minLng: number; maxLng: number } };
    }

    let minLat = valid[0].location_latitude;
    let maxLat = valid[0].location_latitude;
    let minLng = valid[0].location_longitude;
    let maxLng = valid[0].location_longitude;

    for (const d of valid) {
      minLat = Math.min(minLat, d.location_latitude);
      maxLat = Math.max(maxLat, d.location_latitude);
      minLng = Math.min(minLng, d.location_longitude);
      maxLng = Math.max(maxLng, d.location_longitude);
    }

    const latSpan = maxLat - minLat || 1;
    const lngSpan = maxLng - minLng || 1;

    const normalized = valid.map((d) => ({
      ...d,
      x: ((d.location_longitude - minLng) / lngSpan) * 100,
      y: 100 - ((d.location_latitude - minLat) / latSpan) * 100,
    }));

    return { points: normalized, bounds: { minLat, maxLat, minLng, maxLng } };
  }, [mapCandidates]);

  const updatedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;
  const onlineCount = onlineListData ? onlineDispatchers.length : locations.filter((d) => isOnlineStatus(d.status)).length;
  const defaultCenter = { lat: 4.9757, lng: 8.3417 };
  const mapCenter = useMemo(() => {
    if (!bounds) return defaultCenter;
    return {
      lat: (bounds.minLat + bounds.maxLat) / 2,
      lng: (bounds.minLng + bounds.maxLng) / 2,
    };
  }, [bounds]);
  const getCarIcon = (color: string, size: number) => ({
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none">
        <path d="M3 12.5L5.2 7.4C5.6 6.5 6.5 6 7.5 6H16.5C17.5 6 18.4 6.5 18.8 7.4L21 12.5V17C21 17.6 20.6 18 20 18H19C18.4 18 18 17.6 18 17V16H6V17C6 17.6 5.6 18 5 18H4C3.4 18 3 17.6 3 17V12.5Z" fill="${color}"/>
        <circle cx="7" cy="16" r="2" fill="#ffffff"/>
        <circle cx="17" cy="16" r="2" fill="#ffffff"/>
        <rect x="7" y="9" width="10" height="3" fill="#ffffff" opacity="0.25"/>
      </svg>`
    )}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  });
  const focusDriver = (driver: { location_latitude: number; location_longitude: number }) => {
    if (!mapRef.current) return;
    mapRef.current.panTo({ lat: driver.location_latitude, lng: driver.location_longitude });
    mapRef.current.setZoom(15);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Live Map</h2>
          <p className="text-xs text-slate-500 mt-1">
            Showing online dispatchers with active GPS coordinates. Auto-refreshes every 30 seconds.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <RefreshCw className={clsx('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          {updatedAt ? `Last update: ${updatedAt}` : 'Waiting for data'}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-500" />
              <p className="section-title">Dispatcher Locations</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              {onlineCount} online
            </div>
          </div>

          <div className="relative w-full aspect-[16/9] rounded-2xl border border-slate-100 overflow-hidden bg-slate-50">
            {!apiKey ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                Missing Google Maps API key.
              </div>
            ) : !isLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                Loading map...
              </div>
            ) : (
              <>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={points.length ? mapCenter : defaultCenter}
                  zoom={points.length ? 12 : 11}
                  options={{
                    fullscreenControl: false,
                    streetViewControl: false,
                    mapTypeControl: false,
                  }}
                  onLoad={(map) => {
                    mapRef.current = map;
                    if (bounds) {
                      const mapBounds = new google.maps.LatLngBounds(
                        { lat: bounds.minLat, lng: bounds.minLng },
                        { lat: bounds.maxLat, lng: bounds.maxLng }
                      );
                      map.fitBounds(mapBounds);
                    }
                  }}
                >
                  {points.map((d) => (
                    <MarkerF
                      key={d.id}
                      position={{ lat: d.location_latitude, lng: d.location_longitude }}
                      title={`${d.name} (${d.phone_number})`}
                      icon={
                        d.status === 'ONLINE'
                          ? getCarIcon(d.id === selectedId ? '#0f766e' : '#10b981', d.id === selectedId ? 56 : 44)
                          : {
                              path: google.maps.SymbolPath.CIRCLE,
                              scale: d.id === selectedId ? 10 : 8,
                              fillOpacity: 1,
                              strokeWeight: 2,
                              strokeColor: '#ffffff',
                              fillColor: '#94a3b8',
                            }
                      }
                      onClick={() => {
                        setSelectedId(d.id);
                        focusDriver(d);
                      }}
                    />
                  ))}
                </GoogleMap>
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 bg-white/60">
                    Loading live locations...
                  </div>
                ) : points.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 bg-white/60">
                    No live dispatcher locations available.
                  </div>
                ) : null}
              </>
            )}
          </div>

          {bounds && (
            <div className="mt-3 text-[11px] text-slate-400 flex flex-wrap gap-3">
              <span>Lat: {bounds.minLat.toFixed(4)} to {bounds.maxLat.toFixed(4)}</span>
              <span>Lng: {bounds.minLng.toFixed(4)} to {bounds.maxLng.toFixed(4)}</span>
            </div>
          )}
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-slate-500" />
            <p className="section-title">Online Dispatchers</p>
          </div>
          {onlineListLoading || isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : onlineDispatchers.length === 0 ? (
            <p className="text-sm text-slate-400">No online dispatchers right now.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {onlineDispatchers.map((d) => {
                const matched = mapCandidatesById.get(d.id);
                const hasLocation =
                  matched && Number.isFinite(matched.location_latitude) && Number.isFinite(matched.location_longitude);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      if (!hasLocation) return;
                      setSelectedId(d.id);
                      focusDriver({
                        location_latitude: matched.location_latitude as number,
                        location_longitude: matched.location_longitude as number,
                      });
                    }}
                    className={clsx(
                      'w-full text-left flex items-center justify-between gap-3 p-2.5 rounded-xl border transition',
                      d.id === selectedId
                        ? 'border-emerald-300 bg-emerald-50/70 ring-2 ring-emerald-200'
                        : 'border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30',
                      !hasLocation && 'opacity-70 cursor-not-allowed'
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">{d.name}</p>
                      <p className="text-[11px] text-slate-400">{d.phone_number}</p>
                    </div>
                    <div className="text-[11px] text-slate-400 text-right">
                      {hasLocation ? (
                        <>
                          <p>{(matched.location_latitude as number).toFixed(4)}</p>
                          <p>{(matched.location_longitude as number).toFixed(4)}</p>
                        </>
                      ) : (
                        <p>No location</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
