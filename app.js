const albumDataPath = "data/albums.json";
const localStorageKey = "albumRaterLocalAlbums";

const fetchAlbums = async () => {
  const response = await fetch(albumDataPath);
  if (!response.ok) {
    throw new Error("Unable to load album data.");
  }
  return response.json();
};

const getLocalAlbums = () => {
  const stored = localStorage.getItem(localStorageKey);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to parse saved albums", error);
    return [];
  }
};

const saveLocalAlbums = (albums) => {
  localStorage.setItem(localStorageKey, JSON.stringify(albums));
};

const mergeAlbums = (baseAlbums) => {
  const localAlbums = getLocalAlbums();
  return [...baseAlbums, ...localAlbums];
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

const filterAlbums = (albums, searchTerm) => {
  if (!searchTerm) {
    return albums;
  }
  const query = searchTerm.toLowerCase();
  return albums.filter(
    (album) =>
      album.title.toLowerCase().includes(query) ||
      album.artist.toLowerCase().includes(query),
  );
};

const renderAlbumCards = (albums, sortBy = "recent", searchTerm = "") => {
  const grid = document.getElementById("albums");
  if (!grid) {
    return;
  }

  const filteredAlbums = filterAlbums(albums, searchTerm);
  const sortedAlbums = sortAlbums(filteredAlbums, sortBy);

  if (sortedAlbums.length === 0) {
    grid.innerHTML = `<p class="no-results">No results for your search.</p>`;
    return;
  }

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

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildTrackField = (index) => `
  <div class="track-field" data-index="${index}">
    <label>
      Track title
      <input type="text" name="trackTitle-${index}" required />
    </label>
    <label>
      Rating
      <input type="number" name="trackRating-${index}" min="0" max="10" step="0.1" required />
    </label>
    <label class="span-2">
      Notes
      <input type="text" name="trackNotes-${index}" required />
    </label>
    <button type="button" class="ghost-button remove-track" data-index="${index}">Remove</button>
  </div>
`;

const hydrateTrackFields = (container, initialCount = 2) => {
  container.innerHTML = "";
  for (let index = 0; index < initialCount; index += 1) {
    container.insertAdjacentHTML("beforeend", buildTrackField(index));
  }
};

const gatherTracks = (form, container) => {
  const fields = Array.from(container.querySelectorAll(".track-field"));
  return fields.map((field) => {
    const index = field.dataset.index;
    return {
      title: form[`trackTitle-${index}`].value.trim(),
      rating: Number(form[`trackRating-${index}`].value),
      notes: form[`trackNotes-${index}`].value.trim(),
    };
  });
};

const initAlbumEditor = (albums, renderCallback) => {
  const form = document.getElementById("album-form");
  const trackContainer = document.getElementById("track-fields");
  const addTrackButton = document.getElementById("add-track");
  const statusEl = document.getElementById("form-status");
  const downloadButton = document.getElementById("download-json");

  if (!form || !trackContainer || !addTrackButton || !statusEl) {
    return;
  }

  hydrateTrackFields(trackContainer);

  addTrackButton.addEventListener("click", () => {
    const nextIndex = trackContainer.querySelectorAll(".track-field").length;
    trackContainer.insertAdjacentHTML("beforeend", buildTrackField(nextIndex));
  });

  trackContainer.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLButtonElement && target.classList.contains("remove-track")) {
      target.closest(".track-field")?.remove();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const title = formData.get("title").toString().trim();
    const artist = formData.get("artist").toString().trim();
    const year = formData.get("year").toString().trim();
    const genre = formData.get("genre").toString().trim();
    const rating = Number(formData.get("rating"));
    const cover = formData.get("cover").toString().trim();
    const description = formData.get("description").toString().trim();
    const notes = formData.get("notes").toString().trim();
    const dateAddedInput = formData.get("dateAdded").toString();
    const tagsInput = formData.get("tags").toString();

    const id = slugify(`${artist}-${title}`);
    const dateAdded = dateAddedInput || new Date().toISOString().split("T")[0];
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const tracks = gatherTracks(form, trackContainer);

    const newAlbum = {
      id,
      title,
      artist,
      year,
      genre,
      rating,
      dateAdded,
      cover,
      description,
      notes,
      tags,
      tracks,
    };

    const existing = getLocalAlbums();
    saveLocalAlbums([...existing, newAlbum]);
    statusEl.textContent = `Saved ${title}!`;
    form.reset();
    hydrateTrackFields(trackContainer);
    renderCallback();
  });

  if (downloadButton) {
    downloadButton.addEventListener("click", () => {
      const existing = getLocalAlbums();
      const blob = new Blob([JSON.stringify(existing, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "albumrater-local-albums.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }
};

fetchAlbums()
  .then((albums) => {
    const sortSelect = document.getElementById("sort-select");
    const searchInput = document.getElementById("search-input");
    const suggestionsEl = document.getElementById("search-suggestions");
    const initialSort = sortSelect ? sortSelect.value : "recent";
    const renderWithSort = (term = "") => {
      const merged = mergeAlbums(albums);
      renderAlbumCards(merged, sortSelect ? sortSelect.value : initialSort, term);
    };
    renderWithSort();
    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        renderWithSort(searchInput ? searchInput.value.trim() : "");
      });
    }
    if (searchInput && suggestionsEl) {
      const updateSuggestions = (term) => {
        const trimmed = term.trim();
        if (!trimmed) {
          suggestionsEl.innerHTML = "";
          suggestionsEl.classList.remove("visible");
          return;
        }
        const merged = mergeAlbums(albums);
        const matches = filterAlbums(merged, trimmed)
          .map((album) => album.title)
          .filter((value, index, list) => list.indexOf(value) === index)
          .slice(0, 6);
        if (matches.length === 0) {
          suggestionsEl.innerHTML = "";
          suggestionsEl.classList.remove("visible");
          return;
        }
        suggestionsEl.innerHTML = matches
          .map((value) => `<button type="button" class="suggestion-item">${value}</button>`)
          .join("");
        suggestionsEl.classList.add("visible");
      };

      searchInput.addEventListener("input", (event) => {
        const term = event.target.value;
        updateSuggestions(term);
        renderWithSort(term.trim());
      });

      searchInput.addEventListener("focus", (event) => {
        updateSuggestions(event.target.value);
      });

      document.addEventListener("click", (event) => {
        if (!suggestionsEl.contains(event.target) && event.target !== searchInput) {
          suggestionsEl.classList.remove("visible");
        }
      });

      suggestionsEl.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof HTMLButtonElement) {
          searchInput.value = target.textContent || "";
          renderWithSort(searchInput.value.trim());
          suggestionsEl.classList.remove("visible");
        }
      });
    }
    initAlbumEditor(albums, renderWithSort);
    renderAlbumPage(mergeAlbums(albums));
  })
  .catch((error) => {
    const grid = document.getElementById("albums");
    if (grid) {
      grid.innerHTML = `<p>${error.message}</p>`;
    }
  });
