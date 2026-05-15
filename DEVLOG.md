# Movie Search — Nasıl Yaptım

OMDB API'yi kullanan basit bir film arama uygulaması. Tek sayfa, yenileme olmadan çalışıyor, son aramayı hatırlıyor. HTML + CSS + JS, başka bir şey yok.

---

## Klasör Yapısı

```
omdb-project/
├── index.html
├── style.css
└── script.js
```

Üç dosya. Çerçeve kullanmadım, modül sistemi yok, derleme adımı yok. Direkt tarayıcıda açılıyor.

---

## 1. HTML

Önce sayfanın iskeletini çıkardım. Neye ihtiyacım var diye düşündüm:

- API key'i bir yere girmem lazım (OMDB ücretsiz key veriyor ama yine de gerekiyor)
- Arama kutusu ve buton
- Sonuçların gösterileceği bir alan
- Film detayları için bir modal
- Yükleniyor / hata mesajları

### API Key Banner

```html
<div id="key-banner">
    <p>You need a free OMDB API key to use this app.
       Get one at <a href="https://www.omdbapi.com/apikey.aspx" target="_blank">omdbapi.com</a>
    </p>
    <div class="key-row">
        <input type="text" id="key-input" placeholder="Paste your API key here">
        <button onclick="saveKey()">Save</button>
    </div>
    <span id="key-err"></span>
</div>
```

Bu banner başta `display: none` ile gizli, JS'de key yoksa gösteriliyor. Key localStorage'a kaydedildikten sonra bir daha çıkmıyor. Header'daki "⚙ API Key" butonuyla da açılıp kapatılabiliyor.

### Header

```html
<header>
    <div class="header-wrap">
        <h1>🎬 Movie Search</h1>
        <button onclick="toggleKeyBanner()" id="settings-btn">⚙ API Key</button>
    </div>
</header>
```

Sade tuttum. Logo yerine emoji koydum, çünkü ayrı bir ikon dosyasıyla uğraşmak istemedim.

### Arama Kısmı

```html
<div class="search-row">
    <input type="text" id="search-input" placeholder="Search for a movie or TV show...">
    <button id="search-btn">Search</button>
</div>

<p id="loading-msg">Searching...</p>
<p id="error-msg"></p>

<div id="results"></div>
```

`loading-msg` ve `error-msg` başta gizli, JS gerektiğinde gösteriyor. `results` div'i JS tarafından dolduruluyor.

### Modal

```html
<div id="overlay" onclick="handleOverlayClick(event)">
    <div id="modal">
        <button class="close-btn" onclick="closeModal()">✕</button>
        <div id="modal-body"></div>
    </div>
</div>
```

`overlay`'e tıklayınca da kapanıyor (dışarı tıklama). İçerik yine JS tarafından oluşturuluyor.

---

## 2. CSS

Süslü bir şey yapmak istemedim. Açık gri arka plan, koyu mavi header, beyaz kartlar. Arial kullandım, Google Fonts falan eklemedim.

### Genel Reset

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
```

Standart başlangıç. `box-sizing: border-box` olmasa padding hesapları dağılıyor.

### Header

```css
header {
    background: #2c3e50;
    color: white;
    padding: 0 20px;
}

.header-wrap {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 55px;
}
```

`max-width` + `margin: 0 auto` kombinasyonu tüm içerik bloklarında kullandım, geniş ekranda ortalanıyor.

### Arama Kutusu

```css
.search-row {
    display: flex;
    gap: 10px;
    margin-bottom: 18px;
}

.search-row input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 15px;
    background: white;
}
```

Input `flex: 1` alıyor, buton sabit kalıyor. Ekran daralınca alt alta geçiyor (media query ile).

### Film Kartları

```css
#results {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
}

.movie-card {
    width: 155px;
    background: white;
    border-radius: 5px;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 1px 5px rgba(0,0,0,0.1);
    transition: transform 0.15s, box-shadow 0.15s;
}

.movie-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 5px 14px rgba(0,0,0,0.18);
}
```

`flex-wrap: wrap` ile kartlar satır satır diziliyor, ekran boyutuna göre kaç kart sığarsa o kadar giriyor. Sabit genişlik verdim (155px), böylece her kart aynı boyutta.

Poster için `object-fit: cover` kullandım, aksi halde poster oranları bozuluyor:

```css
.card-img img {
    width: 100%;
    height: 225px;
    object-fit: cover;
    display: block;
}
```

Poster yoksa gösterilecek placeholder:

```css
.no-img {
    width: 100%;
    height: 225px;
    background: #d5d8dc;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
    font-size: 12px;
}
```

### Modal

```css
#overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 100;
    justify-content: center;
    align-items: center;
    padding: 16px;
}

#overlay.open {
    display: flex;
}
```

`display: none` → `display: flex` geçişini class ekleyip kaldırarak yapıyorum. `position: fixed` + `inset: 0` sayfanın tamamını kaplıyor.

```css
#modal {
    background: white;
    border-radius: 7px;
    padding: 22px;
    max-width: 650px;
    width: 100%;
    max-height: 87vh;
    overflow-y: auto;
    position: relative;
}
```

`max-height: 87vh` + `overflow-y: auto` uzun içeriklerde scroll çıkıyor, modal ekrandan taşmıyor.

### Responsive

Tek bir media query var, 580px altı için:

```css
@media (max-width: 580px) {
    .search-row {
        flex-direction: column;
    }

    .modal-layout {
        flex-direction: column;
    }

    .modal-layout img {
        width: 100%;
        max-height: 220px;
        object-fit: cover;
    }
}
```

Mobilde arama kutusu ve buton alt alta geçiyor. Modal içindeki poster de tam genişliğe yayılıyor.

---

## 3. JavaScript

Tek dosya, modül yok. Global değişkenler, event listener'lar, birkaç yardımcı fonksiyon.

### Başlangıç

```js
let apiKey = localStorage.getItem('omdb_key') || '';

document.addEventListener('DOMContentLoaded', function () {
    if (!apiKey) {
        document.getElementById('key-banner').style.display = 'block';
    }

    const last = localStorage.getItem('last_search');
    if (last && apiKey) {
        document.getElementById('search-input').value = last;
        doSearch();
    }

    document.getElementById('search-btn').addEventListener('click', doSearch);
    document.getElementById('search-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doSearch();
    });
});
```

Sayfa yüklenince:
1. localStorage'da key var mı? Yoksa banner'ı göster.
2. Önceki arama var mı? Varsa otomatik tekrar çalıştır (son arama kalıcılığı).
3. Butona tıklama ve Enter tuşu event'lerini bağla.

### API Key Kaydetme

```js
function saveKey() {
    const key = document.getElementById('key-input').value.trim();
    const errEl = document.getElementById('key-err');

    if (!key) {
        errEl.textContent = 'Please enter a key.';
        return;
    }

    apiKey = key;
    localStorage.setItem('omdb_key', key);
    document.getElementById('key-banner').style.display = 'none';
    errEl.textContent = '';
}
```

Key boşsa hata göster, değilse localStorage'a yaz ve banner'ı kapat. Sonraki sayfa açılışında `localStorage.getItem('omdb_key')` ile geri okunuyor.

### Arama Fonksiyonu

```js
async function doSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    if (!apiKey) {
        document.getElementById('key-banner').style.display = 'block';
        return;
    }

    localStorage.setItem('last_search', query);

    document.getElementById('results').innerHTML = '';
    closeModal();
    showError('');
    showLoading(true);

    try {
        const data = await fetchOmdb({ s: query });
        showLoading(false);

        if (data.Response === 'False') {
            showError(data.Error || 'No results found.');
        } else {
            renderCards(data.Search);
        }
    } catch (err) {
        showLoading(false);
        showError('Connection error. Please check your internet and try again.');
    }
}
```

Her aramada önce önceki sonuçları temizliyorum, sonra istek atıyorum. OMDB başarısız aramalarda HTTP 200 dönüyor ama JSON içinde `Response: "False"` ve hata mesajı oluyor, bunu ayrıca kontrol etmek gerekiyor.

### Kartları Oluşturma

```js
function renderCards(movies) {
    const container = document.getElementById('results');

    movies.forEach(function (movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.addEventListener('click', function () {
            getDetail(movie.imdbID);
        });

        const hasImg = movie.Poster && movie.Poster !== 'N/A';

        card.innerHTML = `
            <div class="card-img">
                ${hasImg
                    ? `<img src="${movie.Poster}" alt="${esc(movie.Title)}" onerror="this.parentElement.innerHTML='<div class=no-img>No Image</div>'">`
                    : '<div class="no-img">No Image</div>'}
            </div>
            <div class="card-info">
                <h3 title="${esc(movie.Title)}">${esc(movie.Title)}</h3>
                <p>${movie.Year}</p>
            </div>`;

        container.appendChild(card);
    });
}
```

Her film için bir kart elementi oluşturup container'a ekliyorum. Poster `N/A` gelirse veya resim yüklenemezse (`onerror`) gri placeholder gösteriliyor.

### Film Detayı

```js
async function getDetail(id) {
    try {
        const data = await fetchOmdb({ i: id, plot: 'full' });
        openModal(data);
    } catch (err) {
        showError('Could not load movie details.');
    }
}

function openModal(movie) {
    const hasImg = movie.Poster && movie.Poster !== 'N/A';

    document.getElementById('modal-body').innerHTML = `
        <div class="modal-layout">
            ${hasImg ? `<img src="${movie.Poster}" alt="${esc(movie.Title)}">` : ''}
            <div class="modal-text">
                <h2>${esc(movie.Title)} <span style="font-size:15px; font-weight:normal; color:#666;">(${movie.Year})</span></h2>
                <p><strong>Genre:</strong> ${movie.Genre}</p>
                <p><strong>Director:</strong> ${movie.Director}</p>
                <p><strong>Actors:</strong> ${movie.Actors}</p>
                <p><strong>Plot:</strong> ${esc(movie.Plot)}</p>
                ${movie.imdbRating !== 'N/A' ? `<p><strong>IMDb Rating:</strong> ⭐ ${movie.imdbRating}/10</p>` : ''}
            </div>
        </div>`;

    document.getElementById('overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}
```

Karta tıklayınca `imdbID` ile detay isteği atılıyor (`s=` yerine `i=` kullanıyorum, bu tam detayları veriyor). Modal açılınca `body`'nin scroll'unu kilitlemeyi unutmayın, aksi halde arka plan kaymaya devam ediyor.

### XSS Koruması

```js
function esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}
```

Film adlarını ve plotları doğrudan `innerHTML`'e yazmak tehlikeli — API'dan gelen veri içinde `<script>` benzeri şeyler olabilir. Bu fonksiyon metni önce `textContent` olarak bir div'e yazıyor (tarayıcı otomatik escape ediyor), sonra `innerHTML` olarak geri okuyor. Kısa ve etkili bir yöntem.

### API İsteği ve JSONP Fallback

```js
async function fetchOmdb(params) {
    const qs = new URLSearchParams({ apikey: apiKey, ...params });
    const url = `https://www.omdbapi.com/?${qs}`;

    try {
        const res = await fetch(url);
        return await res.json();
    } catch {
        return await jsonpFetch(url);
    }
}
```

Normal şartlarda `fetch` çalışıyor. Ama dosyayı direkt çift tıklayıp açtığınızda tarayıcı `file://` protokolünü kullanıyor ve bu durumda dışarıya `fetch` atılması CORS politikası nedeniyle engelleniyor. Fallback olarak JSONP kullandım:

```js
function jsonpFetch(url) {
    return new Promise(function (resolve, reject) {
        const cbName = '_cb_' + Math.random().toString(36).slice(2, 9);
        const script = document.createElement('script');

        window[cbName] = function (data) {
            delete window[cbName];
            document.head.removeChild(script);
            resolve(data);
        };

        script.onerror = function () {
            delete window[cbName];
            document.head.removeChild(script);
            reject(new Error('request failed'));
        };

        script.src = url + '&callback=' + cbName;
        document.head.appendChild(script);
    });
}
```

JSONP, `<script>` elementi oluşturup URL'e ekleyerek çalışıyor. CORS kısıtlamalarına takılmıyor çünkü script yükleme farklı bir mekanizma. OMDB `callback` parametresini destekliyor, yani `?callback=fonksiyonAdı` eklenince veriyi o fonksiyonu çağırarak dönüyor.

---

## 4. GitHub Pages'e Deploy

Projeyi GitHub'a push ettikten sonra Pages'i açmak için:

1. Repo sayfasında **Settings** → **Pages**
2. Source olarak `master` branch, `/ (root)` seçin
3. Save

Birkaç dakika sonra `https://kullaniciadi.github.io/omdb-project/` adresinde yayında olur.

---

## Sonuç

Öğrendiklerim / dikkat ettiğim şeyler:

- OMDB `Response: "False"` döndürürken HTTP status 200 veriyor, ikisini ayrı kontrol etmek gerekiyor
- `file://` protokolünden fetch atılmıyor, JSONP ile aşılıyor
- Modal açıkken `body`'nin scroll'unu kilitlemek küçük ama önemli bir detay
- `object-fit: cover` olmadan poster boyutları birbirinden farklı olduğu için grid bozuluyor
- innerHTML'e dış kaynaklı veri yazmadan önce escape etmek şart
