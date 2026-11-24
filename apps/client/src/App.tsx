import { useState } from 'react';
import CesiumMap from './map/CesiumMap';
import { deliveryPoint, drones, missions, orders, station, waypoints } from './data/demo';

export default function App() {
  const [selected, setSelected] = useState('uav-01');
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading');
  const [error, setError] = useState('');
  const drone = drones.find(d => d.id === selected)!;

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><div className="brandmark">✈</div><div><b>UAV DELIVERY</b><span>Simulation System</span></div></div>
        <div className="side-scroll">
          <div className="eyebrow">GIAI ĐOẠN 2 · NGÀY 1</div>
          <h1>Mô phỏng UAV 3D</h1>
          <p className="muted">Bản đồ và dữ liệu mẫu tĩnh. Chưa có Simulation Core, GPS thật hoặc kết nối Backend.</p>

          <div className="section-title">ĐỘI UAV <span>{drones.length} thiết bị ảo</span></div>
          <div className="drone-list">
            {drones.map(d => <button key={d.id} className={'drone-card ' + (selected === d.id?'active':'')}
              type="button" onClick={() => setSelected(d.id)}>
              <span className="drone-top"><b>{d.id.toUpperCase()}</b><span className={'status-chip ' + (d.status==='OFFLINE'?'off':'ok')}>{d.status}</span></span>
              <span className="drone-foot"><span>🔋 {d.batteryPct}%</span><span>Tải tối đa {d.maxPayloadKg}kg</span></span>
            </button>)}
          </div>
          <div className="section-title">THÔNG TIN MẪU</div>
          <div className="fact"><span>Trạm</span><b>{station.id}</b></div>
          <div className="fact"><span>Điểm giao</span><b>{deliveryPoint.id}</b></div>
          <div className="fact"><span>Waypoint</span><b>{waypoints.length}</b></div>
          <div className="fact"><span>Order mẫu</span><b>{orders.length}</b></div>
          <div className="fact"><span>Mission mẫu</span><b>{missions[0].id}</b></div>
          <div className="info">Ngày 2–3 sẽ bổ sung chuyển động, State Machine, telemetry và điều khiển Start/Pause/Resume.</div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div><strong>Bản đồ giám sát</strong><span>Hà Nội · Tọa độ minh họa</span></div>
          <div className="topright"><span className={'app-indicator '+status}>{status==='ready'?'● Bản đồ đã tải':status==='error'?'● Lỗi Cesium':'● Đang tải Cesium...'}</span></div>
        </header>
        <div className="map-layout">
          <section className="map-card">
            <CesiumMap selectedDroneId={selected} onReady={()=>setStatus('ready')} onError={e=>{setError(e);setStatus('error');}} />
            {status==='error' && <div className="error-overlay"><b>Không thể khởi tạo CesiumJS</b><p>{error}</p><p>Kiểm tra WebGL và mở Console (F12).</p></div>}
            <div className="map-caption">Lớp ảnh nền từ OpenStreetMap qua Internet · Không sử dụng để dẫn đường UAV thật</div>
          </section>
          <aside className="telemetry">
            <div className="panel-heading"><span>UAV đang chọn</span><span className="pill">STATIC DATA</span></div>
            <h2>{drone.id.toUpperCase()}</h2>
            <div className="metric"><span>Trạng thái</span><b>{drone.status}</b></div>
            <div className="metric"><span>Pin giả lập</span><b>{drone.batteryPct}%</b></div>
            <div className="metric"><span>Kinh độ</span><b>{drone.position.lon.toFixed(5)}</b></div>
            <div className="metric"><span>Vĩ độ</span><b>{drone.position.lat.toFixed(5)}</b></div>
            <div className="metric"><span>Độ cao marker</span><b>{drone.position.altitudeM}m</b></div>
            <div className="metric"><span>Vận tốc bay</span><b>—</b></div>
            <div className="metric"><span>Mission</span><b>{selected==='uav-01' ? 'READY (demo)' : 'Chưa phân công'}</b></div>
            <div className="alert">Các chỉ số ở đây là dữ liệu seed, chưa phải telemetry realtime từ Wokwi.</div>
            <div className="section-title">TUYẾN MẪU</div>
            <div className="route-steps"><span>STATION-01</span><span>WP-01 → WP-02 → WP-03</span><span>POINT-A</span></div>
          </aside>
        </div>
      </main>
    </div>
  );
}
