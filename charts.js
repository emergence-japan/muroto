/* ==========================================================================
   室戸ポータル — chart renderers (vanilla JS + inline SVG / div bars)
   Specs follow the dataviz method: 2px lines, thin marks with rounded
   data-ends, hairline solid grids, surface gaps, hover layer + table twin.
   ========================================================================== */

(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const SERIES = ["#2a78d6", "#1baf7a", "#eda100"]; // validated categorical slots 1-3
  const SEQ_LIGHT = "#9ec5f4"; // sequential blue step 200 (meter track)

  /* ---------- tooltip singleton (textContent only) ---------- */

  const tip = document.createElement("div");
  tip.className = "viz-tooltip";
  tip.setAttribute("role", "status");
  document.body.appendChild(tip);

  function showTip(lines, clientX, clientY) {
    tip.replaceChildren();
    lines.forEach(function (line) {
      const div = document.createElement("div");
      div.className = line.cls || "";
      if (line.keyColor) {
        const key = document.createElement("span");
        key.className = "tt-key";
        key.style.background = line.keyColor;
        div.appendChild(key);
      }
      div.appendChild(document.createTextNode(line.text));
      tip.appendChild(div);
    });
    tip.classList.add("visible");
    positionTip(clientX, clientY);
  }

  function positionTip(clientX, clientY) {
    const pad = 14;
    const r = tip.getBoundingClientRect();
    let x = clientX + pad;
    let y = clientY - r.height - pad;
    if (x + r.width > window.innerWidth - 8) x = clientX - r.width - pad;
    if (y < 8) y = clientY + pad;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }

  function hideTip() { tip.classList.remove("visible"); }

  /* ---------- helpers ---------- */

  function svgEl(name, attrs) {
    const el = document.createElementNS(SVG_NS, name);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function fmt(n) { return n.toLocaleString("ja-JP"); }
  function fmtPct(n) { return n.toFixed(1); }

  function renderTable(container, headers, rows) {
    const table = document.createElement("table");
    table.className = "data-table";
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    headers.forEach(function (h, i) {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = h;
      if (i > 0) th.className = "num";
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    rows.forEach(function (row) {
      const tr = document.createElement("tr");
      row.forEach(function (cell, i) {
        const td = document.createElement("td");
        td.textContent = cell;
        if (i > 0) td.className = "num";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.replaceChildren(table);
  }

  /* rounded top rect path (4px data-end, square baseline) */
  function roundedTopRect(x, y, w, h, r) {
    if (h <= r) r = Math.max(0, h - 0.5);
    return "M" + x + "," + (y + h) +
      " L" + x + "," + (y + r) +
      " Q" + x + "," + y + " " + (x + r) + "," + y +
      " L" + (x + w - r) + "," + y +
      " Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) +
      " L" + (x + w) + "," + (y + h) + " Z";
  }

  /* ==========================================================================
     1. Population line chart (single series → no legend; crosshair + tooltip)
     ========================================================================== */

  function renderPopulationChart(container, tableContainer, data) {
    const series = data.series;
    const cw = container.clientWidth || 720;
    const W = Math.max(300, Math.min(720, cw));
    const narrow = W < 480;
    const H = narrow ? 240 : 300;
    const m = { top: 18, right: narrow ? 74 : 92, bottom: 30, left: narrow ? 44 : 52 };
    const iw = W - m.left - m.right, ih = H - m.top - m.bottom;

    const years = series.map(function (d) { return d.year; });
    const yMin = 8000, yMax = 16000;
    const x = function (year) { return m.left + ((year - years[0]) / (years[years.length - 1] - years[0])) * iw; };
    const y = function (v) { return m.top + ih - ((v - yMin) / (yMax - yMin)) * ih; };

    const svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img", tabindex: "0" });
    svg.setAttribute("aria-label", "室戸市の推計人口の推移。2010年15,210人から2026年9,684人まで一貫して減少。");

    // hairline grid + y ticks
    for (let v = yMin; v <= yMax; v += 2000) {
      svg.appendChild(svgEl("line", { x1: m.left, y1: y(v), x2: W - m.right, y2: y(v), class: "pop-grid" }));
      const t = svgEl("text", { x: m.left - 8, y: y(v) + 4, "text-anchor": "end", class: "pop-axis-text" });
      t.textContent = fmt(v);
      svg.appendChild(t);
    }
    // x ticks
    (narrow ? [2010, 2018, 2026] : [2010, 2014, 2018, 2022, 2026]).forEach(function (yr) {
      const t = svgEl("text", { x: x(yr), y: H - 8, "text-anchor": "middle", class: "pop-axis-text" });
      t.textContent = yr + "年";
      svg.appendChild(t);
    });

    // area wash + line
    let dLine = "", dArea = "";
    series.forEach(function (d, i) {
      const px = x(d.year), py = y(d.value);
      dLine += (i === 0 ? "M" : "L") + px + "," + py;
      dArea += (i === 0 ? "M" + px + "," + (m.top + ih) + "L" : "L") + px + "," + py;
    });
    dArea += "L" + x(years[years.length - 1]) + "," + (m.top + ih) + "Z";
    svg.appendChild(svgEl("path", { d: dArea, class: "pop-area" }));
    svg.appendChild(svgEl("path", { d: dLine, class: "pop-line" }));

    // crosshair + hover dot
    const cross = svgEl("line", { x1: 0, x2: 0, y1: m.top, y2: m.top + ih, class: "crosshair" });
    const hoverDot = svgEl("circle", { r: 4.5, class: "hover-dot" });
    svg.appendChild(cross);
    svg.appendChild(hoverDot);

    // endpoint dot + direct label (the one selective label)
    const last = series[series.length - 1];
    svg.appendChild(svgEl("circle", { cx: x(last.year), cy: y(last.value), r: 4.5, class: "pop-enddot" }));
    const el1 = svgEl("text", { x: x(last.year) + 10, y: y(last.value) + 1, class: "pop-endlabel" });
    el1.textContent = fmt(last.value) + "人";
    const el2 = svgEl("text", { x: x(last.year) + 10, y: y(last.value) + 15, class: "pop-endlabel-sub" });
    el2.textContent = "2026年6月";
    svg.appendChild(el1);
    svg.appendChild(el2);

    // hover layer: nearest-X readout
    let activeIdx = -1;
    function setActive(idx, clientX, clientY) {
      if (idx < 0 || idx >= series.length) return;
      activeIdx = idx;
      const d = series[idx];
      cross.setAttribute("x1", x(d.year));
      cross.setAttribute("x2", x(d.year));
      cross.style.opacity = 1;
      hoverDot.setAttribute("cx", x(d.year));
      hoverDot.setAttribute("cy", y(d.value));
      hoverDot.style.opacity = 1;
      const when = d.year + "年" + (d.note ? "(" + d.note + ")" : "10月1日");
      showTip([
        { text: when, cls: "tt-title" },
        { text: fmt(d.value) + " 人", cls: "tt-value", keyColor: SERIES[0] }
      ], clientX, clientY);
    }
    function clearActive() {
      activeIdx = -1;
      cross.style.opacity = 0;
      hoverDot.style.opacity = 0;
      hideTip();
    }

    svg.addEventListener("pointermove", function (ev) {
      const rect = svg.getBoundingClientRect();
      const sx = (ev.clientX - rect.left) * (W / rect.width);
      let best = 0, bestDist = Infinity;
      series.forEach(function (d, i) {
        const dist = Math.abs(x(d.year) - sx);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      setActive(best, ev.clientX, ev.clientY);
    });
    svg.addEventListener("pointerleave", clearActive);
    svg.addEventListener("focus", function () {
      const rect = svg.getBoundingClientRect();
      setActive(series.length - 1, rect.right - 60, rect.top + 40);
    });
    svg.addEventListener("blur", clearActive);
    svg.addEventListener("keydown", function (ev) {
      if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
      ev.preventDefault();
      const next = activeIdx < 0 ? series.length - 1 : activeIdx + (ev.key === "ArrowRight" ? 1 : -1);
      const idx = Math.max(0, Math.min(series.length - 1, next));
      const rect = svg.getBoundingClientRect();
      setActive(idx, rect.left + x(series[idx].year) * (rect.width / W), rect.top + y(series[idx].value) * (rect.height / H));
    });

    container.replaceChildren(svg);

    renderTable(tableContainer, ["時点", "推計人口(人)"],
      series.map(function (d) {
        return [d.year + "年" + (d.note ? " " + d.note : " 10月1日"), fmt(d.value)];
      }));
  }

  /* ==========================================================================
     2. Stacked horizontal bars (categorical, 2px surface gaps, legend)
     ========================================================================== */

  function textColorFor(seriesIdx) {
    return seriesIdx === 0 ? "" : "light-fill"; // white on blue; ink on aqua/yellow
  }

  function renderStacked(container, tableContainer, opts) {
    const wrap = document.createElement("div");

    opts.rows.forEach(function (row) {
      const group = document.createElement("div");
      group.className = "stack-group";
      if (opts.rows.length > 1 || opts.showRowLabel) {
        const lab = document.createElement("div");
        lab.className = "stack-row-label";
        lab.textContent = row.label;
        group.appendChild(lab);
      }
      const bar = document.createElement("div");
      bar.className = "stack-bar";
      row.segments.forEach(function (pct, i) {
        const seg = document.createElement("div");
        seg.className = "stack-seg " + textColorFor(i);
        seg.style.flexBasis = pct + "%";
        seg.style.flexGrow = "0";
        seg.style.flexShrink = "0";
        seg.style.background = SERIES[i];
        seg.tabIndex = 0;
        const name = opts.legend[i];
        const extra = (row.extras && row.extras[i]) ? " " + row.extras[i] : "";
        seg.setAttribute("role", "img");
        seg.setAttribute("aria-label", row.label + " " + name + " " + fmtPct(pct) + "%" + extra);
        if (pct >= 12) seg.textContent = fmtPct(pct) + "%"; // in-segment label only when it fits
        function onShow(ev) {
          const p = ev.touches ? ev.touches[0] : ev;
          const r = seg.getBoundingClientRect();
          showTip([
            { text: row.label + " — " + name, cls: "tt-title" },
            { text: fmtPct(pct) + "%" + extra, cls: "tt-value", keyColor: SERIES[i] }
          ], p.clientX !== undefined ? p.clientX : r.left + r.width / 2, p.clientY !== undefined ? p.clientY : r.top);
        }
        seg.addEventListener("pointermove", onShow);
        seg.addEventListener("pointerleave", hideTip);
        seg.addEventListener("focus", function () {
          const r = seg.getBoundingClientRect();
          showTip([
            { text: row.label + " — " + name, cls: "tt-title" },
            { text: fmtPct(pct) + "%" + extra, cls: "tt-value", keyColor: SERIES[i] }
          ], r.left + r.width / 2, r.top);
        });
        seg.addEventListener("blur", hideTip);
        bar.appendChild(seg);
      });
      group.appendChild(bar);
      wrap.appendChild(group);
    });

    // legend (≥2 series → always present)
    const legend = document.createElement("div");
    legend.className = "viz-legend";
    opts.legend.forEach(function (name, i) {
      const item = document.createElement("span");
      const swatch = document.createElement("i");
      swatch.style.background = SERIES[i];
      item.appendChild(swatch);
      item.appendChild(document.createTextNode(name));
      legend.appendChild(item);
    });
    wrap.appendChild(legend);

    container.replaceChildren(wrap);

    if (tableContainer) {
      renderTable(tableContainer, [""].concat(opts.legend),
        opts.rows.map(function (row) {
          return [row.label].concat(row.segments.map(function (pct, i) {
            const extra = (row.extras && row.extras[i]) ? "(" + row.extras[i] + ")" : "";
            return fmtPct(pct) + "%" + extra;
          }));
        }));
    }
  }

  /* ==========================================================================
     3. Horizontal bars (single measure → single hue; values at bar tips)
     ========================================================================== */

  function renderHBars(container, data) {
    const max = Math.max.apply(null, data.rows.map(function (r) { return r.value; }));
    const wrap = document.createElement("div");
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", "内訳の横棒グラフ。数値はラベルに表示。");

    data.rows.forEach(function (row) {
      const rowEl = document.createElement("div");
      rowEl.className = "hbar-row";
      rowEl.tabIndex = 0;

      const label = document.createElement("span");
      label.className = "hbar-label";
      label.textContent = row.label;

      const track = document.createElement("div");
      track.className = "hbar-track hbar-baseline";
      const fill = document.createElement("div");
      fill.className = "hbar-fill" + (row.other ? " other" : "");
      fill.style.width = Math.max(1, (row.value / max) * 100) * 0.82 + "%";
      const value = document.createElement("span");
      value.className = "hbar-value";
      value.textContent = row.value + data.unit;
      if (row.pct !== undefined) {
        const small = document.createElement("small");
        small.textContent = "(" + fmtPct(row.pct) + "%)";
        value.appendChild(small);
      }
      track.appendChild(fill);
      track.appendChild(value);
      rowEl.appendChild(label);
      rowEl.appendChild(track);
      rowEl.setAttribute("aria-label", row.label + " " + row.value + data.unit + (row.pct !== undefined ? "、構成比" + fmtPct(row.pct) + "%" : ""));

      function tipLines() {
        return [
          { text: row.label, cls: "tt-title" },
          { text: row.value + data.unit + (row.pct !== undefined ? "(構成比 " + fmtPct(row.pct) + "%)" : ""), cls: "tt-value", keyColor: row.other ? "#c9c5ba" : SERIES[0] }
        ];
      }
      rowEl.addEventListener("pointermove", function (ev) { showTip(tipLines(), ev.clientX, ev.clientY); });
      rowEl.addEventListener("pointerleave", hideTip);
      rowEl.addEventListener("focus", function () {
        const r = rowEl.getBoundingClientRect();
        showTip(tipLines(), r.left + r.width / 2, r.top);
      });
      rowEl.addEventListener("blur", hideTip);

      wrap.appendChild(rowEl);
    });

    container.replaceChildren(wrap);
  }

  /* ==========================================================================
     4. Funding-mix meter (part-to-whole of one scale: hue + lighter step)
     ========================================================================== */

  function renderMeter(container, data) {
    const colors = [SERIES[0], SEQ_LIGHT];
    const bar = document.createElement("div");
    bar.className = "stack-bar";
    bar.setAttribute("role", "img");
    bar.setAttribute("aria-label", data.segments.map(function (s) { return s.label + " " + s.pct + "%"; }).join("、"));
    data.segments.forEach(function (seg, i) {
      const el = document.createElement("div");
      el.className = "stack-seg" + (i === 1 ? " light-fill" : "");
      el.style.flexBasis = seg.pct + "%";
      el.style.flexGrow = "0";
      el.style.flexShrink = "0";
      el.style.background = colors[i];
      el.textContent = seg.label + " " + seg.pct + "%";
      bar.appendChild(el);
    });
    container.replaceChildren(bar);
  }

  /* ==========================================================================
     5. Column chart (ふるさと納税 — 5 columns, values on caps)
     ========================================================================== */

  function renderColumns(container, tableContainer, data) {
    const cw = container.clientWidth || 720;
    const W = Math.max(300, Math.min(720, cw));
    const narrow = W < 480;
    const H = narrow ? 220 : 260;
    const m = { top: 26, right: 14, bottom: 32, left: narrow ? 34 : 44 };
    const iw = W - m.left - m.right, ih = H - m.top - m.bottom;
    const yMax = 20;
    const y = function (v) { return m.top + ih - (v / yMax) * ih; };

    const svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img" });
    svg.setAttribute("aria-label", "ふるさと納税寄附受入額の推移の縦棒グラフ。各棒に金額を表示。");

    for (let v = 0; v <= yMax; v += 5) {
      svg.appendChild(svgEl("line", { x1: m.left, y1: y(v), x2: W - m.right, y2: y(v), class: "col-grid" }));
      const t = svgEl("text", { x: m.left - 8, y: y(v) + 4, "text-anchor": "end", class: "col-axis-text" });
      t.textContent = v;
      svg.appendChild(t);
    }

    const band = iw / data.series.length;
    const barW = 24; // thin-mark cap

    data.series.forEach(function (d, i) {
      const cx = m.left + band * i + band / 2;
      const barX = cx - barW / 2;
      const barY = y(d.value);
      const path = svgEl("path", {
        d: roundedTopRect(barX, barY, barW, m.top + ih - barY, 4),
        class: "col-rect",
        tabindex: "0",
        role: "img",
        "aria-label": d.year + " " + d.value + data.unit
      });

      function tipLines() {
        return [
          { text: d.year, cls: "tt-title" },
          { text: d.value + data.unit, cls: "tt-value", keyColor: SERIES[0] }
        ];
      }
      path.addEventListener("pointermove", function (ev) { showTip(tipLines(), ev.clientX, ev.clientY); });
      path.addEventListener("pointerleave", hideTip);
      path.addEventListener("focus", function () {
        const r = path.getBoundingClientRect();
        showTip(tipLines(), r.left + r.width / 2, r.top);
      });
      path.addEventListener("blur", hideTip);
      svg.appendChild(path);

      const val = svgEl("text", { x: cx, y: barY - 8, class: "col-value" });
      val.textContent = d.value;
      svg.appendChild(val);

      const xt = svgEl("text", { x: cx, y: H - 8, "text-anchor": "middle", class: "col-axis-text" });
      xt.textContent = narrow ? d.year.slice(0, 4) : d.year;
      svg.appendChild(xt);
    });

    container.replaceChildren(svg);

    renderTable(tableContainer, ["年度", "寄附受入額(" + data.unit + ")"],
      data.series.map(function (d) { return [d.year, d.value.toFixed(2)]; }));
  }

  /* ---------- boot ---------- */

  function renderSvgCharts() {
    const D = MUROTO_DATA;
    renderPopulationChart(
      document.getElementById("chart-population"),
      document.getElementById("table-population"),
      D.population
    );
    renderColumns(
      document.getElementById("chart-furusato"),
      document.getElementById("table-furusato"),
      D.furusato
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    const D = MUROTO_DATA;

    renderSvgCharts();

    /* re-render SVG charts when the layout width actually changes */
    let lastW = window.innerWidth;
    let resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (Math.abs(window.innerWidth - lastW) < 24) return;
        lastW = window.innerWidth;
        renderSvgCharts();
      }, 160);
    });

    renderStacked(
      document.getElementById("chart-age"),
      document.getElementById("table-age"),
      {
        legend: D.age.segments.map(function (s) { return s.label; }),
        rows: [{
          label: D.age.rowLabel,
          segments: D.age.segments.map(function (s) { return s.pct; }),
          extras: D.age.segments.map(function (s) { return fmt(s.people) + "人"; })
        }],
        showRowLabel: false
      }
    );

    renderStacked(
      document.getElementById("chart-industry"),
      document.getElementById("table-industry"),
      { legend: D.industry.legend, rows: D.industry.rows }
    );

    renderHBars(document.getElementById("chart-revenue"), D.revenue);
    renderMeter(document.getElementById("chart-jishu"), D.fundingMix);
    renderHBars(document.getElementById("chart-expenditure"), D.expenditure);
  });
})();
