# MONOREPO ĐỀ XUẤT NGÀY 5

```
uav-delivery-simulation/
├── apps/
│   ├── client/                    # React Web + thư viện màn hình dùng chung
│   │   └── src/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── features/
│   │       └── map/             # CesiumJS View
│   ├── mobile/                   # Capacitor wrapper cho React
│   ├── desktop/                  # Electron wrapper cho React
│   └── server/
│       └── src/
│           ├── api/
│           ├── auth/
│           ├── modules/         # orders, drones, missions
│           ├── simulation/
│           │   ├── controller/
│           │   ├── navigation/
│           │   ├── battery/
│           │   ├── sensors/
│           │   └── safety/
│           ├── realtime/
│           └── persistence/
├── packages/
│   ├── shared-types/
│   ├── api-client/
│   └── shared-utils/
├── experiments/
│   ├── day4-flight-controller/
│   └── day5-architecture/
├── docs/
│   ├── 01-requirements/
│   ├── 02-architecture/
│   ├── 03-simulation/
│   ├── 04-database-api/
│   ├── 05-ui-ux/
│   ├── 06-diagrams/
│   └── 07-testing/
└── README.md
```

**Chưa cần tạo toàn bộ `apps/` và `packages/` ở Ngày 5.** Sơ đồ chỉ mô tả cấu trúc sẽ triển khai từ các giai đoạn sau. Không tạo hai bản sao UI độc lập cho Web/Mobile/Desktop.

## Gợi ý phối hợp
- TV1: client, mobile/desktop wrappers, UI.
- TV2: API, DB, Auth, Realtime, sync.
- TV3: Simulation Engine, State Machine, Navigation, Battery, Safety.
- Cả ba phải thống nhất `shared-types` và API contract trước khi tích hợp.
