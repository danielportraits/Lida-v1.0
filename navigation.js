const viewNames = ["chats", "conversation", "estados", "play", "reels", "profile", "ai"];
export function showView(name) {
  if (!viewNames.includes(name)) return;
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.dataset.view === name));
  document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.target === name));
  document.body.dataset.currentView = name;
  if (name !== "conversation") document.querySelector("#app-main")?.focus({ preventScroll: true });
}
export function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach(item => item.addEventListener("click", () => showView(item.dataset.target)));
}
