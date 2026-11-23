const { io } = require('socket.io-client');
const socket = io('http://127.0.0.1:3000', { reconnectionAttempts: 5 });
socket.on('connect', () => console.log('Connected:', socket.id));
socket.on('server:hello', data => console.log('server:hello', data));
socket.on('mission:updated', data => console.log('mission:updated', data.id, data.status, 'version', data.version));
socket.on('drone:telemetry', data => console.log('drone:telemetry', data.drone_id, 'pin', data.battery_pct, 'demoOnly', data.demoOnly));
socket.on('connect_error', error => console.error('Socket connect error:', error.message));
