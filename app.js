const STORAGE_KEY = "one-button-copy.entries";

const elements = {
  form: document.getElementById("entry-form"),
  id: document.getElementById("entry-id"),
  name: document.getElementById("entry-name"),
  value: document.getElementById("entry-value"),
  reset: document.getElementById("reset-form"),
  search: document.getElementById("search-input"),
  count: document.getElementById("entry-count"),
  status: document.getElementById("status-message"),
  empty: document.getElementById("empty-state"),
  list: document.getElementById("entry-list"),
  template: document.getElementById("entry-template"),
};

let entries = loadEntries();
let statusTimer;

render();

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = elements.name.value.trim();
  const value = elements.value.value.trim();
  const editingId = elements.id.value;

  if (!name || !value) {
    setStatus("名前と値の両方を入力してください。", true);
    return;
  }

  if (editingId) {
    entries = entries.map((entry) =>
      entry.id === editingId
        ? {
            ...entry,
            name,
            value,
            updatedAt: new Date().toISOString(),
          }
        : entry,
    );
    setStatus(`「${name}」を更新しました。`);
  } else {
    entries.unshift({
      id: crypto.randomUUID(),
      name,
      value,
      updatedAt: new Date().toISOString(),
    });
    setStatus(`「${name}」を保存しました。`);
  }

  persistEntries();
  resetForm();
  render();
});

elements.reset.addEventListener("click", () => {
  resetForm();
  setStatus("入力欄をクリアしました。");
});

elements.search.addEventListener("input", () => {
  render();
});

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function persistEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function render() {
  const query = elements.search.value.trim().toLowerCase();
  const filtered = entries.filter((entry) => {
    if (!query) {
      return true;
    }

    return `${entry.name}\n${entry.value}`.toLowerCase().includes(query);
  });

  elements.list.innerHTML = "";

  filtered.forEach((entry) => {
    const fragment = elements.template.content.cloneNode(true);
    const card = fragment.querySelector(".entry-card");
    const name = fragment.querySelector(".entry-name");
    const time = fragment.querySelector(".entry-time");
    const value = fragment.querySelector(".entry-value");
    const copyButton = fragment.querySelector(".action-copy");
    const editButton = fragment.querySelector(".action-edit");
    const deleteButton = fragment.querySelector(".action-delete");

    name.textContent = entry.name;
    time.textContent = formatDate(entry.updatedAt);
    time.dateTime = entry.updatedAt;
    value.textContent = entry.value;

    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(entry.value);
        setStatus(`「${entry.name}」をコピーしました。`);
      } catch (error) {
        console.error(error);
        setStatus("コピーに失敗しました。ブラウザの権限設定を確認してください。", true);
      }
    });

    editButton.addEventListener("click", () => {
      elements.id.value = entry.id;
      elements.name.value = entry.name;
      elements.value.value = entry.value;
      elements.name.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
      setStatus(`「${entry.name}」を編集中です。`);
    });

    deleteButton.addEventListener("click", () => {
      const confirmed = window.confirm(`「${entry.name}」を削除しますか？`);
      if (!confirmed) {
        return;
      }

      entries = entries.filter((item) => item.id !== entry.id);
      persistEntries();

      if (elements.id.value === entry.id) {
        resetForm();
      }

      render();
      setStatus(`「${entry.name}」を削除しました。`);
    });

    card.dataset.entryId = entry.id;
    elements.list.appendChild(fragment);
  });

  const totalCount = entries.length;
  const filteredCount = filtered.length;
  elements.count.textContent = query
    ? `${filteredCount} / ${totalCount} 件`
    : `${totalCount} 件`;
  elements.empty.classList.toggle("is-visible", filteredCount === 0);
}

function resetForm() {
  elements.form.reset();
  elements.id.value = "";
}

function setStatus(message, isError = false) {
  window.clearTimeout(statusTimer);
  elements.status.textContent = message;
  elements.status.style.color = isError ? "#a11f1f" : "";

  statusTimer = window.setTimeout(() => {
    elements.status.textContent = "";
  }, 3000);
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
