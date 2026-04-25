const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const submitButton = form?.querySelector('button[type="submit"]');
const suggestionChips = document.getElementById("suggestion-chips");

const conversation = [];
let isSubmitting = false;

initializeWelcomeMessage();
initializeSuggestionChips();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage("user", userMessage);
  conversation.push({ role: "user", text: userMessage });
  input.value = "";

  const thinkingMessage = appendMessage("model", "Sedang memeriksa bentuk baku...");
  setLoadingState(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conversation }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data?.result && typeof data.result === "string") {
      const aiReply = formatModelReply(data.result);
      if (aiReply) {
        thinkingMessage.textContent = aiReply;
        conversation.push({ role: "model", text: aiReply });
      } else {
        thinkingMessage.textContent = "Jawaban belum tersedia.";
      }
    } else {
      thinkingMessage.textContent = "Jawaban belum tersedia.";
    }
  } catch (error) {
    console.error("Error calling /api/chat:", error);
    thinkingMessage.textContent = "Server belum berhasil memberi jawaban.";
  } finally {
    setLoadingState(false);
    input.focus();
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

function setLoadingState(loading) {
  isSubmitting = loading;
  input.disabled = loading;
  if (submitButton) submitButton.disabled = loading;
}

function initializeWelcomeMessage() {
  const welcomeMessage =
    "Selamat datang di Bakuin. Saya bisa membantu mengecek apakah sebuah kata baku atau tidak baku. Coba kirim satu kata seperti 'ijin', atau perbandingan seperti 'praktek atau praktik?'.";

  appendMessage("model", welcomeMessage);
  conversation.push({ role: "model", text: welcomeMessage });
}

function initializeSuggestionChips() {
  if (!suggestionChips) return;

  suggestionChips.addEventListener("click", (event) => {
    const chip = event.target.closest(".chip");
    if (!chip) return;

    input.value = chip.textContent.trim();
    input.focus();
  });
}

function formatModelReply(text) {
  return text
    .replace(/\*\*/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/Status\s*:/gi, "Status:")
    .replace(/Bentuk baku\s*:/gi, "\nBentuk baku:")
    .replace(/Alasan\s*:/gi, "\nAlasan:")
    .replace(/Contoh\s*:/gi, "\nContoh:")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
