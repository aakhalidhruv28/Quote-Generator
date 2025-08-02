// --- DOM ELEMENT SELECTION ---
const quoteBox = document.getElementById("quote-box");
const quoteText = document.querySelector(".quote-text");
const quoteAuthor = document.querySelector(".quote-author");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const speakBtn = document.getElementById("speakBtn");
const saveBtn = document.getElementById("saveBtn");
const shareBtn = document.getElementById("shareBtn");
const themeToggle = document.getElementById("themeToggle");
const wordCount = document.getElementById("wordCount");
const charCount = document.getElementById("charCount");
const exportBtn = document.getElementById("exportBtn");
const favoriteList = document.getElementById("favoriteList");
const emptyFavoritesMsg = document.getElementById("empty-favorites-msg");

// --- API & STATE ---
const apiKey = "YOUR_API_KEY_HERE"; // YOUR_API_KEY_HERE // Use environment variables in a real app! 
const model = "meta-llama/llama-3.3-70b-instruct:free";
let currentQuote = "";
let currentAuthor = "";

// --- EVENT LISTENERS ---
generateBtn.addEventListener("click", generateQuote);
copyBtn.addEventListener("click", copyQuote);
speakBtn.addEventListener("click", speakQuote);
saveBtn.addEventListener("click", toggleFavorite);
shareBtn.addEventListener("click", shareQuote);
themeToggle.addEventListener("click", toggleTheme);
exportBtn.addEventListener("click", exportFavorites);
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  loadFavorites();
});

// --- CORE FUNCTIONS ---

async function generateQuote() {
  const query = document.getElementById('search').value.trim();
  const category = document.getElementById('category').value;
  const language = document.getElementById('language').value;
  const length = document.getElementById('lengthFilter').value;

  let prompt = `Generate a single, unique quote. The format must be strictly: "The quote itself." - Author`;
  if (query) prompt += ` about "${query}"`;
  if (category) prompt += ` in the category of "${category}"`;
  if (language && language !== "Any") prompt += ` in the ${language} language`;
  if (length) prompt += ` with a ${length} length`;
  prompt += ". Ensure the author's name is included.";

  setLoadingState(true);
  quoteBox.classList.remove("visible");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

    const data = await response.json();
    if (data && data.choices && data.choices.length > 0) {
      parseAndDisplayQuote(data.choices[0].message.content.trim());
    } else {
      displayError("Could not fetch a quote. The API might be busy.");
    }
  } catch (error) {
    console.error(error);
    displayError("An error occurred. Please check the console.");
  } finally {
    setLoadingState(false);
  }
}

function parseAndDisplayQuote(fullQuote) {
    let quote = fullQuote;
    let author = "Anonymous";

    // Attempt to parse "Quote" - Author format
    const lastDash = quote.lastIndexOf(" - ");
    if (lastDash > 0 && lastDash > quote.indexOf('"')) {
        const potentialAuthor = quote.substring(lastDash + 3).trim();
        // A simple check to avoid long strings being the author
        if (potentialAuthor.length < 50) {
            author = potentialAuthor;
            quote = quote.substring(0, lastDash).trim();
        }
    }
    
    // Clean up quotation marks
    if (quote.startsWith('"') && quote.endsWith('"')) {
        quote = quote.substring(1, quote.length - 1);
    }
    
    currentQuote = quote;
    currentAuthor = author;

    quoteText.innerText = currentQuote;
    quoteAuthor.innerText = `- ${currentAuthor}`;
    updateMeta(currentQuote);
    checkIfFavorite();
    quoteBox.classList.add("visible");
}


function displayError(message) {
  currentQuote = message;
  currentAuthor = "System";
  quoteText.innerText = currentQuote;
  quoteAuthor.innerText = "";
  updateMeta(message);
  quoteBox.classList.add("visible");
  checkIfFavorite();
}

// --- UI & UX HELPER FUNCTIONS ---

function setLoadingState(isLoading) {
  generateBtn.disabled = isLoading;
  document.querySelector("#generateBtn .btn-text").classList.toggle("hidden", isLoading);
  document.querySelector("#generateBtn .btn-loader").classList.toggle("hidden", !isLoading);
}

function updateMeta(quote) {
  wordCount.innerText = `${quote.trim().split(/\s+/).filter(Boolean).length} words`;
  charCount.innerText = `${quote.length} chars`;
}

function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;
  
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// --- ACTION BUTTONS ---

/*******************************************/
/* CHANGE 3: Robust Copy Function with Fallback */
/*******************************************/
function copyQuote() {
  if (!currentQuote || currentQuote.includes("Could not fetch")) return;
  const textToCopy = `"${currentQuote}" - ${currentAuthor}`;

  // Modern way: Use the Clipboard API (requires HTTPS or localhost)
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast("Quote copied to clipboard!", "success");
      animateCopyButton();
    }).catch(err => {
      console.error("Failed to copy with Clipboard API:", err);
      // Fallback if permission is denied
      copyWithExecCommand(textToCopy);
    });
  } else {
    // Fallback for non-secure contexts (like file://) or older browsers
    copyWithExecCommand(textToCopy);
  }
}

// Fallback function for copying text
function copyWithExecCommand(textToCopy) {
  const textArea = document.createElement("textarea");
  textArea.value = textToCopy;
  // Make the textarea invisible
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showToast("Quote copied to clipboard!", "success");
    animateCopyButton();
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
    showToast("Could not copy text.", "error");
  }
  document.body.removeChild(textArea);
}

function animateCopyButton() {
  const icon = copyBtn.querySelector("i");
  icon.classList.remove("fa-copy");
  icon.classList.add("fa-check");
  setTimeout(() => {
    icon.classList.remove("fa-check");
    icon.classList.add("fa-copy");
  }, 1500);
}

function speakQuote() {
  if (!currentQuote) return;
  speechSynthesis.cancel(); // Cancel any previous speech
  const utterance = new SpeechSynthesisUtterance(`${currentQuote}. By ${currentAuthor}`);
  speechSynthesis.speak(utterance);
}

function shareQuote() {
    if (!currentQuote) return;
    const textToShare = `"${currentQuote}" - ${currentAuthor}`;
    
    // The Web Share API (`navigator.share`) is the best option, but it has requirements:
    // 1. Must be on a mobile device (mostly).
    // 2. Must be in a secure context (HTTPS or localhost).
    if (navigator.share) {
        navigator.share({
            title: 'A Quote from QuoteSphere',
            text: textToShare
        })
        .then(() => showToast("Shared successfully!", "success"))
        .catch(err => {
            // This can happen if the user cancels the share dialog
            console.log("Share failed or was cancelled:", err);
        });
    } else {
        // Fallback for desktops or non-secure contexts: open a new Twitter tab.
        showToast("Web Share not available. Opening Twitter...", "info");
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}`;
        window.open(twitterUrl, '_blank');
    }
}


// --- FAVORITES MANAGEMENT --- (No changes here)

function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function saveFavorites(favorites) {
  localStorage.setItem("favorites", JSON.stringify(favorites));
  loadFavorites();
}

function toggleFavorite() {
  if (!currentQuote) return;
  const favorites = getFavorites();
  const favObject = { quote: currentQuote, author: currentAuthor };
  const favIndex = favorites.findIndex(fav => fav.quote === currentQuote);

  if (favIndex > -1) {
    // Already a favorite, so remove it
    favorites.splice(favIndex, 1);
    showToast("Removed from favorites.", "info");
  } else {
    // Not a favorite, so add it
    favorites.push(favObject);
    showToast("Saved to favorites!", "success");
  }
  saveFavorites(favorites);
}

function checkIfFavorite() {
  const favorites = getFavorites();
  const isFavorite = favorites.some(fav => fav.quote === currentQuote);
  const icon = saveBtn.querySelector("i");
  icon.classList.toggle("fas", isFavorite); // solid star
  icon.classList.toggle("far", !isFavorite); // regular outline star
}

function loadFavorites() {
  const favorites = getFavorites();
  favoriteList.innerHTML = ""; // Clear existing list

  if (favorites.length === 0) {
    emptyFavoritesMsg.classList.remove("hidden");
    exportBtn.classList.add("hidden");
  } else {
    emptyFavoritesMsg.classList.add("hidden");
    exportBtn.classList.remove("hidden");
    favorites.forEach((fav, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <p>"${fav.quote}"<br><em>- ${fav.author}</em></p>
        <button class="delete-fav icon-btn" title="Remove Favorite" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
      `;
      favoriteList.appendChild(li);
    });
  }
  
  // Add event listeners to new delete buttons
  document.querySelectorAll('.delete-fav').forEach(btn => {
      btn.addEventListener('click', removeFavorite);
  });
}

function removeFavorite(event) {
    const indexToRemove = parseInt(event.currentTarget.dataset.index, 10);
    let favorites = getFavorites();
    favorites.splice(indexToRemove, 1);
    saveFavorites(favorites);
    showToast("Favorite removed.", "info");
}

function exportFavorites() {
  const favorites = getFavorites();
  if (favorites.length === 0) {
    showToast("No favorites to export.", "error");
    return;
  }
  const textContent = favorites.map(fav => `"${fav.quote}" - ${fav.author}`).join("\n\n");
  const blob = new Blob([textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "favorite_quotes.txt";
  a.click();
  URL.revokeObjectURL(url);
}


// --- THEME MANAGEMENT --- (No changes here)

function toggleTheme() {
  document.body.classList.toggle("light-theme");
  const isLight = document.body.classList.contains("light-theme");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  updateThemeIcon(isLight);
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  const isLight = savedTheme === "light";
  if (isLight) {
    document.body.classList.add("light-theme");
  }
  updateThemeIcon(isLight);
}

function updateThemeIcon(isLight) {
  const icon = themeToggle.querySelector("i");
  icon.classList.toggle("fa-sun", isLight);
  icon.classList.toggle("fa-moon", !isLight);
}
 