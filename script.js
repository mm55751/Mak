const API_KEY = "4bd73471cd8174f99563c9a8b541211e";

// --- Funkcje do konwersji daty (niezbędne) ---
const ymd = (ts, tz=0)=>{const x=new Date((ts+tz)*1000);return `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,"0")}-${String(x.getUTCDate()).padStart(2,"0")}`};
const human = (d)=>{const[a,b,c]=d.split("-").map(Number);return new Date(Date.UTC(a,b-1,c)).toLocaleDateString("pl-PL",{weekday:"long",day:"2-digit",month:"2-digit"})};
const hm = (ts, tz=0)=>{const x=new Date((ts+tz)*1000);return `${String(x.getUTCHours()).padStart(2,"0")}:${String(x.getUTCMinutes()).padStart(2,"0")}`};
const windDir = d => typeof d!=="number"?"-":["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"][Math.round(d/22.5)%16]+` (${d}°)`;

// --- Stałe i prosta obsługa błędów ---
const out = document.getElementById("wynik");
const esc = s => String(s);
const setError = m => out.innerHTML=`<p style="color:#b00020">${esc(m||'Błąd.')}</p>`;


// 1. ŻĄDANIE CURRENT WEATHER (XMLHttpRequest)
function getCurrentWeather(query, success, error) {
    const base = `q=${encodeURIComponent(query)}&appid=${API_KEY}&units=metric&lang=pl`;
    const req = new XMLHttpRequest();
    req.open("GET", `https://api.openweathermap.org/data/2.5/weather?${base}`, true);

    req.addEventListener('load', () => {
        if (req.status !== 200) { error(`Błąd XHR: Status ${req.status}`); return; }
        let cur;
        try {
            cur = JSON.parse(req.responseText);
            console.log("XHR (Current Weather) Response:", cur);
            success(cur);
        } catch (e) {
            error("Błąd parsowania XHR.");
        }
    });
    req.addEventListener('error', () => { error("Błąd sieci XHR."); });
    req.send();
}

// 2. ŻĄDANIE FORECAST (Fetch API)
function getForecast(query, currentData) {
    const base = `q=${encodeURIComponent(query)}&appid=${API_KEY}&units=metric&lang=pl`;

    fetch(`https://api.openweathermap.org/data/2.5/forecast?${base}`)
        .then(r => { if (!r.ok) throw new Error(`Błąd Fetch: Status ${r.status}`); return r.json(); })
        .then(fore => {
            console.log("Fetch (Forecast) Response:", fore);
            renderWeather(currentData, fore);
        })
        .catch(e => { setError(e.message); });
}

// 3. RENDEROWANIE
function renderWeather(cur, fore) {
    out.innerHTML = '';
    const t=Math.round(cur.main?.temp??NaN), f=Math.round(cur.main?.feels_like??NaN);
    const curIcon = cur.weather?.[0]?.icon ? `https://openweathermap.org/img/wn/${cur.weather[0].icon}@2x.png` : '';

    // A. Bieżąca pogoda
    let html=`<div style="padding:12px;border:1px solid #ddd;border-radius:8px">`;
    html+=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">`;
    html+=`${curIcon ? `<img src="${curIcon}" width="50" height="50">` : ''}`;
    html+=`<div><h3>${esc(cur.name||'-')}, ${esc(cur.sys?.country||'')}</h3>`;
    html+=`<p style="margin:0;color:#555">${esc(cur.weather?.[0]?.description||'-')}</p></div></div>`;
    html+=`<div style="display:flex;gap:15px;align-items:baseline;margin-bottom:8px">`;
    html+=`<div style="font-size:36px;font-weight:bold">${t}°C</div>`;
    html+=`<div style="color:#555">odczuwalna: ${f}°C</div></div>`;
    html+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:small">`;
    html+=`<div>Wilgotność: <strong>${cur.main?.humidity??'-'}%</strong></div>`;
    html+=`<div>Ciśnienie: <strong>${cur.main?.pressure??'-'} hPa</strong></div>`;
    html+=`<div>Wiatr: <strong>${cur.wind?.speed??'-'} m/s</strong></div>`;
    html+=`<div>Kierunek wiatru: <strong>${windDir(cur.wind?.deg)}</strong></div></div></div>`;

    // B. Prognoza na 5 dni (szczegółowa - co 3 godziny)
    const tz=fore.city?.timezone||0, today=ymd(Math.floor(Date.now()/1000),tz);
    const byDay=new Map();
    for(const it of fore.list||[]){if(ymd(it.dt,tz)>=today) (byDay.get(ymd(it.dt,tz))||byDay.set(ymd(it.dt,tz),[]).get(ymd(it.dt,tz))).push(it)}

    const days = Array.from(byDay.keys()).sort().slice(0,5);

    if(days.length) {
        html+='<div style="margin-top:12px"><h4>Prognoza na 5 dni (co 3 godziny)</h4>';
        for(let i=0; i<days.length; i++) {
            const d = days[i];
            html += `<div style="border:1px solid #e5e5e5;margin-top:8px;padding:8px;border-radius:6px"><h5>${esc(human(d))}</h5>`;

            const dailyArr = byDay.get(d) || [];
            // Pętla FOR dla prognozy co 3 godziny
            for(let j=0; j<dailyArr.length; j++) {
                const it = dailyArr[j];
                const itemIcon = it.weather?.[0]?.icon ? `https://openweathermap.org/img/wn/${it.weather[0].icon}.png` : '';
                html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px dotted #f0f0f0;font-size:small">`;
                html += `<div style="width:40px;font-weight:bold">${hm(it.dt,tz)}</div>`;
                html += `${itemIcon ? `<img src="${itemIcon}" width="25" height="25">` : ''}`;
                html += `<div style="width:40px;text-align:right">${Math.round(it.main.temp)}°C</div>`;
                html += `<div style="color:#444">${esc(it.weather?.[0]?.description||'-')}</div>`;
                html += `</div>`;
            }
            html += `</div>`;
        }
        html+='</div>';
    }
    out.innerHTML=html;
}

// 4. GŁÓWNA FUNKCJA
function pogoda(){
    const q=(document.getElementById("miasto")?.value||"").trim();
    if(!q){out.innerHTML='<p>Wpisz miasto.</p>';return}
    out.innerHTML='<p>Ładowanie…</p>';

    getCurrentWeather(q,
        (currentData) => {
            getForecast(q, currentData);
        },
        (errorMessage) => {
            setError(errorMessage);
        }
    );
}