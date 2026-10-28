(() => {
  const script = document.currentScript;
  if (!script) return;
  const assistantId = script.getAttribute("data-chatbot-id");
  if (!assistantId) { console.error("Chatmosaic: data-chatbot-id is required."); return; }
  const base = new URL(script.src).origin;
  const frame = document.createElement("iframe");
  frame.title = "Chat with our organization";
  frame.setAttribute("aria-label", "Chat with our organization");
  frame.style.cssText = "position:fixed;right:20px;bottom:88px;width:370px;height:560px;max-height:calc(100vh - 110px);border:0;border-radius:16px;box-shadow:0 12px 48px #17251f30;z-index:2147483000;display:none;background:white";
  frame.src = `${base}/widget/${encodeURIComponent(assistantId)}`;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Chat with us";
  button.setAttribute("aria-label", "Open chat with our organization");
  button.style.cssText = `position:fixed;right:20px;bottom:20px;z-index:2147483001;border:0;border-radius:999px;padding:15px 21px;background:${script.dataset.primaryColor || "#477b5d"};color:white;font:600 15px system-ui;box-shadow:0 5px 20px #17251f30;cursor:pointer`;
  button.addEventListener("click", () => { const open = frame.style.display === "none"; frame.style.display = open ? "block" : "none"; button.textContent = open ? "Close chat" : "Chat with us"; });
  document.body.append(frame, button);
  window.addEventListener("message", (event) => { if (event.origin === base && event.data === "chatmosaic:close") { frame.style.display = "none"; button.textContent = "Chat with us"; } });
})();
