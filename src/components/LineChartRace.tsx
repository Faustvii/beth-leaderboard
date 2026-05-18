// Compiled to public/LineChartRace.js via `bun client:build`.
// Served from /static/LineChartRace.js, loaded once in base.tsx.

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
  canvas: HTMLCanvasElement;
  chartArea: ChartArea;
  scales: { x: ChartScale; y: ChartScale };
  data: { datasets: ChartDataset[] };
  options?: { scales?: { x?: { min?: number; max?: number } } };
  getDatasetMeta(i: number): DatasetMeta;
  update(mode?: string): void;
  $race?: RaceState;
}

interface RaceMarker {
  kind: "dropout" | "entry";
  x: number;
  y: number;
  color: string;
  datasetIndex: number;
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
  markers: RaceMarker[];
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
        chart.canvas.style.cursor = "grab";
      }
      if (s.playing) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function setupScrollHandler(chart: RaceChart): void {
    const canvas = chart.canvas;
    let isDragging = false;
    let dragStartClientX = 0;
    let dragStartCursorX = 0;

    function canScroll(): boolean {
      return chart.$race?.playing === false;
    }

    function updateCursor(): void {
      canvas.style.cursor = canScroll() ? "grab" : "";
    }

    // Window-level mouse listeners are attached only for the duration of a
    // drag and removed on release, so we never leak listeners between drags
    // (or accumulate them if the chart is ever re-rendered via htmx swap).
    const onWindowMouseMove = (e: MouseEvent) => onMove(e.clientX);

    function onStart(clientX: number): boolean {
      if (!canScroll()) return false;
      const s = chart.$race!;
      isDragging = true;
      dragStartClientX = clientX;
      dragStartCursorX = s.cursorX;
      canvas.style.cursor = "grabbing";
      window.addEventListener("mousemove", onWindowMouseMove);
      window.addEventListener("mouseup", onEnd);
      return true;
    }

    function onMove(clientX: number): void {
      if (!isDragging) return;
      const s = chart.$race;
      if (!s) return;
      const rect = canvas.getBoundingClientRect();
      const xMin = chart.scales.x.min ?? s.dataMin;
      const xMax = chart.scales.x.max ?? s.dataMax;
      const visibleRange = xMax - xMin;
      if (visibleRange <= 0 || rect.width <= 0) return;
      const pxDelta = clientX - dragStartClientX;
      const valDelta = (pxDelta / rect.width) * visibleRange;
      const minCursor = s.dataMin + s.windowDuration;
      s.cursorX = Math.max(
        minCursor,
        Math.min(s.dataMax, dragStartCursorX - valDelta),
      );
      applyWindow(chart);
      chart.update("none");
    }

    function onEnd(): void {
      if (!isDragging) return;
      isDragging = false;
      canvas.style.cursor = canScroll() ? "grab" : "";
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onEnd);
    }

    canvas.addEventListener("mousedown", (e) => {
      if (onStart(e.clientX)) e.preventDefault();
    });

    canvas.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 1 && onStart(e.touches[0].clientX)) {
          e.preventDefault();
        }
      },
      { passive: false },
    );
    canvas.addEventListener(
      "touchmove",
      (e) => {
        if (isDragging && e.touches.length === 1) {
          e.preventDefault();
          onMove(e.touches[0].clientX);
        }
      },
      { passive: false },
    );
    canvas.addEventListener("touchend", onEnd);
    canvas.addEventListener("touchcancel", onEnd);

    updateCursor();
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

      // Drop-out/entry markers are a property of the data, not the cursor,
      // so we compute them once here and the draw loop just filters by x.
      const markers: RaceMarker[] = [];
      chart.data.datasets.forEach((ds, di) => {
        const pts = ds.data;
        const color = ds.borderColor ?? "#fff";
        for (let pi = 0; pi < pts.length; pi++) {
          const p = pts[pi];
          if (p?.y === null) continue;
          const prevP = pi > 0 ? pts[pi - 1] : null;
          const nextP = pi < pts.length - 1 ? pts[pi + 1] : null;

          const isDropOut = !!prevP && prevP.y !== null && nextP?.y === null;
          const isReentry = prevP?.y === null && !!nextP && nextP.y !== null;
          const isFirstAppearance =
            pi === 0 && p.x > dataMin && !!nextP && nextP.y !== null;
          const isEntry = isReentry || isFirstAppearance;

          if (!isDropOut && !isEntry) continue;
          markers.push({
            kind: isDropOut ? "dropout" : "entry",
            x: p.x,
            y: p.y,
            color,
            datasetIndex: di,
          });
        }
      });

      chart.$race = {
        cursorX: opts.autoplay ? dataMin : dataMax,
        velocity: (dataMax - dataMin) / totalRaceMs,
        playing: !!opts.autoplay,
        lastFrame: performance.now(),
        dataMin,
        dataMax,
        windowDuration,
        playButtonId: opts.playButtonId,
        markers,
      };
      setupScrollHandler(chart);
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

      const lineHeight = 14; // px — vertical padding between labels
      interface Label {
        text: string;
        color: string;
        y: number;
      }
      const labels: Label[] = [];
      chart.data.datasets.forEach((ds, i) => {
        const meta = chart.getDatasetMeta(i);
        if (meta.hidden) return;
        const y = findCurrentY(ds.data, cursorVal);
        if (y === null) return;
        labels.push({
          text: " " + (ds.label ?? ""),
          color: ds.borderColor ?? "#fff",
          y: chart.scales.y.getPixelForValue(y),
        });
      });

      // Sort top-to-bottom by natural Y.
      labels.sort((a, b) => a.y - b.y);

      // Top-down pass: push each label down until it clears the one above.
      for (let i = 1; i < labels.length; i++) {
        if (labels[i].y - labels[i - 1].y < lineHeight) {
          labels[i].y = labels[i - 1].y + lineHeight;
        }
      }

      // If the chain overflowed past the chart bottom, pin the last label
      // to area.bottom and bubble the constraint upward.
      if (labels.length > 0 && labels[labels.length - 1].y > area.bottom) {
        labels[labels.length - 1].y = area.bottom;
        for (let i = labels.length - 2; i >= 0; i--) {
          if (labels[i + 1].y - labels[i].y < lineHeight) {
            labels[i].y = labels[i + 1].y - lineHeight;
          } else break;
        }
      }

      ctx.font = "11px 'Roboto Mono', monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      for (const l of labels) {
        ctx.fillStyle = l.color;
        ctx.fillText(l.text, cursorX, l.y);
      }
      ctx.restore();

      // Fall trails (skulls) on drop-out and launch trails (rockets) on entry.
      // Markers are precomputed in afterInit; we just filter by visible range.
      ctx.save();
      ctx.lineWidth = 2;
      const trailDx = 12;
      const trailDy = 26;
      const emojiFont =
        "16px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
      ctx.font = emojiFont;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      for (const m of s.markers) {
        if (chart.getDatasetMeta(m.datasetIndex).hidden) continue;
        const trailPx = chart.scales.x.getPixelForValue(m.x);
        if (trailPx < area.left || trailPx > cursorX) continue;
        const trailPy = chart.scales.y.getPixelForValue(m.y);

        ctx.strokeStyle = m.color;
        ctx.fillStyle = m.color;

        if (m.kind === "dropout") {
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
      ctx.restore();
    },
  });

  window.__lineRace = {
    play(id, btnId) {
      const c = Chart.getChart(id);
      if (!c?.$race) return;
      // Auto-rewind when the cursor sits at the end: tick() pauses at dataMax
      // (see startTickLoop), so the next Play press restarts from dataMin.
      if (c.$race.cursorX >= c.$race.dataMax) c.$race.cursorX = c.$race.dataMin;
      c.$race.playing = true;
      c.$race.lastFrame = performance.now();
      applyWindow(c);
      const btn = btnId ? document.getElementById(btnId) : null;
      if (btn) btn.textContent = "Pause";
      c.canvas.style.cursor = "";
      startTickLoop(c);
    },
    pause(id, btnId) {
      const c = Chart.getChart(id);
      if (!c?.$race) return;
      c.$race.playing = false;
      const btn = btnId ? document.getElementById(btnId) : null;
      if (btn) btn.textContent = "Play";
      c.canvas.style.cursor = "grab";
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
      c.canvas.style.cursor = "grab";
      c.update("none");
    },
  };
}
