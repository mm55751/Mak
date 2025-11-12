(function(){
  const gridSize = 4;
  const totalTiles = gridSize * gridSize;
  let map, marker, lastExportDataUrl = null;
  let placedCount = 0;
  let notificationPermission = ("Notification" in window) ? Notification.permission : "default";

  const els = {
    btnPermissions: document.getElementById('btn-permissions'),
    btnMyLocation: document.getElementById('btn-my-location'),
    btnExport: document.getElementById('btn-export'),
    lat: document.getElementById('latitude'),
    lon: document.getElementById('longitude'),
    map: document.getElementById('map'),
    pool: document.getElementById('puzzle-pool'),
    grid: document.getElementById('puzzle-grid'),
    status: document.getElementById('puzzle-status')
  };


  function ensureGridCells(){
    if (!els.grid.querySelector('.grid-cell')){
      for (let i=0;i<totalTiles;i++){
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.index = String(i);
        cell.addEventListener('dragover', onCellDragOver);
        cell.addEventListener('drop', onCellDrop);
        els.grid.appendChild(cell);
      }
    }
  }


  function initMap(){
    map = L.map('map');
    const esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      crossOrigin: true
    });
    esriSat.addTo(map);
    map.setView([52.237049, 21.017532], 12);
  }

  async function requestPermissions(){
    if ("Notification" in window){
      try {
        const perm = await Notification.requestPermission();
        notificationPermission = perm;
      } catch (e) {
        console.warn('Nie udało się uzyskać zgody na notyfikacje', e);
      }
    }
    if (!('geolocation' in navigator)){
      alert('Twoja przeglądarka nie wspiera geolokalizacji.');
      return;
    }
    if (navigator.permissions && navigator.permissions.query){
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        if (status.state === 'denied'){
          alert('Dostęp do lokalizacji jest zablokowany w przeglądarce. Zezwól w ustawieniach strony i spróbuj ponownie.');
        }
      } catch {}
    }
  }

  async function showNotification(title, body){
    if (!("Notification" in window)){
      els.status.textContent = title + (body? ` – ${body}`: '');
      return;
    }

    console.log('Notification.permission (before):', Notification.permission, 'tracked:', notificationPermission);

    try {
      if (Notification.permission !== 'granted'){
        const perm = await Notification.requestPermission();
        notificationPermission = perm;
        console.log('Notification.requestPermission ->', perm);
      } else {
        notificationPermission = 'granted';
      }
    } catch(e){
      console.warn('Błąd przy requestPermission dla powiadomień', e);
    }

    if (notificationPermission === 'granted'){
      try {
        new Notification(title, { body });
        console.log('Notification shown');
      } catch(e) {
        console.log('Notification error', e);
        els.status.textContent = title + (body? ` – ${body}`: '');
      }
    } else {
      els.status.textContent = title + (body? ` – ${body}`: '') + ' (Aby otrzymać systemowe powiadomienie: kliknij "Poproś o zgody" i zezwól na powiadomienia lub włącz je w ustawieniach strony.)';
      console.log('Notification not granted; falling back to in-page status');
    }
  }

  function getFreshPosition(options = {}){
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation){
        reject(new Error('Geolokalizacja niedostępna'));
        return;
      }
      const opts = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
        ...options
      };
      let cleared = false;
      const clearAll = () => {
        if (cleared) return; cleared = true;
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        if (timer) clearTimeout(timer);
      };
      const timer = setTimeout(() => {
        clearAll();
        navigator.geolocation.getCurrentPosition(
          pos => resolve(pos),
          err => reject(err),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
        );
      }, opts.timeout);
      let watchId = null;
      watchId = navigator.geolocation.watchPosition((pos) => {
        clearAll();
        resolve(pos);
      }, (err) => {
        clearAll();
        reject(err);
      }, opts);
    });
  }

  async function goToMyLocation(){
    if (!navigator.geolocation){
      alert('Brak geolokalizacji');
      return;
    }
    try {
      const pos = await getFreshPosition();
      const { latitude, longitude, accuracy } = pos.coords;
      els.lat.textContent = latitude.toFixed(6);
      els.lon.textContent = longitude.toFixed(6);
      if (marker) marker.remove();
      marker = L.marker([latitude, longitude]).addTo(map).bindPopup(`Twoja lokalizacja (dokł.: ~${Math.round(accuracy)} m)`);
      map.setView([latitude, longitude], 15);
      if (accuracy && accuracy > 5000){
        els.status.textContent = 'Uwaga: niska dokładność lokalizacji. Spróbuj włączyć GPS/Wi‑Fi lub poczekaj chwilę.';
      } else {
        els.status.textContent = '';
      }
    } catch (err){
      console.error(err);
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
      const msg = !isSecure ? 'Geolokalizacja wymaga bezpiecznego połączenia (HTTPS) lub localhost.' : 'Nie udało się pobrać lokalizacji. Sprawdź uprawnienia i włącz usługi lokalizacji.';
      alert(msg);
    }
  }

  function exportMap(){
    if (!window.leafletImage){
      alert('Brak modułu do eksportu (leaflet-image).');
      return;
    }
    els.status.textContent = 'Renderowanie mapy…';
    leafletImage(map, function(err, canvas){
      if (err){
        console.error(err);
        alert('Błąd renderowania mapy');
        return;
      }
      try {
        lastExportDataUrl = canvas.toDataURL('image/png');
        buildPuzzleFromImage(lastExportDataUrl);
        els.status.textContent = 'Mapę podzielono na 16 elementów. Przeciągnij je na siatkę po prawej.';
      } catch(e){
        console.error(e);
        alert('Błąd generowania puzzli');
      }
    });
  }
  function shuffle(arr){
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildPuzzleFromImage(dataUrl){
    els.pool.innerHTML = '';
    els.grid.querySelectorAll('.grid-cell').forEach(c => { 
      c.classList.remove('correct'); 
      c.innerHTML=''; 
    });
    placedCount = 0;

    ensureGridCells();

    const img = new Image();
    img.onload = function(){
      const imgW = img.width, imgH = img.height;
      const tileW = Math.floor(imgW / gridSize);
      const tileH = Math.floor(imgH / gridSize);

      const pieces = [];
      for (let r=0; r<gridSize; r++){
        for (let c=0; c<gridSize; c++){
          const index = r * gridSize + c; // poprawna pozycja

          const canvas = document.createElement('canvas');
          canvas.width = tileW;
          canvas.height = tileH;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(
            img,
            c * tileW,
            r * tileH,
            tileW,
            tileH,
            0,
            0,
            tileW,
            tileH
          );
          
          const url = canvas.toDataURL('image/png', 1.0);
          pieces.push({ index, url, r, c });
        }
      }

      shuffle(pieces);
      for (const p of pieces){
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.draggable = true;
        tile.dataset.index = String(p.index);
        
        const img = document.createElement('img');
        img.src = p.url;
        img.draggable = false;
        const tileSize = 80;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.pointerEvents = 'none';
        
        tile.appendChild(img);
        
        tile.addEventListener('dragstart', onTileDragStart);
        tile.addEventListener('dragend', onTileDragEnd);
        els.pool.appendChild(tile);
      }
    };
    img.src = dataUrl;
  }

  let dragData = null;

  function onTileDragStart(ev){
    const el = ev.currentTarget;
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', el.dataset.index);
    dragData = { index: el.dataset.index, sourceEl: el };
    el.classList.add('dragging');
  }

  function onCellDragOver(ev){
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
  }

  function onTileDragEnd(ev) {
    ev.currentTarget.classList.remove('dragging');
  }

  function onCellDrop(ev){
    ev.preventDefault();
    const targetCell = ev.currentTarget;
    const tileIndex = ev.dataTransfer.getData('text/plain');
    if (!tileIndex) return;

    if (targetCell.children.length > 0) {
      els.status.textContent = 'To miejsce jest już zajęte.';
      return;
    }

    const expectedIndex = targetCell.dataset.index;
    const placed = dragData?.sourceEl || document.querySelector(`.tile[data-index="${tileIndex}"]`);
    if (!placed) return;

    if (placed.parentElement) {
      const wasGridCell = placed.parentElement.classList.contains('grid-cell');
      const wasCorrect = placed.parentElement.classList.contains('correct');
      placed.parentElement.classList.remove('correct');
      if (wasGridCell && wasCorrect) {
        placedCount = Math.max(0, placedCount - 1);
      }
    }

    targetCell.innerHTML = '';
    placed.style.width = '';
    placed.style.height = '';
    placed.style.aspectRatio = '';
    targetCell.appendChild(placed);

    if (tileIndex === expectedIndex) {
      targetCell.classList.add('correct');
      placed.classList.add('locked');
      placed.draggable = false;
      placed.style.cursor = 'default';
      placedCount++;
      els.status.textContent = `Ułożono poprawnie ${placedCount}/${totalTiles}`;
      if (placedCount === totalTiles) {
        showNotification('Gratulacje!', 'Udało Ci się ułożyć całą mapę');
      }
    } else {
      placed.classList.remove('locked');
      placed.draggable = true;
      placed.style.cursor = 'grab';
      els.status.textContent = 'Element położony, ale w złym miejscu. Możesz go przesunąć w inne miejsce.';
    }
  }

  function bindUI(){
    els.btnPermissions?.addEventListener('click', requestPermissions);
    els.btnMyLocation?.addEventListener('click', goToMyLocation);
    els.btnExport?.addEventListener('click', exportMap);
  }

  function start(){
    ensureGridCells();
    bindUI();
    initMap();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
};
