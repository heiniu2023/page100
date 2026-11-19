// Clock: current time as HH:MM:SS, refreshed once per second.
export function nowTimeStr(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
export class Clock {
  constructor(onTick) { this.onTick = onTick; this.timer = null; }
  start() {
    this.stop();
    this.onTick(nowTimeStr());
    this.timer = setInterval(() => this.onTick(nowTimeStr()), 1000);
  }
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; }
}
