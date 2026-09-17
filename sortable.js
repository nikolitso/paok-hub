(function () {
  var style = document.createElement("style");
  style.textContent =
    "thead th.sortable { cursor: pointer; user-select: none; }" +
    "thead th.sortable:hover { color: var(--accent, inherit); }" +
    "thead th .sort-arrow { display: inline-block; margin-left: 4px; opacity: 0.35; font-size: 9px; }" +
    "thead th.sort-active .sort-arrow { opacity: 1; }";
  document.head.appendChild(style);

  function textOf(cell) {
    return (cell.textContent || "").trim();
  }

  function sortValue(cell) {
    var badge = cell.querySelector(".dpos-badge");
    if (badge) {
      var n = parseFloat(badge.textContent.replace(/[^\d.]/g, "")) || 0;
      if (badge.classList.contains("neg-num")) return -n;
      if (badge.classList.contains("zero")) return 0;
      return n;
    }
    // Ignore nested delta/flag annotations (e.g. the "13/14" partial-data
    // superscript) so they can't get glued onto the primary number.
    var clone = cell.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll(".delta, .n-flag"), function (el) {
      el.parentNode.removeChild(el);
    });
    var raw = textOf(clone);
    var cleaned = raw.replace(/−/g, "-").replace(/[,%€$]/g, "").replace(/^\+/, "");
    if (cleaned !== "" && !isNaN(parseFloat(cleaned)) && /^-?[\d.]/.test(cleaned)) {
      return parseFloat(cleaned);
    }
    return raw.toLowerCase();
  }

  function compare(a, b) {
    var av = a.value, bv = b.value;
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    av = String(av); bv = String(bv);
    if (av < bv) return -1;
    if (av > bv) return 1;
    return 0;
  }

  function sortTable(table, colIndex, dir) {
    var tbody = table.tBodies[0];
    if (!tbody) return;
    var rows = Array.prototype.slice.call(tbody.rows);

    // Split into segments, each led by an optional group-row header, so
    // grouped tables (e.g. by position) sort within each group rather
    // than across them.
    var segments = [];
    var header = null;
    var current = [];
    rows.forEach(function (row) {
      if (row.classList.contains("group-row")) {
        segments.push({ header: header, rows: current });
        header = row;
        current = [];
      } else {
        current.push(row);
      }
    });
    segments.push({ header: header, rows: current });

    var out = document.createDocumentFragment();
    segments.forEach(function (seg) {
      if (seg.header) out.appendChild(seg.header);
      var withValues = seg.rows.map(function (row) {
        var cell = row.cells[colIndex];
        return { row: row, value: cell ? sortValue(cell) : "" };
      });
      withValues.sort(function (a, b) {
        var c = compare(a, b);
        return dir === "asc" ? c : -c;
      });
      withValues.forEach(function (x) { out.appendChild(x.row); });
    });
    tbody.appendChild(out);
  }

  function initTable(table) {
    var headRow = table.tHead && table.tHead.rows[table.tHead.rows.length - 1];
    if (!headRow) return;
    var ths = Array.prototype.slice.call(headRow.cells);
    var state = { col: -1, dir: "asc" };

    ths.forEach(function (th, idx) {
      th.classList.add("sortable");
      var arrow = document.createElement("span");
      arrow.className = "sort-arrow";
      arrow.textContent = "▴▾";
      th.appendChild(arrow);

      th.addEventListener("click", function () {
        var dir;
        if (state.col === idx) {
          dir = state.dir === "desc" ? "asc" : "desc";
        } else {
          dir = "desc";
        }
        state.col = idx;
        state.dir = dir;

        ths.forEach(function (h) {
          h.classList.remove("sort-active");
          var a = h.querySelector(".sort-arrow");
          if (a) a.textContent = "▴▾";
        });
        th.classList.add("sort-active");
        arrow.textContent = dir === "asc" ? "▴" : "▾";

        sortTable(table, idx, dir);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.forEach.call(document.querySelectorAll("table"), initTable);
  });
})();
