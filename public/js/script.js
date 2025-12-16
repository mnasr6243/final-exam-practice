// RANDOM COMIC BUTTON
const btnRandom = document.getElementById("btnRandomComic");

if (btnRandom) {
    btnRandom.addEventListener("click", async () => {
        const res = await fetch("/api/randomComic");
        const comic = await res.json();

        const wrapper = document.querySelector(".randomWrapper");
        if (!wrapper || !comic) return;

        wrapper.innerHTML = `
      <img src="${comic.comicUrl}" class="comicImg" alt="${comic.comicTitle}">
      <div class="comicCaption">${comic.comicSiteName}</div>
    `;
    });
}

// COMMENTS MODAL
const modal = document.getElementById("commentsModal");
const closeModal = document.getElementById("closeModal");
const container = document.getElementById("commentsContainer");

if (modal) {
    document.querySelectorAll(".viewComments").forEach(link => {
        link.addEventListener("click", async e => {
            e.preventDefault();

            const id = link.dataset.id;
            const res = await fetch(`/api/comments/${id}`);
            const comments = await res.json();

            container.innerHTML = comments.length
                ? comments
                    .map(c => `<p><b>${c.author}</b>: ${c.comment}</p>`)
                    .join("<hr>")
                : "<p>No comments yet.</p>";

            modal.classList.remove("hidden");
        });
    });

    closeModal.addEventListener("click", () => modal.classList.add("hidden"));
    modal.addEventListener("click", e => {
        if (e.target === modal) modal.classList.add("hidden");
    });
}