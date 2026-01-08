const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");

const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");

const fileInput = document.querySelector("#file-input");
const addFileBtn = document.querySelector("#add-file-btn");
const cancelFileBtn = document.querySelector("#cancel-file-btn");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const filePreview = document.querySelector(".file-preview");

const deleteChatsBtn = document.querySelector("#delete-chats-btn");
const sendPromptBtn = document.querySelector("#send-prompt-btn");
const themeToggleBtn = document.querySelector("#theme-toggle-btn");
const suggestions = document.querySelectorAll(".suggestions--item");


const API_URL = "/api/gemini";

const userData = { message: "", file: {} };
const chatHistory = [];

let isAutoScrollEnabled = true;


container.addEventListener("scroll", () => {
  const { scrollTop, scrollHeight, clientHeight } = container;
  isAutoScrollEnabled = scrollHeight - scrollTop - clientHeight < 50;
});

const scrollToBottom = () => {
  if (isAutoScrollEnabled) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }
};


const createMsgElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};


const applyTypingEffect = (text, textElement, botMsgDiv) => {
  textElement.innerHTML = "";
  const words = text.split(" ");
  let index = 0;
  let current = "";

  const interval = setInterval(() => {
    if (index < words.length) {
      current += (index === 0 ? "" : " ") + words[index++];
      textElement.innerHTML = marked.parse(current);
      textElement
        .querySelectorAll("pre code")
        .forEach((block) => Prism.highlightElement(block));
      scrollToBottom();
    } else {
      clearInterval(interval);
      botMsgDiv.classList.remove("loading");
      addCopyButtons(textElement);
    }
  }, 35);
};

const addCopyButtons = (textElement) => {
  textElement.querySelectorAll("pre").forEach((pre) => {
    const code = pre.querySelector("code");
    if (!code || pre.querySelector(".copy-code-btn")) return;

    const btn = document.createElement("button");
    btn.className = "copy-code-btn";
    btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';

    btn.onclick = async () => {
      await navigator.clipboard.writeText(code.innerText);
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      setTimeout(() => {
        btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
      }, 2000);
    };

    pre.appendChild(btn);
  });
};


const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userData.message,
        history: chatHistory,
      }),
    });

    const rawText = await response.text();
    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error("Server did not return JSON");
    }

    const reply = data.reply || "No response from server.";
    applyTypingEffect(reply, textElement, botMsgDiv);

    chatHistory.push({ role: "user", parts: [{ text: userData.message }] });
    chatHistory.push({ role: "model", parts: [{ text: reply }] });

  } catch (err) {
    textElement.textContent = "Error: " + err.message;
    botMsgDiv.classList.remove("loading");
  }
};


addFileBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    filePreview.src =
      file.type === "application/pdf"
        ? "https://cdn-icons-png.flaticon.com/512/337/337946.png"
        : e.target.result;

    fileUploadWrapper.classList.add("active");
  };

  reader.readAsDataURL(file);
});

cancelFileBtn.addEventListener("click", () => {
  fileInput.value = "";
  fileUploadWrapper.classList.remove("active");
});


const handleFormSubmit = (e) => {
  if (e) e.preventDefault();

  const message = promptInput.value.trim();
  if (!message) return;

  userData.message = message;
  promptInput.value = "";

  container.classList.add("chat-active");

  
  const userDiv = createMsgElement(
    `<p class="message-text">${message}</p>`,
    "user-message"
  );
  chatsContainer.appendChild(userDiv);

  
  setTimeout(() => {
    const botDiv = createMsgElement(
      `
      <div class="avatar-wrapper">
        <img src="gemini-chatbot-logo.svg" class="avatar">
      </div>
      <div class="message-text">Thinking...</div>
      `,
      "bot-message",
      "loading"
    );

    chatsContainer.appendChild(botDiv);
    scrollToBottom();
    generateResponse(botDiv);
  }, 500);

  fileUploadWrapper.classList.remove("active");
};

promptForm.addEventListener("submit", handleFormSubmit);
sendPromptBtn.addEventListener("click", handleFormSubmit);


themeToggleBtn.addEventListener("click", () => {
  const light = document.body.classList.toggle("light-mode");
  themeToggleBtn.querySelector("i").className = light
    ? "fa-solid fa-moon"
    : "fa-solid fa-sun";
});

deleteChatsBtn.addEventListener("click", () => {
  chatsContainer.innerHTML = "";
  chatHistory.length = 0;
  container.classList.remove("chat-active");
});

suggestions.forEach((item) =>
  item.addEventListener("click", () => {
    promptInput.value = item.querySelector(".text").textContent;
    handleFormSubmit();
  })
);
