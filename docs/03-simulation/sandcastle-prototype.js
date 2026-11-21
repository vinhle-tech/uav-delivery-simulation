// Dùng trong Cesium Sandcastle > Hello World, thay toàn bộ JS pane.
// Tọa độ sau CHỈ LÀ ĐIỂM GIẢ ĐỊNH PHỤC VỤ MÔ PHỎNG.
const viewer = new Cesium.Viewer("cesiumContainer");

const station = [105.820, 21.028];
const delivery = [105.831, 21.033];
const waypoint = [105.825, 21.031];

viewer.entities.add({
  name: "UAV Station (simulation)",
  position: Cesium.Cartesian3.fromDegrees(...station, 20),
  point: { pixelSize: 15, color: Cesium.Color.LIME },
  label: { text: "UAV STATION", pixelOffset: new Cesium.Cartesian2(0, -22) },
});
viewer.entities.add({
  name: "Delivery Point (simulation)",
  position: Cesium.Cartesian3.fromDegrees(...delivery, 20),
  point: { pixelSize: 15, color: Cesium.Color.ORANGE },
  label: { text: "DELIVERY", pixelOffset: new Cesium.Cartesian2(0, -22) },
});
viewer.entities.add({
  name: "Waypoint / virtual UAV", 
  position: Cesium.Cartesian3.fromDegrees(...waypoint, 80),
  point: { pixelSize: 14, color: Cesium.Color.YELLOW },
  label: { text: "UAV-01", pixelOffset: new Cesium.Cartesian2(0, -22) },
});
viewer.entities.add({
  name: "Mission route",
  polyline: {
    positions: Cesium.Cartesian3.fromDegreesArrayHeights([
      station[0], station[1], 80,
      waypoint[0], waypoint[1], 80,
      delivery[0], delivery[1], 80,
    ]),
    width: 4,
    material: Cesium.Color.RED,
  },
});
viewer.zoomTo(viewer.entities);
