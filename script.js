(function() {
  'use strict';

  // Elementy DOM
  const $lista = document.getElementById('lista');
  const $input = document.getElementById('input');
  const $data = document.getElementById('data');
  const $dodaj = document.getElementById('dodaj');
  const $szukaj = document.getElementById('szukaj');

  if (!$lista || !$input || !$data || !$dodaj || !$szukaj) {
    // Jeśli czegoś brakuje, nie rób nic więcej
    return;
  }

  // Stan aplikacji
  const STORAGE_KEY = 'lab02_tasks_v1';
  let tasks = load();
  let query = '';
  let editingId = null;

  // Inicjalizacja
  render();
  wireEvents();

  function wireEvents() {
    // Dodawanie po kliknięciu
    $dodaj.addEventListener('click', handleAdd);

    // Dodawanie po Enter w polu tytułu
    $input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleAdd();
      }
    });

    // Szybkie czyszczenie daty po ESC
    $data.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        $data.value = '';
      }
    });

    // Live search
    $szukaj.addEventListener('input', () => {
      query = $szukaj.value.trim().toLowerCase();
      render();
    });
  }

  function handleAdd() {
    const title = ($input.value || '').trim();
    const date = ($data.value || '').trim();

    if (!title) {
      // lekkie podświetlenie błędu
      flashInvalid($input);
      return;
    }

    tasks.push({ id: uid(), title, date });
    save();

    // Wyczyść pola i odśwież listę
    $input.value = '';
    // data zostawiamy, by wygodniej dodać kilka zadań z tą samą datą
    render();
    $input.focus();
  }

  function render() {
    const q = query;
    const items = q
      ? tasks.filter(t => matches(t, q))
      : tasks;

    // Wyczyść listę
    $lista.innerHTML = '';

    if (items.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.style.opacity = '0.8';
      li.innerHTML = `<span class="title">${q ? 'Brak wyników wyszukiwania' : 'Brak zadań'}</span>`;
      $lista.appendChild(li);
      return;
    }

    for (const t of items) {
      const li = document.createElement('li');

      const actionsEl = document.createElement('div');
      actionsEl.className = 'actions';

      const delBtn = document.createElement('button');
      delBtn.className = 'button-ghost button-danger';
      delBtn.type = 'button';
      delBtn.textContent = 'Usuń';
      delBtn.addEventListener('click', (e) => { e.stopPropagation(); removeTask(t.id); });

      actionsEl.appendChild(delBtn);

      if (t.id === editingId) {
        // Tryb edycji inline
        const inputTitle = document.createElement('input');
        inputTitle.type = 'text';
        inputTitle.value = t.title;
        inputTitle.placeholder = 'Tytuł zadania';
        inputTitle.className = 'title';

        const inputDate = document.createElement('input');
        inputDate.type = 'date';
        inputDate.value = t.date || '';
        inputDate.className = 'date';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'button-ghost button-success';
        saveBtn.type = 'button';
        saveBtn.textContent = 'Zapisz';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'button-ghost';
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Anuluj';

        const isValidDate = (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val);

        const commit = () => {
          const title = (inputTitle.value || '').trim();
          const date = (inputDate.value || '').trim();
          if (!title) {
            flashInvalid(inputTitle);
            inputTitle.focus();
            return;
          }
          if (!isValidDate(date)) {
            flashInvalid(inputDate);
            inputDate.focus();
            return;
          }
          const idx = tasks.findIndex(x => x.id === t.id);
          if (idx !== -1) {
            tasks[idx].title = title;
            tasks[idx].date = date;
            save();
          }
          editingId = null;
          render();
        };

        const cancel = () => {
          editingId = null;
          render();
        };

        inputTitle.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') cancel();
        });
        inputDate.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') cancel();
        });

        saveBtn.addEventListener('click', commit);
        cancelBtn.addEventListener('click', cancel);

        li.appendChild(inputTitle);
        li.appendChild(inputDate);
        actionsEl.appendChild(saveBtn);
        actionsEl.appendChild(cancelBtn);
        li.appendChild(actionsEl);

        // Ustaw focus po wyrenderowaniu
        setTimeout(() => inputTitle.focus(), 0);
      } else {
        // Tryb odczytu
        const titleEl = document.createElement('span');
        titleEl.className = 'title';
        const displayTitle = t.title || '';
        const displayDate = t.date ? formatDate(t.date) : '';
        if (($szukaj.value || '').trim()) {
          titleEl.innerHTML = highlight(displayTitle, ($szukaj.value || '').trim());
        } else {
          titleEl.textContent = displayTitle;
        }
        const dateEl = document.createElement('span');
        dateEl.className = 'date';
        if (($szukaj.value || '').trim()) {
          dateEl.innerHTML = highlight(displayDate, ($szukaj.value || '').trim());
        } else {
          dateEl.textContent = displayDate;
        }

        // Kliknięcie w tytuł lub datę uruchamia edycję
        titleEl.title = 'Kliknij, aby edytować';
        dateEl.title = 'Kliknij, aby edytować';
        titleEl.style.cursor = 'pointer';
        dateEl.style.cursor = 'pointer';
        titleEl.addEventListener('click', () => editTask(t.id));
        dateEl.addEventListener('click', () => editTask(t.id));

        li.appendChild(titleEl);
        li.appendChild(dateEl);
        li.appendChild(actionsEl);
      }

      $lista.appendChild(li);
    }
  }

  function matches(task, q) {
    if (!q) return true;
    const inTitle = task.title.toLowerCase().includes(q);
    const inDate = (task.date || '').toLowerCase().includes(q);
    return inTitle || inDate;
  }

  function removeTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      tasks.splice(idx, 1);
      save();
      render();
    }
  }

  function editTask(id) {
    // Przejście do trybu edycji inline (bez promptów)
    const exists = tasks.some(t => t.id === id);
    if (!exists) return;
    editingId = id;
    render();
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (_) {
      // ignoruj
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function formatDate(str) {
    // str w formacie YYYY-MM-DD
    try {
      const [y, m, d] = str.split('-').map(n => parseInt(n, 10));
      if (!y || !m || !d) return str;
      return `${d.toString().padStart(2,'0')}.${m.toString().padStart(2,'0')}.${y}`;
    } catch {
      return str;
    }
  }

  // Zabezpieczone wyróżnianie frazy wyszukiwania
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function escapeHTML(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function highlight(text, qRaw) {
    const txt = String(text ?? '');
    const q = String(qRaw ?? '').trim();
    if (!q) return escapeHTML(txt);
    try {
      const re = new RegExp(escapeRegExp(q), 'gi');
      // Najpierw uciekamy cały tekst, potem podmieniamy dopasowania w bezpieczny sposób
      // Uwaga: Ponieważ używamy replacera, posługujemy się dopasowaniem m (oryginalny fragment)
      return escapeHTML(txt).replace(re, (m) => `<mark class="hl">${escapeHTML(m)}</mark>`);
    } catch {
      // fallback na wypadek błędów z RegExp
      return escapeHTML(txt);
    }
  }

  function flashInvalid(el) {
    el.style.boxShadow = '0 0 0 4px rgba(239,68,68,0.25)';
    el.style.borderColor = 'rgba(239,68,68,0.6)';
    setTimeout(() => {
      el.style.boxShadow = '';
      el.style.borderColor = '';
    }, 300);
  }
})();