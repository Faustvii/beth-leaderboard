const lineChartRacePluginScript = `(function () {
  if (typeof Chart === "undefined") return;

  function findCurrentY(points, cursorX) {
    var prev = null;
    var next = null;
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (p.x <= cursorX) prev = p;
      else { next = p; break; }
    }
    if (!prev || prev.y === null) return null;
    if (!next || next.y === null) return prev.y;
    var span = next.x - prev.x;
    if (span <= 0) return prev.y;
    var t = (cursorX - prev.x) / span;
    return prev.y + t * (next.y - prev.y);
  }

  function applyWindow(chart) {
    var state = chart.$race;
    if (!state || !state.windowSize || state.xValues.length === 0) return;
    var ws = state.windowSize;
    var n = state.xValues.length;
    var rightIdx = Math.max(state.idx, Math.min(ws - 1, n - 1));
    var leftIdx = Math.max(0, rightIdx - (ws - 1));
    chart.options.scales.x.min = state.xValues[leftIdx];
    chart.options.scales.x.max = state.xValues[rightIdx];
  }

  function startTickLoop(chart) {
    function tick() {
      var state = chart.$race;
      if (!state || !state.playing) return;
      var now = performance.now();
      var dt = now - state.lastFrame;
      if (dt >= state.stepMs) {
        var steps = Math.floor(dt / state.stepMs);
        var newIdx = Math.min(state.idx + steps, state.xValues.length - 1);
        state.lastFrame += steps * state.stepMs;
        if (newIdx !== state.idx) {
          state.idx = newIdx;
          applyWindow(chart);
          if (state.idx >= state.xValues.length - 1) {
            state.playing = false;
            var btn = state.playButtonId && document.getElementById(state.playButtonId);
            if (btn) btn.textContent = "Play";
          }
          chart.update("none");
        }
      }
      if (state.playing) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  Chart.register({
    id: "lineChartRace",
    defaults: { enabled: false, autoplay: true, stepMs: 80 },
    afterInit: function (chart, _args, opts) {
      if (!opts || !opts.enabled) return;
      var xSet = new Set();
      chart.data.datasets.forEach(function (ds) {
        ds.data.forEach(function (p) { xSet.add(p.x); });
      });
      var xValues = Array.from(xSet).sort(function (a, b) { return a - b; });
      chart.$race = {
        idx: 0,
        playing: !!opts.autoplay,
        lastFrame: performance.now(),
        stepMs: opts.stepMs || 80,
        xValues: xValues,
        playButtonId: opts.playButtonId,
        windowSize: opts.windowSize || null,
      };
      applyWindow(chart);
      requestAnimationFrame(function () {
        chart.update("none");
        if (chart.$race && chart.$race.playing) startTickLoop(chart);
      });
    },
    beforeDatasetsDraw: function (chart, _args, opts) {
      if (!opts || !opts.enabled) return;
      var state = chart.$race;
      if (!state || state.xValues.length === 0) return;
      var ctx = chart.ctx;
      var area = chart.chartArea;
      var cursorX = chart.scales.x.getPixelForValue(state.xValues[state.idx]);
      ctx.save();
      ctx.beginPath();
      ctx.rect(area.left, area.top, Math.max(0, cursorX - area.left) + 0.5, area.bottom - area.top);
      ctx.clip();
    },
    afterDatasetsDraw: function (chart, _args, opts) {
      if (!opts || !opts.enabled) return;
      var state = chart.$race;
      if (!state || state.xValues.length === 0) return;
      var ctx = chart.ctx;
      var area = chart.chartArea;
      var cursorVal = state.xValues[state.idx];
      var cursorX = chart.scales.x.getPixelForValue(cursorVal);
      ctx.restore();

      var xMin = chart.scales.x.min;
      var xMax = chart.scales.x.max;
      if (xMin != null && xMax != null && xMax > xMin) {
        var labelCount = 5;
        ctx.save();
        ctx.font = "11px 'Roboto Mono', monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.textBaseline = "top";
        for (var li = 0; li < labelCount; li++) {
          var t = li / (labelCount - 1);
          var val = xMin + t * (xMax - xMin);
          var lpx = chart.scales.x.getPixelForValue(val);
          var d = new Date(val);
          var label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
      chart.data.datasets.forEach(function (ds, i) {
        var meta = chart.getDatasetMeta(i);
        if (meta.hidden) return;
        var y = findCurrentY(ds.data, cursorVal);
        if (y === null) return;
        var py = chart.scales.y.getPixelForValue(y);
        ctx.fillStyle = ds.borderColor || "#fff";
        ctx.fillText(" " + (ds.label || ""), cursorX, py);
      });
      ctx.restore();
    },
  });

  window.__lineRace = {
    play: function (id, btnId) {
      var c = Chart.getChart(id);
      if (!c || !c.$race) return;
      var wasAtEnd = c.$race.idx >= c.$race.xValues.length - 1;
      if (wasAtEnd) c.$race.idx = 0;
      c.$race.playing = true;
      c.$race.lastFrame = performance.now();
      applyWindow(c);
      var btn = btnId && document.getElementById(btnId);
      if (btn) btn.textContent = "Pause";
      if (wasAtEnd) c.update("none");
      startTickLoop(c);
    },
    pause: function (id, btnId) {
      var c = Chart.getChart(id);
      if (!c || !c.$race) return;
      c.$race.playing = false;
      var btn = btnId && document.getElementById(btnId);
      if (btn) btn.textContent = "Play";
    },
    toggle: function (id, btnId) {
      var c = Chart.getChart(id);
      if (!c || !c.$race) return;
      if (c.$race.playing) window.__lineRace.pause(id, btnId);
      else window.__lineRace.play(id, btnId);
    },
    reset: function (id, btnId) {
      var c = Chart.getChart(id);
      if (!c || !c.$race) return;
      c.$race.idx = 0;
      c.$race.playing = false;
      applyWindow(c);
      var btn = btnId && document.getElementById(btnId);
      if (btn) btn.textContent = "Play";
      c.update("none");
    },
  };
})();`;

export const LineChartRacePluginHtml = () => (
  <script>{lineChartRacePluginScript}</script>
);
