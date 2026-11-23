const DT = 0.1; // 0.1 giây/bước
const SPEED = 6; // m/s
const TARGET_X = 120; // Điểm giao cách 120 m

const FLY_DRAIN = 0.08;
const HOVER_DRAIN = 0.05;

let x = 0; // Vị trí hiện tại
let battery = 90; // Pin ban đầu
let paused = false;
let time = 0;

for (let step = 1; step <= 260; step++) {
  // Pause trong khoảng giây 6 đến giây 8
  paused = step > 60 && step <= 80;

  if (!paused && x < TARGET_X) {
    // Quãng đường đi được sau một bước
    const distance = SPEED * DT;

    // Không cho UAV bay vượt điểm giao
    x = Math.min(TARGET_X, x + distance);
  }

  // Khi Pause vẫn tiêu hao pin
  const drain = paused ? HOVER_DRAIN : FLY_DRAIN;

  battery = Math.max(0, battery - drain * DT);
  time += DT;

  // In thông tin sau mỗi 20 bước (2 giây)
  if (step % 20 === 0) {
    console.log(
      `t=${time.toFixed(1)}s | ` +
        `x=${x.toFixed(1)}m | ` +
        `pin=${battery.toFixed(2)}% | ` +
        `${paused ? "PAUSED" : "EN_ROUTE"}`,
    );
  }

  if (x === TARGET_X) {
    console.log("ĐÃ ĐẾN ĐIỂM GIAO");
    break;
  }
}
