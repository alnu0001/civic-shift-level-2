/* Civic Shift — Level 01 static browser proof of concept.
   No network calls, analytics, accounts, or third-party libraries. */
(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const healthNumber = document.getElementById("healthNumber");
  const healthFill = document.getElementById("healthFill");
  const clock = document.getElementById("clock");
  const missionText = document.getElementById("missionText");
  const missionHint = document.getElementById("missionHint");
  const incidentFeed = document.getElementById("incidentFeed");
  const activeRoleName = document.getElementById("activeRoleName");
  const primaryAction = document.getElementById("primaryAction");
  const toolHelp = document.getElementById("toolHelp");
  const toast = document.getElementById("toast");
  const startOverlay = document.getElementById("startOverlay");
  const resultOverlay = document.getElementById("resultOverlay");
  const startButton = document.getElementById("startButton");
  const retryButton = document.getElementById("retryButton");
  const menuButton = document.getElementById("menuButton");
  const soundToggle = document.getElementById("soundToggle");
  const resultEyebrow = document.getElementById("resultEyebrow");
  const resultTitle = document.getElementById("resultTitle");
  const resultSummary = document.getElementById("resultSummary");
  const resultHealth = document.getElementById("resultHealth");
  const resultAmbulance = document.getElementById("resultAmbulance");
  const resultScore = document.getElementById("resultScore");

  const W = 1440;
  const H = 900;
  const TOTAL_SHIFT_SECONDS = 480;
  const MODES = {
    quick: { duration: 210, label: "Quick test" },
    full: { duration: 480, label: "Full shift" },
  };

  const COLORS = {
    blue: "#4a93ff",
    teal: "#35c9a5",
    amber: "#f6b73c",
    coral: "#ef5d63",
    violet: "#9166e8",
    cream: "#fff0d8",
    ink: "#10233d",
  };

  const ROLES = {
    dispatcher: {
      title: "DISPATCHER",
      color: COLORS.blue,
      action: "Authorize hospital priority",
      help: "When the ambulance is inbound, activate a 15-second protected route through the square.",
    },
    signal: {
      title: "SIGNAL OPERATOR",
      color: COLORS.teal,
      action: "Cycle central lights",
      help: "Click a glowing intersection to choose an east–west or north–south green phase.",
    },
    route: {
      title: "ROUTE PLANNER",
      color: COLORS.amber,
      action: "Open Bluebird Alley",
      help: "Click the amber alley marker to divert non-emergency traffic around Civic Square.",
    },
    field: {
      title: "FIELD CREW",
      color: COLORS.coral,
      action: "Repair the stalled bus",
      help: "Click a stopped bus or delivery van, then keep the field crew working until the repair completes.",
    },
  };

  let selectedMode = "quick";
  let state = null;
  let audioContext = null;
  let muted = false;
  let lastFrame = performance.now();
  let toastTimer = 0;

  function newState(mode) {
    const config = MODES[mode];
    return {
      mode: "idle",
      selectedMode: mode,
      elapsed: 0,
      briefingElapsed: 0,
      realDuration: config.duration,
      health: 80,
      score: 0,
      role: "dispatcher",
      mission: "Prepare the first shift.",
      hint: "Choose a role, then begin when ready.",
      feed: [],
      particles: [],
      rainDrops: [],
      vehicles: [],
      spawnTimer: 0.8,
      trafficStress: 0,
      busStalled: true,
      busRepairing: false,
      vanStalled: false,
      vanRepairing: false,
      alleyOpen: false,
      rain: false,
      lensLock: false,
      reroutePressure: false,
      priorityUntil: 0,
      ambulance: null,
      ambulanceExit: false,
      ambulanceWait: 0,
      timeline: {
        lock: false,
        pressure: false,
        ambulance: false,
        rain: false,
        van: false,
        reroute: false,
        finalCall: false,
      },
      intersections: {
        i01: "EW",
        i02: "EW",
        i03: "PED",
        i04: "EW",
        i05: "NS",
      },
      task: null,
      pips: {
        dispatcher: { x: 577, y: 606, pulse: 0 },
        signal: { x: 627, y: 628, pulse: 0.8 },
        route: { x: 809, y: 608, pulse: 1.4 },
        field: { x: 860, y: 635, targetX: 860, targetY: 635, pulse: 2.1 },
      },
    };
  }

  function initRain() {
    state.rainDrops = Array.from({ length: 95 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      l: 7 + Math.random() * 13,
      speed: 520 + Math.random() * 240,
      alpha: 0.13 + Math.random() * 0.18,
    }));
  }

  function reset(mode = selectedMode) {
    selectedMode = mode;
    state = newState(mode);
    initRain();
    addInitialTraffic();
    updateUI();
    draw();
  }

  function addInitialTraffic() {
    const starting = [
      ["car", "west", 80], ["car", "west", 380], ["van", "east", 190], ["car", "east", 520],
      ["car", "south", 160], ["car", "north", 385], ["car", "south", 560], ["bike", "east", 720],
    ];
    starting.forEach(([kind, direction, offset]) => {
      const vehicle = createVehicle(kind, direction);
      moveVehicleBy(vehicle, offset);
      state.vehicles.push(vehicle);
    });
  }

  function createVehicle(kind, direction) {
    const paths = {
      west: [[-120, 487], [1560, 487]],
      east: [[1560, 437], [-120, 437]],
      south: [[678, 1000], [678, -120]],
      north: [[758, -120], [758, 1000]],
    };
    const styles = {
      car: { color: ["#57a5ea", "#f08a67", "#f4ca57", "#806fe0", "#62c69f"][Math.floor(Math.random() * 5)], speed: 66 + Math.random() * 19, w: 31, h: 17 },
      van: { color: "#e6f0ff", speed: 50, w: 42, h: 21 },
      bike: { color: "#ffcf66", speed: 82, w: 16, h: 9 },
    };
    const style = styles[kind];
    return {
      kind, direction, path: paths[direction], seg: 0, t: 0,
      x: paths[direction][0][0], y: paths[direction][0][1],
      speed: style.speed, baseSpeed: style.speed, color: style.color, w: style.w, h: style.h,
      stopped: false, wait: 0, alpha: 1,
    };
  }

  function moveVehicleBy(v, distance) {
    v.t = Math.min(0.96, distance / 1680);
    const p0 = v.path[0]; const p1 = v.path[1];
    v.x = p0[0] + (p1[0] - p0[0]) * v.t;
    v.y = p0[1] + (p1[1] - p0[1]) * v.t;
  }

  function startShift() {
    reset(selectedMode);
    startOverlay.classList.add("is-hidden");
    resultOverlay.classList.add("is-hidden");
    state.mode = "briefing";
    setMission("LENS is checking the square…", "Watch the briefing. Your first live action is the stalled school bus.");
    addFeed("LENS: Morning traffic operating within expected parameters.");
    toastMessage("LENS is online. This will be fine.", "");
    ensureAudio();
    beep(312, 0.12, "sine", 0.035);
  }

  function returnToBriefing() {
    state.mode = "idle";
    startOverlay.classList.remove("is-hidden");
    resultOverlay.classList.add("is-hidden");
    reset(selectedMode);
  }

  function update(dt) {
    if (!state) return;
    for (const pip of Object.values(state.pips)) pip.pulse += dt;
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) toast.classList.remove("is-visible");
    }

    if (state.mode === "briefing") {
      state.briefingElapsed += dt;
      if (state.briefingElapsed > 2.8 && state.briefingElapsed < 2.8 + dt) {
        addFeed("LENS: Festival priority detected. Celebration likelihood: 0.3%.", "is-critical");
        toastMessage("LENS has marked a school bus as a parade.", "critical");
      }
      if (state.briefingElapsed >= 6.4) {
        state.mode = "playing";
        setMission("Restore flow — clear the school bus blockage.", "Field repairs the bus; Route can open Bluebird Alley. Then prepare the hospital route.");
        addFeed("Mara: First live shift. Keep the hospital lane open.");
        toastMessage("SHIFT LIVE — The bus is blocking the school turn.", "good");
        beep(612, 0.13, "triangle", 0.07);
      }
      updateTraffic(dt * 0.55);
      return;
    }

    if (state.mode !== "playing") return;
    state.elapsed += dt;
    processTimeline();
    updateTask(dt);
    updateTraffic(dt);
    updateAmbulance(dt);
    updateRain(dt);
    updateHealth(dt);

    if (state.health <= 0) endShift(false, "Civic Square became a standing parade.");
    if (state.elapsed >= state.realDuration) {
      const success = state.ambulanceExit && state.health >= 55;
      endShift(success, success ? "The shift ended with Northgate Hospital still reachable." : "The clock ended before the square was stable.");
    }
    updateUI();
  }

  function processTimeline() {
    const p = state.elapsed / state.realDuration;
    if (p >= 0.10 && !state.timeline.lock) {
      state.timeline.lock = true;
      state.lensLock = true;
      state.intersections.i03 = "PED";
      addFeed("LENS: Northgate crossing locked to pedestrian phase.", "is-critical");
      toastMessage("LENS LOCK — Northgate ignores hospital traffic.", "critical");
      setMission("Stabilize the square. LENS has locked Northgate.", "Dispatcher authorizes priority; Signal must set the hospital crossing north–south.");
      beep(165, 0.25, "sawtooth", 0.07);
    }
    if (p >= 0.17 && !state.timeline.pressure) {
      state.timeline.pressure = true;
      state.trafficStress += 0.22;
      addFeed("East Service Road: delivery traffic entering Civic Square.");
    }
    if (p >= 0.25 && !state.timeline.ambulance) {
      state.timeline.ambulance = true;
      spawnAmbulance();
      addFeed("Mara: Ambulance inbound from the west. Nothing gets in its lane.", "is-critical");
      toastMessage("AMBULANCE INBOUND — Clear West → Northgate.", "critical");
      setMission("Escort the ambulance to Northgate Hospital.", "Repair the bus, give it an east–west green, authorize priority, then clear the north route.");
      beep(760, 0.11, "square", 0.06); setTimeout(() => beep(930, 0.11, "square", 0.06), 160);
    }
    if (p >= 0.42 && !state.timeline.rain) {
      state.timeline.rain = true;
      state.rain = true;
      state.trafficStress += 0.13;
      addFeed("Weather: light rain reduces braking space.");
      toastMessage("RAIN STARTING — Cars need more room to stop.", "");
    }
    if (p >= 0.52 && !state.timeline.van) {
      state.timeline.van = true;
      state.vanStalled = true;
      state.trafficStress += 0.2;
      addFeed("Crane Street: delivery van stalled in service lane.", "is-critical");
      toastMessage("FIELD TASK — A van has blocked the service road.", "critical");
    }
    if (p >= 0.73 && !state.timeline.reroute) {
      state.timeline.reroute = true;
      state.reroutePressure = true;
      state.trafficStress += 0.25;
      addFeed("LENS: Rerouting bus convoy toward priority lane.", "is-critical");
      toastMessage("LENS REROUTE — Keep the hospital lane protected.", "critical");
    }
    if (p >= 0.90 && !state.timeline.finalCall) {
      state.timeline.finalCall = true;
      addFeed("Mara: Final minute. Save what you can.");
    }
  }

  function updateTraffic(dt) {
    state.spawnTimer -= dt;
    const spawnRate = state.reroutePressure ? 0.72 : state.rain ? 1.1 : 1.55;
    if (state.mode === "playing" && state.spawnTimer <= 0 && state.vehicles.length < 42) {
      state.spawnTimer = spawnRate;
      const directions = ["west", "east", "south", "north"];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const typeRoll = Math.random();
      state.vehicles.push(createVehicle(typeRoll > 0.87 ? "van" : typeRoll > 0.76 ? "bike" : "car", direction));
    }
    for (const v of state.vehicles) {
      const allowed = trafficAllowed(v);
      v.stopped = !allowed;
      if (!allowed) v.wait += dt;
      else v.wait = Math.max(0, v.wait - dt * 0.8);
      const speed = allowed ? v.baseSpeed * (state.rain ? 0.84 : 1) : 0;
      const pathLength = Math.hypot(v.path[1][0] - v.path[0][0], v.path[1][1] - v.path[0][1]);
      v.t += (speed * dt) / pathLength;
      if (v.t > 1.04) v.t = -0.04;
      const p0 = v.path[0]; const p1 = v.path[1];
      v.x = p0[0] + (p1[0] - p0[0]) * v.t;
      v.y = p0[1] + (p1[1] - p0[1]) * v.t;
    }
    state.vehicles = state.vehicles.filter((v) => v.t > -0.12 && v.t < 1.12);
  }

  function trafficAllowed(v) {
    const x = v.x; const y = v.y;
    const phase = state.intersections;
    const horizontal = v.direction === "west" || v.direction === "east";
    const vertical = !horizontal;
    if (state.busStalled && v.direction === "west" && x > 175 && x < 385) return state.alleyOpen && v.kind !== "van";
    if (state.vanStalled && v.direction === "east" && x < 1190 && x > 1010) return false;
    if (horizontal && x > 605 && x < 830 && phase.i01 !== "EW") return false;
    if (vertical && y > 360 && y < 590 && phase.i01 !== "NS") return false;
    if (v.direction === "south" && y < 310 && y > 175 && phase.i03 !== "NS") return false;
    if (v.direction === "north" && y > 610 && y < 750 && phase.i05 !== "NS") return false;
    if (v.direction === "east" && x < 360 && x > 235 && phase.i02 !== "EW") return false;
    if (v.direction === "west" && x < 1200 && x > 1080 && phase.i04 !== "EW") return false;
    return true;
  }

  function spawnAmbulance() {
    state.ambulance = {
      x: -85, y: 487, seg: 0, speed: 98, stopped: false, wait: 0, done: false,
      path: [[-85, 487], [590, 487], [698, 487], [698, 142], [698, -95]],
    };
  }

  function updateAmbulance(dt) {
    const a = state.ambulance;
    if (!a || a.done) return;
    const canMove = ambulanceAllowed(a);
    a.stopped = !canMove;
    if (!canMove) {
      a.wait += dt;
      state.ambulanceWait += dt;
      if (Math.floor(a.wait) === 7 && a.wait - dt < 7) {
        addFeed("Ambulance delayed — find the blockage.", "is-critical");
        toastMessage("AMBULANCE WAITING — check bus, lights, and Northgate priority.", "critical");
      }
      return;
    }
    a.wait = Math.max(0, a.wait - dt * 1.2);
    const target = a.path[a.seg + 1];
    const dx = target[0] - a.x; const dy = target[1] - a.y;
    const distance = Math.hypot(dx, dy);
    const step = a.speed * dt;
    if (distance <= step) {
      a.x = target[0]; a.y = target[1]; a.seg += 1;
      if (a.seg >= a.path.length - 1) {
        a.done = true;
        state.ambulanceExit = true;
        state.health = Math.min(100, state.health + 10);
        state.score += 400;
        addFeed("Northgate Hospital: ambulance received. Route clear.", "is-good");
        toastMessage("AMBULANCE CLEAR — Northgate Hospital reached.", "good");
        beep(1047, 0.18, "triangle", 0.08);
        setTimeout(() => beep(1318, 0.2, "triangle", 0.07), 140);
        setMission("Hospital route secure. Finish the shift cleanly.", "Keep traffic flowing until the report is filed.");
      }
      return;
    }
    a.x += (dx / distance) * step;
    a.y += (dy / distance) * step;
  }

  function ambulanceAllowed(a) {
    const hasPriority = state.priorityUntil > state.elapsed;
    if (a.seg === 0 && a.x > 175 && state.busStalled) return false;
    if (a.seg === 1 && state.intersections.i01 !== "EW" && !hasPriority) return false;
    if (a.seg === 2 && (state.intersections.i03 !== "NS" || !hasPriority)) return false;
    return true;
  }

  function updateRain(dt) {
    if (!state.rain) return;
    state.rainDrops.forEach((drop) => {
      drop.x -= drop.speed * dt * 0.15;
      drop.y += drop.speed * dt;
      if (drop.y > H + 25 || drop.x < -25) { drop.x = Math.random() * W + 100; drop.y = -20; }
    });
  }

  function updateHealth(dt) {
    const stopped = state.vehicles.filter((v) => v.stopped).length;
    const blocked = (state.busStalled ? 0.16 : 0) + (state.vanStalled ? 0.09 : 0) + (state.reroutePressure ? 0.075 : 0);
    const ambulancePenalty = state.ambulance && state.ambulance.stopped ? 0.25 : 0;
    const routeRelief = state.alleyOpen ? 0.06 : 0;
    const drain = Math.max(0.01, 0.025 + stopped * 0.006 + state.trafficStress * 0.055 + blocked + ambulancePenalty - routeRelief);
    state.health = Math.max(0, state.health - drain * dt);
    if (!state.busStalled && !state.vanStalled && stopped < 5 && !state.ambulance?.stopped) {
      state.health = Math.min(100, state.health + 0.035 * dt);
      state.score += Math.round(2 * dt);
    }
  }

  function updateTask(dt) {
    if (!state.task) return;
    state.task.remaining -= dt;
    const field = state.pips.field;
    const dx = field.targetX - field.x; const dy = field.targetY - field.y;
    const d = Math.hypot(dx, dy);
    if (d > 1) { field.x += (dx / d) * Math.min(d, 150 * dt); field.y += (dy / d) * Math.min(d, 150 * dt); }
    if (state.task.remaining > 0) return;
    const task = state.task;
    state.task = null;
    field.targetX = 860; field.targetY = 635;
    if (task.type === "bus") {
      state.busStalled = false;
      state.busRepairing = false;
      state.health = Math.min(100, state.health + 6);
      state.score += 100;
      addFeed("Field: school bus restarted. West turn is open.", "is-good");
      toastMessage("BUS REPAIRED — Westbound flow restored.", "good");
      beep(690, 0.14, "triangle", 0.06);
      if (!state.timeline.ambulance) setMission("Stabilize the square. LENS has locked Northgate.", "Prepare the ambulance path: change lights and authorize hospital priority.");
    } else if (task.type === "van") {
      state.vanStalled = false;
      state.vanRepairing = false;
      state.health = Math.min(100, state.health + 4);
      state.score += 80;
      addFeed("Field: service van moved into the pull-off bay.", "is-good");
      toastMessage("SERVICE ROAD CLEAR — delivery lane restored.", "good");
      beep(720, 0.12, "triangle", 0.055);
    }
  }

  function usePrimaryAction() {
    if (state.mode !== "playing") return toastMessage("Begin the shift before issuing an order.", "");
    const role = state.role;
    if (role === "dispatcher") authorizePriority();
    if (role === "signal") cycleCentralSignal();
    if (role === "route") openAlley();
    if (role === "field") startFieldTask(state.busStalled ? "bus" : state.vanStalled ? "van" : null);
  }

  function authorizePriority() {
    if (!state.ambulance || state.ambulance.done) return toastMessage("No active ambulance. Save the authorization for the hospital route.", "");
    if (state.priorityUntil > state.elapsed + 3) return toastMessage("Hospital priority is already active.", "");
    state.priorityUntil = state.elapsed + 15;
    state.lensLock = false;
    state.score += 45;
    addFeed("Dispatcher: hospital priority authorized for 15 seconds.", "is-good");
    toastMessage("HOSPITAL PRIORITY ACTIVE — Signal Northgate north–south.", "good");
    beep(850, 0.1, "sine", 0.065);
  }

  function cycleCentralSignal() {
    if (state.lensLock && state.intersections.i03 === "PED") {
      toastMessage("Northgate is locked by LENS. Dispatcher must authorize hospital priority first.", "critical");
      return;
    }
    state.intersections.i01 = state.intersections.i01 === "EW" ? "NS" : "EW";
    state.score += 14;
    addFeed(`Signal: Civic Square phase set ${state.intersections.i01 === "EW" ? "east–west" : "north–south"}.`);
    toastMessage(`CIVIC SQUARE — ${state.intersections.i01 === "EW" ? "east–west" : "north–south"} flow is green.`, "");
    beep(560, 0.055, "sine", 0.035);
  }

  function setSignal(id) {
    if (state.role !== "signal") return false;
    if (id === "i03" && state.lensLock && state.priorityUntil <= state.elapsed) {
      toastMessage("LENS owns Northgate until Dispatcher authorizes hospital priority.", "critical");
      return true;
    }
    const next = state.intersections[id] === "PED" ? "NS" : state.intersections[id] === "EW" ? "NS" : "EW";
    state.intersections[id] = next;
    state.score += 12;
    const names = { i01: "Civic Square", i02: "School Crossing", i03: "Northgate", i04: "Crane Street", i05: "Market Crossing" };
    addFeed(`Signal: ${names[id]} set ${next === "EW" ? "east–west" : "north–south"}.`);
    toastMessage(`${names[id]} → ${next === "EW" ? "EAST–WEST" : "NORTH–SOUTH"} GREEN.`, "");
    beep(530, 0.06, "sine", 0.03);
    return true;
  }

  function openAlley() {
    if (state.alleyOpen) return toastMessage("Bluebird Alley is already open.", "");
    state.alleyOpen = true;
    state.score += 70;
    state.health = Math.min(100, state.health + 3);
    addFeed("Route: Bluebird Alley opened. Westbound traffic diverted.", "is-good");
    toastMessage("BLUEBIRD ALLEY OPEN — Westbound queue is draining.", "good");
    beep(620, 0.12, "triangle", 0.05);
  }

  function startFieldTask(type) {
    if (!type) return toastMessage("Field crew has no active roadside repair.", "");
    if (state.task) return toastMessage("Field crew is already working.", "");
    const target = type === "bus" ? { x: 328, y: 546 } : { x: 1070, y: 548 };
    state.task = { type, remaining: type === "bus" ? 2.6 : 2.1 };
    state.pips.field.targetX = target.x;
    state.pips.field.targetY = target.y;
    if (type === "bus") state.busRepairing = true; else state.vanRepairing = true;
    addFeed(`Field: dispatching repair crew to the stalled ${type}.`);
    toastMessage(`FIELD CREW EN ROUTE — repairing ${type}…`, "");
    beep(430, 0.08, "square", 0.035);
  }

  function onCanvasClick(event) {
    if (state.mode !== "playing") return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (W / rect.width);
    const y = (event.clientY - rect.top) * (H / rect.height);
    const intersectionHits = [
      ["i01", 700, 462], ["i02", 300, 462], ["i03", 700, 215], ["i04", 1100, 462], ["i05", 700, 700],
    ];
    if (state.role === "signal") {
      const hit = intersectionHits.find(([, ix, iy]) => Math.hypot(x - ix, y - iy) < 65);
      if (hit) return setSignal(hit[0]);
    }
    if (state.role === "route" && x > 165 && x < 520 && y > 185 && y < 360) return openAlley();
    if (state.role === "field") {
      if (state.busStalled && x > 205 && x < 430 && y > 420 && y < 565) return startFieldTask("bus");
      if (state.vanStalled && x > 970 && x < 1190 && y > 405 && y < 560) return startFieldTask("van");
    }
    if (state.role === "dispatcher" && state.ambulance && (y < 330 || x < 800)) return authorizePriority();
    toastMessage(ROLES[state.role].help, "");
  }

  function setRole(role) {
    if (!ROLES[role]) return;
    state.role = role;
    document.querySelectorAll(".role-card").forEach((button) => button.classList.toggle("is-active", button.dataset.role === role));
    activeRoleName.textContent = ROLES[role].title;
    primaryAction.textContent = ROLES[role].action;
    toolHelp.textContent = ROLES[role].help;
    primaryAction.style.background = `linear-gradient(135deg, #f5fbff, ${ROLES[role].color})`;
    toastMessage(`${ROLES[role].title} SELECTED`, "");
    beep(470, 0.045, "sine", 0.025);
  }

  function setMission(main, hint) {
    state.mission = main; state.hint = hint;
    missionText.textContent = main; missionHint.textContent = hint;
  }

  function addFeed(message, kind = "") {
    state.feed.unshift({ message, kind });
    state.feed.length = Math.min(4, state.feed.length);
    incidentFeed.innerHTML = state.feed.map((entry) => `<li class="${entry.kind}">${escapeHtml(entry.message)}</li>`).join("");
  }

  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function toastMessage(message, kind) {
    toast.textContent = message;
    toast.className = `toast is-visible ${kind ? `is-${kind}` : ""}`;
    toastTimer = 3.1;
  }

  function endShift(success, reason) {
    if (state.mode === "results") return;
    state.mode = "results";
    const health = Math.round(state.health);
    const totalScore = Math.max(0, Math.round(state.score + health * 4 + (state.ambulanceExit ? 300 : 0)));
    resultEyebrow.innerHTML = `<span></span> ${success ? "SHIFT REPORT — SUCCESS" : "SHIFT REPORT — INCOMPLETE"}`;
    resultTitle.textContent = success ? "CIVIC SQUARE SAVED" : "THE SQUARE LOCKED UP";
    resultSummary.textContent = success
      ? "Mara: “Hospital clear. You just kept a city moving.” " + reason
      : "Mara: “Reset the square. Same problem, smarter shift.” " + reason;
    resultHealth.textContent = `${health}/100`;
    resultAmbulance.textContent = state.ambulanceExit ? "CLEAR" : "DELAYED";
    resultScore.textContent = totalScore.toLocaleString();
    resultOverlay.classList.remove("is-hidden");
    if (success) beep(1100, 0.2, "triangle", 0.08); else beep(150, 0.35, "sawtooth", 0.07);
  }

  function updateUI() {
    if (!state) return;
    const health = Math.max(0, Math.round(state.health));
    healthNumber.textContent = health;
    healthFill.style.width = `${health}%`;
    healthFill.style.background = health < 30 ? "linear-gradient(90deg,#ef5d63,#ff9b89)" : health < 55 ? "linear-gradient(90deg,#f6b73c,#ffe28b)" : "linear-gradient(90deg,#35c9a5,#78e0be)";
    const remainingDesignSeconds = Math.max(0, TOTAL_SHIFT_SECONDS - state.elapsed * (TOTAL_SHIFT_SECONDS / state.realDuration));
    const minutes = Math.floor(remainingDesignSeconds / 60);
    const seconds = Math.floor(remainingDesignSeconds % 60);
    clock.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    const priorityActive = state.priorityUntil > state.elapsed;
    if (state.role === "dispatcher") {
      primaryAction.classList.toggle("is-cooling", !state.ambulance || priorityActive);
      primaryAction.textContent = priorityActive ? `Priority active · ${Math.ceil(state.priorityUntil - state.elapsed)}s` : "Authorize hospital priority";
    } else if (state.role === "field") {
      primaryAction.textContent = state.task ? "Field crew working…" : state.busStalled ? "Repair stalled bus" : state.vanStalled ? "Repair service van" : "No field task active";
      primaryAction.classList.toggle("is-cooling", Boolean(state.task) || (!state.busStalled && !state.vanStalled));
    } else if (state.role === "route") {
      primaryAction.textContent = state.alleyOpen ? "Bluebird Alley is open" : "Open Bluebird Alley";
      primaryAction.classList.toggle("is-cooling", state.alleyOpen);
    } else {
      primaryAction.classList.remove("is-cooling");
      primaryAction.textContent = "Cycle central lights";
    }
  }

  // -------- Drawing --------------------------------------------------------
  function draw() {
    if (!state) return;
    ctx.clearRect(0, 0, W, H);
    drawWorld();
    drawRoads();
    drawBuildingLayer();
    drawRoadObjects();
    drawTraffic();
    drawStationaryEvents();
    drawCrew();
    drawWorldLabels();
    if (state.rain) drawRain();
    drawWorldEffects();
  }

  function drawWorld() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#64aeb1"); sky.addColorStop(0.48, "#4f9c99"); sky.addColorStop(1, "#438683");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.08)";
    for (let x = -40; x < W + 60; x += 54) ctx.fillRect(x, 0, 1, H);
    for (let y = -20; y < H + 40; y += 54) ctx.fillRect(0, y, W, 1);
    const bloom = ctx.createRadialGradient(510, 130, 15, 510, 130, 700);
    bloom.addColorStop(0, "rgba(255,241,194,.22)"); bloom.addColorStop(1, "rgba(255,241,194,0)");
    ctx.fillStyle = bloom; ctx.fillRect(0, 0, W, H);
  }

  function drawRoads() {
    ctx.save();
    ctx.fillStyle = "rgba(27,48,67,.32)"; ctx.fillRect(0, 379, W, 230); ctx.fillRect(589, 0, 222, H);
    ctx.fillStyle = "#344456"; ctx.fillRect(0, 390, W, 205); ctx.fillRect(600, 0, 200, H);
    ctx.fillStyle = "#263748"; ctx.fillRect(0, 398, W, 189); ctx.fillRect(608, 0, 184, H);
    // alleys
    ctx.fillStyle = state.alleyOpen ? "#384a5c" : "#2c3d4f";
    polygon([[180,375],[205,340],[518,340],[608,407],[608,438],[505,375]], true);
    ctx.fillStyle = "#2e4053";
    polygon([[806,520],[1120,520],[1200,590],[1165,624],[806,575]], true);
    // sidewalks
    ctx.strokeStyle = "#d7ddd2"; ctx.lineWidth = 14; ctx.setLineDash([]);
    ctx.strokeRect(-8, 386, W + 16, 213); ctx.strokeRect(596, -8, 208, H + 16);
    // road lanes
    ctx.strokeStyle = "rgba(239,248,246,.77)"; ctx.lineWidth = 3; ctx.setLineDash([20, 16]);
    ctx.beginPath(); ctx.moveTo(0, 445); ctx.lineTo(W, 445); ctx.moveTo(0, 535); ctx.lineTo(W, 535); ctx.moveTo(655,0);ctx.lineTo(655,H);ctx.moveTo(748,0);ctx.lineTo(748,H); ctx.stroke();
    ctx.setLineDash([]);
    // bike / emergency lane
    ctx.fillStyle = "rgba(91,184,238,.34)"; ctx.fillRect(0, 563, 601, 17); ctx.fillRect(809, 563, 631, 17);
    ctx.fillStyle = "rgba(244,96,96,.22)"; ctx.fillRect(775, 0, 17, 382);
    // crosswalks
    drawCrosswalk(588, 414, 34, 77, true); drawCrosswalk(795, 414, 34, 77, true);
    drawCrosswalk(620, 377, 75, 31, false); drawCrosswalk(620, 579, 75, 31, false);
    drawCrosswalk(620, 164, 75, 25, false); drawCrosswalk(620, 252, 75, 25, false);
    drawCrosswalk(620, 680, 75, 25, false); drawCrosswalk(620, 745, 75, 25, false);
    ctx.restore();
  }

  function drawCrosswalk(x, y, w, h, vertical) {
    ctx.save(); ctx.fillStyle = "rgba(251,253,245,.78)";
    const n = vertical ? 6 : 6;
    for (let i = 0; i < n; i += 1) {
      if (vertical) ctx.fillRect(x + i * (w / n), y, 3, h);
      else ctx.fillRect(x, y + i * (h / n), w, 3);
    }
    ctx.restore();
  }

  function drawBuildingLayer() {
    drawBuilding(24, 34, 320, 290, "SUNNY SIDE\nBAKERY", "#edb577", "#fae0a7");
    drawBuilding(360, 28, 202, 284, "SCHOOL", "#6bb8af", "#b4e0d6");
    drawBuilding(841, 30, 240, 284, "NORTHGATE\nHOSPITAL", "#9aacd4", "#d6e5fb");
    drawBuilding(1102, 36, 303, 284, "CIVIC\nOFFICES", "#bd9ad6", "#e2d2ed");
    drawBuilding(28, 638, 265, 225, "CITY HALL", "#dfad7f", "#f3d1aa");
    drawBuilding(324, 668, 238, 192, "MARKET", "#e8868b", "#f4b6aa");
    drawBuilding(840, 661, 266, 201, "PARKING", "#6b83a1", "#afc2dc");
    drawBuilding(1133, 649, 270, 210, "CRANE STREET", "#6aabb5", "#b7dfe1");
    // plaza greenery
    drawTree(520, 340, 1.1); drawTree(860, 340, 1.1); drawTree(526, 645, 1.05); drawTree(874, 640, 1.05);
    drawTree(389, 352, .8); drawTree(1070, 635, .9); drawTree(1195, 344, .75); drawTree(225, 636, .75);
  }

  function drawBuilding(x, y, w, h, label, base, roof) {
    ctx.save();
    roundedRect(x + 9, y + 12, w, h, 16); ctx.fillStyle = "rgba(22,45,54,.23)"; ctx.fill();
    roundedRect(x, y, w, h, 16); const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, roof); g.addColorStop(1, base); ctx.fillStyle = g; ctx.fill();
    roundedRect(x + 10, y + 11, w - 20, h - 24, 10); ctx.strokeStyle = "rgba(255,255,255,.42)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "rgba(36,60,78,.48)";
    for (let row = 0; row < 3; row += 1) for (let col = 0; col < Math.max(2, Math.floor(w / 64)); col += 1) {
      roundedRect(x + 22 + col * 54, y + 42 + row * 49, 27, 22, 5); ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = "800 12px ui-sans-serif, system-ui"; ctx.textAlign = "center";
    const lines = label.split("\n"); lines.forEach((line, index) => ctx.fillText(line, x + w / 2, y + h - 19 - (lines.length - 1 - index) * 14));
    ctx.restore();
  }

  function drawTree(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(16,57,56,.22)"; ctx.beginPath(); ctx.ellipse(7, 25, 21, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#69543e"; roundedRect(-3, 4, 11, 28, 4); ctx.fill();
    const tree = ctx.createRadialGradient(-7, -9, 2, 0, 0, 27); tree.addColorStop(0, "#9fe3a8"); tree.addColorStop(1, "#34755e"); ctx.fillStyle = tree;
    ctx.beginPath();ctx.arc(0, -3, 21,0,Math.PI*2);ctx.fill(); ctx.beginPath();ctx.arc(-15,7,14,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(15,8,15,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  function drawRoadObjects() {
    drawFountain(700, 474);
    drawControlVan(702, 620);
    drawSignal(592, 405, "i01", "EW"); drawSignal(808, 405, "i01", "EW");
    drawSignal(592, 588, "i01", "NS"); drawSignal(808, 588, "i01", "NS");
    drawSignal(615, 190, "i03", "NS"); drawSignal(784, 190, "i03", "NS");
    drawSignal(615, 709, "i05", "NS"); drawSignal(784, 709, "i05", "NS");
    drawSignal(218, 405, "i02", "EW"); drawSignal(388, 588, "i02", "EW");
    drawSignal(1015, 405, "i04", "EW"); drawSignal(1188, 588, "i04", "EW");
    drawAlleyMarker(); drawHospitalBeacon(); drawLensTower();
    drawMarketStalls(); drawStreetFurniture();
  }

  function drawFountain(x, y) {
    ctx.save();ctx.translate(x,y);ctx.fillStyle="rgba(16,45,60,.28)";ctx.beginPath();ctx.ellipse(0,11,73,25,0,0,Math.PI*2);ctx.fill();
    const pool=ctx.createRadialGradient(0,-2,5,0,0,53);pool.addColorStop(0,"#e5f9ff");pool.addColorStop(.5,"#73c9e8");pool.addColorStop(1,"#277c9f");ctx.fillStyle=pool;ctx.beginPath();ctx.ellipse(0,0,61,22,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#f2e6ce";ctx.beginPath();ctx.ellipse(0,0,22,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#d0b894";roundedRect(-7,-31,14,34,6);ctx.fill();
    ctx.strokeStyle="rgba(228,252,255,.75)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-5,-30);ctx.quadraticCurveTo(-21,-53,-34,-22);ctx.moveTo(5,-30);ctx.quadraticCurveTo(22,-54,34,-22);ctx.moveTo(0,-35);ctx.quadraticCurveTo(0,-66,0,-27);ctx.stroke();ctx.restore();
  }

  function drawControlVan(x,y) {
    ctx.save();ctx.translate(x,y);ctx.fillStyle="rgba(10,30,52,.3)";ctx.beginPath();ctx.ellipse(0,27,104,21,0,0,Math.PI*2);ctx.fill();
    roundedRect(-72,-12,144,54,13);const g=ctx.createLinearGradient(0,-12,0,42);g.addColorStop(0,"#e8f4ff");g.addColorStop(1,"#a3bfdb");ctx.fillStyle=g;ctx.fill();
    ctx.fillStyle="#40576f";roundedRect(-42,-3,57,21,5);ctx.fill();ctx.fillStyle="#4a93ff";roundedRect(24,-4,35,18,5);ctx.fill();
    ctx.fillStyle="#16293f";ctx.fillRect(-50,39,26,8);ctx.fillRect(25,39,26,8);ctx.fillStyle="#f6b73c";ctx.fillRect(-4,-31,8,22);ctx.fillStyle="#eef7ff";ctx.font="800 10px system-ui";ctx.textAlign="center";ctx.fillText("CCB",0,31);ctx.restore();
  }

  function drawSignal(x,y,id,orientation) {
    const phase = state.intersections[id];
    const active = phase === orientation;
    ctx.save();ctx.translate(x,y);ctx.fillStyle="rgba(12,29,43,.24)";ctx.beginPath();ctx.ellipse(7,22,16,6,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#253a48";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,17);ctx.lineTo(0,-24);ctx.stroke();
    roundedRect(-11,-39,22,25,5);ctx.fillStyle="#172633";ctx.fill();
    const c = active ? "#43e6a9" : phase === "PED" ? "#f6b73c" : "#ef5d63";ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,-27,6,0,Math.PI*2);ctx.fill();
    if (state.role === "signal" && Math.random() > 0.982) { ctx.strokeStyle="rgba(53,201,165,.7)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-27,17,0,Math.PI*2);ctx.stroke(); }
    ctx.restore();
  }

  function drawAlleyMarker() {
    ctx.save();ctx.translate(324,300); const glow = state.role === "route" && !state.alleyOpen;
    if (glow) { ctx.fillStyle="rgba(246,183,60,.18)";ctx.beginPath();ctx.arc(0,0,42 + Math.sin(performance.now()/300)*4,0,Math.PI*2);ctx.fill(); }
    roundedRect(-52,-21,104,42,10);ctx.fillStyle=state.alleyOpen?"#2e886f":"#b98124";ctx.fill();ctx.strokeStyle="rgba(255,255,255,.5)";ctx.stroke();ctx.fillStyle="#fff7e8";ctx.font="800 11px system-ui";ctx.textAlign="center";ctx.fillText(state.alleyOpen?"ALLEY OPEN":"BLUEBIRD ALLEY",0,4);ctx.restore();
  }

  function drawHospitalBeacon() {
    ctx.save();ctx.translate(700,93);const active=state.priorityUntil>state.elapsed;ctx.fillStyle=active?"rgba(53,201,165,.18)":"rgba(239,93,99,.13)";ctx.beginPath();ctx.arc(0,0,34 + Math.sin(performance.now()/260)*3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=active?"#35c9a5":"#ef5d63";ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font="900 16px system-ui";ctx.textAlign="center";ctx.fillText("+",0,6);ctx.restore();
  }

  function drawLensTower() {
    ctx.save();ctx.translate(968,337);ctx.fillStyle="rgba(14,39,63,.18)";ctx.beginPath();ctx.ellipse(0,17,35,9,0,0,Math.PI*2);ctx.fill();roundedRect(-11,-56,22,68,7);ctx.fillStyle="#647a8f";ctx.fill();roundedRect(-24,-73,48,27,8);ctx.fillStyle=state.lensLock?"#9166e8":"#43566e";ctx.fill();ctx.fillStyle="#e6dcff";ctx.font="800 9px system-ui";ctx.textAlign="center";ctx.fillText("LENS",0,-56);ctx.restore();
  }

  function drawMarketStalls() {
    for (let i=0;i<4;i+=1) { const x=380+i*40; const y=642;ctx.save();ctx.translate(x,y);ctx.fillStyle="rgba(18,49,57,.2)";ctx.fillRect(-20,12,44,10);ctx.fillStyle=i%2?"#e9878b":"#f4b94b";ctx.fillRect(-19,-7,42,17);ctx.fillStyle="#fff0d4";for(let j=0;j<4;j++)ctx.fillRect(-19+j*10,-7,5,17);ctx.fillStyle="#705c47";ctx.fillRect(-14,10,4,17);ctx.fillRect(14,10,4,17);ctx.restore(); }
  }

  function drawStreetFurniture() {
    // benches, cones, puddles and assorted visual density
    const puddles = [[513,385,38,10],[1090,604,53,12],[825,629,35,9],[151,619,45,11]];
    if (state.rain) puddles.forEach(([x,y,w,h])=>{ctx.fillStyle="rgba(130,214,244,.23)";ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fill();});
    for (const [x,y] of [[490,350],[916,622],[930,385]]) { ctx.fillStyle="#f6b73c";ctx.beginPath();ctx.moveTo(x,y-10);ctx.lineTo(x-6,y+8);ctx.lineTo(x+6,y+8);ctx.closePath();ctx.fill();ctx.fillStyle="#fff3d5";ctx.fillRect(x-4,y+1,8,3); }
  }

  function drawTraffic() {
    state.vehicles.forEach(drawVehicle);
    if (state.ambulance && !state.ambulance.done) drawAmbulance(state.ambulance);
  }

  function drawVehicle(v) {
    ctx.save();ctx.translate(v.x,v.y);const vertical=v.direction==="north"||v.direction==="south";if(vertical)ctx.rotate(Math.PI/2);if(v.direction==="east"||v.direction==="north")ctx.rotate(Math.PI);
    ctx.fillStyle="rgba(11,28,43,.28)";ctx.beginPath();ctx.ellipse(2,9,v.w*.66,v.h*.46,0,0,Math.PI*2);ctx.fill();
    const g=ctx.createLinearGradient(0,-v.h/2,0,v.h/2);g.addColorStop(0,"#ffffff");g.addColorStop(.12,v.color);g.addColorStop(1,shade(v.color,-28));roundedRect(-v.w/2,-v.h/2,v.w,v.h,Math.min(7,v.h/2));ctx.fillStyle=g;ctx.fill();
    ctx.fillStyle="rgba(13,39,57,.65)";roundedRect(-v.w*.23,-v.h*.29,v.w*.43,v.h*.31,4);ctx.fill();ctx.fillStyle="#f7ecbd";ctx.fillRect(v.w/2-4,-v.h*.25,3,4);ctx.fillRect(v.w/2-4,v.h*.25-4,3,4);
    if(v.stopped){ctx.fillStyle="#ef5d63";ctx.beginPath();ctx.arc(-v.w/2+3,-v.h/2-3,3,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }

  function drawAmbulance(a) {
    ctx.save();ctx.translate(a.x,a.y);let angle=0;if(a.seg>=2)angle=-Math.PI/2;ctx.rotate(angle);ctx.fillStyle="rgba(10,28,43,.35)";ctx.beginPath();ctx.ellipse(3,12,30,12,0,0,Math.PI*2);ctx.fill();
    roundedRect(-29,-14,58,28,8);ctx.fillStyle="#f5fbff";ctx.fill();ctx.fillStyle="#ef5d63";ctx.fillRect(-6,-14,14,28);ctx.fillRect(-28,1,56,6);ctx.fillStyle="#34536a";roundedRect(-20,-9,18,10,3);ctx.fill();ctx.fillStyle="#2c4051";ctx.fillRect(-10,14,15,5);ctx.fillStyle="#ef5d63";ctx.fillRect(-3,-21,13,6);ctx.fillStyle="#dff8ff";ctx.fillRect(-20,-18,8,4);
    const flash=Math.sin(performance.now()/70)>0;ctx.fillStyle=flash?"#5ba7ff":"#ef5d63";ctx.fillRect(-17,-19,6,5);ctx.fillRect(13,-19,6,5);ctx.restore();
  }

  function drawStationaryEvents() {
    if (state.busStalled) drawStalledBus();
    if (state.vanStalled) drawStalledVan();
  }

  function drawStalledBus() {
    ctx.save();ctx.translate(314,487);const glow=state.role==="field";if(glow){ctx.fillStyle="rgba(239,93,99,.14)";ctx.beginPath();ctx.ellipse(0,0,100+Math.sin(performance.now()/240)*5,58,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle="rgba(8,25,39,.33)";ctx.beginPath();ctx.ellipse(0,29,98,20,0,0,Math.PI*2);ctx.fill();roundedRect(-91,-29,182,54,12);const g=ctx.createLinearGradient(0,-29,0,25);g.addColorStop(0,"#ffd86b");g.addColorStop(1,"#e59a2f");ctx.fillStyle=g;ctx.fill();
    ctx.fillStyle="#294d64";for(let i=0;i<5;i++)roundedRect(-62+i*27,-18,20,18,4),ctx.fill();ctx.fillStyle="#f1c249";ctx.fillRect(-84,-2,168,8);ctx.fillStyle="#f7f3d8";ctx.font="800 9px system-ui";ctx.textAlign="center";ctx.fillText("SCHOOL BUS",0,16);ctx.fillStyle="#293746";ctx.fillRect(-64,25,25,9);ctx.fillRect(38,25,25,9);
    ctx.fillStyle="#ef5d63";ctx.beginPath();ctx.arc(-72,-34,5+Math.sin(performance.now()/120)*1,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(50,54,70,.55)";for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(40+i*9,-43-i*9,7+i*2,0,Math.PI*2);ctx.fill();}ctx.restore();
  }

  function drawStalledVan() {
    ctx.save();ctx.translate(1082,437);const glow=state.role==="field";if(glow){ctx.fillStyle="rgba(239,93,99,.14)";ctx.beginPath();ctx.ellipse(0,0,86,50,0,0,Math.PI*2);ctx.fill();}ctx.fillStyle="rgba(8,25,39,.3)";ctx.beginPath();ctx.ellipse(0,22,59,16,0,0,Math.PI*2);ctx.fill();roundedRect(-53,-21,106,40,8);ctx.fillStyle="#e7e9ef";ctx.fill();ctx.fillStyle="#89a5bb";roundedRect(12,-15,29,22,4);ctx.fill();ctx.fillStyle="#ef5d63";ctx.fillRect(-51,-1,102,7);ctx.fillStyle="#283442";ctx.fillRect(-34,19,18,8);ctx.fillRect(20,19,18,8);ctx.fillStyle="#ef5d63";ctx.beginPath();ctx.arc(-41,-26,4+Math.sin(performance.now()/120),0,Math.PI*2);ctx.fill();ctx.restore();
  }

  function drawCrew() {
    const order=["dispatcher","signal","route","field"]; order.forEach((role)=>{const p=state.pips[role];drawPip(p.x,p.y,role,role===state.role);});
  }

  function drawPip(x,y,role,selected) {
    const p=state.pips[role]; const bob=Math.sin(p.pulse*2.4)*2; const accent=ROLES[role].color;
    ctx.save();ctx.translate(x,y+bob);const scale=role==="field"&&state.task?1.04:1;ctx.scale(scale,scale);
    if(selected){ctx.fillStyle=hexToRgba(accent,.19);ctx.beginPath();ctx.ellipse(0,30,35+Math.sin(p.pulse*4)*2,10,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle="rgba(8,27,43,.28)";ctx.beginPath();ctx.ellipse(1,27,25,8,0,0,Math.PI*2);ctx.fill();
    // boots
    ctx.fillStyle="#293342";roundedRect(-20,15,17,12,7);ctx.fill();roundedRect(3,15,17,12,7);ctx.fill();
    // raincoat body and arms
    ctx.fillStyle="#ece2d2";roundedRect(-23,-7,46,28,10);ctx.fill();ctx.fillStyle="#dccdb7";ctx.fillRect(-23,12,46,5);ctx.fillStyle=accent;ctx.fillRect(-4,-7,8,28);
    ctx.fillStyle="#384555";ctx.beginPath();ctx.arc(-25,5,8,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(25,5,8,0,Math.PI*2);ctx.fill();
    // helmet and cream dot-eye face
    roundedRect(-24,-34,48,31,12);const face=ctx.createLinearGradient(0,-34,0,-3);face.addColorStop(0,"#fff7e8");face.addColorStop(1,"#e9d9c0");ctx.fillStyle=face;ctx.fill();
    ctx.fillStyle=accent;ctx.beginPath();ctx.ellipse(0,-32,24,8,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-23,-30,46,7);
    ctx.fillStyle="#27313c";ctx.beginPath();ctx.arc(-8,-18,2.8,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(8,-18,2.8,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#6f4037";ctx.lineWidth=2;ctx.lineCap="round";ctx.beginPath();ctx.arc(0,-12,4,0.1,Math.PI-0.1);ctx.stroke();
    // status tab
    roundedRect(10,-27,9,5,2);ctx.fillStyle=accent;ctx.fill();
    // role distinction / tool
    if(role==="dispatcher"){ctx.strokeStyle="#2e3847";ctx.lineWidth=3;ctx.beginPath();ctx.arc(-25,-20,8,Math.PI/2,Math.PI*1.5);ctx.stroke();ctx.beginPath();ctx.arc(25,-20,8,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.fillStyle="#354455";roundedRect(20,-2,12,17,2);ctx.fill();}
    if(role==="signal"){ctx.fillStyle="#27313d";roundedRect(-12,-48,24,9,3);ctx.fill();["#ef5d63","#f6b73c","#35c9a5"].forEach((c,i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(-7+i*7,-43,2.5,0,Math.PI*2);ctx.fill();});ctx.fillStyle="#334151";roundedRect(23,-5,7,24,4);ctx.fill();ctx.fillStyle="#f6b73c";ctx.beginPath();ctx.arc(26,-9,4,0,Math.PI*2);ctx.fill();}
    if(role==="route"){ctx.fillStyle="#1d3451";ctx.beginPath();ctx.ellipse(0,-40,26,7,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle="#9ed9cc";ctx.beginPath();ctx.moveTo(22,-5);ctx.lineTo(37,-13);ctx.lineTo(39,7);ctx.lineTo(23,13);ctx.closePath();ctx.fill();ctx.strokeStyle="#fff5d2";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(25,-2);ctx.lineTo(35,1);ctx.stroke();}
    if(role==="field"){ctx.fillStyle="#293747";ctx.beginPath();ctx.arc(24,-35,7,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ffe597";ctx.beginPath();ctx.arc(25,-35,4,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#8291a0";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(23,7);ctx.lineTo(35,15);ctx.stroke();ctx.beginPath();ctx.arc(38,17,5,0,Math.PI*1.7);ctx.stroke();}
    ctx.restore();
  }

  function drawWorldLabels() {
    ctx.save();ctx.font="800 12px system-ui";ctx.textAlign="center";ctx.fillStyle="rgba(255,255,255,.83)";ctx.fillText("CIVIC SQUARE",700,343);ctx.fillText("NORTHGATE HOSPITAL",700,116);ctx.fillText("MARKET CROSSING",700,789);ctx.fillText("BLUEBIRD ALLEY",347,365);ctx.fillText("CRANE STREET",1112,365);ctx.restore();
    if(state.ambulance&&!state.ambulance.done){ctx.save();ctx.translate(state.ambulance.x,state.ambulance.y-34);ctx.fillStyle="rgba(13,31,52,.82)";roundedRect(-41,-10,82,20,7);ctx.fill();ctx.fillStyle="#ffdadb";ctx.font="800 10px system-ui";ctx.textAlign="center";ctx.fillText(state.ambulance.stopped?"AMBULANCE WAITING":"AMBULANCE",0,4);ctx.restore();}
    if(state.task){const p=state.task.type==="bus"?{x:314,y:395}:{x:1082,y:357};ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle="rgba(8,24,43,.85)";roundedRect(-53,-11,106,22,8);ctx.fill();ctx.fillStyle="#fff0d5";ctx.font="800 10px system-ui";ctx.textAlign="center";ctx.fillText(`REPAIR ${Math.max(0,state.task.remaining).toFixed(1)}s`,0,4);ctx.restore();}
  }

  function drawRain() { ctx.save();ctx.lineWidth=1.15;state.rainDrops.forEach((drop)=>{ctx.strokeStyle=`rgba(218,248,255,${drop.alpha})`;ctx.beginPath();ctx.moveTo(drop.x,drop.y);ctx.lineTo(drop.x-5,drop.y+drop.l);ctx.stroke();});ctx.restore(); }

  function drawWorldEffects() {
    if(state.priorityUntil>state.elapsed){const pulse=0.55+Math.sin(performance.now()/160)*.2;ctx.save();ctx.strokeStyle=`rgba(53,201,165,${pulse})`;ctx.lineWidth=8;ctx.setLineDash([15,12]);ctx.beginPath();ctx.moveTo(20,487);ctx.lineTo(700,487);ctx.lineTo(700,96);ctx.stroke();ctx.restore();}
    if(state.mode==="briefing"){ctx.save();ctx.fillStyle="rgba(4,18,36,.23)";ctx.fillRect(0,0,W,H);ctx.fillStyle="#eaf5ff";ctx.font="800 18px system-ui";ctx.textAlign="center";ctx.fillText(state.briefingElapsed<2.8?"LENS: Morning traffic operating within expected parameters.":"LENS: Festival priority detected.",W/2,H*.17);ctx.restore();}
  }

  function polygon(points, fill) { ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();if(fill)ctx.fill(); }
  function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function shade(hex,amount){const n=parseInt(hex.slice(1),16);let r=(n>>16)+amount,g=((n>>8)&255)+amount,b=(n&255)+amount;r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));return `rgb(${r},${g},${b})`;}
  function hexToRgba(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`;}

  // -------- Audio ----------------------------------------------------------
  function ensureAudio(){ if(!audioContext){ try{audioContext=new(window.AudioContext||window.webkitAudioContext)();}catch{audioContext=null;} } if(audioContext?.state==="suspended")audioContext.resume(); }
  function beep(freq,duration,type="sine",volume=.04){if(muted||!audioContext)return;const now=audioContext.currentTime;const osc=audioContext.createOscillator();const gain=audioContext.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,now);gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain).connect(audioContext.destination);osc.start(now);osc.stop(now+duration+.02);}

  // -------- Event wiring ---------------------------------------------------
  document.querySelectorAll(".role-card").forEach((button)=>button.addEventListener("click",()=>setRole(button.dataset.role)));
  document.querySelectorAll(".mode-choice").forEach((button)=>button.addEventListener("click",()=>{selectedMode=button.dataset.mode;document.querySelectorAll(".mode-choice").forEach((item)=>item.classList.toggle("is-selected",item===button));}));
  startButton.addEventListener("click", startShift);
  retryButton.addEventListener("click", startShift);
  menuButton.addEventListener("click", returnToBriefing);
  primaryAction.addEventListener("click", usePrimaryAction);
  soundToggle.addEventListener("click",()=>{muted=!muted;soundToggle.textContent=muted?"◖×":"◖))";soundToggle.setAttribute("aria-label",muted?"Enable sound":"Mute sound");if(!muted){ensureAudio();beep(500,.05,"sine",.03);}});
  canvas.addEventListener("pointerdown",onCanvasClick);
  canvas.addEventListener("keydown",(event)=>{
    const map={"1":"dispatcher","2":"signal","3":"route","4":"field"};
    if(map[event.key]){event.preventDefault();setRole(map[event.key]);}
    if(event.key.toLowerCase()==="m"){soundToggle.click();}
    if(event.key.toLowerCase()==="r"){startShift();}
    if(event.key===" "){usePrimaryAction();}
  });
  window.addEventListener("keydown",(event)=>{
    if(["INPUT","BUTTON"].includes(document.activeElement.tagName))return;
    const map={"1":"dispatcher","2":"signal","3":"route","4":"field"};
    if(map[event.key])setRole(map[event.key]);
    if(event.key.toLowerCase()==="m")soundToggle.click();
    if(event.key.toLowerCase()==="r"&&state.mode!=="idle")startShift();
  });

  function frame(time){const dt=Math.min(.05,(time-lastFrame)/1000);lastFrame=time;update(dt);draw();requestAnimationFrame(frame);}
  reset("quick");
  requestAnimationFrame(frame);
})();
