
SELECT id, battery_pct
FROM drones
WHERE battery_pct >= 55
  AND status = 'AVAILABLE';
