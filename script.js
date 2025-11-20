

const API_KEY = "4bd73471cd8174f99563c9a8b541211e";
console.log('Aplikacja pogodowa załadowana. Otwórz konsolę, aby zobaczyć logi.');

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatWind(deg) {
  if (typeof deg !== "number") return "-";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(deg / 22.5) % 16;
  return `${dirs[idx]} (${deg}°)`;
}

function toLocalYMD(tsSec, tzOffsetSec) {
  const d = new Date((tsSec + (tzOffsetSec || 0)) * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function humanDate(ymd, locale = "pl-PL") {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString(locale, { weekday: "long", day: "2-digit", month: "2-digit" });
}

function xhrGetJSON(url) {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "json";
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          const status = xhr.status;
          if (status >= 200 && status < 300) {
            let body = xhr.response;
            if (body == null && typeof xhr.responseText === "string" && xhr.responseText.length) {
              try { body = JSON.parse(xhr.responseText); } catch (_) {}
            }
            resolve(body);
          } else {
            let message = "";
            try {
              const errObj = xhr.response || (xhr.responseText && JSON.parse(xhr.responseText));
              if (errObj && errObj.message) message = errObj.message;
            } catch (_) {}
            reject({ status, message });
          }
        }
      };
      xhr.onerror = function () { reject({ status: 0, message: "Błąd sieci (XMLHttpRequest)" }); };
      xhr.ontimeout = function () { reject({ status: 0, message: "Przekroczono limit czasu (XMLHttpRequest)" }); };
      xhr.send();
    } catch (e) {
      reject({ status: 0, message: e?.message || "Nieznany błąd XHR" });
    }
  });
}

async function pogoda() {
  const input = document.getElementById("miasto");
  const wynik = document.getElementById("wynik");
  let q = (input?.value || "").trim();
  console.log('Kliknięto "Pogoda". Zapytanie dla miasta:', q || '(puste)');

  // Jeśli puste
  if (!q) {
    console.warn('Nie podano nazwy miasta. Przerywam.');
    wynik.innerHTML = '<p>Wpisz nazwę miasta i spróbuj ponownie.</p>';
    return;
  }

  // URL
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${API_KEY}&units=metric&lang=pl`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(q)}&appid=${API_KEY}&units=metric&lang=pl`;
  console.info('Start pobierania danych...', { currentUrl, forecastUrl });

  // Ekran ładowania
  wynik.innerHTML = '<p>Ładowanie pogody...</p>';

  try {
    // XMLHttpRequest + Fetch API
    const forecastPromise = fetch(forecastUrl);
    const currentPromise = xhrGetJSON(currentUrl);

    let data;
    try {
      data = await currentPromise; // oczekujemy JSON-a
      console.debug('Pobrano aktualną pogodę (XHR). Surowe dane:', data);
    } catch (xhrErr) {
      let msg = `Błąd: ${xhrErr?.status ?? 'nieznany'}`;
      if (xhrErr?.message) msg += ` — ${escapeHTML(xhrErr.message)}`;
      console.error('Błąd pobierania aktualnej pogody (XHR):', xhrErr);
      wynik.innerHTML = `<p style=\"color:#b00020\">Nie udało się pobrać aktualnej pogody. ${msg}</p>`;
      return;
    }

    const resForecast = await forecastPromise;
    if (!resForecast.ok) {
      let msg = `Błąd: ${resForecast.status}`;
      try {
        const errData = await resForecast.json();
        if (errData?.message) msg += ` — ${escapeHTML(errData.message)}`;
      } catch (_) {}
      console.error('Błąd pobierania prognozy (Fetch):', msg);
      wynik.innerHTML = `<p style=\"color:#b00020\">Nie udało się pobrać prognozy. ${msg}</p>`;
      return;
    }

    const forecast = await resForecast.json();
    console.debug('Pobrano prognozę (Fetch). Ilość wpisów:', forecast?.list?.length ?? 0, 'Miasto:', forecast?.city);

    // Dane z API (aktualne)
    const name = data.name || "-";
    const country = data.sys?.country || "";
    const desc = data.weather?.[0]?.description || "-";
    const icon = data.weather?.[0]?.icon || "";
    const temp = Math.round(data.main?.temp ?? NaN);
    const feels = Math.round(data.main?.feels_like ?? NaN);
    const humidity = data.main?.humidity ?? "-";
    const pressure = data.main?.pressure ?? "-";
    const wind = data.wind?.speed ?? "-";
    const windDeg = data.wind?.deg;

    const iconUrl = icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : "";

    console.info('Aktualna pogoda:', { miasto: name, kraj: country, opis: desc, temp, odczuwalna: feels, wilgotnosc: humidity, cisnienie: pressure, wiatr: wind, wiatrStopnie: windDeg });

    // HTML dla aktualnej pogody
    let html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;max-width:680px;padding:12px;border:1px solid #ddd;border-radius:8px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          ${iconUrl ? `<img src="${iconUrl}" alt="${escapeHTML(desc)}" width="64" height="64">` : ""}
          <div>
            <div style="font-size:20px;font-weight:600">${escapeHTML(name)}${country ? `, ${escapeHTML(country)}` : ""}</div>
            <div style="color:#555">${escapeHTML(desc)}</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:baseline;margin:8px 0 12px">
          <div style="font-size:40px;font-weight:700">${Number.isFinite(temp) ? `${temp}°C` : "-"}</div>
          <div style="color:#555">odczuwalna: ${Number.isFinite(feels) ? `${feels}°C` : "-"}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div>Wilgotność: <strong>${escapeHTML(humidity)}</strong>%</div>
          <div>Ciśnienie: <strong>${escapeHTML(pressure)}</strong> hPa</div>
          <div>Wiatr: <strong>${escapeHTML(wind)}</strong> m/s</div>
          <div>Kierunek wiatru: <strong>${formatWind(windDeg)}</strong></div>
        </div>
      </div>
    `;

    // 5 dni do przodu
    try {
      const tz = forecast.city?.timezone || 0; // sekundy przesunięcia
      const nowYMD = toLocalYMD(Math.floor(Date.now() / 1000), tz);
      const groups = new Map(); // ymd -> array of entries
      for (const item of forecast.list || []) {
        if (!item?.dt || !item?.main) continue;
        const ymd = toLocalYMD(item.dt, tz);
        if (!groups.has(ymd)) groups.set(ymd, []);
        groups.get(ymd).push(item);
      }

      // Od dziś 5 dni
      const sortedDays = Array.from(groups.keys()).sort();
      const selectedDays = sortedDays.filter(d => d >= nowYMD).slice(0, 5);

      const dayCards = [];
      for (const day of selectedDays) {
        const arr = groups.get(day) || [];
        let tmin = Infinity, tmax = -Infinity;
        let chosen = null;
        // Około 12:00 lokalnie
        let bestScore = Infinity;
        for (const it of arr) {
          const t = it.main.temp;
          if (Number.isFinite(t)) {
            if (t < tmin) tmin = t;
            if (t > tmax) tmax = t;
          }
          const hourLocal = new Date((it.dt + tz) * 1000).getUTCHours();
          const score = Math.abs(12 - hourLocal);
          if (score < bestScore) {
            bestScore = score;
            chosen = it;
          }
        }
        if (!Number.isFinite(tmin)) tmin = null;
        if (!Number.isFinite(tmax)) tmax = null;

        const w = chosen?.weather?.[0];
        const dsc = w?.description || "-";
        const ic = w?.icon || "";
        const icUrl = ic ? `https://openweathermap.org/img/wn/${ic}.png` : "";

        dayCards.push(`
          <div style="border:1px solid #e5e5e5;border-radius:8px;padding:10px;text-align:center;background:#fafafa">
            <div style="font-weight:600;margin-bottom:6px">${escapeHTML(humanDate(day))}</div>
            ${icUrl ? `<img src="${icUrl}" alt="${escapeHTML(dsc)}" width="50" height="50">` : ""}
            <div style="margin-top:6px;color:#444">${escapeHTML(dsc)}</div>
            <div style="margin-top:8px;font-weight:600">
              ${tmin !== null ? Math.round(tmin) + '°' : '-'} / ${tmax !== null ? Math.round(tmax) + '°' : '-'} C
            </div>
          </div>
        `);
      }

      if (dayCards.length) {
        html += `
          <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;max-width:680px;margin-top:12px">
            <div style="font-size:18px;font-weight:700;margin:6px 0 8px">Prognoza na 5 dni</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px">
              ${dayCards.join("")}
            </div>
          </div>
        `;
      }

      // Co 3 godziny
      try {
        const nowSec = Math.floor(Date.now() / 1000);
        const hourlyItems = (forecast.list || []).filter(it => it?.dt >= nowSec).slice(0, 40); // do ~5 dni, co 3h

        if (hourlyItems.length) {
          const blocks = [];
          let lastDay = "";
          for (const it of hourlyItems) {
            const day = toLocalYMD(it.dt, tz);
            if (day !== lastDay) {
              blocks.push(`<div style="font-weight:700;margin:12px 0 6px">${escapeHTML(humanDate(day))}</div>`);
              lastDay = day;
            }
            const d = new Date((it.dt + tz) * 1000);
            const hh = String(d.getUTCHours()).padStart(2, "0");
            const mm = String(d.getUTCMinutes()).padStart(2, "0");
            const time = `${hh}:${mm}`;
            const t = it.main?.temp;
            const w = it.weather?.[0];
            const dsc = w?.description || "-";
            const ic = w?.icon || "";
            const icUrl = ic ? `https://openweathermap.org/img/wn/${ic}.png` : "";

            blocks.push(`
              <div style="display:flex;align-items:center;gap:10px;padding:6px 4px;border-bottom:1px solid #eee">
                <div style="width:54px;font-variant-numeric:tabular-nums">${time}</div>
                ${icUrl ? `<img src="${icUrl}" alt="${escapeHTML(dsc)}" width="36" height="36">` : ""}
                <div style="min-width:60px;font-weight:600">${Number.isFinite(t) ? Math.round(t) + '°C' : '-'}</div>
                <div style="color:#555;flex:1">${escapeHTML(dsc)}</div>
              </div>
            `);
          }

          html += `
            <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;max-width:680px;margin-top:12px">
              <div style="font-size:18px;font-weight:700;margin:12px 0 8px">Prognoza co 3 godziny</div>
              <div>
                ${blocks.join("")}
              </div>
            </div>
          `;
        }
      } catch (e) {
        console.warn("Błąd budowania prognozy co 3 godziny:", e);
      }
    } catch (e) {
      console.warn("Błąd budowania prognozy:", e);
    }

    wynik.innerHTML = html;
  } catch (err) {
    console.error(err);
    wynik.innerHTML = `<p style="color:#b00020">Wystąpił nieoczekiwany błąd podczas pobierania danych.</p>`;
  }
}
