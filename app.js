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
    blocks: {
      name: "Falling Block Skirmish",
      players: "2–10 • score race",
      summary: "Build, rotate, and drop polyominoes to clear a Borg matrix.",
      rule: "Every drone has a 10×14 matrix and twelve blocks. Move, rotate, then hard-drop your active block. Each cleared horizontal line is worth 100 points. Clear five lines to win, or lead on points after every drone places twelve blocks.",
      min: 2,
    },
    breaker: {
      name: "Shield Breaker Fleet",
      players: "2–10 • turn based",
      summary: "Launch nanoprobes through shield lanes to shatter a brick wall.",
      rule: "On your turn, choose one of six launch lanes. The nanoprobe follows a visible deterministic bounce path through your 6×5 shield wall and breaks every block it contacts. Clear your wall to win; after twelve shots each, the highest number of broken blocks wins.",
      min: 2,
    },
    tiles: {
      name: "Tile Matrix",
      players: "2–10 • turn based",
      summary: "Match exposed Borg tiles from a shared wall.",
      rule: "On your turn, select two matching exposed tiles. A tile is exposed when its left or right neighbour is empty. A pair is worth 1 point and keeps your turn; a mismatch passes control. The high score when the wall clears wins.",
      min: 2,
    },
    chess: {
      name: "Borg Chess: Rapid Variant",
      players: "2 • tactical",
      summary: "A two-commander chess match with check and promotion.",
      rule: "Pieces use standard chess movement. You may not leave your king in check. Checkmate or stalemate ends the match; pawns promote to queens. This rapid variant omits castling and en passant.",
      min: 2,
    },
    fleet: {
      name: "Borg Fleet Engagement",
      players: "2 • hidden fleet",
      summary: "Privately deploy vessels, then scan the enemy sector.",
      rule: "Place your four vessels on an 8×8 sector grid. On your turn, scan one enemy coordinate. A hit earns another scan; a miss passes control. Sink every enemy vessel to win. Enemy placements remain masked until hit.",
      min: 2,
    },
  };

  const SOLO_META = {
    blocks: {
      name: "Falling Block Skirmish: Solo",
      label: "Falling Block Skirmish",
      players: "solo score attack",
      summary: "Place twelve polyominoes and clear as many Borg matrix lines as possible.",
      rule: "Move, rotate, then hard-drop twelve blocks. Each block is worth 10 points and each cleared line adds 100. Clearing five lines completes the simulation early.",
      record: "high score",
    },
    breaker: {
      name: "Shield Breaker Fleet: Solo",
      label: "Shield Breaker Fleet",
      players: "solo precision",
      summary: "Use twelve deterministic nanoprobes to break your shield wall.",
      rule: "Choose a launch lane for each of twelve probes. Each follows its visible bounce path and breaks every intact shield block it crosses. Clear all 30 blocks or post the highest score you can.",
      record: "high score",
    },
    tiles: {
      name: "Tile Matrix: Solitaire",
      label: "Tile Matrix",
      players: "solo matching",
      summary: "Match exposed Borg tiles from a personal matrix.",
      rule: "Select two exposed matching tiles to remove them. A tile is exposed when its left or right neighbor is clear. You may recalibrate the remaining tiles, but each recalibration costs one point.",
      record: "pairs cleared",
    },
    chess: {
      name: "Borg Chess: Computer Opponent",
      label: "Borg Chess vs Computer",
      players: "you vs computer",
      summary: "Command White against a tactical Borg opponent.",
      rule: "You command White and move first. Pieces use standard movement; check, checkmate, stalemate, and automatic queen promotion apply. Castling and en passant are omitted in this rapid variant.",
      record: "victories",
    },
    fleet: {
      name: "Borg Fleet Engagement: Computer Opponent",
      label: "Fleet Engagement vs Computer",
      players: "you vs computer",
      summary: "Deploy a private fleet, then outscan a Borg tactical routine.",
      rule: "Place four vessels on your private sector grid. Scan one enemy coordinate per turn. A hit earns another scan; a miss gives the computer a scan. Sink every enemy vessel to win.",
      record: "victories",
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
  const solo = { game: null, timers: [] };
  const ui = {
    adaptMode: false, matrixDraft: [], matrixRound: null, interceptDraft: [], chessFrom: null, fleetShip: 0, fleetHorizontal: true,
    soloChessFrom: null, soloFleetShip: 0, soloFleetHorizontal: true,
  };

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

  function stateForViewer(playerId) {
    const visible = JSON.parse(JSON.stringify(session.state));
    const game = visible?.game;
    if (game?.type === "fleet") {
      game.active.filter((id) => id !== playerId).forEach((id) => {
        game.boards[id] = game.boards[id].map(() => null);
        game.fleets[id] = game.fleets[id].map((ship) => ({ index: ship.index, label: ship.label, size: ship.size }));
      });
    }
    return visible;
  }

  function broadcast() {
    if (!isHost() || !session.state) return;
    session.state.version += 1;
    session.connections.forEach((connection) => {
      if (connection.open) connection.send({ type: "state", state: stateForViewer(connection.peer) });
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
    if (game.type === "blocks" && action.type === "blockMove") moveBlock(playerId, Number(action.dx));
    if (game.type === "blocks" && action.type === "blockRotate") rotateBlock(playerId);
    if (game.type === "blocks" && action.type === "blockDrop") dropBlock(playerId);
    if (game.type === "breaker" && action.type === "breakerFire") fireBreaker(playerId, Number(action.lane));
    if (game.type === "tiles" && action.type === "tilePick") pickTile(playerId, Number(action.index));
    if (game.type === "chess" && action.type === "chessMove") moveChess(playerId, Number(action.from), Number(action.to));
    if (game.type === "fleet" && action.type === "fleetPlace") placeFleetShip(playerId, Number(action.ship), Number(action.index), Boolean(action.horizontal));
    if (game.type === "fleet" && action.type === "fleetFire") fireFleetScan(playerId, Number(action.index));
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
    const active = ["duel", "chess", "fleet"].includes(type) ? session.state.players.slice(0, 2).map((player) => player.id) : session.state.players.map((player) => player.id);
    session.state.phase = "game";
    session.state.message = "Simulation started.";
    session.state.game = { type, active, phase: "playing", startedAt: Date.now() };
    if (type === "accord") startAccord();
    if (type === "duel") startDuel();
    if (type === "conquest") startConquest();
    if (type === "matrix") startMatrix();
    if (type === "intercept") startIntercept();
    if (type === "blocks") startBlocks();
    if (type === "breaker") startBreaker();
    if (type === "tiles") startTiles();
    if (type === "chess") startChess();
    if (type === "fleet") startFleet();
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

  const BLOCK_TYPES = ["I", "O", "T", "L", "S"];
  const TILE_SIGNS = ["◈", "◉", "◆", "✦", "▲", "●", "☍", "☌", "✚", "✣", "⌁", "⌬", "◐", "◑", "◒", "◓"];

  function blockShape(type, rotation) {
    const turn = rotation % 4;
    const shapes = {
      I: turn % 2 ? [[0, 0], [0, 1], [0, 2], [0, 3]] : [[0, 0], [1, 0], [2, 0], [3, 0]],
      O: [[0, 0], [1, 0], [0, 1], [1, 1]],
      T: [
        [[0, 0], [1, 0], [2, 0], [1, 1]], [[1, 0], [0, 1], [1, 1], [1, 2]],
        [[1, 0], [0, 1], [1, 1], [2, 1]], [[0, 0], [0, 1], [1, 1], [0, 2]],
      ][turn],
      L: [
        [[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0], [1, 0], [2, 0], [0, 1]],
        [[0, 0], [1, 0], [1, 1], [1, 2]], [[2, 0], [0, 1], [1, 1], [2, 1]],
      ][turn],
      S: turn % 2 ? [[1, 0], [0, 1], [1, 1], [0, 2]] : [[1, 0], [2, 0], [0, 1], [1, 1]],
    };
    return shapes[type];
  }

  function newBlock() {
    return { type: BLOCK_TYPES[Math.floor(Math.random() * BLOCK_TYPES.length)], rotation: 0, x: 3, y: 0 };
  }

  function blockIndexes(piece) {
    return blockShape(piece.type, piece.rotation).map(([x, y]) => (piece.y + y) * 10 + piece.x + x);
  }

  function validBlock(board, piece) {
    return blockShape(piece.type, piece.rotation).every(([x, y]) => {
      const column = piece.x + x;
      const row = piece.y + y;
      return column >= 0 && column < 10 && row >= 0 && row < 14 && !board[row * 10 + column];
    });
  }

  function startBlocks() {
    const game = currentGame();
    const boards = {};
    const pieces = {};
    const scores = {};
    const lines = {};
    const drops = {};
    const finished = {};
    game.active.forEach((id) => {
      boards[id] = Array(140).fill(null);
      pieces[id] = newBlock();
      scores[id] = 0;
      lines[id] = 0;
      drops[id] = 0;
      finished[id] = false;
    });
    Object.assign(game, { boards, pieces, scores, lines, drops, finished, lastResult: "Move, rotate, then hard-drop your first polyomino." });
  }

  function finishBlocks(game, winnerId) {
    game.phase = "complete";
    if (winnerId) game.outcome = `${nameOf(winnerId)} clears five lines and wins the skirmish.`;
    else {
      const high = Math.max(...Object.values(game.scores));
      const winners = game.active.filter((id) => game.scores[id] === high).map(nameOf);
      game.outcome = winners.length === 1 ? `${winners[0]} wins on ${high} points.` : `The skirmish ends tied: ${winners.join(" and ")} each have ${high} points.`;
    }
  }

  function moveBlock(playerId, dx) {
    const game = currentGame();
    const piece = game.pieces[playerId];
    if (game.phase !== "playing" || game.finished[playerId] || !piece || ![-1, 1].includes(dx)) return;
    const candidate = { ...piece, x: piece.x + dx };
    if (validBlock(game.boards[playerId], candidate)) game.pieces[playerId] = candidate;
    broadcast();
  }

  function rotateBlock(playerId) {
    const game = currentGame();
    const piece = game.pieces[playerId];
    if (game.phase !== "playing" || game.finished[playerId] || !piece) return;
    const candidate = { ...piece, rotation: (piece.rotation + 1) % 4 };
    if (validBlock(game.boards[playerId], candidate)) game.pieces[playerId] = candidate;
    broadcast();
  }

  function clearBlockRows(board) {
    let cleared = 0;
    for (let row = 13; row >= 0; row -= 1) {
      if (board.slice(row * 10, row * 10 + 10).every(Boolean)) {
        board.splice(row * 10, 10);
        board.unshift(...Array(10).fill(null));
        cleared += 1;
        row += 1;
      }
    }
    return cleared;
  }

  function dropBlock(playerId) {
    const game = currentGame();
    let piece = game.pieces[playerId];
    if (game.phase !== "playing" || game.finished[playerId] || !piece) return;
    while (validBlock(game.boards[playerId], { ...piece, y: piece.y + 1 })) piece = { ...piece, y: piece.y + 1 };
    blockIndexes(piece).forEach((index) => { game.boards[playerId][index] = "block"; });
    const cleared = clearBlockRows(game.boards[playerId]);
    game.drops[playerId] += 1;
    game.lines[playerId] += cleared;
    game.scores[playerId] += 10 + cleared * 100;
    game.lastResult = cleared ? `${nameOf(playerId)} clears ${cleared} line${cleared === 1 ? "" : "s"}.` : `${nameOf(playerId)} locks a block.`;
    if (game.lines[playerId] >= 5) {
      finishBlocks(game, playerId);
    } else if (game.drops[playerId] >= 12) {
      game.finished[playerId] = true;
      game.pieces[playerId] = null;
    } else {
      const next = newBlock();
      if (validBlock(game.boards[playerId], next)) game.pieces[playerId] = next;
      else { game.finished[playerId] = true; game.pieces[playerId] = null; }
    }
    if (game.phase === "playing" && game.active.every((id) => game.finished[id])) finishBlocks(game);
    broadcast();
  }

  function startBreaker() {
    const game = currentGame();
    const walls = {};
    const scores = {};
    const shots = {};
    game.active.forEach((id) => { walls[id] = Array(30).fill(true); scores[id] = 0; shots[id] = 0; });
    Object.assign(game, { walls, scores, shots, turn: 0, lastPath: [], lastResult: `${nameOf(game.active[0])} chooses the first launch lane.` });
  }

  function bouncedColumn(value) {
    const cycle = ((value % 10) + 10) % 10;
    return cycle < 6 ? cycle : 9 - cycle;
  }

  function breakerPath(lane, shot) {
    const direction = shot % 2 === 0 ? 1 : -1;
    return Array.from({ length: 5 }, (_, step) => step * 6 + bouncedColumn(lane + direction * step));
  }

  function finishBreaker(game) {
    game.phase = "complete";
    const high = Math.max(...Object.values(game.scores));
    const winners = game.active.filter((id) => game.scores[id] === high).map(nameOf);
    game.outcome = winners.length === 1 ? `${winners[0]} breaks the most shield blocks: ${high}.` : `Shield-breaking tie: ${winners.join(" and ")} each hit ${high} blocks.`;
  }

  function fireBreaker(playerId, lane) {
    const game = currentGame();
    if (game.phase !== "playing" || game.active[game.turn] !== playerId || !Number.isInteger(lane) || lane < 0 || lane > 5) return;
    const path = breakerPath(lane, game.shots[playerId]);
    let broken = 0;
    path.forEach((index) => { if (game.walls[playerId][index]) { game.walls[playerId][index] = false; broken += 1; } });
    game.scores[playerId] += broken;
    game.shots[playerId] += 1;
    game.lastPath = path;
    game.lastResult = `${nameOf(playerId)} launches through lane ${lane + 1} and breaks ${broken} block${broken === 1 ? "" : "s"}.`;
    if (game.walls[playerId].every((cell) => !cell)) {
      game.phase = "complete";
      game.outcome = `${nameOf(playerId)} clears an entire shield wall and wins.`;
    } else if (game.active.every((id) => game.shots[id] >= 12)) {
      finishBreaker(game);
    } else {
      game.turn = (game.turn + 1) % game.active.length;
      game.lastResult += ` ${nameOf(game.active[game.turn])}'s turn.`;
    }
    broadcast();
  }

  function startTiles() {
    const game = currentGame();
    const wall = shuffle(TILE_SIGNS.flatMap((sign) => [sign, sign]));
    Object.assign(game, { wall, scores: Object.fromEntries(game.active.map((id) => [id, 0])), turn: 0, selected: [], lastResult: `${nameOf(game.active[0])} begins the tile matrix.` });
  }

  function tileAvailable(wall, index) {
    if (!wall[index]) return false;
    const column = index % 8;
    const leftOpen = column === 0 || !wall[index - 1];
    const rightOpen = column === 7 || !wall[index + 1];
    return leftOpen || rightOpen;
  }

  function finishTiles(game) {
    game.phase = "complete";
    const high = Math.max(...Object.values(game.scores));
    const winners = game.active.filter((id) => game.scores[id] === high).map(nameOf);
    game.outcome = winners.length === 1 ? `${winners[0]} clears the Tile Matrix with ${high} pairs.` : `The Tile Matrix ends tied: ${winners.join(" and ")} each have ${high} pairs.`;
  }

  function pickTile(playerId, index) {
    const game = currentGame();
    if (game.phase !== "playing" || game.active[game.turn] !== playerId || !Number.isInteger(index) || index < 0 || index >= game.wall.length || !tileAvailable(game.wall, index) || game.selected.includes(index)) return;
    game.selected.push(index);
    if (game.selected.length < 2) {
      game.lastResult = `${nameOf(playerId)} selected a tile. Choose its match.`;
      broadcast();
      return;
    }
    const [first, second] = game.selected;
    if (game.wall[first] === game.wall[second]) {
      game.wall[first] = null;
      game.wall[second] = null;
      game.scores[playerId] += 1;
      game.lastResult = `${nameOf(playerId)} matches a pair and keeps the turn.`;
      if (game.wall.every((tile) => !tile)) finishTiles(game);
    } else {
      game.lastResult = `${nameOf(playerId)} misses the match. ${nameOf(game.active[(game.turn + 1) % game.active.length])}'s turn.`;
      game.turn = (game.turn + 1) % game.active.length;
    }
    game.selected = [];
    broadcast();
  }

  const CHESS_BACK_RANK = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  const CHESS_GLYPHS = { wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙", bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟" };

  function chessSide(piece) { return piece?.[0]; }
  function chessKind(piece) { return piece?.[1]; }
  function chessRow(index) { return Math.floor(index / 8); }
  function chessCol(index) { return index % 8; }

  function createChessBoard() {
    const board = Array(64).fill(null);
    CHESS_BACK_RANK.forEach((kind, index) => { board[index] = `b${kind}`; board[8 + index] = "bP"; board[48 + index] = "wP"; board[56 + index] = `w${kind}`; });
    return board;
  }

  function chessPathClear(board, from, to) {
    const fromRow = chessRow(from); const fromCol = chessCol(from);
    const toRow = chessRow(to); const toCol = chessCol(to);
    const rowStep = Math.sign(toRow - fromRow); const colStep = Math.sign(toCol - fromCol);
    let row = fromRow + rowStep; let col = fromCol + colStep;
    while (row !== toRow || col !== toCol) {
      if (board[row * 8 + col]) return false;
      row += rowStep; col += colStep;
    }
    return true;
  }

  function chessPseudoMove(board, from, to, side, attackOnly = false) {
    const piece = board[from];
    if (!piece || chessSide(piece) !== side || from === to) return false;
    const target = board[to];
    if (!attackOnly && target && chessSide(target) === side) return false;
    const rowDelta = chessRow(to) - chessRow(from);
    const colDelta = chessCol(to) - chessCol(from);
    const absRow = Math.abs(rowDelta); const absCol = Math.abs(colDelta);
    const kind = chessKind(piece);
    if (kind === "P") {
      const direction = side === "w" ? -1 : 1;
      const startRow = side === "w" ? 6 : 1;
      if (attackOnly) return rowDelta === direction && absCol === 1;
      if (absCol === 1 && rowDelta === direction && target && chessSide(target) !== side) return true;
      if (colDelta === 0 && rowDelta === direction && !target) return true;
      if (colDelta === 0 && chessRow(from) === startRow && rowDelta === direction * 2 && !target && !board[(chessRow(from) + direction) * 8 + chessCol(from)]) return true;
      return false;
    }
    if (kind === "N") return (absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2);
    if (kind === "K") return absRow <= 1 && absCol <= 1;
    if (kind === "B") return absRow === absCol && chessPathClear(board, from, to);
    if (kind === "R") return (rowDelta === 0 || colDelta === 0) && chessPathClear(board, from, to);
    if (kind === "Q") return (rowDelta === 0 || colDelta === 0 || absRow === absCol) && chessPathClear(board, from, to);
    return false;
  }

  function applyChessMove(board, from, to) {
    const next = [...board];
    let piece = next[from];
    next[from] = null;
    if (chessKind(piece) === "P" && [0, 7].includes(chessRow(to))) piece = `${chessSide(piece)}Q`;
    next[to] = piece;
    return next;
  }

  function chessInCheck(board, side) {
    const king = board.findIndex((piece) => piece === `${side}K`);
    if (king < 0) return true;
    const enemy = side === "w" ? "b" : "w";
    return board.some((piece, index) => chessSide(piece) === enemy && chessPseudoMove(board, index, king, enemy, true));
  }

  function legalChessMove(board, from, to, side) {
    return chessPseudoMove(board, from, to, side) && !chessInCheck(applyChessMove(board, from, to), side);
  }

  function chessHasMove(board, side) {
    return board.some((piece, from) => chessSide(piece) === side && board.some((_, to) => legalChessMove(board, from, to, side)));
  }

  function startChess() {
    const game = currentGame();
    Object.assign(game, {
      board: createChessBoard(),
      colors: { [game.active[0]]: "w", [game.active[1]]: "b" },
      turn: "w",
      history: [],
      lastResult: `${nameOf(game.active[0])} commands White. Select a piece, then a legal destination.`,
    });
  }

  function moveChess(playerId, from, to) {
    const game = currentGame();
    const side = game.colors[playerId];
    if (game.phase !== "playing" || side !== game.turn || !Number.isInteger(from) || !Number.isInteger(to) || from < 0 || from > 63 || to < 0 || to > 63 || !legalChessMove(game.board, from, to, side)) return;
    const moved = game.board[from];
    const captured = game.board[to];
    game.board = applyChessMove(game.board, from, to);
    game.history.unshift({ side, from, to, moved, captured });
    const nextSide = side === "w" ? "b" : "w";
    const nextPlayer = game.active.find((id) => game.colors[id] === nextSide);
    const check = chessInCheck(game.board, nextSide);
    if (!chessHasMove(game.board, nextSide)) {
      game.phase = "complete";
      game.outcome = check ? `${nameOf(playerId)} achieves checkmate.` : "The game ends in stalemate.";
    } else {
      game.turn = nextSide;
      const square = `${String.fromCharCode(97 + chessCol(to))}${8 - chessRow(to)}`;
      game.lastResult = `${nameOf(playerId)} moves ${CHESS_GLYPHS[moved]} to ${square}${captured ? ` and captures ${CHESS_GLYPHS[captured]}` : ""}.${check ? " Check." : ` ${nameOf(nextPlayer)} to move.`}`;
    }
    broadcast();
  }

  const FLEET_SHIPS = [
    { label: "Tactical Cube", size: 4 },
    { label: "Assimilation Sphere", size: 3 },
    { label: "Probe Wing", size: 3 },
    { label: "Relay Node", size: 2 },
  ];

  function fleetCells(index, length, horizontal) {
    const row = Math.floor(index / 8); const col = index % 8;
    const cells = Array.from({ length }, (_, offset) => horizontal ? row * 8 + col + offset : (row + offset) * 8 + col);
    if (cells.some((cell) => cell < 0 || cell >= 64)) return null;
    if (horizontal && cells.some((cell) => Math.floor(cell / 8) !== row)) return null;
    return cells;
  }

  function startFleet() {
    const game = currentGame();
    const boards = {}; const fleets = {}; const shots = {};
    game.active.forEach((id) => { boards[id] = Array(64).fill(null); fleets[id] = []; shots[id] = Array(64).fill(null); });
    Object.assign(game, { phase: "placement", boards, fleets, shots, turn: 0, lastResult: "Each commander privately places a four-vessel fleet." });
  }

  function fleetReady(game, playerId) { return game.fleets[playerId].length === FLEET_SHIPS.length; }

  function placeFleetShip(playerId, shipIndex, index, horizontal) {
    const game = currentGame();
    if (game.phase !== "placement" || !Number.isInteger(shipIndex) || !FLEET_SHIPS[shipIndex] || game.fleets[playerId].some((ship) => ship.index === shipIndex)) return;
    const cells = fleetCells(index, FLEET_SHIPS[shipIndex].size, horizontal);
    if (!cells || cells.some((cell) => game.boards[playerId][cell])) return;
    cells.forEach((cell) => { game.boards[playerId][cell] = `ship-${shipIndex}`; });
    game.fleets[playerId].push({ index: shipIndex, label: FLEET_SHIPS[shipIndex].label, size: FLEET_SHIPS[shipIndex].size, cells, hits: 0 });
    if (game.active.every((id) => fleetReady(game, id))) {
      game.phase = "playing";
      game.turn = 0;
      game.lastResult = `${nameOf(game.active[0])} has the first scan.`;
    } else {
      game.lastResult = `${nameOf(playerId)} deployed ${FLEET_SHIPS[shipIndex].label}. Waiting for the other commander.`;
    }
    broadcast();
  }

  function fireFleetScan(playerId, index) {
    const game = currentGame();
    if (game.phase !== "playing" || game.active[game.turn] !== playerId || !Number.isInteger(index) || index < 0 || index >= 64) return;
    const target = game.active.find((id) => id !== playerId);
    if (game.shots[target][index]) return;
    const vessel = game.boards[target][index];
    const hit = Boolean(vessel);
    game.shots[target][index] = hit ? "hit" : "miss";
    let sunk = null;
    if (hit) {
      const ship = game.fleets[target].find((item) => `ship-${item.index}` === vessel);
      ship.hits += 1;
      if (ship.hits === ship.size) sunk = ship.label;
    }
    if (game.fleets[target].every((ship) => ship.hits >= ship.size)) {
      game.phase = "complete";
      game.outcome = `${nameOf(playerId)} destroys every enemy vessel and wins Fleet Engagement.`;
    } else if (hit) {
      game.lastResult = `${nameOf(playerId)} records a hit${sunk ? ` and sinks the ${sunk}` : ""}. A hit earns another scan.`;
    } else {
      game.turn = (game.turn + 1) % 2;
      game.lastResult = `${nameOf(playerId)} misses. ${nameOf(game.active[game.turn])}'s turn.`;
    }
    broadcast();
  }

  function soloStore() {
    try { return JSON.parse(window.localStorage.getItem("unimatrix-solo-records-v1") || "{}"); } catch { return {}; }
  }

  function soloRecord(type) {
    return Number(soloStore()[type] || 0);
  }

  function saveSoloRecord(type, value) {
    try {
      const records = soloStore();
      records[type] = value;
      window.localStorage.setItem("unimatrix-solo-records-v1", JSON.stringify(records));
    } catch { /* Local play continues when storage is unavailable. */ }
  }

  function soloRecordLabel(type) {
    const value = soloRecord(type);
    if (type === "chess" || type === "fleet") return `${value} ${value === 1 ? "victory" : "victories"} saved`;
    return `best ${value}`;
  }

  function scheduleSolo(fn, delay) {
    const timer = window.setTimeout(() => {
      solo.timers = solo.timers.filter((item) => item !== timer);
      fn();
    }, delay);
    solo.timers.push(timer);
  }

  function clearSoloTimers() {
    solo.timers.forEach((timer) => window.clearTimeout(timer));
    solo.timers = [];
  }

  function finishSolo(game, outcome, playerWon = false) {
    if (game.phase === "complete") return;
    game.phase = "complete";
    game.outcome = outcome;
    if (game.recorded) return;
    game.recorded = true;
    if (["blocks", "breaker", "tiles"].includes(game.type)) {
      saveSoloRecord(game.type, Math.max(soloRecord(game.type), game.score));
    } else if (playerWon) {
      saveSoloRecord(game.type, soloRecord(game.type) + 1);
    }
  }

  function startSolo(type) {
    if (!SOLO_META[type]) return;
    clearSoloTimers();
    ui.soloChessFrom = null;
    ui.soloFleetShip = 0;
    ui.soloFleetHorizontal = true;
    if (type === "blocks") solo.game = { type, phase: "playing", board: Array(140).fill(null), piece: newBlock(), score: 0, lines: 0, drops: 0, lastResult: "Move, rotate, then hard-drop your first polyomino." };
    if (type === "breaker") solo.game = { type, phase: "playing", wall: Array(30).fill(true), score: 0, shots: 0, lastPath: [], lastResult: "Choose a launch lane for your first nanoprobe." };
    if (type === "tiles") solo.game = { type, phase: "playing", wall: shuffle(TILE_SIGNS.flatMap((sign) => [sign, sign])), score: 0, selected: [], recalibrations: 0, lastResult: "Choose two exposed matching tiles." };
    if (type === "chess") solo.game = { type, phase: "playing", board: createChessBoard(), turn: "w", history: [], lastResult: "You command White. Select a piece, then a legal destination." };
    if (type === "fleet") solo.game = {
      type, phase: "placement", turn: "player", ownBoard: Array(64).fill(null), computerBoard: Array(64).fill(null), ownFleet: [], computerFleet: [], ownShots: Array(64).fill(null), computerShots: Array(64).fill(null), lastResult: "Deploy every vessel before the Borg tactical routine begins scanning.",
    };
    render();
  }

  function leaveSolo() {
    clearSoloTimers();
    solo.game = null;
    ui.soloChessFrom = null;
    render();
  }

  function soloBlockMove(dx) {
    const game = solo.game;
    if (!game || game.type !== "blocks" || game.phase !== "playing" || ![-1, 1].includes(dx)) return;
    const candidate = { ...game.piece, x: game.piece.x + dx };
    if (validBlock(game.board, candidate)) game.piece = candidate;
    render();
  }

  function soloBlockRotate() {
    const game = solo.game;
    if (!game || game.type !== "blocks" || game.phase !== "playing") return;
    const candidate = { ...game.piece, rotation: (game.piece.rotation + 1) % 4 };
    if (validBlock(game.board, candidate)) game.piece = candidate;
    render();
  }

  function soloBlockDrop() {
    const game = solo.game;
    if (!game || game.type !== "blocks" || game.phase !== "playing" || !game.piece) return;
    let piece = game.piece;
    while (validBlock(game.board, { ...piece, y: piece.y + 1 })) piece = { ...piece, y: piece.y + 1 };
    blockIndexes(piece).forEach((index) => { game.board[index] = "block"; });
    const cleared = clearBlockRows(game.board);
    game.drops += 1;
    game.lines += cleared;
    game.score += 10 + cleared * 100;
    game.lastResult = cleared ? `You clear ${cleared} line${cleared === 1 ? "" : "s"}.` : "Block locked. Continue the construction.";
    if (game.lines >= 5) finishSolo(game, `Matrix stabilized: five lines cleared for ${game.score} points.`);
    else if (game.drops >= 12) finishSolo(game, `Twelve blocks placed. Final score: ${game.score}.`);
    else {
      const next = newBlock();
      if (validBlock(game.board, next)) game.piece = next;
      else finishSolo(game, `The matrix has no space for another block. Final score: ${game.score}.`);
    }
    render();
  }

  function soloBreakerFire(lane) {
    const game = solo.game;
    if (!game || game.type !== "breaker" || game.phase !== "playing" || !Number.isInteger(lane) || lane < 0 || lane > 5) return;
    const path = breakerPath(lane, game.shots);
    let broken = 0;
    path.forEach((index) => { if (game.wall[index]) { game.wall[index] = false; broken += 1; } });
    game.score += broken;
    game.shots += 1;
    game.lastPath = path;
    game.lastResult = `Nanoprobe through lane ${lane + 1} breaks ${broken} block${broken === 1 ? "" : "s"}.`;
    if (game.wall.every((cell) => !cell)) finishSolo(game, `Every shield block is down. Final score: ${game.score}.`);
    else if (game.shots >= 12) finishSolo(game, `Twelve probes expended. Final score: ${game.score} blocks broken.`);
    render();
  }

  function soloTilePick(index) {
    const game = solo.game;
    if (!game || game.type !== "tiles" || game.phase !== "playing" || !tileAvailable(game.wall, index) || game.selected.includes(index)) return;
    game.selected.push(index);
    if (game.selected.length === 1) {
      game.lastResult = "Tile selected. Choose its exposed match.";
      render();
      return;
    }
    const [first, second] = game.selected;
    if (game.wall[first] === game.wall[second]) {
      game.wall[first] = null;
      game.wall[second] = null;
      game.score += 1;
      game.lastResult = "Pair matched. Continue the matrix.";
      if (game.wall.every((tile) => !tile)) finishSolo(game, `The Tile Matrix is clear: ${game.score} pairs recovered.`);
    } else {
      game.lastResult = "Those tiles do not match. Try another exposed pair.";
    }
    game.selected = [];
    render();
  }

  function recalibrateSoloTiles() {
    const game = solo.game;
    if (!game || game.type !== "tiles" || game.phase !== "playing") return;
    const remaining = shuffle(game.wall.filter(Boolean));
    let cursor = 0;
    game.wall = game.wall.map((tile) => tile ? remaining[cursor++] : null);
    game.selected = [];
    game.recalibrations += 1;
    game.score = Math.max(0, game.score - 1);
    game.lastResult = "The remaining tiles recalibrated. One point was spent.";
    render();
  }

  function chessMoves(board, side) {
    const moves = [];
    board.forEach((piece, from) => {
      if (chessSide(piece) !== side) return;
      board.forEach((_, to) => { if (legalChessMove(board, from, to, side)) moves.push({ from, to }); });
    });
    return moves;
  }

  function finishSoloChessTurn(game, side, from, to) {
    const moved = game.board[from];
    const captured = game.board[to];
    game.board = applyChessMove(game.board, from, to);
    game.history.unshift({ side, from, to, moved, captured });
    const nextSide = side === "w" ? "b" : "w";
    const check = chessInCheck(game.board, nextSide);
    if (!chessHasMove(game.board, nextSide)) {
      if (check) finishSolo(game, side === "w" ? "Checkmate. You adapted beyond the Borg tactical routine." : "Checkmate. The Borg tactical routine controls the board.", side === "w");
      else finishSolo(game, "The chess simulation ends in stalemate.");
      return;
    }
    game.turn = nextSide;
    const square = `${String.fromCharCode(97 + chessCol(to))}${8 - chessRow(to)}`;
    game.lastResult = `${side === "w" ? "You" : "The Borg routine"} move ${CHESS_GLYPHS[moved]} to ${square}${captured ? ` and capture ${CHESS_GLYPHS[captured]}` : ""}.${check ? " Check." : ""}`;
  }

  function soloChessMove(from, to) {
    const game = solo.game;
    if (!game || game.type !== "chess" || game.phase !== "playing" || game.turn !== "w" || !legalChessMove(game.board, from, to, "w")) return;
    finishSoloChessTurn(game, "w", from, to);
    ui.soloChessFrom = null;
    render();
    if (game.phase === "playing" && game.turn === "b") scheduleSolo(soloComputerChessMove, 520);
  }

  function soloComputerChessMove() {
    const game = solo.game;
    if (!game || game.type !== "chess" || game.phase !== "playing" || game.turn !== "b") return;
    const values = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 50 };
    const candidates = chessMoves(game.board, "b");
    if (!candidates.length) return;
    const ranked = candidates.map((move) => {
      const captured = game.board[move.to];
      const next = applyChessMove(game.board, move.from, move.to);
      const center = 4 - Math.abs(3.5 - chessCol(move.to)) - Math.abs(3.5 - chessRow(move.to));
      return { ...move, score: (captured ? values[chessKind(captured)] * 20 : 0) + (chessInCheck(next, "w") ? 7 : 0) + center + Math.random() * 2 };
    }).sort((first, second) => second.score - first.score);
    const pick = ranked[0];
    finishSoloChessTurn(game, "b", pick.from, pick.to);
    render();
  }

  function soloPlaceFleetShip(board, fleet, shipIndex, index, horizontal) {
    if (!FLEET_SHIPS[shipIndex] || fleet.some((ship) => ship.index === shipIndex)) return false;
    const cells = fleetCells(index, FLEET_SHIPS[shipIndex].size, horizontal);
    if (!cells || cells.some((cell) => board[cell])) return false;
    cells.forEach((cell) => { board[cell] = `ship-${shipIndex}`; });
    fleet.push({ index: shipIndex, label: FLEET_SHIPS[shipIndex].label, size: FLEET_SHIPS[shipIndex].size, cells, hits: 0 });
    return true;
  }

  function deployComputerFleet(game) {
    FLEET_SHIPS.forEach((ship, index) => {
      let placed = false;
      for (let attempt = 0; attempt < 300 && !placed; attempt += 1) {
        placed = soloPlaceFleetShip(game.computerBoard, game.computerFleet, index, Math.floor(Math.random() * 64), Math.random() >= 0.5);
      }
    });
  }

  function soloFleetPlace(index) {
    const game = solo.game;
    if (!game || game.type !== "fleet" || game.phase !== "placement") return;
    if (!soloPlaceFleetShip(game.ownBoard, game.ownFleet, ui.soloFleetShip, index, ui.soloFleetHorizontal)) return;
    const remaining = FLEET_SHIPS.findIndex((ship, shipIndex) => !game.ownFleet.some((placed) => placed.index === shipIndex));
    if (remaining >= 0) {
      ui.soloFleetShip = remaining;
      game.lastResult = `${FLEET_SHIPS[ui.soloFleetShip].label} awaits deployment.`;
    } else {
      deployComputerFleet(game);
      game.phase = "playing";
      game.turn = "player";
      game.lastResult = "Both fleets are deployed. You have the first scan.";
    }
    render();
  }

  function soloFleetScan(game, attacker, index) {
    const targetBoard = attacker === "player" ? game.computerBoard : game.ownBoard;
    const targetFleet = attacker === "player" ? game.computerFleet : game.ownFleet;
    const shots = attacker === "player" ? game.ownShots : game.computerShots;
    if (shots[index]) return null;
    const vessel = targetBoard[index];
    const hit = Boolean(vessel);
    shots[index] = hit ? "hit" : "miss";
    let sunk = null;
    if (hit) {
      const ship = targetFleet.find((item) => `ship-${item.index}` === vessel);
      ship.hits += 1;
      if (ship.hits === ship.size) sunk = ship.label;
    }
    if (targetFleet.every((ship) => ship.hits >= ship.size)) {
      finishSolo(game, attacker === "player" ? "Every Borg vessel is destroyed. Fleet Engagement is yours." : "The Borg tactical routine destroys your fleet.", attacker === "player");
      return { hit, sunk, finished: true };
    }
    return { hit, sunk, finished: false };
  }

  function soloFleetFire(index) {
    const game = solo.game;
    if (!game || game.type !== "fleet" || game.phase !== "playing" || game.turn !== "player" || game.ownShots[index]) return;
    const result = soloFleetScan(game, "player", index);
    if (!result) return;
    if (!result.finished && result.hit) game.lastResult = `Hit confirmed${result.sunk ? `: ${result.sunk} destroyed` : ""}. Scan again.`;
    if (!result.finished && !result.hit) {
      game.turn = "computer";
      game.lastResult = "Scan missed. The Borg tactical routine is calculating a response.";
    }
    render();
    if (!result.finished && !result.hit) scheduleSolo(soloComputerFleetTurn, 520);
  }

  function computerFleetTarget(game) {
    const candidates = [];
    game.computerShots.forEach((shot, index) => {
      if (shot !== "hit") return;
      const row = Math.floor(index / 8); const col = index % 8;
      [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]].forEach(([nextRow, nextCol]) => {
        const next = nextRow * 8 + nextCol;
        if (nextRow >= 0 && nextRow < 8 && nextCol >= 0 && nextCol < 8 && !game.computerShots[next]) candidates.push(next);
      });
    });
    const unscanned = game.computerShots.map((shot, index) => shot ? null : index).filter((index) => index !== null);
    const choices = candidates.length ? candidates : unscanned;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function soloComputerFleetTurn() {
    const game = solo.game;
    if (!game || game.type !== "fleet" || game.phase !== "playing" || game.turn !== "computer") return;
    const index = computerFleetTarget(game);
    const result = soloFleetScan(game, "computer", index);
    if (!result) return;
    if (!result.finished && result.hit) {
      game.lastResult = `The Borg routine records a hit${result.sunk ? ` and destroys your ${result.sunk}` : ""}. It scans again.`;
      render();
      scheduleSolo(soloComputerFleetTurn, 520);
      return;
    }
    if (!result.finished) {
      game.turn = "player";
      game.lastResult = "The Borg scan missed. Your sector is ready for the next command.";
    }
    render();
  }

  function soloComplete(game) {
    if (game.phase !== "complete") return "";
    return `<div class="result"><strong>Solo simulation complete</strong><br>${escapeHtml(game.outcome || "")}</div><div class="host-tools" style="margin-top:16px"><button class="action" data-action="solo-restart">Run again</button><button class="secondary" data-action="solo-lobby">Solo Deck</button></div>`;
  }

  function renderSoloShell(content) {
    const game = solo.game;
    const meta = SOLO_META[game.type];
    return `<section class="panel"><div class="game-header"><div><div class="brand">Local solo simulation</div><h2>${escapeHtml(meta.name)}</h2><p>${escapeHtml(meta.players)}</p></div><div class="scoreboard"><span class="score">Saved record: ${escapeHtml(soloRecordLabel(game.type))}</span></div></div><div class="rulebox">${escapeHtml(meta.rule)}</div>${content}${game.phase !== "complete" ? '<div class="host-tools" style="margin-top:22px"><button class="secondary" data-action="solo-lobby">Leave Solo Deck</button></div>' : ""}</section>`;
  }

  function renderSoloBlocks() {
    const game = solo.game;
    const active = new Set(game.piece ? blockIndexes(game.piece) : []);
    const grid = game.board.map((cell, index) => `<span class="block-cell ${cell ? "locked" : ""} ${active.has(index) ? "falling" : ""}"></span>`).join("");
    const controls = game.phase === "playing" ? '<div class="host-tools block-controls"><button class="secondary" data-action="solo-block-move" data-dx="-1">◀ Move</button><button class="secondary" data-action="solo-block-rotate">↻ Rotate</button><button class="secondary" data-action="solo-block-move" data-dx="1">Move ▶</button><button class="action" data-action="solo-block-drop">Hard drop</button></div>' : "";
    return renderSoloShell(`<div class="center"><div class="brand">Personal construction matrix</div><p class="hint">${game.drops}/12 blocks • ${game.lines}/5 lines • ${game.score} points</p><div class="block-board">${grid}</div>${controls}</div><p class="helper">${escapeHtml(game.lastResult)}</p>${soloComplete(game)}`);
  }

  function renderSoloBreaker() {
    const game = solo.game;
    const wall = game.wall.map((brick, index) => `<span class="brick ${brick ? "intact" : "broken"} ${game.lastPath.includes(index) ? "path" : ""}"></span>`).join("");
    const lanes = Array.from({ length: 6 }, (_, lane) => `<button class="glyph" data-action="solo-breaker-fire" data-lane="${lane}" ${game.phase !== "playing" ? "disabled" : ""}>${lane + 1}</button>`).join("");
    return renderSoloShell(`<div class="center"><div class="brand">Personal shield wall</div><p class="hint">${game.shots}/12 probes • ${game.score} blocks broken</p><div class="breaker-board">${wall}</div><div class="glyphs launch-lanes">${lanes}</div></div><p class="helper">${escapeHtml(game.lastResult)}</p>${soloComplete(game)}`);
  }

  function renderSoloTiles() {
    const game = solo.game;
    const tiles = game.wall.map((tile, index) => {
      const open = tileAvailable(game.wall, index);
      return `<button class="tile ${tile ? "" : "cleared"} ${open ? "exposed" : ""} ${game.selected.includes(index) ? "selected-choice" : ""}" data-action="solo-tile-pick" data-index="${index}" ${!tile || !open || game.phase !== "playing" ? "disabled" : ""}>${tile || ""}</button>`;
    }).join("");
    return renderSoloShell(`<div class="center"><div class="brand">Personal tile matrix</div><p class="hint">${game.score} pairs cleared • ${game.recalibrations} recalibrations</p><div class="tile-wall">${tiles}</div><button class="secondary" data-action="solo-tile-recalibrate" ${game.phase !== "playing" ? "disabled" : ""}>Recalibrate remaining tiles (−1 point)</button></div><p class="helper">${escapeHtml(game.lastResult)}</p>${soloComplete(game)}`);
  }

  function renderSoloChess() {
    const game = solo.game;
    const canMove = game.phase === "playing" && game.turn === "w";
    if (!canMove) ui.soloChessFrom = null;
    const squares = game.board.map((piece, index) => {
      const selected = ui.soloChessFrom === index;
      const legal = ui.soloChessFrom !== null && canMove && legalChessMove(game.board, ui.soloChessFrom, index, "w");
      const color = (chessRow(index) + chessCol(index)) % 2 ? "dark" : "light";
      return `<button class="chess-square ${color} ${selected ? "selected-choice" : ""} ${legal ? "legal" : ""}" data-action="solo-chess-square" data-index="${index}" ${!canMove ? "disabled" : ""}>${piece ? CHESS_GLYPHS[piece] : ""}</button>`;
    }).join("");
    const status = game.phase === "complete" ? "Board archive" : game.turn === "w" ? "Your command: select a White piece, then a legal destination." : "The Borg tactical routine is considering its response…";
    return renderSoloShell(`<div class="center"><div class="brand">Rapid chess board</div><p class="hint">${status}</p><div class="chess-board">${squares}</div></div><p class="helper">${escapeHtml(game.lastResult)}</p>${soloComplete(game)}`);
  }

  function soloFleetGrid(board, shots, enemy, interactive) {
    return board.map((vessel, index) => {
      const shot = shots[index];
      const classes = ["fleet-cell"];
      if (!enemy && vessel) classes.push("vessel");
      if (shot) classes.push(shot);
      return `<button class="${classes.join(" ")}" data-action="solo-fleet-cell" data-index="${index}" ${!interactive ? "disabled" : ""}>${shot === "hit" ? "✦" : shot === "miss" ? "·" : !enemy && vessel ? "◆" : ""}</button>`;
    }).join("");
  }

  function renderSoloFleet() {
    const game = solo.game;
    if (game.phase === "placement") {
      const remaining = FLEET_SHIPS.filter((ship, index) => !game.ownFleet.some((placed) => placed.index === index));
      if (remaining.length && !remaining.some((ship) => FLEET_SHIPS.indexOf(ship) === ui.soloFleetShip)) ui.soloFleetShip = FLEET_SHIPS.indexOf(remaining[0]);
      const ships = FLEET_SHIPS.map((ship, index) => {
        const placed = game.ownFleet.some((item) => item.index === index);
        return `<button class="${ui.soloFleetShip === index ? "action" : "secondary"}" data-action="solo-fleet-select" data-ship="${index}" ${placed ? "disabled" : ""}>${escapeHtml(ship.label)} • ${ship.size}</button>`;
      }).join("");
      return renderSoloShell(`<div class="center"><div class="brand">Private fleet deployment</div><p class="hint">Select a vessel, choose an orientation, then select its starting cell.</p><div class="host-tools" style="justify-content:center">${ships}<button class="secondary" data-action="solo-fleet-orientation">${ui.soloFleetHorizontal ? "Horizontal" : "Vertical"}</button></div><div class="fleet-board">${soloFleetGrid(game.ownBoard, game.computerShots, false, true)}</div></div><p class="helper">${escapeHtml(game.lastResult)}</p>`);
    }
    const canFire = game.phase === "playing" && game.turn === "player";
    const enemy = soloFleetGrid(game.computerBoard, game.ownShots, true, canFire);
    const own = soloFleetGrid(game.ownBoard, game.computerShots, false, false);
    return renderSoloShell(`<div class="fleet-layout"><section><div class="brand">Enemy sector</div><div class="fleet-board">${enemy}</div></section><section><div class="brand">Your sector</div><div class="fleet-board">${own}</div></section></div><p class="helper center">${escapeHtml(game.lastResult)}</p>${soloComplete(game)}`);
  }

  function renderSolo() {
    const game = solo.game;
    const header = '<header class="topbar"><div><div class="brand">Unimatrix Social Deck</div><h1>Solo Deck</h1></div><div class="connection"><span class="status">● local simulation</span><br><span>no room code required</span></div></header>';
    const body = game.type === "blocks" ? renderSoloBlocks()
      : game.type === "breaker" ? renderSoloBreaker()
      : game.type === "tiles" ? renderSoloTiles()
      : game.type === "chess" ? renderSoloChess()
      : renderSoloFleet();
    return header + body;
  }

  function renderLanding() {
    const queryRoom = new URLSearchParams(window.location.search).get("room") || "";
    const cards = Object.entries(META).map(([key, meta]) => `
      <article class="game-card"><strong>${escapeHtml(meta.name)}</strong><p>${escapeHtml(meta.summary)}</p><span class="pill">${escapeHtml(meta.players)}</span></article>
    `).join("");
    const soloCards = Object.entries(SOLO_META).map(([key, meta]) => `
      <button class="solo-card" data-action="solo-start" data-game="${key}"><strong>${escapeHtml(meta.label)}</strong><p>${escapeHtml(meta.summary)}</p><span class="pill">${escapeHtml(meta.players)}</span><small>Saved record: ${escapeHtml(soloRecordLabel(key))}</small></button>
    `).join("");
    return `
      <section class="hero">
        <div class="brand">Borg themed Discord game room</div>
        <h1>UNIMATRIX<br><span class="accent">SOCIAL DECK</span></h1>
        <p>Ten multiplayer simulations for a collective that is never in the same room. One drone hosts; everyone joins the same link from their own device.</p>
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
        <div class="section-heading solo-heading"><h2>Solo Deck</h2><span>Play immediately on this device</span></div>
        <div class="solo-grid">${soloCards}</div>
        <p class="helper">Solo records are stored in this browser. Chess and Fleet Engagement include a local Borg computer opponent.</p>
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
    if (game.type === "blocks") return game.active.map((id) => `<span class="score">${escapeHtml(nameOf(id))}: ${game.scores[id]} pts / ${game.lines[id]} lines</span>`).join("");
    if (game.type === "breaker") return game.active.map((id) => `<span class="score">${escapeHtml(nameOf(id))}: ${game.scores[id]} broken</span>`).join("");
    if (game.type === "tiles") return `<span class="score">Turn: ${escapeHtml(nameOf(game.active[game.turn]))}</span>` + game.active.map((id) => `<span class="score">${escapeHtml(nameOf(id))}: ${game.scores[id]} pairs</span>`).join("");
    if (game.type === "chess") return `<span class="score">${game.turn === "w" ? "White" : "Black"} to move</span>`;
    if (game.type === "fleet") return game.phase === "placement" ? `<span class="score">Private deployment</span>` : `<span class="score">Turn: ${escapeHtml(nameOf(game.active[game.turn]))}</span>`;
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

  function renderBlocks() {
    const game = currentGame();
    const boardId = isActive() ? session.meId : game.active[0];
    const activePiece = game.pieces[boardId];
    const activeIndexes = new Set(activePiece ? blockIndexes(activePiece) : []);
    const grid = game.boards[boardId].map((cell, index) => `<span class="block-cell ${cell ? "locked" : ""} ${activeIndexes.has(index) ? "falling" : ""}"></span>`).join("");
    const canControl = game.phase === "playing" && boardId === session.meId && !game.finished[boardId];
    const controls = canControl ? `<div class="host-tools block-controls"><button class="secondary" data-action="block-move" data-dx="-1">◀ Move</button><button class="secondary" data-action="block-rotate">↻ Rotate</button><button class="secondary" data-action="block-move" data-dx="1">Move ▶</button><button class="action" data-action="block-drop">Hard drop</button></div>` : "";
    const status = game.finished[boardId] ? "Your matrix is complete." : `Block ${game.drops[boardId] + 1} of 12 • ${game.lines[boardId]}/5 lines`;
    return renderGameShell(`<div class="center"><div class="brand">${escapeHtml(nameOf(boardId))}'s construction matrix</div><p class="hint">${status}</p><div class="block-board">${grid}</div>${controls}</div><p class="helper">${escapeHtml(game.lastResult)}</p>${game.phase === "complete" ? completeBlock(game) : ""}`);
  }

  function renderBreaker() {
    const game = currentGame();
    const boardId = isActive() ? session.meId : game.active[0];
    const canFire = game.phase === "playing" && game.active[game.turn] === session.meId;
    const wall = game.walls[boardId].map((brick, index) => `<span class="brick ${brick ? "intact" : "broken"} ${boardId === session.meId && game.lastPath.includes(index) ? "path" : ""}"></span>`).join("");
    const lanes = Array.from({ length: 6 }, (_, lane) => `<button class="glyph" data-action="breaker-fire" data-lane="${lane}" ${!canFire ? "disabled" : ""}>${lane + 1}</button>`).join("");
    return renderGameShell(`<div class="center"><div class="brand">${escapeHtml(nameOf(boardId))}'s shield wall</div><p class="hint">${game.shots[boardId]}/12 launches • ${game.active[game.turn] === session.meId ? "Choose a launch lane." : `${escapeHtml(nameOf(game.active[game.turn]))} is aiming.`}</p><div class="breaker-board">${wall}</div><div class="glyphs launch-lanes">${lanes}</div></div><p class="helper">${escapeHtml(game.lastResult)}</p>${game.phase === "complete" ? completeBlock(game) : ""}`);
  }

  function renderTiles() {
    const game = currentGame();
    const myTurn = game.phase === "playing" && game.active[game.turn] === session.meId;
    const tiles = game.wall.map((tile, index) => {
      const open = tileAvailable(game.wall, index);
      const selected = game.selected.includes(index);
      return `<button class="tile ${tile ? "" : "cleared"} ${open ? "exposed" : ""} ${selected ? "selected-choice" : ""}" data-action="tile-pick" data-index="${index}" ${!tile || !open || !myTurn ? "disabled" : ""}>${tile || ""}</button>`;
    }).join("");
    return renderGameShell(`<div class="center"><div class="brand">Shared tile wall</div><p class="hint">${myTurn ? "Choose two exposed matching tiles." : `${escapeHtml(nameOf(game.active[game.turn]))} is selecting tiles.`}</p><div class="tile-wall">${tiles}</div></div><p class="helper">${escapeHtml(game.lastResult)}</p>${game.phase === "complete" ? completeBlock(game) : ""}`);
  }

  function renderChess() {
    const game = currentGame();
    const side = game.colors[session.meId];
    const canMove = game.phase === "playing" && side === game.turn;
    if (!canMove) ui.chessFrom = null;
    const squares = game.board.map((piece, index) => {
      const selected = ui.chessFrom === index;
      const legal = ui.chessFrom !== null && canMove && legalChessMove(game.board, ui.chessFrom, index, side);
      const color = (chessRow(index) + chessCol(index)) % 2 ? "dark" : "light";
      return `<button class="chess-square ${color} ${selected ? "selected-choice" : ""} ${legal ? "legal" : ""}" data-action="chess-square" data-index="${index}" ${!canMove ? "disabled" : ""}>${piece ? CHESS_GLYPHS[piece] : ""}</button>`;
    }).join("");
    const command = side ? `${side === "w" ? "White" : "Black"} command: ${canMove ? "select a piece, then a destination." : "await the opposing command."}` : "You are observing this rapid chess match.";
    return renderGameShell(`<div class="center"><div class="brand">Rapid chess board</div><p class="hint">${command}</p><div class="chess-board">${squares}</div></div><p class="helper">${escapeHtml(game.lastResult)}</p>${game.phase === "complete" ? completeBlock(game) : ""}`);
  }

  function fleetGrid(game, boardId, enemy, interactive) {
    return game.boards[boardId].map((vessel, index) => {
      const shot = game.shots[boardId][index];
      const classes = ["fleet-cell"];
      if (!enemy && vessel) classes.push("vessel");
      if (shot) classes.push(shot);
      return `<button class="${classes.join(" ")}" data-action="fleet-cell" data-index="${index}" ${!interactive ? "disabled" : ""}>${shot === "hit" ? "✦" : shot === "miss" ? "·" : !enemy && vessel ? "◆" : ""}</button>`;
    }).join("");
  }

  function renderFleet() {
    const game = currentGame();
    const me = session.meId;
    const ownId = isActive() ? me : game.active[0];
    if (game.phase === "placement") {
      const remaining = FLEET_SHIPS.filter((ship, index) => !game.fleets[ownId].some((placed) => placed.index === index));
      if (remaining.length && !remaining.some((ship) => FLEET_SHIPS.indexOf(ship) === ui.fleetShip)) ui.fleetShip = FLEET_SHIPS.indexOf(remaining[0]);
      const canPlace = ownId === me && remaining.length > 0;
      const ships = FLEET_SHIPS.map((ship, index) => {
        const placed = game.fleets[ownId].some((item) => item.index === index);
        return `<button class="${ui.fleetShip === index ? "action" : "secondary"}" data-action="fleet-select-ship" data-ship="${index}" ${placed || !canPlace ? "disabled" : ""}>${escapeHtml(ship.label)} • ${ship.size}</button>`;
      }).join("");
      const grid = fleetGrid(game, ownId, false, canPlace);
      return renderGameShell(`<div class="center"><div class="brand">Private fleet deployment</div><p class="hint">${canPlace ? "Select a vessel, choose its orientation, then select its starting cell." : `${escapeHtml(nameOf(ownId))}'s fleet is ready. Waiting for the opposing commander.`}</p><div class="host-tools" style="justify-content:center">${ships}<button class="secondary" data-action="fleet-orientation" ${!canPlace ? "disabled" : ""}>${ui.fleetHorizontal ? "Horizontal" : "Vertical"}</button></div><div class="fleet-board">${grid}</div></div><p class="helper">${escapeHtml(game.lastResult)}</p>`);
    }
    const target = game.active.find((id) => id !== ownId);
    const myTurn = game.phase === "playing" && ownId === me && game.active[game.turn] === me;
    const enemyBoard = fleetGrid(game, target, true, myTurn);
    const ownBoard = fleetGrid(game, ownId, false, false);
    const body = `<div class="fleet-layout"><section><div class="brand">Enemy sector</div><div class="fleet-board">${enemyBoard}</div></section><section><div class="brand">Your sector</div><div class="fleet-board">${ownBoard}</div></section></div><p class="helper center">${escapeHtml(game.lastResult)}</p>${game.phase === "complete" ? completeBlock(game) : ""}`;
    return renderGameShell(body);
  }

  function render() {
    if (solo.game) {
      app.innerHTML = renderSolo();
      return;
    }
    if (!session.state) {
      app.innerHTML = renderLanding();
      return;
    }
    const header = `<header class="topbar"><div><div class="brand">Unimatrix Social Deck</div><h1>${session.state.phase === "lobby" ? "Collective Lobby" : "Simulation In Progress"}</h1></div><div class="connection"><span class="status">${session.connected ? "● linked" : "◌ connecting"}</span><br><span class="room-code">${escapeHtml(session.room || "")}</span></div></header>`;
    let body = renderLobby();
    if (session.state.phase === "game") {
      const type = currentGame()?.type;
      body = type === "accord" ? renderAccord()
        : type === "duel" ? renderDuel()
        : type === "conquest" ? renderConquest()
        : type === "matrix" ? renderMatrix()
        : type === "intercept" ? renderIntercept()
        : type === "blocks" ? renderBlocks()
        : type === "breaker" ? renderBreaker()
        : type === "tiles" ? renderTiles()
        : type === "chess" ? renderChess()
        : renderFleet();
    }
    app.innerHTML = header + body;
  }

  function getInput(id) { return document.querySelector(id)?.value || ""; }

  app.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === "solo-start") { startSolo(button.dataset.game); return; }
    if (action === "solo-lobby") { leaveSolo(); return; }
    if (action === "solo-restart") { startSolo(solo.game?.type); return; }
    if (action === "solo-block-move") { soloBlockMove(Number(button.dataset.dx)); return; }
    if (action === "solo-block-rotate") { soloBlockRotate(); return; }
    if (action === "solo-block-drop") { soloBlockDrop(); return; }
    if (action === "solo-breaker-fire") { soloBreakerFire(Number(button.dataset.lane)); return; }
    if (action === "solo-tile-pick") { soloTilePick(Number(button.dataset.index)); return; }
    if (action === "solo-tile-recalibrate") { recalibrateSoloTiles(); return; }
    if (action === "solo-chess-square") {
      const game = solo.game; const index = Number(button.dataset.index);
      if (!game || game.turn !== "w") return;
      if (ui.soloChessFrom === null) {
        if (chessSide(game.board[index]) === "w") { ui.soloChessFrom = index; render(); }
      } else if (chessSide(game.board[index]) === "w") {
        ui.soloChessFrom = index; render();
      } else {
        soloChessMove(ui.soloChessFrom, index);
      }
      return;
    }
    if (action === "solo-fleet-select") { ui.soloFleetShip = Number(button.dataset.ship); render(); return; }
    if (action === "solo-fleet-orientation") { ui.soloFleetHorizontal = !ui.soloFleetHorizontal; render(); return; }
    if (action === "solo-fleet-cell") {
      const game = solo.game; const index = Number(button.dataset.index);
      if (game?.phase === "placement") soloFleetPlace(index);
      else soloFleetFire(index);
      return;
    }
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
    if (action === "block-move") { sendAction({ type: "blockMove", dx: Number(button.dataset.dx) }); return; }
    if (action === "block-rotate") { sendAction({ type: "blockRotate" }); return; }
    if (action === "block-drop") { sendAction({ type: "blockDrop" }); return; }
    if (action === "breaker-fire") { sendAction({ type: "breakerFire", lane: Number(button.dataset.lane) }); return; }
    if (action === "tile-pick") { sendAction({ type: "tilePick", index: Number(button.dataset.index) }); return; }
    if (action === "chess-square") {
      const game = currentGame(); const index = Number(button.dataset.index); const side = game.colors[session.meId];
      if (ui.chessFrom === null) {
        if (chessSide(game.board[index]) === side) { ui.chessFrom = index; render(); }
      } else if (chessSide(game.board[index]) === side) {
        ui.chessFrom = index; render();
      } else {
        const from = ui.chessFrom; ui.chessFrom = null; sendAction({ type: "chessMove", from, to: index }); render();
      }
      return;
    }
    if (action === "fleet-select-ship") { ui.fleetShip = Number(button.dataset.ship); render(); return; }
    if (action === "fleet-orientation") { ui.fleetHorizontal = !ui.fleetHorizontal; render(); return; }
    if (action === "fleet-cell") {
      const game = currentGame(); const index = Number(button.dataset.index);
      if (game.phase === "placement") sendAction({ type: "fleetPlace", ship: ui.fleetShip, index, horizontal: ui.fleetHorizontal });
      else sendAction({ type: "fleetFire", index });
      return;
    }
  });

  render();
})();
