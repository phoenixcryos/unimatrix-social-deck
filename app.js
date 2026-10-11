/* Unimatrix Social Deck: static, host-authoritative multiplayer games. */
(() => {
  "use strict";

  const app = document.querySelector("#app");
  const MAX_PLAYERS = 10;
  const GLYPHS = ["◉", "◆", "▲", "✦"];
  const ACCORD_PROMPTS = [
    {
      prompt: "A damaged cube broadcasts a distress pulse through the collective. Which adaptation preserves the mission?",
      choices: ["Route power through the damaged relay", "Isolate the relay and build a redundant path", "Broadcast every drone's location"],
      answer: 1,
      rationale: "Redundancy preserves the network without spreading the fault.",
    },
    {
      prompt: "An away team finds a shield frequency that changes every ten seconds. What is the best collective response?",
      choices: ["Keep firing the current frequency", "Send one drone to negotiate", "Sample each shift, then adapt the modulation"],
      answer: 2,
      rationale: "Sampling the pattern gives the collective the data required to adapt.",
    },
    {
      prompt: "A new drone's neural link produces conflicting sensor data. What should the collective do first?",
      choices: ["Compare it with two independent drone feeds", "Delete the link immediately", "Ignore the disagreement"],
      answer: 0,
      rationale: "Independent confirmation separates a faulty link from a real threat.",
    },
    {
      prompt: "A Starfleet vessel begins an emergency warp escape. Which move best secures an intercept?",
      choices: ["Predict its vector from engine wake data", "Chase its last position", "Disable the cube's own sensors"],
      answer: 0,
      rationale: "The engine wake reveals direction and lets the collective plan ahead.",
    },
    {
      prompt: "The cube has one power cell and two essential systems: life support and a transwarp coil. What is the priority?",
      choices: ["Power life support, then recharge before pursuit", "Power the coil and abandon drones", "Split the cell until both fail"],
      answer: 0,
      rationale: "A collective without drones cannot pursue or adapt.",
    },
    {
      prompt: "A resistant computer virus has reached a minor subsystem. What prevents a cascade?",
      choices: ["Open every data pathway", "Quarantine the subsystem and map the virus", "Restart the cube in the middle of combat"],
      answer: 1,
      rationale: "Quarantine contains the threat while the collective learns how to remove it.",
    },
  ];

  const META = {
    accord: {
      name: "Adaptation Accord",
      players: "2–10 • cooperative",
      summary: "Secretly select the safest response and build enough collective integrity.",
      rule: "Five mission prompts. Everyone locks one response. A unanimous correct response adds 2 integrity, a correct majority adds 1, and any other result adds 0. Reach 7 integrity to complete the mission.",
      min: 2,
    },
    duel: {
      name: "Nanoprobe Duel",
      players: "2 • simultaneous",
      summary: "A five-round tactical triangle for two drones.",
      rule: "Choose in secret each round. Beam defeats Adapt, Shield defeats Beam, and Adapt defeats Shield. The losing drone takes 2 hull damage. Both begin with 6 hull; the higher hull after round 5 wins.",
      min: 2,
    },
    conquest: {
      name: "Cube Conquest",
      players: "2–10 • teams",
      summary: "Expand Alpha or Beta across a contested 5×5 node grid.",
      rule: "Players alternate Alpha and Beta teams. On your turn, claim an empty node orthogonally adjacent to your team's node. Once per team, adapt an enemy node that touches two friendly nodes. Control 13 nodes, or the most when the board fills, to win.",
      min: 2,
    },
    matrix: {
      name: "Memory Matrix",
      players: "2–10 • score race",
      summary: "Watch a glyph pattern, then rebuild it from collective memory.",
      rule: "Watch each sequence, then submit it after it hides. There are five rounds. A correct reconstruction earns 2 points; the first correct player receives 1 bonus point. The highest score wins.",
      min: 2,
    },
    intercept: {
      name: "Subspace Intercept",
      players: "2–10 • turn based",
      summary: "Break a four-glyph signal before the shared attempts run out.",
      rule: "Take turns guessing the four distinct glyphs. Teal marks the right glyph in the right place; amber marks a glyph in the signal but in another place. Break the signal within 12 collective attempts to win.",
      min: 2,
    },
  };

  const session = {
    peer: null,
    hostConnection: null,
    connections: new Map(),
    isHost: false,
    room: null,
    meId: null,
    meName: null,
    state: null,
    timers: [],
    connected: false,
    error: "",
  };
  const ui = { adaptMode: false, matrixDraft: [], matrixRound: null, interceptDraft: [] };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[char]);
  const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
  const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const nameOf = (id) => session.state?.players.find((player) => player.id === id)?.name || "Unknown drone";
  const activePlayers = () => session.state?.game?.active || session.state?.players.map((player) => player.id) || [];
  const isActive = (id = session.meId) => activePlayers().includes(id);
  const isHost = () => session.isHost;
  const currentGame = () => session.state?.game;
  const selectedMeta = () => META[session.state?.gameType || "accord"];
  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);

  function toast(message) {
    const old = document.querySelector(".toast");
    if (old) old.remove();
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    document.body.append(item);
    window.setTimeout(() => item.remove(), 3400);
  }

  function initialState() {
    return { version: 1, gameType: "accord", phase: "lobby", players: [], game: null, message: "Choose a simulation, then begin when the collective is ready." };
  }

  function shareUrl() {
    return `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(session.room || "")}`;
  }

  function setRoomInAddress() {
    window.history.replaceState({}, "", `?room=${encodeURIComponent(session.room)}`);
  }

  function cleanName(raw) {
    return raw.trim().replace(/\s+/g, " ").slice(0, 20);
  }

  function randomSequence(length) {
    return Array.from({ length }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
  }

  function uniqueSequence(length) {
    return shuffle(GLYPHS).slice(0, length);
  }

  function neighbours(index) {
    const row = Math.floor(index / 5);
    const col = index % 5;
    return [
      row > 0 ? index - 5 : null,
      row < 4 ? index + 5 : null,
      col > 0 ? index - 1 : null,
      col < 4 ? index + 1 : null,
    ].filter((item) => item !== null);
  }

  function schedule(fn, delay) {
    const timer = window.setTimeout(() => {
      session.timers = session.timers.filter((item) => item !== timer);
      fn();
    }, delay);
    session.timers.push(timer);
  }

  function clearTimers() {
    session.timers.forEach((timer) => window.clearTimeout(timer));
    session.timers = [];
  }

  function broadcast() {
    if (!isHost() || !session.state) return;
    session.state.version += 1;
    session.connections.forEach((connection) => {
      if (connection.open) connection.send({ type: "state", state: session.state });
    });
    render();
  }

  function hostError(error) {
    const detail = error?.type === "unavailable-id" ? "That room code is already active. Try a new one." : "Connection system unavailable. Check your network, then try again.";
    session.error = detail;
    render();
  }

  function createRoom(name) {
    if (!window.Peer) {
      session.error = "The connection library did not load. Refresh and try again.";
      render();
      return;
    }
    session.isHost = true;
    session.meName = name;
    session.room = code();
    session.meId = `host-${session.room.toLowerCase()}`;
    session.state = initialState();
    session.state.players = [{ id: session.meId, name, host: true }];
    session.connected = false;
    session.peer = new window.Peer(`unimatrix-${session.room.toLowerCase()}`);
    session.peer.on("open", () => {
      session.connected = true;
      setRoomInAddress();
      broadcast();
    });
    session.peer.on("connection", setupHostConnection);
    session.peer.on("error", hostError);
    session.peer.on("disconnected", () => {
      session.connected = false;
      render();
    });
    render();
  }

  function joinRoom(name, room) {
    if (!window.Peer) {
      session.error = "The connection library did not load. Refresh and try again.";
      render();
      return;
    }
    session.isHost = false;
    session.meName = name;
    session.room = room.toUpperCase();
    session.connected = false;
    session.error = "";
    session.peer = new window.Peer();
    session.peer.on("open", (id) => {
      session.meId = id;
      session.hostConnection = session.peer.connect(`unimatrix-${session.room.toLowerCase()}`, { reliable: true });
      setupGuestConnection(session.hostConnection);
    });
    session.peer.on("error", (error) => {
      session.error = error?.type === "peer-unavailable" ? "This room is not active. Ask the host for a fresh link." : "Could not connect to this room. Check the code and try again.";
      render();
    });
    render();
  }

  function setupHostConnection(connection) {
    connection.on("open", () => {});
    connection.on("data", (message) => {
      if (message?.type === "join") registerGuest(connection, message.name);
      if (message?.type === "action") handleAction(message.action, connection.peer);
    });
    connection.on("close", () => removeGuest(connection.peer));
    connection.on("error", () => removeGuest(connection.peer));
  }

  function setupGuestConnection(connection) {
    connection.on("open", () => {
      session.connected = true;
      connection.send({ type: "join", name: session.meName });
      render();
    });
    connection.on("data", (message) => {
      if (message?.type === "state") {
        session.state = message.state;
        session.error = "";
        render();
      }
      if (message?.type === "room-error") {
        session.error = message.message;
        render();
      }
    });
    connection.on("close", () => {
      session.connected = false;
      session.error = "The host connection closed. The room is no longer live.";
      render();
    });
    connection.on("error", () => {
      session.error = "Could not maintain the host connection.";
      render();
    });
  }

  function registerGuest(connection, rawName) {
    if (!session.state || session.connections.has(connection.peer)) return;
    if (session.state.players.length >= MAX_PLAYERS) {
      connection.send({ type: "room-error", message: "This cube already has 10 drones." });
      connection.close();
      return;
    }
    if (session.state.phase !== "lobby") {
      connection.send({ type: "room-error", message: "This match has already started. Ask the host to reset the lobby." });
      connection.close();
      return;
    }
    const name = cleanName(rawName) || "Unnamed drone";
    session.connections.set(connection.peer, connection);
    session.state.players.push({ id: connection.peer, name, host: false });
    broadcast();
  }

  function removeGuest(id) {
    if (!isHost() || !session.connections.has(id)) return;
    session.connections.delete(id);
    session.state.players = session.state.players.filter((player) => player.id !== id);
    const game = currentGame();
    if (game?.active?.includes(id)) {
      session.state.message = `${nameOf(id)} disconnected. The host can return to the lobby and start a fresh simulation.`;
    }
    broadcast();
  }

  function sendAction(action) {
    if (!session.state) return;
    if (isHost()) handleAction(action, session.meId);
    else if (session.hostConnection?.open) session.hostConnection.send({ type: "action", action });
    else toast("Waiting for the host connection.");
  }

  function handleAction(action, playerId) {
    if (!isHost() || !session.state || !action?.type) return;
    const game = currentGame();
    if (action.type === "selectGame" && playerId === session.meId && session.state.phase === "lobby" && META[action.game]) {
      session.state.gameType = action.game;
      session.state.message = `${META[action.game].name} has been selected.`;
      broadcast();
      return;
    }
    if (action.type === "start" && playerId === session.meId && session.state.phase === "lobby") {
      startGame();
      return;
    }
    if (action.type === "lobby" && playerId === session.meId) {
      clearTimers();
      session.state.phase = "lobby";
      session.state.game = null;
      session.state.message = "The collective is back in the lobby.";
      broadcast();
      return;
    }
    if (!game || !isActive(playerId)) return;
    if (game.type === "accord" && action.type === "accordChoice") submitAccord(playerId, action.choice);
    if (game.type === "duel" && action.type === "duelMove") submitDuelMove(playerId, action.move);
    if (game.type === "conquest" && action.type === "conquestMove") submitConquestMove(playerId, action.index, Boolean(action.adapt));
    if (game.type === "matrix" && action.type === "matrixSubmit") submitMatrix(playerId, action.value);
    if (game.type === "intercept" && action.type === "interceptGuess") submitIntercept(playerId, action.value);
    if (game.type === "accord" && action.type === "resolveAccord" && playerId === session.meId) resolveAccord();
  }

  function startGame() {
    const meta = selectedMeta();
    if (session.state.players.length < meta.min) {
      session.state.message = `${meta.name} needs at least ${meta.min} players.`;
      broadcast();
      return;
    }
    clearTimers();
    const type = session.state.gameType;
    const active = type === "duel" ? session.state.players.slice(0, 2).map((player) => player.id) : session.state.players.map((player) => player.id);
    session.state.phase = "game";
    session.state.message = "Simulation started.";
    session.state.game = { type, active, phase: "playing", startedAt: Date.now() };
    if (type === "accord") startAccord();
    if (type === "duel") startDuel();
    if (type === "conquest") startConquest();
    if (type === "matrix") startMatrix();
    if (type === "intercept") startIntercept();
    broadcast();
  }

  function startAccord() {
    Object.assign(currentGame(), {
      prompts: shuffle(ACCORD_PROMPTS).slice(0, 5),
      round: 0,
      integrity: 0,
      choices: {},
      results: [],
      lastResult: "Each drone should lock one response.",
    });
  }

  function submitAccord(playerId, choice) {
    const game = currentGame();
    if (game.phase !== "playing" || hasOwn(game.choices, playerId) || !Number.isInteger(choice) || choice < 0 || choice > 2) return;
    game.choices[playerId] = choice;
    if (Object.keys(game.choices).length === game.active.length) resolveAccord();
    else broadcast();
  }

  function resolveAccord() {
    const game = currentGame();
    if (!game || game.phase !== "playing") return;
    const prompt = game.prompts[game.round];
    const choices = Object.values(game.choices);
    if (!choices.length) return;
    const correct = choices.filter((choice) => choice === prompt.answer).length;
    let gain = 0;
    if (correct === game.active.length) gain = 2;
    else if (correct > game.active.length / 2) gain = 1;
    game.integrity += gain;
    game.results.push({ prompt: prompt.prompt, correct, gain, rationale: prompt.rationale });
    game.lastResult = `${correct}/${game.active.length} chose the correct adaptation. +${gain} integrity. ${prompt.rationale}`;
    game.round += 1;
    if (game.round >= game.prompts.length) {
      game.phase = "complete";
      game.outcome = game.integrity >= 7 ? "Mission successful. The collective adapted." : "Mission compromised. The collective needs greater consensus.";
    } else {
      game.choices = {};
    }
    broadcast();
  }

  function startDuel() {
    const active = currentGame().active;
    Object.assign(currentGame(), {
      round: 1,
      moves: {},
      hull: { [active[0]]: 6, [active[1]]: 6 },
      log: [],
      lastResult: "Choose a tactic; selections resolve together.",
    });
  }

  function duelWinner(first, second) {
    if (first === second) return 0;
    const wins = { beam: "adapt", shield: "beam", adapt: "shield" };
    return wins[first] === second ? 1 : -1;
  }

  function submitDuelMove(playerId, move) {
    const game = currentGame();
    if (game.phase !== "playing" || hasOwn(game.moves, playerId) || !["beam", "shield", "adapt"].includes(move)) return;
    game.moves[playerId] = move;
    if (Object.keys(game.moves).length === 2) resolveDuel();
    else broadcast();
  }

  function resolveDuel() {
    const game = currentGame();
    const [first, second] = game.active;
    const firstMove = game.moves[first];
    const secondMove = game.moves[second];
    const winner = duelWinner(firstMove, secondMove);
    if (winner === 1) game.hull[second] = Math.max(0, game.hull[second] - 2);
    if (winner === -1) game.hull[first] = Math.max(0, game.hull[first] - 2);
    const line = winner === 0
      ? `Round ${game.round}: both drones chose ${firstMove}; no hull damage.`
      : `Round ${game.round}: ${nameOf(winner === 1 ? first : second)} wins ${firstMove} versus ${secondMove} and deals 2 hull damage.`;
    game.log.unshift(line);
    const ended = game.round >= 5 || game.hull[first] === 0 || game.hull[second] === 0;
    if (ended) {
      game.phase = "complete";
      const difference = game.hull[first] - game.hull[second];
      game.outcome = difference === 0 ? "The duel ends in a tactical stalemate." : `${nameOf(difference > 0 ? first : second)} wins the duel.`;
    } else {
      game.round += 1;
      game.moves = {};
      game.lastResult = line;
    }
    broadcast();
  }

  function startConquest() {
    const game = currentGame();
    const teams = {};
    game.active.forEach((id, index) => { teams[id] = index % 2 === 0 ? "alpha" : "beta"; });
    const board = Array(25).fill(null);
    board[0] = "alpha";
    board[24] = "beta";
    Object.assign(game, { board, teams, turn: 0, adaptUsed: { alpha: false, beta: false }, log: ["Alpha opens at node 1. Beta opens at node 25."], lastResult: "Claim an adjacent empty node on your turn." });
  }

  function countTeam(board, team) { return board.filter((cell) => cell === team).length; }
  function canClaim(game, index, team) { return game.board[index] === null && neighbours(index).some((node) => game.board[node] === team); }
  function canAdapt(game, index, team) { return game.board[index] && game.board[index] !== team && neighbours(index).filter((node) => game.board[node] === team).length >= 2; }

  function submitConquestMove(playerId, index, adapt) {
    const game = currentGame();
    if (game.phase !== "playing" || game.active[game.turn] !== playerId || !Number.isInteger(index) || index < 0 || index > 24) return;
    const team = game.teams[playerId];
    const legal = adapt ? !game.adaptUsed[team] && canAdapt(game, index, team) : canClaim(game, index, team);
    if (!legal) return;
    game.board[index] = team;
    if (adapt) game.adaptUsed[team] = true;
    const action = adapt ? "adapted" : "claimed";
    game.log.unshift(`${nameOf(playerId)} ${action} node ${index + 1} for ${team === "alpha" ? "Alpha" : "Beta"}.`);
    const alpha = countTeam(game.board, "alpha");
    const beta = countTeam(game.board, "beta");
    if (alpha >= 13 || beta >= 13 || game.board.every(Boolean)) {
      game.phase = "complete";
      game.outcome = alpha === beta ? "The grid is evenly held: a collective stalemate." : `${alpha > beta ? "Alpha" : "Beta"} controls the cube: ${alpha} nodes to ${beta}.`;
    } else {
      game.turn = (game.turn + 1) % game.active.length;
      game.lastResult = `${nameOf(game.active[game.turn])}'s turn for ${game.teams[game.active[game.turn]] === "alpha" ? "Alpha" : "Beta"}.`;
    }
    broadcast();
  }

  function startMatrix() {
    const game = currentGame();
    Object.assign(game, { round: 0, scores: Object.fromEntries(game.active.map((id) => [id, 0])), sequence: [], submissions: {}, lastResult: "Loading the first recall pattern…" });
    schedule(matrixLaunchRound, 350);
  }

  function matrixLaunchRound() {
    const game = currentGame();
    if (!isHost() || !game || game.type !== "matrix" || game.phase === "complete") return;
    game.round += 1;
    game.sequence = randomSequence(Math.min(2 + game.round, 7));
    game.submissions = {};
    game.phase = "reveal";
    game.endsAt = Date.now() + 4200;
    game.lastResult = `Round ${game.round}: memorize ${game.sequence.length} glyphs.`;
    broadcast();
    schedule(() => {
      const active = currentGame();
      if (!active || active.type !== "matrix" || active.round !== game.round || active.phase !== "reveal") return;
      active.phase = "input";
      active.endsAt = Date.now() + 14000;
      active.lastResult = "The pattern is hidden. Rebuild it before the timer expires.";
      broadcast();
      schedule(() => {
        const current = currentGame();
        if (current?.type === "matrix" && current.phase === "input" && current.round === game.round) resolveMatrix();
      }, 14200);
    }, 4300);
  }

  function submitMatrix(playerId, value) {
    const game = currentGame();
    if (game.phase !== "input" || hasOwn(game.submissions, playerId) || !Array.isArray(value) || value.length !== game.sequence.length || value.some((glyph) => !GLYPHS.includes(glyph))) return;
    game.submissions[playerId] = { value, at: Date.now() };
    if (Object.keys(game.submissions).length === game.active.length) resolveMatrix();
    else broadcast();
  }

  function resolveMatrix() {
    const game = currentGame();
    if (!game || game.phase !== "input") return;
    const target = game.sequence.join("");
    const correct = game.active.filter((id) => game.submissions[id]?.value.join("") === target);
    correct.forEach((id) => { game.scores[id] += 2; });
    if (correct.length) {
      const first = correct.sort((a, b) => game.submissions[a].at - game.submissions[b].at)[0];
      game.scores[first] += 1;
      game.lastResult = `${correct.length} drone${correct.length === 1 ? "" : "s"} reconstructed ${target}. ${nameOf(first)} receives the speed bonus.`;
    } else {
      game.lastResult = `No reconstruction matched ${target}.`;
    }
    if (game.round >= 5) {
      game.phase = "complete";
      const high = Math.max(...Object.values(game.scores));
      const winners = game.active.filter((id) => game.scores[id] === high).map(nameOf);
      game.outcome = winners.length === 1 ? `${winners[0]} wins the Memory Matrix with ${high} points.` : `Shared memory victory for ${winners.join(" and ")} with ${high} points.`;
      broadcast();
    } else {
      game.phase = "between";
      game.endsAt = Date.now() + 2700;
      broadcast();
      schedule(matrixLaunchRound, 2800);
    }
  }

  function startIntercept() {
    const game = currentGame();
    Object.assign(game, { code: uniqueSequence(4), turn: 0, attempts: [], lastResult: `${nameOf(game.active[0])} holds the first intercept.` });
  }

  function feedbackFor(value, target) {
    return value.map((glyph, index) => glyph === target[index] ? "exact" : target.includes(glyph) ? "near" : "miss");
  }

  function submitIntercept(playerId, value) {
    const game = currentGame();
    if (game.phase !== "playing" || game.active[game.turn] !== playerId || !Array.isArray(value) || value.length !== 4 || new Set(value).size !== 4 || value.some((glyph) => !GLYPHS.includes(glyph))) return;
    const feedback = feedbackFor(value, game.code);
    const solved = feedback.every((item) => item === "exact");
    game.attempts.push({ by: playerId, value, feedback });
    if (solved) {
      game.phase = "complete";
      game.outcome = `${nameOf(playerId)} broke the signal in ${game.attempts.length} collective attempt${game.attempts.length === 1 ? "" : "s"}.`;
    } else if (game.attempts.length >= 12) {
      game.phase = "complete";
      game.outcome = `The signal escaped after 12 attempts. Its code was ${game.code.join("")}.`;
    } else {
      game.turn = (game.turn + 1) % game.active.length;
      game.lastResult = `${nameOf(game.active[game.turn])}'s turn to intercept.`;
    }
    broadcast();
  }

  function renderLanding() {
    const queryRoom = new URLSearchParams(window.location.search).get("room") || "";
    const cards = Object.entries(META).map(([key, meta]) => `
      <article class="game-card"><strong>${escapeHtml(meta.name)}</strong><p>${escapeHtml(meta.summary)}</p><span class="pill">${escapeHtml(meta.players)}</span></article>
    `).join("");
    return `
      <section class="hero">
        <div class="brand">Borg themed Discord game room</div>
        <h1>UNIMATRIX<br><span class="accent">SOCIAL DECK</span></h1>
        <p>Five quick multiplayer simulations for a collective that is never in the same room. One drone hosts; everyone joins the same link from their own device.</p>
      </section>
      <section class="panel">
        <div class="entry">
          <label class="field">Your drone designation<input id="player-name" maxlength="20" autocomplete="nickname" placeholder="Seven of Nine" /></label>
          <label class="field">Collective room code<input id="room-code" maxlength="8" value="${escapeHtml(queryRoom.toUpperCase())}" placeholder="AB12CD" /></label>
        </div>
        <div class="entry-actions" style="margin-top:16px">
          <button class="action" data-action="create">Create a collective</button>
          <button class="secondary" data-action="join">Join a collective</button>
        </div>
        ${session.error ? `<p class="helper error">${escapeHtml(session.error)}</p>` : ""}
        <p class="helper">The host keeps the room tab open. A room supports up to ten players, each on a separate browser or device.</p>
      </section>
      <section class="catalogue">
        <div class="section-heading"><h2>Available simulations</h2><span>Rules appear inside every room</span></div>
        <div class="game-grid">${cards}</div>
      </section>`;
  }

  function playerList() {
    return session.state.players.map((player) => `<li><span>${escapeHtml(player.name)} ${player.id === session.meId ? "(you)" : ""}</span>${player.host ? '<span class="tag">HOST</span>' : ""}</li>`).join("");
  }

  function renderLobby() {
    const selected = session.state.gameType;
    const modes = Object.entries(META).map(([key, meta]) => `
      <button class="mode ${key === selected ? "selected" : ""}" data-action="select-game" data-game="${key}" ${!isHost() ? "disabled" : ""}>
        <span>${escapeHtml(meta.name)}</span><small>${escapeHtml(meta.players)}<br>${escapeHtml(meta.summary)}</small>
      </button>`).join("");
    const observers = selected === "duel" && session.state.players.length > 2 ? `<p class="observers">Nanoprobe Duel uses the first two drones as duelists; the others can spectate.</p>` : "";
    return `
      <section class="lobby">
        <aside class="panel">
          <div class="brand">Collective roster</div>
          <ul class="players">${playerList()}</ul>
          <div class="share">Share this exact link with your Discord server:<input readonly value="${escapeHtml(shareUrl())}" data-share-url /></div>
          <button class="secondary" style="margin-top:10px" data-action="copy">Copy invitation</button>
        </aside>
        <section class="panel">
          <div class="section-heading"><h2>Select a simulation</h2><span>${isHost() ? "Host controls are active" : "Waiting for the host to select"}</span></div>
          <div class="mode-list">${modes}</div>
          <div class="rulebox"><strong class="objective">How ${escapeHtml(META[selected].name)} works:</strong><br>${escapeHtml(META[selected].rule)}</div>
          <div class="host-tools">
            ${isHost() ? `<button class="action" data-action="start">Begin simulation</button>` : ""}
          </div>
          ${observers}
          <p class="helper">${escapeHtml(session.state.message || "")}</p>
        </section>
      </section>`;
  }

  function renderGameShell(content) {
    const meta = META[currentGame().type];
    const observer = !isActive() ? `<p class="observers">You are observing this simulation. The active roster was fixed when the match began.</p>` : "";
    return `
      <section class="panel">
        <div class="game-header">
          <div><div class="brand">Active simulation</div><h2>${escapeHtml(meta.name)}</h2><p>${escapeHtml(meta.players)}</p></div>
          <div class="scoreboard">${renderGameScore()}</div>
        </div>
        <div class="rulebox">${escapeHtml(meta.rule)}</div>
        ${observer}
        ${content}
        ${isHost() ? `<div class="host-tools" style="margin-top:22px"><button class="secondary" data-action="lobby">Return to lobby</button></div>` : ""}
      </section>`;
  }

  function renderGameScore() {
    const game = currentGame();
    if (game.type === "accord") return `<span class="score">Integrity ${game.integrity}/7</span><span class="score">Round ${Math.min(game.round + 1, 5)}/5</span>`;
    if (game.type === "duel") return game.active.map((id) => `<span class="score">${escapeHtml(nameOf(id))}: ${game.hull[id]} hull</span>`).join("");
    if (game.type === "conquest") return `<span class="score">Alpha ${countTeam(game.board, "alpha")}</span><span class="score">Beta ${countTeam(game.board, "beta")}</span>`;
    if (game.type === "matrix") return game.active.map((id) => `<span class="score">${escapeHtml(nameOf(id))}: ${game.scores[id] || 0}</span>`).join("");
    if (game.type === "intercept") return `<span class="score">Attempt ${game.attempts.length}/12</span><span class="score">Turn: ${escapeHtml(nameOf(game.active[game.turn]))}</span>`;
    return "";
  }

  function completeBlock(game) {
    return `<div class="result"><strong>Simulation complete</strong><br>${escapeHtml(game.outcome || "")}</div>`;
  }

  function renderAccord() {
    const game = currentGame();
    if (game.phase === "complete") return renderGameShell(`${completeBlock(game)}<div class="result">${escapeHtml(game.lastResult)}</div>`);
    const prompt = game.prompts[game.round];
    const mine = game.choices[session.meId];
    const locked = Object.keys(game.choices).length;
    const options = prompt.choices.map((choice, index) => `<button class="move ${mine === index ? "selected-choice" : ""}" data-action="accord-choice" data-choice="${index}" ${hasOwn(game.choices, session.meId) || !isActive() ? "disabled" : ""}><strong>${String.fromCharCode(65 + index)}. ${escapeHtml(choice)}</strong><small>${mine === index ? "Response locked" : "Select this adaptation"}</small></button>`).join("");
    return renderGameShell(`
      <div class="center"><div class="brand">Mission prompt ${game.round + 1} of 5</div><h3>${escapeHtml(prompt.prompt)}</h3><p class="hint">${locked}/${game.active.length} responses locked. Responses stay hidden until the collective resolves them.</p></div>
      <div class="choice-row">${options}</div>
      ${isHost() && locked ? `<div class="host-tools" style="margin-top:16px"><button class="secondary" data-action="resolve-accord">Resolve now</button></div>` : ""}
      <p class="helper">${escapeHtml(game.lastResult)}</p>`);
  }

  function renderDuel() {
    const game = currentGame();
    const combatants = game.active.map((id) => `<article class="duelist ${id === session.meId ? "me" : ""}"><strong>${escapeHtml(nameOf(id))}</strong><div class="hull">${"◆".repeat(game.hull[id])}${"◇".repeat(6 - game.hull[id])}</div><small>${game.hull[id]} hull remaining</small></article>`).join("");
    if (game.phase === "complete") return renderGameShell(`<div class="duel-grid">${combatants}</div>${completeBlock(game)}<div class="result">${escapeHtml(game.log[0] || "")}</div>`);
    const mine = game.moves[session.meId];
    const tactics = [
      ["beam", "Beam", "Defeats Adapt"],
      ["shield", "Shield", "Defeats Beam"],
      ["adapt", "Adapt", "Defeats Shield"],
    ].map(([key, label, note]) => `<button class="move ${mine === key ? "selected-choice" : ""}" data-action="duel-move" data-move="${key}" ${hasOwn(game.moves, session.meId) || !isActive() ? "disabled" : ""}><strong>${label}</strong><small>${note}</small></button>`).join("");
    return renderGameShell(`<div class="duel-grid">${combatants}</div><div class="center"><div class="brand">Round ${game.round} of 5</div><p class="hint">${Object.keys(game.moves).length}/2 tactics locked. Select one tactic at the same time as your opponent.</p></div><div class="choice-row">${tactics}</div><p class="helper">${escapeHtml(game.lastResult)}</p>`);
  }

  function renderConquest() {
    const game = currentGame();
    const activeId = game.active[game.turn];
    const mineTeam = game.teams[session.meId];
    const canAct = game.phase === "playing" && activeId === session.meId;
    const cells = game.board.map((owner, index) => {
      const legalClaim = canAct && canClaim(game, index, mineTeam);
      const legalAdapt = canAct && ui.adaptMode && !game.adaptUsed[mineTeam] && canAdapt(game, index, mineTeam);
      const selectable = legalClaim || legalAdapt;
      return `<button class="cell ${owner || ""} ${selectable ? "legal" : ""}" data-action="conquest-cell" data-index="${index}" ${!selectable ? "disabled" : ""}>${owner === "alpha" ? "A" : owner === "beta" ? "B" : index + 1}</button>`;
    }).join("");
    const teamList = (team) => game.active.filter((id) => game.teams[id] === team).map(nameOf).map(escapeHtml).join(", ");
    const actionTools = canAct ? `<div class="host-tools"><button class="${ui.adaptMode ? "action amber" : "secondary"}" data-action="toggle-adapt" ${game.adaptUsed[mineTeam] ? "disabled" : ""}>${ui.adaptMode ? "Cancel adaptation" : "Use team adaptation"}</button><span class="hint">${ui.adaptMode ? "Choose an enemy node touching two of your nodes." : "Choose an outlined empty node."}</span></div>` : "";
    const content = `
      <div class="teams"><div class="team alpha"><strong>Alpha • ${countTeam(game.board, "alpha")} nodes</strong><br><span class="hint">${teamList("alpha")}</span></div><div class="team beta"><strong>Beta • ${countTeam(game.board, "beta")} nodes</strong><br><span class="hint">${teamList("beta")}</span></div></div>
      <div class="center"><p class="hint">${game.phase === "complete" ? "Final node map" : `${escapeHtml(nameOf(activeId))}'s turn • ${game.teams[activeId] === "alpha" ? "Alpha" : "Beta"}`}</p></div>
      <div class="board">${cells}</div>
      ${game.phase === "complete" ? completeBlock(game) : actionTools}
      <p class="helper">${escapeHtml(game.lastResult || game.log[0])}</p>`;
    return renderGameShell(content);
  }

  function renderMatrix() {
    const game = currentGame();
    if (ui.matrixRound !== game.round) { ui.matrixRound = game.round; ui.matrixDraft = []; }
    const show = game.phase === "reveal" || game.phase === "complete" || game.phase === "between";
    const sequence = game.sequence.map((glyph) => `<span>${show ? glyph : "?"}</span>`).join("");
    const submitted = Object.keys(game.submissions).length;
    const canInput = game.phase === "input" && isActive() && !hasOwn(game.submissions, session.meId);
    const keys = GLYPHS.map((glyph) => `<button class="glyph" data-action="matrix-glyph" data-glyph="${glyph}" ${!canInput ? "disabled" : ""}>${glyph}</button>`).join("");
    const timerCopy = game.phase === "reveal" ? "Memorize the sequence." : game.phase === "input" ? `${submitted}/${game.active.length} reconstructions submitted.` : game.phase === "between" ? "Score update recorded. Loading the next signal…" : "Five recall patterns complete.";
    const controls = game.phase === "input" ? `<div class="typed">${ui.matrixDraft.join(" ") || "_ _ _ _"}</div><div class="glyphs">${keys}</div><div class="host-tools" style="justify-content:center; margin-top:10px"><button class="secondary" data-action="matrix-clear" ${!canInput || !ui.matrixDraft.length ? "disabled" : ""}>Clear</button><button class="action" data-action="matrix-submit" ${!canInput || ui.matrixDraft.length !== game.sequence.length ? "disabled" : ""}>Submit sequence</button></div>` : "";
    const body = `<div class="center"><div class="brand">Recall round ${game.round} of 5</div><p class="hint">${timerCopy}</p><div class="sequence ${show ? "" : "hidden"}">${sequence}</div>${controls}</div><p class="helper">${escapeHtml(game.lastResult)}</p>${game.phase === "complete" ? completeBlock(game) : ""}`;
    return renderGameShell(body);
  }

  function renderIntercept() {
    const game = currentGame();
    const myTurn = game.phase === "playing" && game.active[game.turn] === session.meId;
    const draft = ui.interceptDraft;
    const keys = GLYPHS.map((glyph) => `<button class="glyph ${draft.includes(glyph) ? "selected-choice" : ""}" data-action="intercept-glyph" data-glyph="${glyph}" ${!myTurn || draft.includes(glyph) ? "disabled" : ""}>${glyph}</button>`).join("");
    const history = game.attempts.slice().reverse().map((attempt) => `<div class="guess"><span>${escapeHtml(nameOf(attempt.by))}</span><div class="feedback">${attempt.value.map((glyph, index) => `<b class="${attempt.feedback[index]}">${glyph}</b>`).join("")}</div></div>`).join("") || '<p class="hint center">No signal attempts yet.</p>';
    const controls = game.phase === "playing" ? `<div class="typed">${draft.join(" ") || "_ _ _ _"}</div><div class="glyphs">${keys}</div><div class="host-tools" style="justify-content:center; margin-top:10px"><button class="secondary" data-action="intercept-clear" ${!myTurn || !draft.length ? "disabled" : ""}>Clear</button><button class="action" data-action="intercept-submit" ${!myTurn || draft.length !== 4 ? "disabled" : ""}>Send intercept</button></div>` : "";
    const code = game.phase === "complete" ? `<div class="result">Final signal: <strong>${game.code.join(" ")}</strong></div>` : "";
    return renderGameShell(`<div class="center"><div class="brand">Subspace signal</div><p class="hint">${escapeHtml(game.lastResult)}</p>${controls}</div><div class="guess-history">${history}</div>${game.phase === "complete" ? completeBlock(game) : ""}${code}`);
  }

  function render() {
    if (!session.state) {
      app.innerHTML = renderLanding();
      return;
    }
    const header = `<header class="topbar"><div><div class="brand">Unimatrix Social Deck</div><h1>${session.state.phase === "lobby" ? "Collective Lobby" : "Simulation In Progress"}</h1></div><div class="connection"><span class="status">${session.connected ? "● linked" : "◌ connecting"}</span><br><span class="room-code">${escapeHtml(session.room || "")}</span></div></header>`;
    let body = renderLobby();
    if (session.state.phase === "game") {
      const type = currentGame()?.type;
      body = type === "accord" ? renderAccord() : type === "duel" ? renderDuel() : type === "conquest" ? renderConquest() : type === "matrix" ? renderMatrix() : renderIntercept();
    }
    app.innerHTML = header + body;
  }

  function getInput(id) { return document.querySelector(id)?.value || ""; }

  app.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === "create" || action === "join") {
      const name = cleanName(getInput("#player-name"));
      const room = getInput("#room-code").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!name) { toast("Enter a drone designation first."); return; }
      if (action === "create") createRoom(name);
      else if (!room) toast("Enter the collective room code.");
      else joinRoom(name, room);
      return;
    }
    if (action === "copy") {
      navigator.clipboard?.writeText(shareUrl()).then(() => toast("Invitation copied.")).catch(() => toast("Copy the invitation link from the field."));
      return;
    }
    if (action === "select-game") { sendAction({ type: "selectGame", game: button.dataset.game }); return; }
    if (action === "start") { sendAction({ type: "start" }); return; }
    if (action === "lobby") { sendAction({ type: "lobby" }); return; }
    if (action === "accord-choice") { sendAction({ type: "accordChoice", choice: Number(button.dataset.choice) }); return; }
    if (action === "resolve-accord") { sendAction({ type: "resolveAccord" }); return; }
    if (action === "duel-move") { sendAction({ type: "duelMove", move: button.dataset.move }); return; }
    if (action === "toggle-adapt") { ui.adaptMode = !ui.adaptMode; render(); return; }
    if (action === "conquest-cell") { sendAction({ type: "conquestMove", index: Number(button.dataset.index), adapt: ui.adaptMode }); ui.adaptMode = false; return; }
    if (action === "matrix-glyph") { if (ui.matrixDraft.length < currentGame().sequence.length) { ui.matrixDraft.push(button.dataset.glyph); render(); } return; }
    if (action === "matrix-clear") { ui.matrixDraft = []; render(); return; }
    if (action === "matrix-submit") { sendAction({ type: "matrixSubmit", value: ui.matrixDraft }); return; }
    if (action === "intercept-glyph") { if (!ui.interceptDraft.includes(button.dataset.glyph)) { ui.interceptDraft.push(button.dataset.glyph); render(); } return; }
    if (action === "intercept-clear") { ui.interceptDraft = []; render(); return; }
    if (action === "intercept-submit") { sendAction({ type: "interceptGuess", value: ui.interceptDraft }); ui.interceptDraft = []; return; }
  });

  render();
})();
