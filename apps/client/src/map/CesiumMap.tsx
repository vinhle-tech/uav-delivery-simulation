import { useEffect, useRef } from 'react';
import {
  CallbackPositionProperty, CallbackProperty, Cartesian2, Cartesian3, Color, ConstantProperty,
  Ellipsoid, EllipsoidTerrainProvider, Entity, HeightReference, ImageryLayer,
  LabelStyle, OpenStreetMapImageryProvider, VerticalOrigin, Viewer,
} from 'cesium';
import type { SimulationSnapshot } from '@uav/simulation-core';
import { deliveryPoint, drones, station, waypoints } from '../data/demo';
import type { GeoPoint } from '../types/domain';

const foreground = Color.fromCssColorString('#f8fafc');

function at(p: GeoPoint, result?: Cartesian3): Cartesian3 {
  return Cartesian3.fromDegrees(p.lon, p.lat, p.altitudeM, Ellipsoid.WGS84, result);
}

function tag(text: string, tint: Color) {
  return {
    text, font: '600 13px sans-serif', fillColor: foreground,
    showBackground: true, backgroundColor: tint.withAlpha(0.90),
    backgroundPadding: new Cartesian2(8, 5), verticalOrigin: VerticalOrigin.BOTTOM,
    pixelOffset: new Cartesian2(0, -18), style: LabelStyle.FILL,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  };
}

/** Đổi mét sang độ tại vĩ độ nhỏ; chỉ dùng để vẽ 4 rotor, không dùng định tuyến. */
function offsetPoint(p: GeoPoint, eastM: number, northM: number): GeoPoint {
  const degLat = northM / 111_320;
  const degLon = eastM / (111_320 * Math.cos(p.lat * Math.PI / 180));
  return { lon: p.lon + degLon, lat: p.lat + degLat, altitudeM: p.altitudeM };
}

function flyTo(viewer: Viewer, p: GeoPoint, height = 900) {
  viewer.camera.flyTo({ destination: Cartesian3.fromDegrees(p.lon, p.lat, height), duration: 0.7 });
}

interface Props {
  selectedDroneId: string;
  snapshots: Record<string, SimulationSnapshot>;
  follow: boolean;
  onFollowChange: (value: boolean) => void;
  onReady: () => void;
  onError: (message: string) => void;
}

export default function CesiumMap({
  selectedDroneId, snapshots, follow, onFollowChange, onReady, onError,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const entityRef = useRef<Map<string, Entity>>(new Map());
  const snapshotsRef = useRef(snapshots);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  snapshotsRef.current = snapshots;
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!container.current || viewerRef.current) return;
    let viewer: Viewer | null = null;
    try {
      const imagery = new ImageryLayer(new OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' }));
      viewer = new Viewer(container.current, {
        baseLayer: imagery,
        terrainProvider: new EllipsoidTerrainProvider(),
        animation: false, timeline: false, baseLayerPicker: false,
        geocoder: false, homeButton: false, sceneModePicker: false,
        navigationHelpButton: false, infoBox: false, selectionIndicator: false,
        fullscreenButton: false,
      });
      viewerRef.current = viewer;
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.baseColor = Color.fromCssColorString('#102a44');

      viewer.entities.add({
        id: station.id, name: station.name, position: at(station.position),
        point: { pixelSize: 19, color: Color.LIME, outlineColor: Color.WHITE,
          outlineWidth: 3, heightReference: HeightReference.NONE },
        label: tag('STATION-01', Color.fromCssColorString('#15803d')),
      });
      viewer.entities.add({
        id: deliveryPoint.id, name: deliveryPoint.name, position: at(deliveryPoint.position),
        point: { pixelSize: 17, color: Color.ORANGE, outlineColor: Color.WHITE, outlineWidth: 2 },
        label: tag('POINT-A', Color.fromCssColorString('#a34e16')),
      });
      waypoints.forEach((w) => viewer!.entities.add({
        id: w.id, name: w.id.toUpperCase(), position: at(w.position),
        point: { pixelSize: 10, color: Color.CYAN, outlineColor: Color.WHITE, outlineWidth: 1 },
        label: tag(w.id.toUpperCase(), Color.fromCssColorString('#075985')),
      }));
      const route = [station.position, ...waypoints.map((w) => w.position), deliveryPoint.position];
      viewer.entities.add({
        id: 'demo-route',
        polyline: { positions: route.map((p) => at(p)), width: 4, material: Color.CYAN.withAlpha(0.8) },
      });

      drones.forEach((drone) => {
        // Đọc snapshot mới nhất trên mỗi frame mà KHÔNG hủy/tạo lại Cesium Viewer.
        const pos = new CallbackPositionProperty((_time, result) => {
          const p = snapshotsRef.current[drone.id]?.position ?? drone.position;
          return at(p, result);
        }, false);
        const e = viewer!.entities.add({
          id: drone.id, name: drone.id.toUpperCase(), position: pos,
          point: {
            pixelSize: 18, color: Color.YELLOW, outlineColor: Color.WHITE,
            outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: tag(drone.id.toUpperCase(), Color.fromCssColorString('#334155')),
          // Hình khối 3D tượng trưng (không phải mô hình khí động học/glb).
          box: { dimensions: new Cartesian3(5, 3, 1), material: Color.fromCssColorString('#0d9488').withAlpha(0.9) },
        });
        entityRef.current.set(drone.id, e);

        // 4 rotor + 4 arm: biểu diễn 3D tối giản, kích thước phóng đại cho demo.
        // Mọi tọa độ đều đến từ snapshot, không tạo simulation thứ hai.
        const motors = [
          { east: -3.5, north: -3.5 }, { east: 3.5, north: -3.5 },
          { east: -3.5, north: 3.5 }, { east: 3.5, north: 3.5 },
        ];
        motors.forEach(({ east, north }, i) => {
          const rotorPos = new CallbackPositionProperty((_time, result) => {
            const p = snapshotsRef.current[drone.id]?.position ?? drone.position;
            return at(offsetPoint(p, east, north), result);
          }, false);
          viewer!.entities.add({
            id: `${drone.id}-rotor-${i}`, position: rotorPos,
            ellipsoid: {
              radii: new Cartesian3(1.35, 1.35, 0.15),
              material: Color.fromCssColorString('#a7f3d0').withAlpha(0.85),
            },
          });
          viewer!.entities.add({
            id: `${drone.id}-arm-${i}`,
            polyline: {
              positions: new CallbackProperty(() => {
                const p = snapshotsRef.current[drone.id]?.position ?? drone.position;
                return [at(p), at(offsetPoint(p, east, north))];
              }, false),
              width: 3, material: Color.fromCssColorString('#cbd5e1'),
            },
          });
        });
      });

      flyTo(viewer, station.position, 1900);
      onReadyRef.current();
    } catch (error) {
      onErrorRef.current(error instanceof Error ? error.message : String(error));
      viewer?.destroy();
      viewerRef.current = null;
    }

    return () => {
      entityRef.current.clear();
      const active = viewerRef.current;
      if (active && !active.isDestroyed()) active.destroy();
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    for (const [id, e] of entityRef.current) {
      if (e.point) e.point.color = new ConstantProperty(id === selectedDroneId ? Color.YELLOW : Color.SKYBLUE);
    }
    if (follow) {
      viewer.trackedEntity = entityRef.current.get(selectedDroneId);
    } else {
      viewer.trackedEntity = undefined;
      const p = snapshotsRef.current[selectedDroneId]?.position;
      if (p) flyTo(viewer, p, 950);
    }
  }, [selectedDroneId, follow]);

  function overview() {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.trackedEntity = undefined;
    onFollowChange(false);
    flyTo(viewer, station.position, 1900);
  }

  return (
    <div className="map-wrap">
      <div ref={container} className="cesium-container" aria-label="Bản đồ UAV CesiumJS" />
      <div className="map-buttons">
        <button className="overview-btn" type="button" onClick={overview}>⌖ Tổng quan</button>
        <button className={'overview-btn ' + (follow ? 'following' : '')} type="button"
          onClick={() => onFollowChange(!follow)}>{follow ? '◎ Đang theo dõi' : '◎ Theo dõi UAV'}</button>
      </div>
    </div>
  );
}
