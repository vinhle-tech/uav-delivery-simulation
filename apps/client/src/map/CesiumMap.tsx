import { useEffect, useRef } from 'react';
import {
  Cartesian2, Cartesian3, Color, ConstantProperty, EllipsoidTerrainProvider, Entity,
  HeightReference, ImageryLayer, LabelStyle, OpenStreetMapImageryProvider,
  VerticalOrigin, Viewer
} from 'cesium';
import { deliveryPoint, drones, station, waypoints } from '../data/demo';
import type { GeoPoint } from '../types/domain';

function at(p: GeoPoint) {
  return Cartesian3.fromDegrees(p.lon, p.lat, p.altitudeM);
}

const foreground = Color.fromCssColorString('#f8fafc');

function nameTag(text: string, tint: Color) {
  return {
    text,
    font: '600 13px sans-serif',
    fillColor: foreground,
    showBackground: true,
    backgroundColor: tint.withAlpha(0.90),
    backgroundPadding: new Cartesian2(8, 5),
    verticalOrigin: VerticalOrigin.BOTTOM,
    pixelOffset: new Cartesian2(0, -18),
    style: LabelStyle.FILL,
    disableDepthTestDistance: Number.POSITIVE_INFINITY
  };
}

function focus(viewer: Viewer, point: GeoPoint, distance = 1700) {
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(point.lon, point.lat, distance),
    duration: 0.8
  });
}

type Props = { selectedDroneId: string; onReady: () => void; onError: (message: string) => void };

export default function CesiumMap({ selectedDroneId, onReady, onError }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const droneEntities = useRef<Map<string, Entity>>(new Map());
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!container.current || viewerRef.current) return;
    let viewer: Viewer | null = null;
    try {
      // Ảnh nền OSM. Nếu mất Internet, Cesium vẫn có địa cầu nhưng thiếu ảnh nền.
      const imagery = new ImageryLayer(new OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/'
      }));
      viewer = new Viewer(container.current, {
        baseLayer: imagery,
        terrainProvider: new EllipsoidTerrainProvider(),
        animation: false, timeline: false, baseLayerPicker: false,
        geocoder: false, homeButton: false, sceneModePicker: false,
        navigationHelpButton: false, infoBox: false, selectionIndicator: false,
        fullscreenButton: false
      });
      viewerRef.current = viewer;
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.baseColor = Color.fromCssColorString('#102a44');

      viewer.entities.add({
        id: station.id, name: station.name, position: at(station.position),
        point: { pixelSize: 18, color: Color.LIME, outlineColor: Color.WHITE,
          outlineWidth: 3, heightReference: HeightReference.NONE },
        label: nameTag('STATION-01', Color.fromCssColorString('#15803d'))
      });
      viewer.entities.add({
        id: deliveryPoint.id, name: deliveryPoint.name, position: at(deliveryPoint.position),
        point: { pixelSize: 16, color: Color.ORANGE, outlineColor: Color.WHITE, outlineWidth: 2 },
        label: nameTag('POINT-A', Color.fromCssColorString('#a34e16'))
      });
      waypoints.forEach(w => viewer!.entities.add({
        id: w.id, name: w.id.toUpperCase(), position: at(w.position),
        point: { pixelSize: 10, color: Color.CYAN, outlineColor: Color.WHITE, outlineWidth: 1 },
        label: nameTag(w.id.toUpperCase(), Color.fromCssColorString('#075985'))
      }));
      const route = [station.position, ...waypoints.map(w=>w.position), deliveryPoint.position];
      viewer.entities.add({
        id: 'demo-route',
        polyline: {
          positions: route.map(at), width: 4,
          material: Color.fromCssColorString('#22d3ee').withAlpha(0.95)
        }
      });
      drones.forEach(drone => {
        const e = viewer!.entities.add({
          id: drone.id, name: drone.id.toUpperCase(), position: at(drone.position),
          point: {pixelSize: 15, color: Color.fromCssColorString('#facc15'),
            outlineColor: Color.WHITE, outlineWidth: 2},
          label: nameTag(drone.id.toUpperCase(), Color.fromCssColorString('#334155'))
        });
        droneEntities.current.set(drone.id, e);
      });
      focus(viewer, station.position, 1900);
      onReadyRef.current();
    } catch (error) {
      onErrorRef.current(error instanceof Error ? error.message : String(error));
      viewer?.destroy();
      viewerRef.current = null;
    }
    return () => {
      droneEntities.current.clear();
      if (viewerRef.current && !viewerRef.current.isDestroyed()) viewerRef.current.destroy();
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    for (const [id, entity] of droneEntities.current) {
      if (entity.point) entity.point.color = new ConstantProperty(id === selectedDroneId ? Color.YELLOW : Color.SKYBLUE);
    }
    const selected = drones.find(d => d.id === selectedDroneId);
    if (selected) focus(viewer, selected.position, 950);
  }, [selectedDroneId]);

  return (
    <div className="map-wrap">
      <div ref={container} className="cesium-container" aria-label="Bản đồ UAV CesiumJS" />
      <button className="overview-btn" type="button" onClick={() => {
        if (viewerRef.current) focus(viewerRef.current, station.position, 1900);
      }}>⌖ Tổng quan</button>
    </div>
  );
}
