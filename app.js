const albumDataPath = "data/albums.json";

const fetchAlbums = async () => {
  const response = await fetch(albumDataPath);
  if (!response.ok) {
    throw new Error("Unable to load album data.");
  }
  return response.json();
};

const sortAlbums = (albums, sortBy) => {
  const sorted = [...albums];
  if (sortBy === "rating") {
    sorted.sort((a, b) => b.rating - a.rating);
    return sorted;
  }
  sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  return sorted;
};

const renderAlbumCards = (albums, sortBy = "recent") => {
  const grid = document.getElementById("albums");
  if (!grid) {
    return;
  }

  const sortedAlbums = sortAlbums(albums, sortBy);

  grid.innerHTML = sortedAlbums
    .map(
      (album) => `
        <a class="album-card" href="album.html?id=${album.id}">
          <img src="${album.cover}" alt="${album.title} cover art" loading="lazy" />
          <div>
            <h3>${album.title}</h3>
            <p>${album.artist} • ${album.year}</p>
          </div>
          <span class="rating-pill">Overall ${album.rating}/10</span>
        </a>
      `,
    )
    .join("");
};

const renderAlbumPage = (albums) => {
  const params = new URLSearchParams(window.location.search);
  const albumId = params.get("id");
  if (!albumId) {
    return;
  }

  const album = albums.find((item) => item.id === albumId);
  if (!album) {
    document.body.innerHTML = "<p>Album not found.</p>";
    return;
  }

  const titleEl = document.getElementById("album-title");
  const artistEl = document.getElementById("album-artist");
  const metaEl = document.getElementById("album-meta");
  const coverEl = document.getElementById("album-cover");
  const ratingEl = document.getElementById("album-rating");
  const descriptionEl = document.getElementById("album-description");
  const notesEl = document.getElementById("album-notes");
  const tagsEl = document.getElementById("album-tags");
  const trackGridEl = document.getElementById("track-grid");

  if (!titleEl || !artistEl || !metaEl || !coverEl || !ratingEl || !descriptionEl || !notesEl || !tagsEl || !trackGridEl) {
    return;
  }

  titleEl.textContent = album.title;
  artistEl.textContent = album.artist;
  metaEl.textContent = `${album.year} • ${album.genre}`;
  coverEl.src = album.cover;
  coverEl.alt = `${album.title} cover art`;
  ratingEl.textContent = `Overall rating: ${album.rating}/10`;
  descriptionEl.textContent = album.description;
  notesEl.textContent = album.notes;

  tagsEl.innerHTML = album.tags.map((tag) => `<span class="tag">${tag}</span>`).join("");

  trackGridEl.innerHTML = album.tracks
    .map(
      (track, index) => `
        <div class="track">
          <div>
            <h3>${index + 1}. ${track.title}</h3>
            <p>${track.notes}</p>
          </div>
          <span class="rating-pill">${track.rating}/10</span>
        </div>
      `,
    )
    .join("");
};

fetchAlbums()
  .then((albums) => {
    const sortSelect = document.getElementById("sort-select");
    const initialSort = sortSelect ? sortSelect.value : "recent";
    renderAlbumCards(albums, initialSort);
    if (sortSelect) {
      sortSelect.addEventListener("change", (event) => {
        renderAlbumCards(albums, event.target.value);
      });
    }
    renderAlbumPage(albums);
  })
  .catch((error) => {
    const grid = document.getElementById("albums");
    if (grid) {
      grid.innerHTML = `<p>${error.message}</p>`;
    }
  });
