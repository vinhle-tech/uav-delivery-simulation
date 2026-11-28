-- Data for learning only. Do NOT use the fake user/password_hash for authentication.
INSERT INTO users(id,email,full_name,role,password_hash) VALUES
  ('user-01','operator@example.invalid','Demo Operator','OPERATOR','NOT_A_REAL_PASSWORD_HASH')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stations(id,name,latitude,longitude) VALUES
  ('station-01','Tram UAV mau',21.0285,105.8542)
ON CONFLICT (id) DO NOTHING;

INSERT INTO drone_models(id,name,max_payload_kg,cruise_speed_mps) VALUES
  ('model-q1','Quadcopter Demo',1.50,6.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO delivery_points(id,name,latitude,longitude) VALUES
  ('point-a','Diem nhan A',21.0300,105.8600)
ON CONFLICT (id) DO NOTHING;

INSERT INTO drones(id,model_id,station_id,battery_pct,status) VALUES
  ('uav-01','model-q1','station-01',90,'AVAILABLE'),
  ('uav-02','model-q1','station-01',35,'AVAILABLE'),
  ('uav-03','model-q1','station-01',85,'BUSY')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders(id,delivery_point_id,created_by,weight_kg,status) VALUES
  ('ord-001','point-a','user-01',0.8,'PENDING')
ON CONFLICT (id) DO NOTHING;
