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
let draggedEntryId = null;

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
  const isSortingEnabled = query === "";
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
    card.dataset.entryId = entry.id;
    card.draggable = isSortingEnabled;

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

    if (isSortingEnabled) {
      card.addEventListener("dragstart", (event) => {
        draggedEntryId = entry.id;
        card.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", entry.id);
      });

      card.addEventListener("dragend", () => {
        draggedEntryId = null;
        clearDragState();
      });

      card.addEventListener("dragover", (event) => {
        event.preventDefault();
        if (!draggedEntryId || draggedEntryId === entry.id) {
          return;
        }

        event.dataTransfer.dropEffect = "move";
        clearDropTargets();
        card.classList.add("is-drop-target");
      });

      card.addEventListener("dragleave", (event) => {
        if (event.currentTarget.contains(event.relatedTarget)) {
          return;
        }

        card.classList.remove("is-drop-target");
      });

      card.addEventListener("drop", (event) => {
        event.preventDefault();
        card.classList.remove("is-drop-target");

        const sourceId = draggedEntryId || event.dataTransfer.getData("text/plain");
        if (!sourceId || sourceId === entry.id) {
          return;
        }

        const moved = moveEntry(sourceId, entry.id);
        if (!moved) {
          return;
        }

        persistEntries();
        render();
        setStatus(`「${moved.name}」の並び順を更新しました。`);
      });
    }

    elements.list.appendChild(fragment);
  });

  const totalCount = entries.length;
  const filteredCount = filtered.length;
  elements.count.textContent = query
    ? `${filteredCount} / ${totalCount} 件`
    : `${totalCount} 件`;
  elements.empty.classList.toggle("is-visible", filteredCount === 0);
}

function moveEntry(sourceId, targetId) {
  const sourceIndex = entries.findIndex((entry) => entry.id === sourceId);
  const targetIndex = entries.findIndex((entry) => entry.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return null;
  }

  const [movedEntry] = entries.splice(sourceIndex, 1);
  const insertionIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  entries.splice(insertionIndex, 0, movedEntry);
  return movedEntry;
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

function clearDragState() {
  clearDropTargets();
  document.querySelectorAll(".entry-card.is-dragging").forEach((card) => {
    card.classList.remove("is-dragging");
  });
}

function clearDropTargets() {
  document.querySelectorAll(".entry-card.is-drop-target").forEach((card) => {
    card.classList.remove("is-drop-target");
  });
}
