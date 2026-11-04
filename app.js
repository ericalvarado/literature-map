/* Literature Infographic — static GitHub Pages app
 * Data-driven from data/works.json. Vanilla JS + D3 v7 (CDN).
 */
(function () {
  "use strict";

  const DATA_URL = "data/works.json";
  let DATA = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function byId(id) {
    return DATA.works.find((w) => w.id === id);
  }

  function colorForArea(area) {
    const meta = DATA.areaMeta[area] || DATA.areaMeta[area === "UI/UX & Design" ? "UI/UX" : area];
    return (meta && meta.color) || "#94a3b8";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cite(w) {
    if (w.citation_count != null) {
      return `${w.citation_count} cites (${w.citation_source || "source n/a"})`;
    }
    return "cites n/a";
  }

  function workCard(w) {
    const title = escapeHtml(w.title);
    const authors = escapeHtml(w.authors);
    const year = w.year;
    const venue = escapeHtml(w.venue);
    const why = escapeHtml(w.why);
    const link = escapeHtml(w.link);
    const kindClass = w.kind === "recent" ? "kind recent" : "kind";
    return `<details class="work">
      <summary>
        <span>${authors} (${year})</span>
        <span class="${kindClass}">${escapeHtml(w.kind)}</span>
      </summary>
      <p><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></p>
      <p class="venue">${venue} · ${escapeHtml(cite(w))} · ${escapeHtml(w.area)}</p>
      <p>${why}</p>
    </details>`;
  }

  function renderMetrics() {
    const counts = {};
    DATA.works.forEach((w) => {
      counts[w.area] = (counts[w.area] || 0) + 1;
    });
    const recent = DATA.works.filter((w) => w.kind === "recent").length;
    const items = [
      { value: DATA.works.length, label: "Verified entries" },
      { value: counts["Data Comics"] || 0, label: "Data Comics" },
      { value: recent, label: "Recent ~2020–26" },
      { value: DATA.readingOrder.length, label: "Reading path" },
    ];
    $("#metrics").innerHTML = items
      .map(
        (m) =>
          `<li><span class="value">${m.value}</span><span class="label">${escapeHtml(
            m.label
          )}</span></li>`
      )
      .join("");
    return counts;
  }

  function renderLegend() {
    $("#legend").innerHTML = DATA.coreAreas
      .map((a) => {
        const c = colorForArea(a);
        return `<li><span class="swatch" style="background:${c}" aria-hidden="true"></span><span>${escapeHtml(
          a
        )}</span></li>`;
      })
      .join("");
  }

  function renderCoreCards(counts) {
    $("#core-cards").innerHTML = DATA.coreAreas
      .map((a) => {
        const meta = DATA.areaMeta[a];
        return `<article class="card">
          <h3><span class="swatch" style="background:${meta.color}" aria-hidden="true"></span>${escapeHtml(
          a
        )}</h3>
          <p>${escapeHtml(meta.short)}</p>
          <p class="meta">${counts[a] || 0} catalog entries</p>
        </article>`;
      })
      .join("");
  }

  function renderReadingPath() {
    const shortWhy = DATA.readingShortWhy || {};
    $("#reading-path").innerHTML = DATA.readingOrder
      .map((id) => {
        const w = byId(id);
        if (!w) {
          return `<li><div class="title">${escapeHtml(id)}</div><div class="detail">Missing from catalog</div></li>`;
        }
        const author = w.authors.split(";")[0];
        const why = shortWhy[id] || w.why;
        return `<li>
          <div class="title">${escapeHtml(author)} (${w.year})</div>
          <div class="detail"><a href="${escapeHtml(w.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
          w.title
        )}</a> — ${escapeHtml(why)}</div>
        </li>`;
      })
      .join("");
  }

  function renderGaps() {
    $("#gap-cards").innerHTML = DATA.blindSpots
      .map((b) => {
        const links = (b.starters || [])
          .map((id) => byId(id))
          .filter(Boolean)
          .map(
            (w, i) =>
              `<li>${i + 1}. <a href="${escapeHtml(w.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                w.authors
              )} (${w.year}). ${escapeHtml(w.title)}</a></li>`
          )
          .join("");
        return `<article class="card">
          <h3>${escapeHtml(b.title)} <span class="badge">open gap</span></h3>
          <p>${escapeHtml(b.why)}</p>
          <ol>${links}</ol>
        </article>`;
      })
      .join("");
  }

  function drawNetwork() {
    const svgEl = $("#network");
    if (!window.d3 || !svgEl) return;

    const width = 920;
    const height = 420;
    const svg = d3.select(svgEl).attr("viewBox", `0 0 ${width} ${height}`).attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    // Fixed layout: bridges top, cores middle, hub center-bottom, gaps right
    const positions = {
      ling: [80, 60],
      cog: [280, 40],
      ux: [500, 40],
      gd: [720, 60],
      semi: [120, 180],
      narr: [300, 200],
      vt: [500, 200],
      dv: [700, 180],
      dc: [410, 310],
      gap_seq: [680, 340],
      gap_a11y: [820, 280],
      gap_recall: [820, 380],
    };

    const nodes = DATA.network.nodes.map((n) => ({
      ...n,
      x: positions[n.id][0],
      y: positions[n.id][1],
    }));
    const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const edges = DATA.network.edges.map((e) => ({
      ...e,
      source: nodeById[e.from],
      target: nodeById[e.to],
    }));

    const g = svg.append("g");

    // edges
    g.selectAll("line.edge")
      .data(edges)
      .join("line")
      .attr("class", "edge")
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y)
      .attr("stroke", (d) => (d.dashed ? "#f59e0b" : "#64748b"))
      .attr("stroke-width", (d) => (d.dashed ? 2 : 1.5))
      .attr("stroke-dasharray", (d) => (d.dashed ? "6 4" : null))
      .attr("opacity", 0.85);

    // edge labels (sparse)
    g.selectAll("text.elabel")
      .data(edges.filter((e) => e.dashed || e.label.length < 14))
      .join("text")
      .attr("class", "elabel")
      .attr("x", (d) => (d.source.x + d.target.x) / 2)
      .attr("y", (d) => (d.source.y + d.target.y) / 2 - 6)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", 9)
      .text((d) => d.label);

    const node = g
      .selectAll("g.node")
      .data(nodes)
      .join("g")
      .attr("class", (d) => `node network-node ${d.role}`)
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("tabindex", 0)
      .attr("role", "img")
      .attr("aria-label", (d) => `${d.label}: ${d.detail}`);

    node.each(function (d) {
      const sel = d3.select(this);
      const fill = d.role === "gap" ? "#1c1917" : colorForArea(d.area || "Data Comics");
      if (d.role === "gap") {
        // diamond
        sel
          .append("polygon")
          .attr("points", "0,-22 28,0 0,22 -28,0")
          .attr("fill", fill)
          .attr("stroke", "#f59e0b")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4 3")
          .attr("class", "gap-node");
      } else if (d.role === "hub") {
        sel
          .append("circle")
          .attr("r", 34)
          .attr("fill", fill)
          .attr("stroke", "#fff")
          .attr("stroke-width", 2.5);
      } else {
        const w = d.role === "bridge" ? 108 : 118;
        const h = 44;
        sel
          .append("rect")
          .attr("x", -w / 2)
          .attr("y", -h / 2)
          .attr("rx", 10)
          .attr("width", w)
          .attr("height", h)
          .attr("fill", fill)
          .attr("stroke", "rgba(255,255,255,0.35)")
          .attr("stroke-width", 1.5)
          .attr("opacity", d.role === "bridge" ? 0.85 : 1);
      }
      sel
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", d.role === "gap" ? "0.35em" : "-0.1em")
        .attr("fill", "#fff")
        .attr("font-size", d.role === "hub" ? 12 : 11)
        .attr("font-weight", 700)
        .text(d.label);
      if (d.role !== "gap") {
        sel
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "1.15em")
          .attr("fill", "rgba(255,255,255,0.85)")
          .attr("font-size", 9)
          .text(d.detail);
      } else {
        sel
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "1.5em")
          .attr("fill", "#fbbf24")
          .attr("font-size", 9)
          .text("OPEN GAP");
      }
    });
  }

  function drawTimeline() {
    const svgEl = $("#timeline");
    if (!window.d3 || !svgEl) return;

    const marks = DATA.timelineIds.map((id) => byId(id)).filter(Boolean);
    if (!marks.length) return;

    const width = 920;
    const height = 170;
    const pad = 28;
    const minY = marks[0].year;
    const maxY = marks[marks.length - 1].year;
    const span = Math.max(maxY - minY, 1);

    const svg = d3.select(svgEl).attr("viewBox", `0 0 ${width} ${height}`).attr("width", width).attr("height", height);
    svg.selectAll("*").remove();

    svg
      .append("line")
      .attr("x1", pad)
      .attr("y1", height / 2)
      .attr("x2", width - pad)
      .attr("y2", height / 2)
      .attr("stroke", "#475569")
      .attr("stroke-width", 2);

    [1900, 1950, 1980, 2000, 2010, 2020, 2026].forEach((y) => {
      if (y < minY - 5 || y > maxY + 5) return;
      const x = pad + ((y - minY) / span) * (width - pad * 2);
      svg
        .append("line")
        .attr("x1", x)
        .attr("y1", height / 2 - 8)
        .attr("x2", x)
        .attr("y2", height / 2 + 8)
        .attr("stroke", "#64748b");
      svg
        .append("text")
        .attr("x", x)
        .attr("y", height - 8)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("font-size", 10)
        .text(y);
    });

    marks.forEach((w, i) => {
      const x = pad + ((w.year - minY) / span) * (width - pad * 2);
      const up = i % 2 === 0;
      const y2 = up ? 28 : height - 36;
      const color = colorForArea(w.area);
      const label = w.authors.split(";")[0].split(" ").slice(-1)[0];
      const g = svg.append("g");
      g.append("line")
        .attr("x1", x)
        .attr("y1", height / 2)
        .attr("x2", x)
        .attr("y2", y2)
        .attr("stroke", color)
        .attr("stroke-width", 2);
      g.append("circle").attr("cx", x).attr("cy", y2).attr("r", 5).attr("fill", color);
      g.append("text")
        .attr("x", x)
        .attr("y", up ? y2 - 10 : y2 + 16)
        .attr("text-anchor", "middle")
        .attr("fill", "#cbd5e1")
        .attr("font-size", 9)
        .text(`${label} ’${String(w.year).slice(2)}`);
      g.append("title").text(`${w.authors} (${w.year}). ${w.title} — ${w.area}`);
    });
  }

  function mapFocusToCatalogArea(focus) {
    if (focus === "UI/UX" || focus === "Graphic Design") return "UI/UX & Design";
    if (focus === "Linguistics") return "Semiotics";
    if (focus === "Cognitive Psychology") return "Visual Thinking";
    return focus;
  }

  function setupAreas() {
    const options = [
      ...DATA.coreAreas,
      ...DATA.bridgeAreas,
      "Visualization Literacy",
      "Accessibility",
    ];
    const sel = $("#focus-select");
    sel.innerHTML = options.map((a) => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join("");
    sel.value = "Data Comics";
    const render = () => {
      const focus = sel.value;
      const meta = DATA.areaMeta[focus] || { def: "", color: "#94a3b8" };
      $("#focus-def").innerHTML = `<strong>${escapeHtml(focus)}</strong><span>${escapeHtml(meta.def || "")}</span>`;
      const catalogArea = mapFocusToCatalogArea(focus);
      const works = DATA.works
        .filter((w) => w.area === catalogArea)
        .sort((a, b) => a.year - b.year || a.title.localeCompare(b.title))
        .slice(0, 12);
      $("#focus-count").textContent = `Up to 12 works from the catalog for this node (${works.length} shown).`;
      $("#focus-works").innerHTML = works.map(workCard).join("");
    };
    sel.addEventListener("change", render);
    render();
  }

  function setupComics() {
    const c = DATA.comics;
    const fill = (el, ids) => {
      $(el).innerHTML = ids.map((id) => byId(id)).filter(Boolean).map(workCard).join("");
    };
    fill("#comics-design", c.design);
    fill("#comics-empirical", c.empirical);
    fill("#comics-cognition", c.cognition);
    $("#open-questions").innerHTML = c.openQuestions
      .map(
        (q) =>
          `<aside class="callout" role="note"><strong>${escapeHtml(q.lead)}</strong><span>${escapeHtml(
            q.text
          )}</span></aside>`
      )
      .join("");
  }

  function setupCatalog(counts) {
    const areaSel = $("#area-filter");
    const kindSel = $("#kind-filter");
    const search = $("#search-filter");
    areaSel.innerHTML =
      `<option value="all">all</option>` +
      DATA.catalogAreas
        .map(
          (a) =>
            `<option value="${escapeHtml(a)}">${escapeHtml(a)} (${counts[a] || 0})</option>`
        )
        .join("");
    $("#catalog-intro").textContent = `All ${DATA.works.length} verified entries. Weekly jobs append here; the infographic recomputes automatically.`;

    const render = () => {
      const area = areaSel.value;
      const kind = kindSel.value;
      const q = search.value.trim().toLowerCase();
      const filtered = DATA.works
        .filter((w) => {
          if (area !== "all" && w.area !== area) return false;
          if (kind !== "all" && w.kind !== kind) return false;
          if (!q) return true;
          return `${w.title} ${w.authors} ${w.venue} ${w.why} ${w.area}`.toLowerCase().includes(q);
        })
        .sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
      $("#catalog-count").textContent = `Showing ${filtered.length} of ${DATA.works.length}.`;
      $("#catalog-list").innerHTML = filtered.map(workCard).join("");
    };
    areaSel.addEventListener("change", render);
    kindSel.addEventListener("change", render);
    search.addEventListener("input", render);
    render();
  }

  function setupTabs() {
    const tabs = $$('[role="tab"]');
    const panels = {
      map: $("#panel-map"),
      areas: $("#panel-areas"),
      comics: $("#panel-comics"),
      catalog: $("#panel-catalog"),
    };

    function activate(view, { focusPanel = true } = {}) {
      tabs.forEach((tab) => {
        const selected = tab.dataset.view === view;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.tabIndex = selected ? 0 : -1;
      });
      Object.entries(panels).forEach(([key, panel]) => {
        const on = key === view;
        panel.hidden = !on;
        if (on && focusPanel) panel.focus({ preventScroll: true });
      });
      if (view === "map") {
        // redraw in case of late D3 / resize
        drawNetwork();
        drawTimeline();
      }
      try {
        history.replaceState(null, "", `#${view}`);
      } catch (_) {}
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => activate(tab.dataset.view));
      tab.addEventListener("keydown", (e) => {
        let next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          next.focus();
          activate(next.dataset.view, { focusPanel: false });
        }
      });
    });

    const hash = (location.hash || "#map").slice(1);
    const initial = panels[hash] ? hash : "map";
    activate(initial, { focusPanel: false });
  }

  async function init() {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`Failed to load ${DATA_URL}: ${res.status}`);
    DATA = await res.json();
    if (!DATA.works || !Array.isArray(DATA.works)) {
      throw new Error("works.json missing works array");
    }

    document.title = DATA.meta.title;
    $("#summary").textContent = DATA.meta.summary;
    $("#updated-note").textContent = DATA.meta.updatedNote;
    $("#verification").textContent = DATA.meta.verification;

    const counts = renderMetrics();
    renderLegend();
    renderCoreCards(counts);
    renderReadingPath();
    renderGaps();
    setupAreas();
    setupComics();
    setupCatalog(counts);
    setupTabs();

    // D3 may still be loading due to defer order; retry briefly
    const tryDraw = () => {
      if (window.d3) {
        drawNetwork();
        drawTimeline();
        return true;
      }
      return false;
    };
    if (!tryDraw()) {
      let n = 0;
      const t = setInterval(() => {
        n += 1;
        if (tryDraw() || n > 40) clearInterval(t);
      }, 50);
    }

    window.addEventListener("resize", () => {
      if (!$("#panel-map").hidden) {
        drawNetwork();
        drawTimeline();
      }
    });
  }

  init().catch((err) => {
    console.error(err);
    const main = $("#main");
    if (main) {
      main.insertAdjacentHTML(
        "afterbegin",
        `<aside class="callout" role="alert"><strong>Could not load data.</strong><span>${escapeHtml(
          String(err.message || err)
        )}</span></aside>`
      );
    }
  });
})();
