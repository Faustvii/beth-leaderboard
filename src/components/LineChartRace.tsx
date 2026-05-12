// Compiled to public/lineChartRace.js via `bun client:build`.
// Served from /static/lineChartRace.js, loaded once in base.tsx.

interface LineRacePoint {
  x: number;
  y: number | null;
}

interface ChartScale {
  min: number | null;
  max: number | null;
  getPixelForValue(value: number): number;
}

interface ChartDataset {
  data: LineRacePoint[];
  borderColor?: string;
  label?: string;
}

interface ChartArea {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface DatasetMeta {
  hidden?: boolean;
}

interface RaceChart {
  ctx: CanvasRenderingContext2D;
  chartArea: ChartArea;
  scales: { x: ChartScale; y: ChartScale };
  data: { datasets: ChartDataset[] };
  options?: { scales?: { x?: { min?: number; max?: number } } };
  getDatasetMeta(i: number): DatasetMeta;
  update(mode?: string): void;
  $race?: RaceState;
}

interface RaceState {
  cursorX: number;
  velocity: number;
  playing: boolean;
  lastFrame: number;
  dataMin: number;
  dataMax: number;
  windowDuration: number;
  playButtonId?: string;
}

interface RacePluginOptions {
  enabled?: boolean;
  autoplay?: boolean;
  totalRaceMs?: number;
  windowSize?: number;
  playButtonId?: string;
}

interface RacePluginDef {
  id: string;
  defaults: RacePluginOptions;
  afterInit(chart: RaceChart, args: unknown, opts: RacePluginOptions): void;
  beforeDatasetsDraw(
    chart: RaceChart,
    args: unknown,
    opts: RacePluginOptions,
  ): void;
  afterDatasetsDraw(
    chart: RaceChart,
    args: unknown,
    opts: RacePluginOptions,
  ): void;
}

declare const Chart: {
  register(plugin: RacePluginDef): void;
  getChart(id: string): RaceChart | undefined;
};

declare global {
  interface Window {
    __lineRace: {
      play(id: string, btnId?: string): void;
      pause(id: string, btnId?: string): void;
      toggle(id: string, btnId?: string): void;
      reset(id: string, btnId?: string): void;
    };
  }
}

if (typeof Chart !== "undefined") {
  function findCurrentY(
    points: LineRacePoint[],
    cursorX: number,
  ): number | null {
    let prev: LineRacePoint | null = null;
    let next: LineRacePoint | null = null;
    for (const p of points) {
      if (p.x <= cursorX) prev = p;
      else {
        next = p;
        break;
      }
    }
    if (prev?.y == null) return null;
    if (next?.y == null) return prev.y;
    const span = next.x - prev.x;
    if (span <= 0) return prev.y;
    const t = (cursorX - prev.x) / span;
    return prev.y + t * (next.y - prev.y);
  }

  function applyWindow(chart: RaceChart): void {
    const s = chart.$race;
    if (!s?.windowDuration) return;
    const rightX = Math.max(s.cursorX, s.dataMin + s.windowDuration);
    const leftX = Math.max(s.dataMin, rightX - s.windowDuration);
    if (chart.options?.scales?.x) {
      chart.options.scales.x.min = leftX;
      chart.options.scales.x.max = rightX;
    }
  }

  function startTickLoop(chart: RaceChart): void {
    function tick() {
      const s = chart.$race;
      if (!s || !s.playing) return;
      const now = performance.now();
      const dt = now - s.lastFrame;
      s.lastFrame = now;
      s.cursorX = Math.min(s.dataMax, s.cursorX + dt * s.velocity);
      applyWindow(chart);
      chart.update("none");
      if (s.cursorX >= s.dataMax) {
        s.playing = false;
        const btn = s.playButtonId
          ? document.getElementById(s.playButtonId)
          : null;
        if (btn) btn.textContent = "Play";
      }
      if (s.playing) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  Chart.register({
    id: "lineChartRace",
    defaults: {
      enabled: false,
      autoplay: true,
      totalRaceMs: 20000,
      windowSize: 50,
    },
    afterInit(chart, _args, opts) {
      if (!opts?.enabled) return;
      const xSet = new Set<number>();
      chart.data.datasets.forEach((ds) => {
        ds.data.forEach((p) => xSet.add(p.x));
      });
      const xValues = Array.from(xSet).sort((a, b) => a - b);
      if (xValues.length === 0) return;

      const dataMin = xValues[0];
      const dataMax = xValues[xValues.length - 1];
      const totalRaceMs = opts.totalRaceMs ?? 20000;
      const ws = Math.max(1, opts.windowSize ?? 50);
      const windowFraction = Math.min(1, ws / xValues.length);
      const windowDuration = (dataMax - dataMin) * windowFraction;

      chart.$race = {
        cursorX: opts.autoplay ? dataMin : dataMax,
        velocity: (dataMax - dataMin) / totalRaceMs,
        playing: !!opts.autoplay,
        lastFrame: performance.now(),
        dataMin,
        dataMax,
        windowDuration,
        playButtonId: opts.playButtonId,
      };
      applyWindow(chart);
      requestAnimationFrame(() => {
        chart.update("none");
        if (chart.$race?.playing) startTickLoop(chart);
      });
    },
    beforeDatasetsDraw(chart, _args, opts) {
      if (!opts?.enabled) return;
      const s = chart.$race;
      if (!s) return;
      const ctx = chart.ctx;
      const area = chart.chartArea;
      const cursorX = chart.scales.x.getPixelForValue(s.cursorX);
      ctx.save();
      ctx.beginPath();
      ctx.rect(
        area.left,
        area.top,
        Math.max(0, cursorX - area.left) + 0.5,
        area.bottom - area.top,
      );
      ctx.clip();
    },
    afterDatasetsDraw(chart, _args, opts) {
      if (!opts?.enabled) return;
      const s = chart.$race;
      if (!s) return;
      const ctx = chart.ctx;
      const area = chart.chartArea;
      const cursorVal = s.cursorX;
      const cursorX = chart.scales.x.getPixelForValue(cursorVal);
      ctx.restore();

      const xMin = chart.scales.x.min;
      const xMax = chart.scales.x.max;
      if (xMin != null && xMax != null && xMax > xMin) {
        const labelCount = 5;
        ctx.save();
        ctx.font = "11px 'Roboto Mono', monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.textBaseline = "top";
        for (let li = 0; li < labelCount; li++) {
          const t = li / (labelCount - 1);
          const val = xMin + t * (xMax - xMin);
          const lpx = chart.scales.x.getPixelForValue(val);
          const d = new Date(val);
          const label = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          if (li === 0) ctx.textAlign = "left";
          else if (li === labelCount - 1) ctx.textAlign = "right";
          else ctx.textAlign = "center";
          ctx.fillText(label, lpx, area.bottom + 6);
        }
        ctx.restore();
      }

      ctx.save();
      ctx.strokeStyle = "rgba(255, 137, 6, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cursorX, area.top);
      ctx.lineTo(cursorX, area.bottom);
      ctx.stroke();

      ctx.font = "11px 'Roboto Mono', monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      chart.data.datasets.forEach((ds, i) => {
        const meta = chart.getDatasetMeta(i);
        if (meta.hidden) return;
        const y = findCurrentY(ds.data, cursorVal);
        if (y === null) return;
        const py = chart.scales.y.getPixelForValue(y);
        ctx.fillStyle = ds.borderColor ?? "#fff";
        ctx.fillText(" " + (ds.label ?? ""), cursorX, py);
      });
      ctx.restore();

      // Fall trails (skulls) on drop-out and launch trails (rockets) on entry.
      // Both require a connected segment on the chart side — i.e. the neighbor
      // in the relevant direction must also be in top N — so we don't render
      // emojis next to invisible single-point "blip" entries or exits.
      ctx.save();
      ctx.lineWidth = 2;
      const trailDx = 12;
      const trailDy = 26;
      const emojiFont =
        "16px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";

      for (let di = 0; di < chart.data.datasets.length; di++) {
        const ds2 = chart.data.datasets[di];
        const meta2 = chart.getDatasetMeta(di);
        if (!meta2 || meta2.hidden) continue;
        const pts = ds2.data;

        for (let pi = 0; pi < pts.length; pi++) {
          const p = pts[pi];
          if (p?.y === null) continue;
          const prevP = pi > 0 ? pts[pi - 1] : null;
          const nextP = pi < pts.length - 1 ? pts[pi + 1] : null;

          const isDropOut =
            !!prevP && prevP.y !== null && !!nextP && nextP.y === null;
          const isReentry =
            !!prevP && prevP.y === null && !!nextP && nextP.y !== null;
          const isFirstAppearance =
            pi === 0 && p.x > s.dataMin && !!nextP && nextP.y !== null;
          const isEntry = isReentry || isFirstAppearance;

          if (!isDropOut && !isEntry) continue;

          const trailPx = chart.scales.x.getPixelForValue(p.x);
          if (trailPx < area.left || trailPx > cursorX) continue;
          const trailPy = chart.scales.y.getPixelForValue(p.y);

          const color = ds2.borderColor ?? "#fff";
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.font = emojiFont;
          ctx.textBaseline = "middle";
          ctx.textAlign = "center";

          if (isDropOut) {
            const endX = trailPx + trailDx;
            const endY = Math.min(area.bottom + 6, trailPy + trailDy);
            ctx.beginPath();
            ctx.moveTo(trailPx, trailPy);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.fillText("\u{1F480}", endX, endY);
          } else {
            const startX = trailPx - trailDx;
            const startY = Math.min(area.bottom + 6, trailPy + trailDy);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(trailPx, trailPy);
            ctx.stroke();
            ctx.fillText("\u{1F680}", startX, startY);
          }
        }
      }
      ctx.restore();
    },
  });

  window.__lineRace = {
    play(id, btnId) {
      const c = Chart.getChart(id);
      if (!c?.$race) return;
      if (c.$race.cursorX >= c.$race.dataMax) c.$race.cursorX = c.$race.dataMin;
      c.$race.playing = true;
      c.$race.lastFrame = performance.now();
      applyWindow(c);
      const btn = btnId ? document.getElementById(btnId) : null;
      if (btn) btn.textContent = "Pause";
      startTickLoop(c);
    },
    pause(id, btnId) {
      const c = Chart.getChart(id);
      if (!c?.$race) return;
      c.$race.playing = false;
      const btn = btnId ? document.getElementById(btnId) : null;
      if (btn) btn.textContent = "Play";
    },
    toggle(id, btnId) {
      const c = Chart.getChart(id);
      if (!c?.$race) return;
      if (c.$race.playing) window.__lineRace.pause(id, btnId);
      else window.__lineRace.play(id, btnId);
    },
    reset(id, btnId) {
      const c = Chart.getChart(id);
      if (!c?.$race) return;
      c.$race.cursorX = c.$race.dataMin;
      c.$race.playing = false;
      applyWindow(c);
      const btn = btnId ? document.getElementById(btnId) : null;
      if (btn) btn.textContent = "Play";
      c.update("none");
    },
  };
}
