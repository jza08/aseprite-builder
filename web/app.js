const DATA_PATH = "data/catalog.json";
const SAMPLE_PATH = "data/sample_catalog.json";
const LIBRARY_ROOT = "I:/Marvel comic/comics";

const state = {
  allComics: [],
  filtered: [],
};

async function loadData() {
  try {
    const res = await fetch(DATA_PATH, { cache: "no-store" });
    if (!res.ok) throw new Error("catalog.json 不存在，使用示例数据");
    state.allComics = await res.json();
  } catch (error) {
    console.warn(error.message);
    const res = await fetch(SAMPLE_PATH);
    state.allComics = await res.json();
  }

  normalizeData();
  buildFilters();
  applyFilters();
}

function normalizeData() {
  state.allComics = state.allComics.map((item, index) => {
    return {
      id: item.id ?? index,
      title: item.title ?? "未命名",
      series: item.series ?? "单本",
      series_index: Number(item.series_index ?? item.series_index ?? 0),
      authors: toArray(item.authors),
      publisher: item.publisher ?? "未知",
      pubdate: item.pubdate ?? "",
      cover: item.cover ?? "",
      tags: toArray(item.tags),
      timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
      formats: toArray(item.formats),
      comments: item.comments ?? "",
      calibre_id: item.calibre_id ?? item.id ?? index,
      path: item.path ?? item.title?.replace(/[^\w\s-]/g, "").trim() ?? "",
    };
  });
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(/,\s*/).filter(Boolean);
  return [value];
}

function buildFilters() {
  const tagSelect = document.querySelector("#tagFilter");
  const publisherSelect = document.querySelector("#publisherFilter");

  const tags = new Set();
  const publishers = new Set();

  state.allComics.forEach((comic) => {
    comic.tags.forEach((tag) => tags.add(tag));
    publishers.add(comic.publisher);
  });

  fillSelect(tagSelect, Array.from(tags).sort());
  fillSelect(publisherSelect, Array.from(publishers).sort());
}

function fillSelect(selectEl, values) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectEl.appendChild(option);
  });
}

function applyFilters() {
  const search = document.querySelector("#searchInput").value.toLowerCase();
  const tag = document.querySelector("#tagFilter").value;
  const publisher = document.querySelector("#publisherFilter").value;
  const sort = document.querySelector("#sortSelect").value;

  state.filtered = state.allComics.filter((comic) => {
    const haystack = [
      comic.title,
      comic.series,
      comic.authors.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = haystack.includes(search);
    const matchesTag = !tag || comic.tags.includes(tag);
    const matchesPublisher = !publisher || comic.publisher === publisher;

    return matchesSearch && matchesTag && matchesPublisher;
  });

  const sorters = {
    recent: (a, b) => b.timestamp - a.timestamp,
    series: (a, b) =>
      a.series.localeCompare(b.series) || a.series_index - b.series_index,
    title: (a, b) => a.title.localeCompare(b.title),
  };

  state.filtered.sort(sorters[sort]);
  updateStats();
  renderGrid();
}

function updateStats() {
  document.querySelector("#totalCount").textContent = state.filtered.length;
  const seriesCount = new Set(state.filtered.map((c) => c.series)).size;
  document.querySelector("#seriesCount").textContent = seriesCount;

  const latest = state.filtered[0]?.timestamp;
  document.querySelector("#latestImport").textContent = latest
    ? latest.toLocaleDateString()
    : "-";
}

function renderGrid() {
  const grid = document.querySelector("#comicGrid");
  grid.innerHTML = "";

  if (!state.filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "没有找到匹配的漫画，试试更宽泛的筛选条件";
    grid.appendChild(empty);
    return;
  }

  const template = document.querySelector("#comicCardTemplate");
  state.filtered.forEach((comic) => {
    const node = template.content.cloneNode(true);
    const img = node.querySelector("img");
    img.src = comic.cover || "https://dummyimage.com/400x600/1f2937/94a3b8&text=No+Cover";
    img.alt = `${comic.title} 封面`;

    node.querySelector(".series").textContent = `${comic.series} #${
      comic.series_index || "?"
    }`;
    node.querySelector(".title").textContent = comic.title;
    node.querySelector(".authors").textContent = comic.authors.join(" / ");
    node.querySelector(".tags").textContent = comic.tags.join(", ");
    node.querySelector("button").addEventListener("click", () =>
      openDrawer(comic)
    );

    grid.appendChild(node);
  });
}

function openDrawer(comic) {
  const drawer = document.querySelector("#detailDrawer");
  const content = document.querySelector("#drawerContent");

  const formatPills = comic.formats
    .map((format) => `<span class="format-pill">${format}</span>`)
    .join("");

  const calibrePath = `${LIBRARY_ROOT}/${comic.path}`;

  content.innerHTML = `
    <img class="cover" src="${
      comic.cover
    }" alt="${comic.title}" style="width:100%;border-radius:16px;" />
    <h2>${comic.title}</h2>
    <p>${comic.comments || "暂无简介"}</p>
    <div class="details-grid">
      <div>
        <span>系列</span>
        <strong>${comic.series}</strong>
      </div>
      <div>
        <span>期号</span>
        <strong>${comic.series_index || "-"}</strong>
      </div>
      <div>
        <span>作者</span>
        <strong>${comic.authors.join(" / ")}</strong>
      </div>
      <div>
        <span>出版社</span>
        <strong>${comic.publisher}</strong>
      </div>
      <div>
        <span>出版时间</span>
        <strong>${comic.pubdate || "-"}</strong>
      </div>
      <div>
        <span>导入时间</span>
        <strong>${comic.timestamp.toLocaleDateString()}</strong>
      </div>
    </div>
    <div>
      <h3>格式</h3>
      <div class="formats">${formatPills || "-"}</div>
    </div>
    <div style="margin-top:1.5rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
      <a class="primary" href="calibre://view-book/${comic.calibre_id}" target="_blank">
        在 Calibre 中打开
      </a>
      <a class="ghost" href="${calibrePath}" target="_blank">
        打开文件夹
      </a>
    </div>
  `;

  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  const drawer = document.querySelector("#detailDrawer");
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

function attachEvents() {
  document.querySelectorAll(
    "#searchInput, #tagFilter, #publisherFilter, #sortSelect"
  ).forEach((el) => el.addEventListener("input", applyFilters));

  document.querySelector("#drawerClose").addEventListener("click", closeDrawer);
  document.querySelector("#detailDrawer").addEventListener("click", (e) => {
    if (e.target.id === "detailDrawer") closeDrawer();
  });

  document.querySelector("#refreshButton").addEventListener("click", loadData);
}

attachEvents();
loadData();
