let apiKey = localStorage.getItem('omdb_key') || '';

document.addEventListener('DOMContentLoaded', function () {
    if (!apiKey) {
        document.getElementById('key-banner').style.display = 'block';
    }

    // restore last search on page load
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

function toggleKeyBanner() {
    const banner = document.getElementById('key-banner');
    if (banner.style.display === 'block') {
        banner.style.display = 'none';
    } else {
        document.getElementById('key-input').value = apiKey;
        banner.style.display = 'block';
    }
}

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

function closeModal() {
    document.getElementById('overlay').classList.remove('open');
    document.body.style.overflow = '';
}

function handleOverlayClick(e) {
    if (e.target.id === 'overlay') closeModal();
}

function showLoading(show) {
    document.getElementById('loading-msg').style.display = show ? 'block' : 'none';
}

function showError(msg) {
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
}

// avoids xss when inserting titles/plots into innerHTML
function esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// tries fetch first; if that fails (e.g. cors when opening file directly),
// falls back to jsonp which works without a server
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
