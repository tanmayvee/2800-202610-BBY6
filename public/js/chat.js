// Global state for chat
let currentLocationName = "";
let currentLocationContext = "";
let chatIsLoading = false;

function openChat(locationName, locationContext = "") {
  const modal = document.getElementById("chat-modal");
  const messagesContainer = document.getElementById("chat-messages");
  const locationNameEl = document.getElementById("chat-location-name");

  currentLocationName = locationName;
  currentLocationContext = locationContext;
  chatIsLoading = false;

  // Clear previous messages
  messagesContainer.innerHTML = "";

  // Set title
  locationNameEl.textContent = `Chat about ${locationName}`;

  // Show modal
  modal.classList.remove("hidden");

  // Add initial greeting
  addChatMessage(
    `Hi! I'm here to help answer questions about ${locationName}. What would you like to know?`,
    "bot"
  );

  // Focus input
  document.getElementById("chat-input").focus();
}

function closeChat() {
  const modal = document.getElementById("chat-modal");
  modal.classList.add("hidden");
  document.getElementById("chat-input").value = "";
  document.getElementById("chat-messages").innerHTML = "";
  document.getElementById("chat-error").classList.add("hidden");
}

function addChatMessage(message, sender = "user") {
  const messagesContainer = document.getElementById("chat-messages");
  const messageEl = document.createElement("div");
  messageEl.className = `mb-4 flex ${sender === "user" ? "justify-end" : "justify-start"}`;

  const bubble = document.createElement("div");
  bubble.className = `max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
    sender === "user"
      ? "bg-blue-600 text-white rounded-br-none"
      : "bg-gray-200 text-gray-800 rounded-bl-none"
  }`;
  bubble.style.whiteSpace = "pre-wrap";
  bubble.style.overflowWrap = "break-word";
  bubble.textContent = message;

  messageEl.appendChild(bubble);
  messagesContainer.appendChild(messageEl);

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  const sendBtn = document.getElementById("chat-send");
  const errorEl = document.getElementById("chat-error");

  if (!message) return;

  if (chatIsLoading) return;

  // Add user message to display
  addChatMessage(message, "user");
  input.value = "";

  // Disable send button and show loading state
  chatIsLoading = true;
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";
  errorEl.classList.add("hidden");

  try {
    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        locationName: currentLocationName,
        locationContext: currentLocationContext,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get response from server");
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Add bot response
    addChatMessage(data.response, "bot");
  } catch (error) {
    console.error("Chat error:", error);
    errorEl.textContent = `Error: ${error.message}`;
    errorEl.classList.remove("hidden");
    addChatMessage(
      "Sorry, I encountered an error. Please try again.",
      "bot"
    );
  } finally {
    chatIsLoading = false;
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
    input.focus();
  }
}

function handleChatKeypress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendChatMessage();
  }
}

// Make globally accessible
window.openChat = openChat;
window.closeChat = closeChat;
window.sendChatMessage = sendChatMessage;
window.handleChatKeypress = handleChatKeypress;
