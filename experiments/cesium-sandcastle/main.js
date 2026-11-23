/*
 * UAV Delivery System - Giai doan 1 / Ngay 8
 * Cesium Sandcastle technology spike - NOT a production flight controller.
 * Works inside https://sandcastle.cesium.com/?src=Hello%20World.html
 * Paste companion sandcastle.html into the HTML/CSS editor tab.
 */

// Sandcastle normally provides Cesium and a demo access token automatically.
// For a standalone website, use your own Cesium ion token when needed.
const viewer = new Cesium.Viewer('cesiumContainer', {
  animation: false,
  timeline: false,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  selectionIndicator: true,
  infoBox: true,
});

viewer.scene.globe.depthTestAgainstTerrain = false;

// All values are fictional training data, not verified delivery locations.
// Coordinate order throughout Cesium: LONGITUDE, LATITUDE, HEIGHT (meters).
const station = { id: 'STATION-01', lon: 105.8542, lat: 21.0285, alt: 0 };
const wp1 = { id: 'WP-01', lon: 105.8559, lat: 21.0303, alt: 45 };
const wp2 = { id: 'WP-02', lon: 105.8576, lat: 21.0323, alt: 45 };
const wp3 = { id: 'WP-03', lon: 105.8593, lat: 21.0338, alt: 45 };
const delivery = { id: 'POINT-A', lon: 105.8614, lat: 21.0353, alt: 0 };

// Cruise starts at station horizontally but 45 meters up (after TAKEOFF).
const route = [
  { ...station, alt: 45 },
  wp1,
  wp2,
  wp3,
  { ...delivery, alt: 45 },
];

const CRUISE_SPEED_MPS = 6;
const ASCENT_SPEED_MPS = 3;
const DESCENT_SPEED_MPS = 2;
const CRUISE_ALTITUDE_M = 45;
const DEMO_TIME_SCALE = 8;  // Run faster for the class demo.

function haversineMeters(a, b) {
  const r = 6371000;
  const lat1 = Cesium.Math.toRadians(a.lat);
  const lat2 = Cesium.Math.toRadians(b.lat);
  const dLat = lat2 - lat1;
  const dLon = Cesium.Math.toRadians(b.lon - a.lon);
  const f = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(f)));
}

const segmentDistances = [];
let totalDistance = 0;
for (let i = 0; i < route.length - 1; i++) {
  const meters = haversineMeters(route[i], route[i + 1]);
  segmentDistances.push(meters);
  totalDistance += meters;
}

function interpolateByDistance(meters) {
  let remain = Math.max(0, Math.min(meters, totalDistance));
  for (let i = 0; i < segmentDistances.length; i++) {
    const length = segmentDistances[i];
    if (remain <= length || i === segmentDistances.length - 1) {
      const t = length === 0 ? 1 : remain / length;
      return {
        lon: Cesium.Math.lerp(route[i].lon, route[i + 1].lon, t),
        lat: Cesium.Math.lerp(route[i].lat, route[i + 1].lat, t),
      };
    }
    remain -= length;
  }
  return { lon: delivery.lon, lat: delivery.lat };
}

function markPlace(p, color, size) {
  return viewer.entities.add({
    id: p.id,
    name: p.id,
    description: `<strong>Demo point:</strong> ${p.id}<br>Longitude: ${p.lon}<br>Latitude: ${p.lat}`,
    position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 3),
    point: {
      pixelSize: size,
      color,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: p.id,
      font: 'bold 14px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -27),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
}

const stationEntity = markPlace(station, Cesium.Color.LIMEGREEN, 18);
markPlace(delivery, Cesium.Color.ORANGE, 18);
[wp1, wp2, wp3].forEach((p) => markPlace(p, Cesium.Color.DEEPSKYBLUE, 11));

viewer.entities.add({
  id: 'MISSION-ROUTE',
  name: 'MIS-001 planned route',
  polyline: {
    positions: route.map((p) => Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt)),
    width: 4,
    material: new Cesium.PolylineDashMaterialProperty({color: Cesium.Color.CYAN}),
  },
});

// Optional *visual* no-fly zone. No path validation exists in this tech spike.
viewer.entities.add({
  id: 'DEMO-NO-FLY-ZONE',
  name: 'No-fly demo overlay (visual only)',
  position: Cesium.Cartesian3.fromDegrees(105.8511, 21.0348, 0),
  ellipse: {
    semiMajorAxis: 115,
    semiMinorAxis: 115,
    height: 1,
    material: Cesium.Color.RED.withAlpha(0.22),
    outline: true,
    outlineColor: Cesium.Color.RED,
  },
});

// Second and third UAVs are static markers; only UAV-01 performs a demo mission.
[
  { id: 'UAV-02', lon: 105.8544, lat: 21.0283, status: 'AVAILABLE', color: Cesium.Color.YELLOW },
  { id: 'UAV-03', lon: 105.8540, lat: 21.0283, status: 'BUSY (mock)', color: Cesium.Color.MAGENTA },
].forEach((p) => viewer.entities.add({
  id: p.id,
  name: `${p.id} (${p.status})`,
  description: `Demo fleet UAV marker; status: ${p.status}. No autonomous motion in Day 8.`,
  position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 6),
  point: { pixelSize: 12, color: p.color, outlineColor: Cesium.Color.BLACK, outlineWidth: 2 },
  label: {
    text: p.id,
    font: 'bold 12px sans-serif',
    fillColor: Cesium.Color.WHITE,
    outlineColor: Cesium.Color.BLACK,
    outlineWidth: 3,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    pixelOffset: new Cesium.Cartesian2(0, 21),
  },
}));

const flight = {
  lon: station.lon,
  lat: station.lat,
  alt: 0,
  traveledMeters: 0,
  state: 'IDLE',
  running: false,
  simSeconds: 0,
};

// Toy 3D quadcopter assembled from Cesium geometry entities.
// The geometry is enlarged intentionally so it remains recognizable at map scale.
function getOffsetPosition(eastM, northM, upM) {
  return new Cesium.CallbackPositionProperty(() => {
    const longitudeOffset = eastM / (111320 * Math.cos(Cesium.Math.toRadians(flight.lat)));
    const latitudeOffset = northM / 111320;
    return Cesium.Cartesian3.fromDegrees(
      flight.lon + longitudeOffset,
      flight.lat + latitudeOffset,
      flight.alt + upM + 7,
    );
  }, false);
}

const uavBody = viewer.entities.add({
  id: 'UAV-01',
  name: 'UAV-01 / simulated quadcopter',
  description: 'Illustrative geometry. Movement is a browser-side tech demo, not a flight controller.',
  position: getOffsetPosition(0, 0, 0),
  ellipsoid: {
    radii: new Cesium.Cartesian3(3.1, 2.2, 1.3),
    material: Cesium.Color.DARKTURQUOISE,
    outline: true,
    outlineColor: Cesium.Color.WHITE,
  },
  label: {
    text: 'UAV-01',
    font: 'bold 15px sans-serif',
    pixelOffset: new Cesium.Cartesian2(0, -30),
    fillColor: Cesium.Color.WHITE,
    outlineColor: Cesium.Color.BLACK,
    outlineWidth: 3,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  },
});

// Cross arms and rotor disks make the toy marker recognizable as a quadcopter.
viewer.entities.add({position:getOffsetPosition(0,0,0),box:{dimensions:new Cesium.Cartesian3(17,1.3,0.8),material:Cesium.Color.DARKSLATEGRAY}});
viewer.entities.add({position:getOffsetPosition(0,0,0),box:{dimensions:new Cesium.Cartesian3(1.3,17,0.8),material:Cesium.Color.DARKSLATEGRAY}});
for (const [east, north] of [[-8, 0], [8, 0], [0, -8], [0, 8]]) {
  viewer.entities.add({
    position: getOffsetPosition(east, north, 1.0),
    ellipsoid: {
      radii: new Cesium.Cartesian3(2.1, 2.1, 0.25),
      material: Cesium.Color.SKYBLUE.withAlpha(0.85),
      outline: true,
      outlineColor: Cesium.Color.WHITE,
    },
  });
}

viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(105.8574, 21.0319, 1850),
  orientation: {
    heading: Cesium.Math.toRadians(0),
    pitch: Cesium.Math.toRadians(-65),
    roll: 0,
  },
  duration: 1.5,
});

const statusEl = document.getElementById('flightStatus');
const batteryEl = document.getElementById('batteryValue');
const distanceEl = document.getElementById('distanceValue');
const altitudeEl = document.getElementById('altitudeValue');
const progressEl = document.getElementById('progressValue');
const timeEl = document.getElementById('timeValue');

function syncHud() {
  const pct = Math.min(100, (flight.traveledMeters / totalDistance) * 100);
  const toyBattery = Math.max(30, 90 - flight.simSeconds * 0.06);
  statusEl.textContent = flight.state;
  batteryEl.textContent = `${toyBattery.toFixed(1)}% (toy)`;
  distanceEl.textContent = `${flight.traveledMeters.toFixed(0)} / ${totalDistance.toFixed(0)} m`;
  altitudeEl.textContent = `${flight.alt.toFixed(1)} m`;
  progressEl.textContent = `${pct.toFixed(0)}%`;
  timeEl.textContent = `${flight.simSeconds.toFixed(1)} s (simulated)`;
}

function startFlight() {
  if (flight.state === 'IDLE') {
    flight.state = 'TAKEOFF';
    flight.running = true;
  } else if (flight.state === 'PAUSED') {
    flight.state = flight.traveledMeters >= totalDistance ? 'LANDING' :
      flight.alt < CRUISE_ALTITUDE_M ? 'TAKEOFF' : 'EN_ROUTE';
    flight.running = true;
  }
  syncHud();
}

function pauseFlight() {
  if (flight.running && ['TAKEOFF', 'EN_ROUTE', 'LANDING'].includes(flight.state)) {
    flight._stateBeforePause = flight.state;
    flight.state = 'PAUSED';
    flight.running = false;
  }
  syncHud();
}

function resumeFlight() {
  if (flight.state === 'PAUSED') {
    flight.state = flight._stateBeforePause || 'EN_ROUTE';
    flight.running = true;
  }
  syncHud();
}

function resetFlight() {
  flight.lon = station.lon;
  flight.lat = station.lat;
  flight.alt = 0;
  flight.traveledMeters = 0;
  flight.simSeconds = 0;
  flight.state = 'IDLE';
  flight.running = false;
  flight._stateBeforePause = undefined;
  syncHud();
}

document.getElementById('startBtn').addEventListener('click', startFlight);
document.getElementById('pauseBtn').addEventListener('click', pauseFlight);
document.getElementById('resumeBtn').addEventListener('click', resumeFlight);
document.getElementById('resetBtn').addEventListener('click', resetFlight);
document.getElementById('focusBtn').addEventListener('click', () => viewer.flyTo(uavBody, {duration:1}));
document.getElementById('overviewBtn').addEventListener('click', () => viewer.flyTo(viewer.entities, {duration:1}));

// A simple browser-side animation tick: NOT real physics, autopilot, or server state.
let previousTimestamp = performance.now();
function animationFrame(timestamp) {
  const dtReal = Math.max(0, Math.min((timestamp - previousTimestamp) / 1000, 0.10));
  previousTimestamp = timestamp;
  if (flight.running) {
    const dt = dtReal * DEMO_TIME_SCALE;
    flight.simSeconds += dt;
    if (flight.state === 'TAKEOFF') {
      flight.alt = Math.min(CRUISE_ALTITUDE_M, flight.alt + ASCENT_SPEED_MPS * dt);
      if (flight.alt >= CRUISE_ALTITUDE_M) flight.state = 'EN_ROUTE';
    } else if (flight.state === 'EN_ROUTE') {
      flight.traveledMeters = Math.min(totalDistance, flight.traveledMeters + CRUISE_SPEED_MPS * dt);
      const p = interpolateByDistance(flight.traveledMeters);
      flight.lon = p.lon;
      flight.lat = p.lat;
      if (flight.traveledMeters >= totalDistance) flight.state = 'LANDING';
    } else if (flight.state === 'LANDING') {
      flight.alt = Math.max(0, flight.alt - DESCENT_SPEED_MPS * dt);
      if (flight.alt <= 0) {
        flight.state = 'WAITING_FOR_HANDOVER';
        flight.running = false;
      }
    }
    syncHud();
  }
  requestAnimationFrame(animationFrame);
}

syncHud();
requestAnimationFrame(animationFrame);
console.log('[Day 8] Cesium demo initialized', {totalRouteMeters: totalDistance, stations: 1, drones: 3});
