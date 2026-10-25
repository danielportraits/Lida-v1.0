import { readJSON, writeJSON } from "./storage.js";
import { showView, setupNavigation } from "./navigation.js";
import { openDialog, closeDialog, toast } from "./dialogs.js";

const welcomeChat = { id: "lida-welcome", name: "LIDA", userHandle: "@lida", lastMessage: "¡Bienvenido! Estoy aquí para ayudarte a conocer LIDA.", time: "Ahora", unread: false, favorite: true, online: false, system: true };
const state = {
  chats: readJSON("lida.chats", [welcomeChat]).filter(chat => chat.id === "lida-welcome"),
  messages: { "lida-welcome": readJSON("lida.messages", { "lida-welcome": [{ text: "¡Hola! 👋 Te doy la bienvenida a LIDA. Aquí podrás descubrir la comunidad, conversar y jugar. Explora la aplicación con la guía inicial.", mine: false, time: "Ahora", system: true }] })["lida-welcome"] || [{ text: "¡Hola! 👋 Te doy la bienvenida a LIDA. Aquí podrás descubrir la comunidad, conversar y jugar. Explora la aplicación con la guía inicial.", mine: false, time: "Ahora", system: true }] },
  statuses: [],
  filter: "all",
  activeChatId: null,
  profile: readJSON("lida.profile", { name: "", handle: "", bio: "" }),
  registered: readJSON("lida.registered", false),
  guideCompleted: readJSON("lida.guideCompleted", false),
  guideSkipped: readJSON("lida.guideSkipped", false),
  guideStep: 0,
  directory: readJSON("lida.localContacts", [])
};
if (!state.chats.some(chat => chat.id === "lida-welcome")) state.chats.unshift(welcomeChat);
if (!state.messages["lida-welcome"] || !state.messages["lida-welcome"].length) state.messages["lida-welcome"] = [{ text: "¡Hola! 👋 Te doy la bienvenida a LIDA. Aquí podrás descubrir la comunidad, conversar y jugar. Explora la aplicación con la guía inicial.", mine: false, time: "Ahora", system: true }];
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
const initials = name => name.trim().split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase();

function persist() {
  writeJSON("lida.chats", state.chats);
  writeJSON("lida.messages", state.messages);
  writeJSON("lida.statuses", state.statuses);
  writeJSON("lida.profile", state.profile);
  writeJSON("lida.registered", state.registered);
  writeJSON("lida.userDirectory", state.directory);
  writeJSON("lida.localContacts", state.directory);
  writeJSON("lida.guideCompleted", state.guideCompleted);
  writeJSON("lida.guideSkipped", state.guideSkipped);
}
function renderChats() {
  const query = ($("#chat-search").value || "").toLowerCase().trim();
  const chats = state.chats.filter(chat => {
    const matchesQuery = `${chat.name} ${chat.lastMessage || ""}`.toLowerCase().includes(query);
    const matchesFilter = state.filter === "all" || (state.filter === "unread" && chat.unread) || (state.filter === "favorites" && chat.favorite);
    return matchesQuery && matchesFilter;
  });
  $("#chat-list").innerHTML = chats.map(chat => `<button class="chat-row" data-chat-id="${esc(chat.id)}">
    <span class="avatar ${chat.online ? "online-avatar" : ""}">${esc(initials(chat.name))}</span>
    <span class="chat-copy"><span class="chat-title-line"><strong>${esc(chat.name)}</strong><time>${esc(chat.time || "")}</time></span><span class="chat-preview">${chat.unread ? '<i class="unread-dot"></i>' : ""}${esc(chat.lastMessage || "Inicia una conversación")}</span></span>
    ${chat.favorite ? '<span class="favorite-mark" aria-label="Favorito">★</span>' : ""}
  </button>`).join("");
  $("#chat-empty").classList.toggle("hidden", chats.length > 0);
}
function renderConversation(chatId) {
  const chat = state.chats.find(item => item.id === chatId);
  if (!chat) return;
  state.activeChatId = chatId;
  chat.unread = false;
  $("#conversation-name").textContent = chat.name;
  $("#conversation-avatar").textContent = initials(chat.name);
  $("#conversation-status").textContent = chat.system ? "Asistente de bienvenida · local" : "Conversación local";
  const messages = state.messages[chatId] || [];
  $("#message-list").innerHTML = `<div class="date-divider"><span>HOY</span></div>` + messages.map(message => `<div class="message ${message.mine ? "mine" : "theirs"}"><p>${esc(message.text)}</p><time>${esc(message.time)}</time></div>`).join("");
  $("#message-list").scrollTop = $("#message-list").scrollHeight;
  persist();
  renderChats();
  showView("conversation");
}
function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed || !state.activeChatId) return;
  const messages = state.messages[state.activeChatId] || [];
  const time = new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
  messages.push({ text: trimmed, mine: true, time });
  state.messages[state.activeChatId] = messages;
  const chat = state.chats.find(item => item.id === state.activeChatId);
  if (chat) { chat.lastMessage = trimmed; chat.time = time; }
  persist();
  renderConversation(state.activeChatId);
}
function renderFriends() {
  const input = $("#friend-search");
  const query = (input?.value || "").trim().toLowerCase().replace(/^@/, "");
  const friends = state.directory.filter(person => `${person.name} ${person.handle}`.toLowerCase().includes(query));
  const list = $("#friend-list");
  const count = $("#friend-count");
  if (!list || !count) return;
  count.textContent = String(state.directory.length);
  list.innerHTML = friends.length ? friends.map(person => `<article class="friend-result"><span class="avatar">${esc(initials(person.name))}</span><div class="friend-result-copy"><strong>${esc(person.name)}</strong><small>${esc(person.handle)} · contacto local</small></div><button class="secondary-button" data-contact-chat="${esc(person.id)}">Mensaje</button><button class="icon-button" data-contact-remove="${esc(person.id)}" aria-label="Eliminar ${esc(person.name)}">×</button></article>`).join("") : `<div class="friend-empty">${query ? "No hay contactos que coincidan con la búsqueda." : "Todavía no has agregado contactos. Pulsa «Agregar persona» para guardar uno."}</div>`;
}
function openNewChat() {
  openDialog(`<p class="eyebrow">COMUNIDAD LIDA</p><h2>Agregar persona</h2><p>Guarda un contacto usando su nombre de usuario. Importante: esta versión aún no está conectada a un servidor, así que esto no envía una solicitud a otra persona ni confirma que el usuario exista.</p><label class="field-label" for="contact-name">Nombre para mostrar</label><input id="contact-name" class="dialog-input" maxlength="40" placeholder="Ej. Alex"><label class="field-label" for="contact-handle">Nombre de usuario</label><div class="username-input-wrap"><span>@</span><input id="contact-handle" class="dialog-input" maxlength="20" placeholder="usuario" autocomplete="off" autocapitalize="none" spellcheck="false"></div><p class="registration-note">El contacto se guardará solo en este navegador. La búsqueda y las solicitudes entre cuentas se activarán al conectar el backend.</p><button class="primary-button full-width" id="save-contact">Guardar contacto</button>`);
  $("#save-contact").addEventListener("click", () => {
    const name = $("#contact-name").value.trim();
    const handle = $("#contact-handle").value.trim().replace(/^@/, "").toLowerCase();
    if (!name) { toast("Escribe el nombre para mostrar."); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) { toast("El usuario debe tener entre 3 y 20 caracteres: letras, números o guion bajo."); return; }
    if (state.profile.handle && handle === state.profile.handle.replace(/^@/, "").toLowerCase()) { toast("Ese es tu propio usuario."); return; }
    if (state.directory.some(person => person.handle.toLowerCase() === `@${handle}`)) { toast("Ese contacto ya está guardado."); return; }
    state.directory.unshift({ id: `contact-${Date.now()}`, name, handle: `@${handle}`, addedAt: new Date().toISOString() });
    persist(); renderFriends(); closeDialog(); toast("Contacto guardado en este dispositivo.");
  });
}
function openRegistration() {
  openDialog(`<div class="registration-mark"><img src="./lida-logo-original.png" alt="LIDA"></div><p class="eyebrow">BIENVENIDO A LIDA</p><h2>Crea tu usuario</h2><p class="muted">Sin número de teléfono ni verificación por SMS. Elige un nombre de usuario para identificarte y encontrar amigos.</p><label class="field-label" for="register-handle">Nombre de usuario</label><div class="username-input-wrap"><span>@</span><input id="register-handle" class="dialog-input" maxlength="20" placeholder="tu_usuario" autocomplete="username" autocapitalize="none" spellcheck="false"></div><small class="muted">Usa de 3 a 20 caracteres: letras, números o guion bajo.</small><button class="primary-button full-width" id="complete-registration">Entrar a LIDA</button><p class="registration-note">Por ahora, tu usuario se guarda solo en este navegador. La búsqueda global estará disponible al conectar el backend.</p>`);
  $("#complete-registration").addEventListener("click", () => {
    const handle = $("#register-handle").value.trim().replace(/^@/, "").toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) { toast("El usuario debe tener entre 3 y 20 caracteres: letras, números o guion bajo."); return; }
    state.profile = { name: handle, handle: `@${handle}`, bio: "Conectando a mi manera." };
    state.registered = true;
    persist(); renderProfile(); closeDialog(); renderConversation("lida-welcome"); toast("¡Bienvenido a LIDA!");
    if (!state.guideCompleted && !state.guideSkipped) openGuide();
  });
}
function openStatusDialog() {
  openDialog(`<p class="eyebrow">COMPARTE UN MOMENTO</p><h2>Crear estado</h2><p class="muted">Este estado será una nota local de demostración.</p><textarea id="status-text" class="dialog-input" maxlength="240" rows="3" placeholder="¿Qué quieres compartir?"></textarea><button class="primary-button full-width" id="publish-status">Publicar estado</button>`);
  $("#publish-status").addEventListener("click", () => {
    const text = $("#status-text").value.trim();
    if (!text) { toast("Escribe algo para tu estado."); return; }
    state.statuses.unshift({ id: `status-${Date.now()}`, name: state.profile.name, text, time: "Ahora", own: true });
    persist(); renderStatuses(); closeDialog(); toast("Estado guardado en este dispositivo.");
  });
}
function renderStatuses() {
  $("#status-list").innerHTML = state.statuses.map(status => `<article class="status-row"><div class="status-ring"><div class="avatar">${esc(initials(status.name))}</div></div><div class="status-copy"><h3>${esc(status.name)} ${status.own ? '<span class="muted-inline">(tú)</span>' : ""}</h3><p>${esc(status.text)}</p><small>${esc(status.time || "")}</small></div></article>`).join("");
}
function openGuide() {
  const steps = [
    { title: "Inicio", text: "Tu punto de partida para acceder rápidamente a las secciones de LIDA." },
    { title: "Comunidad", text: "Aquí podrás descubrir personas y gestionar amistades cuando el servicio esté conectado." },
    { title: "Mensajes", text: "Tus conversaciones aparecerán aquí. En esta versión solo existe el chat de bienvenida de LIDA." },
    { title: "Games", text: "Prueba los minijuegos locales disponibles en esta versión base." },
    { title: "Perfil", text: "Edita tu nombre, usuario y biografía desde tu perfil." },
    { title: "Privacidad y seguridad", text: "Consulta qué datos guarda esta demo y recuerda que todavía no hay cuentas ni sincronización en servidor." }
  ];
  state.guideStep = Math.max(0, Math.min(state.guideStep, steps.length - 1));
  const render = () => {
    const step = steps[state.guideStep];
    openDialog(`<p class="eyebrow">GUÍA DE LIDA · ${state.guideStep + 1} DE ${steps.length}</p><div class="guide-progress">${steps.map((_,i)=>`<span class="${i <= state.guideStep ? "done" : ""}"></span>`).join("")}</div><h2>${step.title}</h2><p>${step.text}</p><div class="guide-actions"><button class="secondary-button" id="guide-skip">Omitir guía</button><button class="primary-button" id="guide-next">${state.guideStep === steps.length - 1 ? "Terminar" : "Siguiente"}</button></div>`);
    $("#guide-skip").addEventListener("click", () => { state.guideSkipped = true; persist(); closeDialog(); toast("Puedes volver a abrir la guía desde Perfil → Ayuda."); });
    $("#guide-next").addEventListener("click", () => {
      if (state.guideStep >= steps.length - 1) { state.guideCompleted = true; persist(); closeDialog(); toast("¡Guía completada!"); return; }
      state.guideStep += 1; render();
    });
  };
  render();
}
function openTicTacToe() {
  let board = Array(9).fill(""); let turn = "X"; let finished = false; let moves = 0;
  const winner = () => { for (const [a,b,c] of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]; return board.every(Boolean) ? "draw" : null; };
  const render = () => {
    const result = winner(); if (result) finished = true;
    openDialog(`<p class="eyebrow">GAMES · LOCAL</p><h2>Tres en raya</h2><p>${result ? (result === "draw" ? "Empate." : `Gana ${result === "X" ? "Jugador 1 (X)" : "Jugador 2 (O)"}.`) : `Turno de ${turn === "X" ? "Jugador 1 (X)" : "Jugador 2 (O)"}`}</p><div class="ttt-board">${board.map((cell,i)=>`<button class="ttt-cell" data-cell="${i}" ${cell || finished ? "disabled" : ""}>${cell}</button>`).join("")}</div><p class="demo-notice">Modo local para dos personas en este dispositivo; no es multijugador en línea.</p><button class="primary-button full-width" id="ttt-reset">${finished ? "Jugar de nuevo" : "Reiniciar partida"}</button>`);
    $$("[data-cell]").forEach(button => button.addEventListener("click", () => { const i=Number(button.dataset.cell); if (board[i] || finished) return; board[i]=turn; moves++; const win=winner(); if (!win) turn=turn === "X" ? "O" : "X"; render(); }));
    $("#ttt-reset").addEventListener("click", () => { board=Array(9).fill(""); turn="X"; finished=false; moves=0; render(); });
  }; render();
}
function openLuzCamina() {
  const board = Array.from({length:16}, (_,i)=>({id:i,type:Math.random()<.28?"reto":Math.random()<.5?"verdad":"vacia",open:false}));
  const render = () => {
    openDialog(`<p class="eyebrow">GAMES · LOCAL</p><h2>Luz camina</h2><p>Descubre casillas: rojo = reto, verde = verdad y vacía = sigue jugando.</p><div class="mines-board">${board.map(cell=>`<button class="mine-cell ${cell.open ? cell.type : ""}" data-mine="${cell.id}" ${cell.open?"disabled":""}>${cell.open ? (cell.type === "reto" ? "!" : cell.type === "verdad" ? "✓" : "·") : "?"}</button>`).join("")}</div><p id="mine-message" class="muted">Toca una casilla para revelar qué contiene.</p><p class="demo-notice">Tablero local de demostración. No hay salas ni jugadores remotos.</p><button class="primary-button full-width" id="mine-reset">Nuevo tablero</button>`);
    $$("[data-mine]").forEach(button=>button.addEventListener("click",()=>{const cell=board[Number(button.dataset.mine)]; cell.open=true; const msg=cell.type === "reto" ? "🔴 ¡Te ha tocado un reto! Elige uno seguro y divertido." : cell.type === "verdad" ? "🟢 ¡Te ha tocado verdad! Responde una pregunta si quieres." : "⬜ Casilla vacía. ¡Puedes seguir!"; render(); const message=$("#mine-message"); if(message) message.textContent=msg;}));
    $("#mine-reset").addEventListener("click",openLuzCamina);
  }; render();
}
function openHelp() { openDialog(`<p class="eyebrow">AYUDA</p><h2>Ayuda de LIDA</h2><p>Vuelve a consultar la guía o revisa el estado de esta versión base.</p><button class="primary-button full-width" id="reopen-guide">Abrir guía de LIDA</button><button class="secondary-button full-width" id="show-version-info">Estado y límites de la demo</button>`); $("#reopen-guide").addEventListener("click",()=>{closeDialog();state.guideStep=0;openGuide();}); $("#show-version-info").addEventListener("click",()=>{closeDialog();openDialog(`<p class="eyebrow">VERSIÓN BASE</p><h2>Qué está disponible</h2><p>Perfil y mensajes se guardan en este navegador. Los juegos son locales. Todavía no hay backend, sincronización, llamadas, notificaciones push reales ni IA conectada.</p>`);}); }
function editProfile() {
  openDialog(`<p class="eyebrow">PERSONALIZACIÓN</p><h2>Editar perfil</h2><label class="field-label" for="edit-name">Nombre</label><input id="edit-name" class="dialog-input" maxlength="50" value="${esc(state.profile.name)}"><label class="field-label" for="edit-handle">Usuario</label><input id="edit-handle" class="dialog-input" maxlength="40" value="${esc(state.profile.handle)}"><label class="field-label" for="edit-bio">Biografía</label><textarea id="edit-bio" class="dialog-input" maxlength="160" rows="3">${esc(state.profile.bio)}</textarea><button class="primary-button full-width" id="save-profile">Guardar cambios</button>`);
  $("#save-profile").addEventListener("click", () => {
    const name = $("#edit-name").value.trim();
    const handle = $("#edit-handle").value.trim();
    if (!name || !handle) { toast("El nombre y el usuario son obligatorios."); return; }
    const normalizedHandle = handle.startsWith("@") ? handle.toLowerCase() : `@${handle.toLowerCase()}`;
    if (!/^@[a-z0-9_]{3,20}$/.test(normalizedHandle)) { toast("El usuario debe tener de 3 a 20 caracteres: letras, números o guion bajo."); return; }
    const oldHandle = state.profile.handle;
    state.profile = { name, handle: normalizedHandle, bio: $("#edit-bio").value.trim() };

    persist(); renderProfile(); closeDialog(); toast("Perfil actualizado.");
  });
}
function renderProfile() {
  $("#profile-display-name").textContent = state.profile.name;
  $("#profile-handle").textContent = state.profile.handle;
  $(".profile-bio").textContent = state.profile.bio;
  $(".profile-avatar").textContent = initials(state.profile.name);
  $("#profile-shortcut").textContent = initials(state.profile.name);
}
function setupAI() {
  const ask = text => {
    const input = text.trim(); if (!input) return;
    const area = $("#ai-messages");
    area.insertAdjacentHTML("beforeend", `<div class="ai-bubble user-ai">${esc(input)}</div><div class="ai-bubble assistant-ai"><strong>✦ LIDA AI</strong><p>Estoy en modo de demostración. Cuando conectemos el servicio de IA, podré responder a “${esc(input)}” con ayuda real.</p></div>`);
    $("#ai-input").value = ""; area.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  $("#ai-form").addEventListener("submit", event => { event.preventDefault(); ask($("#ai-input").value); });
  $$(".suggestion").forEach(button => button.addEventListener("click", () => ask(button.dataset.prompt)));
}
function setupEvents() {
  $("#chat-search").addEventListener("input", renderChats);
  $$(".filter-chip").forEach(button => button.addEventListener("click", () => { state.filter = button.dataset.filter; $$(".filter-chip").forEach(item => item.classList.toggle("selected", item === button)); renderChats(); }));
  $("#chat-list").addEventListener("click", event => { const row = event.target.closest("[data-chat-id]"); if (row) renderConversation(row.dataset.chatId); });
  $("#message-form").addEventListener("submit", event => { event.preventDefault(); sendMessage($("#message-input").value); $("#message-input").value = ""; });
  $("#back-to-chats").addEventListener("click", () => showView("chats"));
  $("#new-chat-button").addEventListener("click", openNewChat);
  $("#new-chat-community").addEventListener("click", openNewChat);
  $("#friend-search").addEventListener("input", renderFriends);
  $("#friend-list").addEventListener("click", event => {
    const remove = event.target.closest("[data-contact-remove]");
    const message = event.target.closest("[data-contact-chat]");
    if (remove) {
      state.directory = state.directory.filter(person => person.id !== remove.dataset.contactRemove);
      persist(); renderFriends(); toast("Contacto eliminado de este dispositivo.");
    }
    if (message) {
      const person = state.directory.find(item => item.id === message.dataset.contactChat);
      if (!person) return;
      let chat = state.chats.find(item => item.contactId === person.id);
      if (!chat) {
        chat = { id: `local-chat-${person.id}`, contactId: person.id, name: person.name, userHandle: person.handle, lastMessage: "Contacto local · no conectado", time: "Ahora", unread: false, favorite: false, online: false, system: false, localOnly: true };
        state.chats.push(chat); state.messages[chat.id] = [{ text: `Este chat está preparado localmente para ${person.name} (${person.handle}). Los mensajes no se entregan a otra persona hasta que LIDA tenga un servidor conectado.`, mine: false, time: "Ahora", system: true }]; persist();
      }
      renderConversation(chat.id);
    }
  });
  $("#new-status-button").addEventListener("click", openStatusDialog);
  $("#status-add").addEventListener("click", openStatusDialog);
  $("#edit-profile-button").addEventListener("click", editProfile);
  $("#profile-edit-main").addEventListener("click", editProfile);
  $("#profile-shortcut").addEventListener("click", () => showView("profile"));
  $("#search-button").addEventListener("click", () => { showView("chats"); $("#chat-search").focus(); });
  $("#attach-button").addEventListener("click", () => toast("Los archivos adjuntos requieren una fase posterior."));
  $("#conversation-menu").addEventListener("click", () => openDialog(`<p class="eyebrow">CONVERSACIÓN</p><h2>Opciones</h2><button class="settings-row" id="clear-chat"><span>⌫</span><span><strong>Limpiar mensajes locales</strong><small>Elimina los mensajes guardados en este dispositivo</small></span></button>`));
  document.addEventListener("click", event => { if (event.target.closest("#clear-chat")) { state.messages[state.activeChatId] = []; persist(); renderConversation(state.activeChatId); closeDialog(); toast("Mensajes locales eliminados."); } });
  $("#appearance-button").addEventListener("click", () => openDialog(`<p class="eyebrow">APARIENCIA</p><h2>Estilo de LIDA</h2><p>Tema oscuro premium, verde neón y logo original sin modificaciones.</p>`));
  $("#privacy-button").addEventListener("click", () => openDialog(`<p class="eyebrow">PRIVACIDAD</p><h2>Datos del prototipo</h2><p>Esta versión guarda datos localmente en el navegador. No hay cuentas reales, sincronización de servidor ni cifrado de extremo a extremo. No introduzcas información sensible.</p>`));
  $("#about-button").addEventListener("click", () => openDialog(`<p class="eyebrow">ACERCA DE</p><h2>LIDA</h2><p>Versión base 0.2.0. Los mensajes y juegos son locales. Backend, cuentas compartidas, notificaciones reales y llamadas requieren implementación adicional.</p>`));
  $("#open-tictactoe").addEventListener("click", openTicTacToe);
  $("#open-luzcamina").addEventListener("click", openLuzCamina);
  $("#help-button").addEventListener("click", openHelp);
  $("#home-guide-button").addEventListener("click", () => { state.guideStep=0; openGuide(); });
  $("#home-open-messages").addEventListener("click", () => showView("chats"));
  $("#home-open-games").addEventListener("click", () => showView("play"));
  $("#home-open-community").addEventListener("click", () => showView("estados"));
}
setupNavigation();
setupEvents();
setupAI();
renderChats();
renderStatuses();
renderProfile();
if (!state.registered) openRegistration();
else if (!state.guideCompleted && !state.guideSkipped) openGuide();
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(error => console.warn("No se pudo registrar el service worker:", error)));
}

// Pantalla de carga: el logo original tiene un destello lento y no muestra barra de progreso.
window.addEventListener("load", () => {
  const splash = document.querySelector("#lida-splash");
  if (splash) window.setTimeout(() => splash.classList.add("is-hidden"), 1500);
});
