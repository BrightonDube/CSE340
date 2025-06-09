// /public/js/favorites.js

// Handles favorite button toggles and removal without page reload

document.addEventListener("DOMContentLoaded", () => {
  // --- Notes Modal Logic ---
  const notesBtn = document.getElementById("notes-btn");
  const notesModal = document.getElementById("notes-modal");
  const notesModalClose = document.getElementById("notes-modal-close");
  const notesForm = document.getElementById("notes-form");
  const notesTextarea = document.getElementById("notes-textarea");
  const notesError = document.getElementById("notes-error");
  let notesInvId = null;

  // Open notes modal
  if (notesBtn && notesModal) {
    notesBtn.addEventListener("click", () => {
      notesInvId = notesBtn.dataset.invId;
      // Optionally fetch existing notes for this favorite (if desired)
      notesTextarea.value = notesBtn.getAttribute('data-current-notes') || '';
      notesModal.style.display = "flex";
      notesError.style.display = "none";
      notesError.textContent = "";
    });
  }
  // Close modal
  if (notesModalClose && notesModal) {
    notesModalClose.addEventListener("click", () => {
      notesModal.style.display = "none";
    });
  }
  // Close modal on outside click
  if (notesModal) {
    notesModal.addEventListener("click", (e) => {
      if (e.target === notesModal) {
        notesModal.style.display = "none";
      }
    });
  }
  // Notes form submit
  if (notesForm) {
    notesForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const notes = notesTextarea.value.trim();
      const inv_id = notesInvId || notesForm.elements['inv_id'].value;
      // Client-side validation
      if (notes.length > 1000) {
        notesError.textContent = "Notes must be less than 1000 characters.";
        notesError.style.display = "block";
        return;
      }
      notesError.style.display = "none";
      notesError.textContent = "";
      // AJAX POST
      try {
        const res = await fetch("/favorites/update-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inv_id, notes })
        });
        const data = await res.json();
        if (data.success) {
          notesModal.style.display = "none";
          // Reload the page to display flash message
          location.reload();
        } else {
          notesError.textContent = data.message || "Could not save notes.";
          notesError.style.display = "block";
        }
      } catch (err) {
        notesError.textContent = "An error occurred. Please try again.";
        notesError.style.display = "block";
      }
    });
  }

  // --- Detail Page Favorite Button ---
  const favBtn = document.getElementById("favorite-btn");
  if (favBtn) {
    favBtn.addEventListener("click", async () => {
      const invId = favBtn.dataset.invId;
      const isFavorited = favBtn.innerHTML.includes("♥");
      favBtn.disabled = true;
      const action = isFavorited ? "remove" : "add";
      const url = `/favorites/${action}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inv_id: invId })
        });
        const data = await res.json();
        if (data.success) {
          favBtn.innerHTML = action === "add" ? "♥ Remove from Favorites" : "♡ Add to Favorites";
        } else {
          alert(data.message || "Could not update favorite status.");
        }
      } catch (err) {
        console.error("Favorite toggle error:", err);
        alert("An error occurred. Please try again.");
      } finally {
        favBtn.disabled = false;
      }
    });
  }

  // --- My Favorites Page Remove Buttons ---
  const favContainer = document.querySelector(".favorites-container");
  const modal = document.getElementById("remove-modal");
  const modalClose = document.getElementById("modal-close");
  const modalConfirm = document.getElementById("modal-confirm");
  const modalCancel = document.getElementById("modal-cancel");
  let pendingRemove = { btn: null, li: null, invId: null };

  if (favContainer) {
    favContainer.addEventListener("click", (e) => {
      if (e.target.matches(".remove-fav-btn")) {
        const btn = e.target;
        const invId = btn.dataset.invId;
        const li = btn.closest("li");
        pendingRemove = { btn, li, invId };
        if (modal) modal.style.display = "flex";
      }
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", () => {
      modal.style.display = "none";
      pendingRemove = { btn: null, li: null, invId: null };
    });
  }
  if (modalCancel) {
    modalCancel.addEventListener("click", () => {
      modal.style.display = "none";
      pendingRemove = { btn: null, li: null, invId: null };
    });
  }
  if (modalConfirm) {
    modalConfirm.addEventListener("click", async () => {
      const { btn, li, invId } = pendingRemove;
      if (!btn || !li || !invId) return;
      btn.disabled = true;
      try {
        const res = await fetch("/favorites/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inv_id: invId })
        });
        const data = await res.json();
        if (data.success) {
          li.style.transition = "opacity 0.5s";
          li.style.opacity = "0";
          setTimeout(() => {
            li.remove();
            if (!favContainer.querySelector("li")) {
              favContainer.innerHTML = '<p class="notice">You have no favorite vehicles yet.</p>';
            }
          }, 500);
        } else {
          alert(data.message || "Could not remove favorite.");
          btn.disabled = false;
        }
      } catch (err) {
        console.error("Favorite removal error:", err);
        alert("An error occurred. Please try again.");
        btn.disabled = false;
      } finally {
        modal.style.display = "none";
        pendingRemove = { btn: null, li: null, invId: null };
      }
    });
  }

  // Optional: close modal on outside click
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
        pendingRemove = { btn: null, li: null, invId: null };
      }
    });
  }
});
