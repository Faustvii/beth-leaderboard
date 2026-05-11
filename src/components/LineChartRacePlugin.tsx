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
    var s = chart.$race;
    if (!s || !s.windowDuration) return;
    var rightX = Math.max(s.cursorX, s.dataMin + s.windowDuration);
    var leftX = Math.max(s.dataMin, rightX - s.windowDuration);
    if (chart.options && chart.options.scales && chart.options.scales.x) {
      chart.options.scales.x.min = leftX;
      chart.options.scales.x.max = rightX;
    }
  }

  function startTickLoop(chart) {
    function tick() {
      var s = chart.$race;
      if (!s || !s.playing) return;
      var now = performance.now();
      var dt = now - s.lastFrame;
      s.lastFrame = now;
      s.cursorX = Math.min(s.dataMax, s.cursorX + dt * s.velocity);
      applyWindow(chart);
      chart.update("none");
      if (s.cursorX >= s.dataMax) {
        s.playing = false;
        var btn = s.playButtonId && document.getElementById(s.playButtonId);
        if (btn) btn.textContent = "Play";
      }
      if (s.playing) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  Chart.register({
    id: "lineChartRace",
    defaults: { enabled: false, autoplay: true, totalRaceMs: 20000, windowSize: 50 },
    afterInit: function (chart, _args, opts) {
      if (!opts || !opts.enabled) return;
      var xSet = new Set();
      chart.data.datasets.forEach(function (ds) {
        ds.data.forEach(function (p) { xSet.add(p.x); });
      });
      var xValues = Array.from(xSet).sort(function (a, b) { return a - b; });
      if (xValues.length === 0) return;

      var dataMin = xValues[0];
      var dataMax = xValues[xValues.length - 1];
      var totalRaceMs = opts.totalRaceMs || 20000;
      var ws = Math.max(1, opts.windowSize || 50);
      var windowFraction = Math.min(1, ws / xValues.length);
      var windowDuration = (dataMax - dataMin) * windowFraction;

      chart.$race = {
        cursorX: opts.autoplay ? dataMin : dataMax,
        velocity: (dataMax - dataMin) / totalRaceMs,
        playing: !!opts.autoplay,
        lastFrame: performance.now(),
        dataMin: dataMin,
        dataMax: dataMax,
        windowDuration: windowDuration,
        playButtonId: opts.playButtonId,
      };
      applyWindow(chart);
      requestAnimationFrame(function () {
        chart.update("none");
        if (chart.$race && chart.$race.playing) startTickLoop(chart);
      });
    },
    beforeDatasetsDraw: function (chart, _args, opts) {
      if (!opts || !opts.enabled) return;
      var s = chart.$race;
      if (!s) return;
      var ctx = chart.ctx;
      var area = chart.chartArea;
      var cursorX = chart.scales.x.getPixelForValue(s.cursorX);
      ctx.save();
      ctx.beginPath();
      ctx.rect(area.left, area.top, Math.max(0, cursorX - area.left) + 0.5, area.bottom - area.top);
      ctx.clip();
    },
    afterDatasetsDraw: function (chart, _args, opts) {
      if (!opts || !opts.enabled) return;
      var s = chart.$race;
      if (!s) return;
      var ctx = chart.ctx;
      var area = chart.chartArea;
      var cursorVal = s.cursorX;
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

      // Fall trails: short diagonal strokes from each drop-out point heading
      // down off the chart, illustrating that the player lost rank rather
      // than just blinking out.
      ctx.save();
      ctx.lineWidth = 2;
      var trailDx = 12;
      var trailDy = 26;
      for (var di = 0; di < chart.data.datasets.length; di++) {
        var ds2 = chart.data.datasets[di];
        var meta2 = chart.getDatasetMeta(di);
        if (!meta2 || meta2.hidden) continue;
        var pts = ds2.data;
        for (var pi = 1; pi < pts.length - 1; pi++) {
          var p = pts[pi];
          var prevP = pts[pi - 1];
          var nextP = pts[pi + 1];
          if (!p || p.y === null) continue;
          if (!prevP || prevP.y === null) continue;
          if (!nextP || nextP.y !== null) continue;
          var trailPx = chart.scales.x.getPixelForValue(p.x);
          if (trailPx < area.left || trailPx > cursorX) continue;
          var trailPy = chart.scales.y.getPixelForValue(p.y);
          var endX = trailPx + trailDx;
          var endY = Math.min(area.bottom + 6, trailPy + trailDy);
          var color = ds2.borderColor || "#fff";
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(trailPx, trailPy);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Skull emoji at the trail tip — the player's reign in top N has died.
          ctx.font = "16px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
          ctx.textBaseline = "middle";
          ctx.textAlign = "center";
          ctx.fillText("\u{1F480}", endX, endY);
        }
      }
      ctx.restore();
    },
  });

  window.__lineRace = {
    play: function (id, btnId) {
      var c = Chart.getChart(id);
      if (!c || !c.$race) return;
      if (c.$race.cursorX >= c.$race.dataMax) c.$race.cursorX = c.$race.dataMin;
      c.$race.playing = true;
      c.$race.lastFrame = performance.now();
      applyWindow(c);
      var btn = btnId && document.getElementById(btnId);
      if (btn) btn.textContent = "Pause";
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
      c.$race.cursorX = c.$race.dataMin;
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
