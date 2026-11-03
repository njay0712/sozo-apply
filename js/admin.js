/* Admin dashboard logic */
(function () {
  "use strict";
  const C = window.SOZO_CONFIG, S = window.Sozo, A = window.SOZO_ASSESSMENT, esc = S.esc;
  const $ = id => document.getElementById(id);
  const PROGS = C.PROGRAMMES.map(p => p.name);
  const PROG_COLORS = ["#0f4c5c", "#e36414", "#8e44ad", "#2a9d8f"];
  const AGE_COLORS = { "16–20": "#e36414", "21–35": "#0f4c5c" };
  const FIT_COLORS = { "Strong fit": "#1f7a4d", "Moderate fit": "#c98a00", "Low fit": "#b42318" };
  const FITS = ["Strong fit", "Moderate fit", "Low fit"];
  const STATUSES = Object.keys(C.STATUS_INFO);
  const FEE_DUE = ["Shortlisted", "Interview scheduled", "Accepted"];
  const BADGE = { "Received": "b-received", "Under review": "b-review", "Shortlisted": "b-short", "Interview scheduled": "b-interview", "Accepted": "b-accepted", "Waiting list": "b-wait", "Not successful": "b-no" };
  const TOKEN_KEY = "sozo_admin_session";

  let session = null, all = [], progFilter = "";
  let sortKey = "submitted", sortDir = -1, page = 0;
  const PAGE_SIZE = 25;

  /* ---------- Session ---------- */
  function loadSession() { try { return JSON.parse(sessionStorage.getItem(TOKEN_KEY)); } catch (e) { return null; } }
  function saveSession(s) { try { s ? sessionStorage.setItem(TOKEN_KEY, JSON.stringify(s)) : sessionStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ } }

  if (S.DEMO) { $("demoLoginNote").hidden = false; $("demoBanner").hidden = false; }

  $("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const u = $("username").value.trim().toLowerCase(), p = $("password").value;
    if (!u || !p) { $("loginAlert").innerHTML = '<div class="alert alert-error">Enter your username and password.</div>'; return; }
    const btn = $("loginBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Signing in…';
    try {
      const r = await S.api("login", { username: u, password: p });
      if (r.ok) {
        session = { token: r.token, name: r.name, username: r.username };
        saveSession(session); $("password").value = ""; $("loginAlert").innerHTML = "";
        start();
      } else $("loginAlert").innerHTML = `<div class="alert alert-error">${esc(r.error || "Sign-in failed.")}</div>`;
    } catch (err) {
      $("loginAlert").innerHTML = '<div class="alert alert-error">Could not reach the server. Check your connection.</div>';
    }
    btn.disabled = false; btn.textContent = "Sign in";
  });

  async function logout() {
    if (session) { try { await S.api("logout", { token: session.token }); } catch (e) { /* ignore */ } }
    session = null; saveSession(null); all = [];
    $("app").hidden = true; $("loginScreen").hidden = false;
  }
  $("logoutBtn").addEventListener("click", logout);
  $("logoutBtn2").addEventListener("click", logout);

  function start() {
    $("loginScreen").hidden = true; $("app").hidden = false;
    $("whoami").textContent = session.name + " (" + session.username + ")";
    refresh();
  }

  /* ---------- Data ---------- */
  async function refresh() {
    $("loading").hidden = false; $("loadError").innerHTML = "";
    try {
      const r = await S.api("list", { token: session.token });
      if (r.authError) { toast("Your session has expired. Please sign in again."); return logout(); }
      if (!r.ok) throw new Error(r.error || "Could not load data");
      all = (r.applications || []).map(a => {
        const o = Object.assign({}, a);
        ["age", "scoreTotal", "scoreInterest", "scoreJudgement", "scoreKnowledge", "scoreReadiness", "householdSize", "dependants"].forEach(k => { o[k] = +o[k] || 0; });
        return o;
      });
      $("lastUpdated").textContent = all.length + " applications · updated " + new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
      render();
    } catch (err) {
      $("loadError").innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`;
    }
    $("loading").hidden = true;
  }
  $("refreshBtn").addEventListener("click", refresh);

  if (S.DEMO) {
    $("seedBtn").addEventListener("click", () => { S.seedDemo(60); refresh(); });
    $("clearBtn").addEventListener("click", () => { S.clearDemo(); refresh(); });
  }

  const areaOf = a => a.area === "Other" && a.areaOther ? "Other: " + a.areaOther : a.area;
  const feeState = a => a.feeStatus === "Paid" ? "Paid" : a.feeStatus === "Waived" ? "Waived" : FEE_DUE.includes(a.status) ? "Due" : "Not yet due";
  const flagsOf = a => String(a.flags || "").split(";").map(s => s.trim()).filter(Boolean);
  const citizenOf = a => a.nationality === "South Africa" ? "South African" : (a.citizenship === "Refugee" || a.citizenship === "Asylum seeker") ? a.citizenship : "Other foreign national";
  function filtered() { return progFilter ? all.filter(a => a.programme === progFilter) : all; }
  function countBy(rows, fn, order) {
    const m = new Map();
    (order || []).forEach(k => m.set(k, 0));
    rows.forEach(r => { const k = fn(r) || "Not given"; m.set(k, (m.get(k) || 0) + 1); });
    return m;
  }
  const avg = (rows, k) => rows.length ? Math.round(rows.reduce((s, r) => s + (+r[k] || 0), 0) / rows.length) : 0;
  const fitChip = a => `<span class="fit fit-${String(a.fit || "Low fit").split(" ")[0].toLowerCase()}"><b>${a.scoreTotal}</b> ${esc(a.fit || "")}</span>`;
  const feeChip = a => { const s = feeState(a); return `<span class="fee-chip ${s === "Due" ? "fee-due" : s === "Not yet due" ? "fee-na" : "fee-paid"}">${s === "Due" ? "R" + C.FEE_AMOUNT + " due" : s}</span>`; };

  /* ---------- Chart helpers ---------- */
  function bars(el, map, opts) {
    opts = opts || {};
    let entries = [...map.entries()];
    if (opts.sort) entries.sort((a, b) => b[1] - a[1]);
    if (opts.hideZero) entries = entries.filter(e => e[1] > 0);
    if (opts.limit) entries = entries.slice(0, opts.limit);
    const total = opts.total || [...map.values()].reduce((s, v) => s + v, 0);
    const max = Math.max(1, ...entries.map(e => e[1]));
    if (!total) { $(el).innerHTML = '<div class="empty">No applications yet.</div>'; return; }
    $(el).innerHTML = entries.map(([k, v], i) => {
      const color = opts.colors ? (Array.isArray(opts.colors) ? opts.colors[i % opts.colors.length] : opts.colors[k]) : null;
      return `<div class="bar-row" title="${esc(k)}: ${v}">
        <span class="b-label">${esc(k)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(v / max * 100).toFixed(1)}%${color ? ";background:" + color : ""}"></div></div>
        <span class="bar-val">${v} <span>${Math.round(v / total * 100)}%</span></span></div>`;
    }).join("");
  }

  function crossTab(el, rows, rowFn, rowOrder) {
    const keys = rowOrder ? rowOrder.slice() : [];
    rows.forEach(r => { const k = rowFn(r) || "Not given"; if (!keys.includes(k)) keys.push(k); });
    const body = keys.map(k => {
      const vals = PROGS.map(c => rows.filter(r => (rowFn(r) || "Not given") === k && r.programme === c).length);
      return { k, vals, tot: vals.reduce((s, v) => s + v, 0) };
    }).filter(r => r.tot > 0 || (rowOrder && rowOrder.includes(r.k)));
    $(el).innerHTML = `<thead><tr><th></th>${PROGS.map(c => `<th class="num">${esc(c)}</th>`).join("")}<th class="num">Total</th></tr></thead>
      <tbody>${body.map(r => `<tr><td>${esc(r.k)}</td>${r.vals.map(v => `<td class="num">${v}</td>`).join("")}<td class="num"><strong>${r.tot}</strong></td></tr>`).join("")}</tbody>
      <tfoot><tr><td>Total</td>${PROGS.map(c => `<td class="num">${rows.filter(r => r.programme === c).length}</td>`).join("")}<td class="num">${rows.length}</td></tr></tfoot>`;
  }

  function daysLeft() { return Math.max(0, Math.floor((new Date(C.CLOSING_DATE) - Date.now()) / 864e5)); }

  /* ---------- M&E indicators ---------- */
  const LOW_INCOME = ["No income", "R1 – R1 000", "R1 001 – R3 500"];
  const MATRIC_PLUS = ["Grade 12 / Matric (NQF 4)", "Higher Certificate (NQF 5)", "Diploma (NQF 6)", "Degree (NQF 7+)"];
  const BELOW_G10 = ["No schooling", "Grade 7 or lower", "Grade 8–9"];
  const INDICATORS = [
    { group: "Reach" },
    { label: "Applicants (unique participants)", count: true },
    { label: "Women", def: "Gender = Female", fn: a => a.gender === "Female" },
    { label: "Aged 16–20", fn: a => a.ageGroup === "16–20" },
    { label: "Aged 21–35", fn: a => a.ageGroup === "21–35" },
    { label: "Foreign nationals", def: "Incl. refugees and asylum seekers", fn: a => a.nationality && a.nationality !== "South Africa" },
    { label: "Persons with disability", def: "Washington Group Short Set: a lot of difficulty or cannot do, in any domain", fn: a => a.disability === "Yes" },
    { group: "Economic baseline" },
    { label: "NEET", def: "Not in employment, education or training", fn: a => a.neet === "Yes" },
    { label: "Unemployed and looking for work", fn: a => a.employment === "Unemployed – looking for work" },
    { label: "Discouraged work-seekers", fn: a => a.employment === "Unemployed – not looking (discouraged)" },
    { label: "Long-term unemployed or never worked", def: "Last worked more than 1 year ago, or never", fn: a => ["1–2 years ago", "More than 2 years ago", "Never worked"].includes(a.lastWorked) },
    { label: "No personal income", fn: a => a.personalIncome === "No income" },
    { label: "Household income R3 500 or less per month", fn: a => LOW_INCOME.includes(a.householdIncome) },
    { label: "Household receives a social grant", fn: a => a.anyGrant === "Yes" },
    { label: "Head of household", fn: a => a.headOfHousehold === "Yes" },
    { label: "Has dependants", fn: a => +a.dependants > 0 },
    { group: "Family and social" },
    { label: "Parents (has own children)", fn: a => a.hasChildren === "Yes" },
    { label: "Orphans", def: "Mother, father or both parents have passed away", fn: a => a.orphan === "Yes" },
    { label: "Not living with a parent", fn: a => a.livingWith && !["Both parents", "One parent"].includes(a.livingWith) },
    { label: "Married or living with partner", fn: a => ["Married", "Living with partner"].includes(a.maritalStatus) },
    { label: "Household food insecurity", def: "Someone went to sleep hungry in the past 4 weeks", fn: a => a.foodInsecure === "Yes" },
    { label: "Household mainly depends on grants", fn: a => a.incomeSource === "Social grants" },
    { label: "New to the area (less than 1 year)", fn: a => a.yearsInArea === "Less than 1 year" },
    { group: "Work readiness" },
    { label: "Has a bank account", fn: a => a.bankAccount === "Yes" },
    { label: "Has a CV", fn: a => a.hasCV === "Yes" },
    { label: "Has a learner's or driver's licence", fn: a => a.licence && a.licence !== "No" },
    { label: "Registered as a job-seeker", def: "SAYouth.mobi, ESSA, Harambee or an agency", fn: a => a.jobseeker && a.jobseeker !== "None" },
    { label: "Comfortable being trained in English", fn: a => ["Very comfortable", "Comfortable"].includes(a.englishComfort) },
    { label: "Returning Sozo participant", fn: a => a.previousSozo && a.previousSozo !== "No" },
    { group: "Education and living conditions" },
    { label: "Completed Grade 12 or higher", fn: a => MATRIC_PLUS.includes(a.education) },
    { label: "Highest education below Grade 10", fn: a => BELOW_G10.includes(a.education) },
    { label: "Lives in informal or backyard shack", fn: a => ["Backyard shack (wendy house)", "Shack in informal settlement"].includes(a.dwelling) },
    { label: "Own smartphone (reachable for follow-up)", fn: a => a.deviceAccess === "My own smartphone" },
    { label: "Consented to follow-up surveys", fn: a => a.followUpConsent === "Yes" },
    { group: "Assessment and selection" },
    { label: "Strong fit", fn: a => a.fit === "Strong fit" },
    { label: "Average assessment score", avg: "scoreTotal" },
    { label: "Average baseline knowledge (pre-test)", avg: "scoreKnowledge" },
    { label: "Accepted", fn: a => a.status === "Accepted" },
    { label: "Registration fees paid", def: "Count and rand value", fee: true }
  ];

  function indicatorCell(ind, rows) {
    if (ind.count) return { text: String(rows.length), n: rows.length };
    if (ind.avg) return { text: rows.length ? String(avg(rows, ind.avg)) : "–", n: avg(rows, ind.avg) };
    if (ind.fee) { const n = rows.filter(a => a.feeStatus === "Paid").length; return { text: n + " · R" + (n * C.FEE_AMOUNT).toLocaleString("en-ZA"), n: n }; }
    const n = rows.filter(ind.fn).length;
    return { text: n + (rows.length ? " · " + Math.round(n / rows.length * 100) + "%" : ""), n: n, pct: rows.length ? Math.round(n / rows.length * 100) : 0 };
  }

  /* ---------- Views ---------- */
  function render() { renderOverview(); renderProgrammes(); renderAssessment(); renderMne(); renderBuilder(); renderTable(); }

  function renderOverview() {
    const rows = filtered();
    const young = rows.filter(r => r.ageGroup === "16–20").length, older = rows.filter(r => r.ageGroup === "21–35").length;
    const strong = rows.filter(r => r.fit === "Strong fit").length;
    const pct = n => rows.length ? Math.round(n / rows.length * 100) + "% of applicants" : "—";
    $("kpis").innerHTML = `
      <div class="kpi accent"><div class="k-label">${progFilter ? esc(progFilter) : "Total applications"}</div><div class="k-value">${rows.length}</div><div class="k-foot">${progFilter ? "of " + all.length + " in total" : "across all 4 schools"}</div></div>
      <div class="kpi"><div class="k-label">Aged 16–20 / 21–35</div><div class="k-value">${young} <span style="color:var(--muted);font-weight:500">/</span> ${older}</div><div class="k-foot">${pct(young)} are 16–20</div></div>
      <div class="kpi"><div class="k-label">Strong fit</div><div class="k-value">${strong}</div><div class="k-foot">${pct(strong)} · avg score ${avg(rows, "scoreTotal")}</div></div>
      <div class="kpi"><div class="k-label">Days until closing</div><div class="k-value">${daysLeft()}</div><div class="k-foot">Closes 28 Jan 2027</div></div>`;
    $("ovTotal").textContent = all.length + " total";
    bars("ovProg", countBy(all, r => r.programme, PROGS), { colors: PROG_COLORS });
    bars("ovFit", countBy(rows, r => r.fit, FITS), { colors: FIT_COLORS });
    bars("ovStatus", countBy(rows, r => r.status, STATUSES), { hideZero: true });
    bars("ovAreas", countBy(rows, areaOf), { sort: true, limit: 8 });
    const due = rows.filter(a => feeState(a) === "Due").length, paid = rows.filter(a => a.feeStatus === "Paid").length, waived = rows.filter(a => a.feeStatus === "Waived").length;
    const needHelp = rows.filter(a => flagsOf(a).includes("Needs fee support") && feeState(a) === "Due").length;
    $("ovFees").innerHTML = `<div class="fee-stats">
        <div><strong>${paid}</strong><span>Paid</span></div>
        <div><strong>${due}</strong><span>Due (shortlisted)</span></div>
        <div><strong>R${(paid * C.FEE_AMOUNT).toLocaleString("en-ZA")}</strong><span>Collected</span></div></div>
      <p style="font-size:14px;color:var(--muted);margin:0">${waived} waived · ${needHelp} of those due said they would need help with the fee.
      <a href="#" id="showDue">Show applicants with fees due</a></p>`;
    $("showDue").addEventListener("click", e => { e.preventDefault(); $("fFee").value = "Due"; page = 0; renderTable(); setView("applicants"); });
    // Daily
    const days = new Map();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      days.set(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"), 0);
    }
    rows.forEach(r => { const k = String(r.submitted).slice(0, 10); if (days.has(k)) days.set(k, days.get(k) + 1); });
    const max = Math.max(1, ...days.values());
    $("ovDaily").innerHTML = '<div class="cols-wrap"><div class="cols">' + [...days.entries()].map(([k, v]) => {
      const d = new Date(k + "T12:00:00");
      return `<div class="col" title="${d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}: ${v}">
        <span class="col-val">${v || ""}</span><div class="col-bar" style="height:${(v / max * 100).toFixed(1)}%"></div>
        <span class="col-lbl">${d.getDate()}<br>${d.toLocaleDateString("en-ZA", { month: "short" })}</span></div>`;
    }).join("") + "</div></div>";
  }

  function renderProgrammes() {
    $("progCards").innerHTML = C.PROGRAMMES.map((p, i) => {
      const rows = all.filter(a => a.programme === p.name);
      const y = rows.filter(r => r.ageGroup === "16–20").length, o = rows.filter(r => r.ageGroup === "21–35").length;
      const f = rows.filter(r => r.gender === "Female").length, m = rows.filter(r => r.gender === "Male").length;
      const st = s => rows.filter(r => r.status === s).length;
      const share = all.length ? Math.round(rows.length / all.length * 100) : 0;
      const yp = rows.length ? y / rows.length * 100 : 0, op = rows.length ? o / rows.length * 100 : 0;
      const strong = rows.filter(r => r.fit === "Strong fit").length;
      const topAreas = [...countBy(rows, areaOf).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => esc(e[0]) + " (" + e[1] + ")").join(", ") || "—";
      return `<div class="card prog-card" style="--c:${PROG_COLORS[i]}">
        <div class="prog-head"><div><h3 style="margin-bottom:2px">${esc(p.name)}</h3><span style="font-size:13px;color:var(--muted)">${share}% of all applications</span></div>
          <div class="prog-total">${rows.length}<small>applicants</small></div></div>
        <div class="split" aria-label="Age split">
          ${y ? `<div style="width:${yp}%;background:${AGE_COLORS["16–20"]}">${y}</div>` : ""}
          ${o ? `<div style="width:${op}%;background:${AGE_COLORS["21–35"]}">${o}</div>` : ""}
        </div>
        <div class="legend"><span><i style="background:${AGE_COLORS["16–20"]}"></i>16–20: ${y}</span><span><i style="background:${AGE_COLORS["21–35"]}"></i>21–35: ${o}</span><span>Female: ${f} · Male: ${m}</span></div>
        <div class="mini-stats">
          <div><strong>${strong}</strong><span>Strong fit</span></div>
          <div><strong>${st("Shortlisted") + st("Interview scheduled")}</strong><span>Shortlisted</span></div>
          <div><strong>${st("Accepted")}</strong><span>Accepted</span></div>
        </div>
        <p style="font-size:13px;color:var(--muted);margin-bottom:12px"><strong style="color:var(--ink)">Avg score:</strong> ${avg(rows, "scoreTotal")} · <strong style="color:var(--ink)">Top areas:</strong> ${topAreas}</p>
        <div class="prog-actions">
          <button class="btn btn-outline btn-sm" data-show="${esc(p.name)}">View applicants</button>
          <button class="btn btn-outline btn-sm" data-rank="${esc(p.name)}">Ranked shortlist</button>
          <button class="btn btn-outline btn-sm" data-export="${esc(p.name)}">Export this school</button>
        </div></div>`;
    }).join("");
    crossTab("xAge", all, r => r.ageGroup, ["16–20", "21–35"]);
  }
  $("progCards").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const pick = name => { progFilter = name; $("globalProg").value = name; page = 0; render(); };
    if (b.dataset.show) { pick(b.dataset.show); setView("applicants"); }
    if (b.dataset.rank) { pick(b.dataset.rank); setView("assessment"); }
    if (b.dataset.export) exportExcel(b.dataset.export);
  });

  function renderAssessment() {
    const sections = [["Overall score", "scoreTotal"], ["Interest", "scoreInterest"], ["Judgement", "scoreJudgement"], ["Knowledge (pre-test)", "scoreKnowledge"], ["Readiness", "scoreReadiness"]];
    $("asSummary").innerHTML = `<thead><tr><th>Average score</th>${PROGS.map(p => `<th class="num">${esc(p)}</th>`).join("")}<th class="num">All</th></tr></thead>
      <tbody>${sections.map(([l, k]) => `<tr><td>${l}</td>${PROGS.map(p => `<td class="num">${avg(all.filter(a => a.programme === p), k)}</td>`).join("")}<td class="num"><strong>${avg(all, k)}</strong></td></tr>`).join("")}</tbody>`;
    $("asFitBySchool").innerHTML = PROGS.map(p => {
      const rows = all.filter(a => a.programme === p), n = rows.length || 1;
      return `<div class="stack-row"><span>${esc(p.replace(" School", ""))}</span><div class="stack">${FITS.map(f => {
        const c = rows.filter(a => a.fit === f).length;
        return c ? `<div style="width:${c / n * 100}%;background:${FIT_COLORS[f]}" title="${f}: ${c}">${c}</div>` : "";
      }).join("")}</div><span style="text-align:right;color:var(--muted)">${rows.length}</span></div>`;
    }).join("") + `<div class="legend">${FITS.map(f => `<span><i style="background:${FIT_COLORS[f]}"></i>${f}</span>`).join("")}</div>`;
    const rows = filtered();
    const fl = new Map(); rows.forEach(a => flagsOf(a).forEach(f => fl.set(f, (fl.get(f) || 0) + 1)));
    bars("asFlags", fl, { sort: true, limit: 8, total: rows.length });
    if (!fl.size) $("asFlags").innerHTML = '<div class="empty">No flags.</div>';
    const fitF = $("asFit").value, noFlags = $("asNoFlags").checked;
    const ranked = rows.filter(a => (!fitF || a.fit === fitF) && (!noFlags || !flagsOf(a).length)).sort((a, b) => b.scoreTotal - a.scoreTotal);
    $("asRankNote").textContent = (progFilter || "All schools") + " · " + ranked.length + " applicants";
    $("asRank").innerHTML = ranked.slice(0, 100).map((a, i) => `<tr data-ref="${esc(a.reference)}" tabindex="0">
      <td data-label="Rank" class="num">${i + 1}</td><td data-label="Name">${esc(a.firstName)} ${esc(a.surname)}</td><td data-label="School">${esc(a.programme)}</td>
      <td data-label="Score" class="num"><strong>${a.scoreTotal}</strong></td><td data-label="Fit">${fitChip(a)}</td>
      <td data-label="Interest" class="num">${a.scoreInterest}</td><td data-label="Judgement" class="num">${a.scoreJudgement}</td><td data-label="Knowledge" class="num">${a.scoreKnowledge}</td><td data-label="Readiness" class="num">${a.scoreReadiness}</td>
      <td data-label="Flags">${flagsOf(a).map(f => `<span class="flag-chip">${esc(f)}</span>`).join("") || "—"}</td>
      <td data-label="Status"><span class="badge ${BADGE[a.status] || "b-received"}">${esc(a.status)}</span></td></tr>`).join("") ||
      '<tr><td colspan="11" class="empty" style="text-align:center">No applicants match.</td></tr>';
  }
  $("asFit").addEventListener("change", renderAssessment);
  $("asNoFlags").addEventListener("change", renderAssessment);
  $("asRank").addEventListener("click", e => { const tr = e.target.closest("tr[data-ref]"); if (tr) openDrawer(tr.dataset.ref); });

  function renderMne() {
    const rows = filtered();
    $("mneNote").innerHTML = (progFilter ? `Charts show <strong>${esc(progFilter)}</strong> (${rows.length} applicants).` : `Charts show <strong>all schools</strong> (${rows.length} applicants).`) +
      " The indicator table always shows every school side by side. All figures are baseline data captured at application. Use <strong>Export to Excel</strong> for the funder-ready indicator sheet.";
    $("indTable").innerHTML = `<thead><tr><th>Indicator</th>${PROGS.map(p => `<th class="num">${esc(p)}</th>`).join("")}<th class="num">All schools</th></tr></thead><tbody>` +
      INDICATORS.map(ind => ind.group ? `<tr class="group"><td colspan="${PROGS.length + 2}">${esc(ind.group)}</td></tr>`
        : `<tr><td>${esc(ind.label)}${ind.def ? `<small>${esc(ind.def)}</small>` : ""}</td>${PROGS.map(p => `<td class="num">${indicatorCell(ind, all.filter(a => a.programme === p)).text}</td>`).join("")}<td class="num"><strong>${indicatorCell(ind, all).text}</strong></td></tr>`).join("") + "</tbody>";
    bars("dAge", countBy(rows, r => r.ageGroup, ["16–20", "21–35"]), { colors: AGE_COLORS });
    bars("dGender", countBy(rows, r => r.gender, C.GENDERS), { hideZero: true, colors: ["#8e44ad", "#2a9d8f", "#5b6672", "#9aa5b1"] });
    bars("dCitizen", countBy(rows, citizenOf, ["South African", "Other foreign national", "Asylum seeker", "Refugee"]), { hideZero: true });
    bars("dArea", countBy(rows, areaOf), { sort: true });
    bars("dRace", countBy(rows, r => r.race, C.RACES), { hideZero: true });
    bars("dReligion", countBy(rows, r => r.religion, C.RELIGIONS), { hideZero: true });
    bars("dLang", countBy(rows, r => r.homeLanguage), { sort: true, limit: 10 });
    bars("dEmp", countBy(rows, r => r.employment, C.EMPLOYMENT), { hideZero: true });
    bars("dEdu", countBy(rows, r => r.education, C.EDUCATION), { hideZero: true });
    bars("dHhInc", countBy(rows, r => r.householdIncome, C.INCOME_BANDS), { hideZero: true });
    bars("dDwell", countBy(rows, r => r.dwelling, C.DWELLINGS), { hideZero: true });
    const g = new Map([["No grants", 0]].concat(C.GRANTS.map(x => [x, 0])));
    rows.forEach(a => { if (!a.grants || a.grants === "None") g.set("No grants", g.get("No grants") + 1); else a.grants.split(",").map(s => s.trim()).forEach(s => g.set(s, (g.get(s) || 0) + 1)); });
    bars("dGrants", g, { hideZero: true, total: rows.length });
    const wg = new Map([["Any disability (WG-SS)", rows.filter(a => a.disability === "Yes").length]]);
    C.WG_QUESTIONS.forEach(q => wg.set(q.key.replace("wg", ""), rows.filter(a => a[q.key] === "A lot of difficulty" || a[q.key] === "Cannot do at all").length));
    bars("dWG", wg, { total: rows.length });
    bars("dMarital", countBy(rows, r => r.maritalStatus, C.MARITAL), { hideZero: true });
    bars("dLiving", countBy(rows, r => r.livingWith, C.LIVING_WITH), { hideZero: true });
    bars("dOrphan", countBy(rows, r => r.orphanhood, C.ORPHANHOOD), { hideZero: true });
    bars("dChildren", countBy(rows, r => r.hasChildren === "Yes" ? (+r.numChildren >= 3 ? "3 or more children" : r.numChildren + (r.numChildren === "1" ? " child" : " children")) : r.hasChildren === "No" ? "No children" : r.hasChildren,
      ["No children", "1 child", "2 children", "3 or more children", "Prefer not to say"]), { hideZero: true });
    bars("dYears", countBy(rows, r => r.yearsInArea, C.YEARS_IN_AREA), { hideZero: true });
    bars("dIncSrc", countBy(rows, r => r.incomeSource, C.INCOME_SOURCES), { hideZero: true });
    bars("dHunger", countBy(rows, r => r.hunger, C.HUNGER), { hideZero: true, colors: ["#1f7a4d", "#c98a00", "#d9622b", "#b42318", "#9aa5b1"] });
    bars("dReady", new Map([
      ["Bank account", rows.filter(a => a.bankAccount === "Yes").length],
      ["CV", rows.filter(a => a.hasCV === "Yes").length],
      ["Licence (any)", rows.filter(a => a.licence && a.licence !== "No").length],
      ["Job-seeker registered", rows.filter(a => a.jobseeker && a.jobseeker !== "None").length]
    ]), { total: rows.length });
    bars("dEnglish", countBy(rows, r => r.englishComfort, C.ENGLISH_COMFORT), { hideZero: true });
    bars("dPrevSozo", countBy(rows, r => r.previousSozo, C.PREVIOUS_SOZO), { hideZero: true });
    pairTab("xGenderAge", rows, r => r.gender, r => r.ageGroup, C.GENDERS, ["16–20", "21–35"]);
    crossTab("xArea", all, areaOf);
  }

  /* Generic two-way table */
  function pairTab(el, rows, rowFn, colFn, rowOrder, colOrder, pct) {
    const keysOf = (fn, order) => { const k = (order || []).slice(); rows.forEach(r => { const v = fn(r) || "Not given"; if (!k.includes(v)) k.push(v); }); return k; };
    let rk = keysOf(rowFn, rowOrder), ck = keysOf(colFn, colOrder);
    const cell = {}; rows.forEach(r => { const a = rowFn(r) || "Not given", b = colFn(r) || "Not given"; cell[a + "|" + b] = (cell[a + "|" + b] || 0) + 1; });
    const rowTot = k => ck.reduce((s, c) => s + (cell[k + "|" + c] || 0), 0), colTot = c => rk.reduce((s, k) => s + (cell[k + "|" + c] || 0), 0);
    rk = rk.filter(k => rowTot(k) > 0); ck = ck.filter(c => colTot(c) > 0);
    const fmt = (n, k, c) => {
      if (!pct || pct === "n") return String(n);
      const d = pct === "row" ? rowTot(k) : colTot(c);
      return n + '<small class="pct">' + (d ? Math.round(n / d * 100) : 0) + "%</small>";
    };
    if (!rows.length) { $(el).innerHTML = '<tbody><tr><td class="empty">No applications yet.</td></tr></tbody>'; return; }
    $(el).innerHTML = `<thead><tr><th></th>${ck.map(c => `<th class="num">${esc(c)}</th>`).join("")}<th class="num">Total</th></tr></thead>
      <tbody>${rk.map(k => `<tr><td>${esc(k)}</td>${ck.map(c => `<td class="num">${fmt(cell[k + "|" + c] || 0, k, c)}</td>`).join("")}<td class="num"><strong>${rowTot(k)}</strong></td></tr>`).join("")}</tbody>
      <tfoot><tr><td>Total</td>${ck.map(c => `<td class="num">${colTot(c)}</td>`).join("")}<td class="num">${rows.length}</td></tr></tfoot>`;
  }

  /* ---------- Breakdown builder ---------- */
  const DIMS = [
    ["School", a => a.programme, PROGS], ["Age group", a => a.ageGroup, ["16–20", "21–35"]],
    ["Age (exact)", a => String(a.age)], ["Gender", a => a.gender, C.GENDERS],
    ["Nationality", a => a.nationality], ["Citizenship status", a => a.citizenship], ["Population group", a => a.race, C.RACES],
    ["Religion", a => a.religion, C.RELIGIONS], ["Home language", a => a.homeLanguage], ["Area", areaOf], ["Municipality", a => a.municipality],
    ["Type of home", a => a.dwelling, C.DWELLINGS], ["Time in area", a => a.yearsInArea, C.YEARS_IN_AREA], ["Lives with", a => a.livingWith, C.LIVING_WITH],
    ["Relationship status", a => a.maritalStatus, C.MARITAL], ["Parents alive", a => a.orphanhood, C.ORPHANHOOD], ["Has children", a => a.hasChildren],
    ["Disability (WG-SS)", a => a.disability], ["Highest education", a => a.education, C.EDUCATION], ["Work situation", a => a.employment, C.EMPLOYMENT],
    ["NEET", a => a.neet], ["Last worked", a => a.lastWorked, C.LAST_WORKED], ["Personal income", a => a.personalIncome, C.INCOME_BANDS],
    ["Household income", a => a.householdIncome, C.INCOME_BANDS], ["Main income source", a => a.incomeSource, C.INCOME_SOURCES],
    ["Any social grant", a => a.anyGrant], ["Food insecure", a => a.foodInsecure], ["Head of household", a => a.headOfHousehold],
    ["Bank account", a => a.bankAccount], ["Has CV", a => a.hasCV], ["Driver's licence", a => a.licence, C.LICENCE],
    ["English comfort", a => a.englishComfort, C.ENGLISH_COMFORT], ["Previous Sozo", a => a.previousSozo, C.PREVIOUS_SOZO],
    ["Phone access", a => a.deviceAccess, C.DEVICE_ACCESS], ["Heard about us", a => a.heardAbout, C.HEARD_ABOUT],
    ["Assessment fit", a => a.fit, FITS], ["Application status", a => a.status, STATUSES], ["Fee", feeState]
  ];
  const B_FILTERS = [["Everyone", () => true], ["NEET only", a => a.neet === "Yes"], ["Women only", a => a.gender === "Female"],
    ["Men only", a => a.gender === "Male"], ["Aged 16–20 only", a => a.ageGroup === "16–20"], ["Aged 21–35 only", a => a.ageGroup === "21–35"],
    ["Persons with disability", a => a.disability === "Yes"], ["Foreign nationals", a => a.nationality !== "South Africa"],
    ["Strong fit only", a => a.fit === "Strong fit"], ["Accepted only", a => a.status === "Accepted"]];
  $("bRows").innerHTML = DIMS.map((d, i) => `<option value="${i}">${esc(d[0])}</option>`).join("");
  $("bCols").innerHTML = DIMS.map((d, i) => `<option value="${i}">${esc(d[0])}</option>`).join("");
  $("bFilter").innerHTML = B_FILTERS.map((d, i) => `<option value="${i}">${esc(d[0])}</option>`).join("");
  $("bRows").value = String(DIMS.findIndex(d => d[0] === "Area")); $("bCols").value = "0"; $("bPct").value = "row";
  function renderBuilder() {
    const r = DIMS[+$("bRows").value], c = DIMS[+$("bCols").value], f = B_FILTERS[+$("bFilter").value][1];
    pairTab("bTable", filtered().filter(f), r[1], c[1], r[2], c[2], $("bPct").value);
  }
  ["bRows", "bCols", "bPct", "bFilter"].forEach(id => $(id).addEventListener("change", renderBuilder));
  function tableToAoa(el) { return [...$(el).querySelectorAll("tr")].map(tr => [...tr.children].map(td => { const t = td.cloneNode(true); t.querySelectorAll(".pct").forEach(p => p.remove()); const v = t.textContent.trim(); return /^\d+$/.test(v) ? +v : v; })); }
  $("bCopy").addEventListener("click", () => {
    const text = tableToAoa("bTable").map(r => r.join("\t")).join("\n");
    const done = () => toast("Table copied – paste it into Excel or Word");
    try { navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done)); } catch (e) { fallbackCopy(text, done); }
  });
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { toast("Select the table and copy it manually."); }
    ta.remove();
  }
  $("bExport").addEventListener("click", () => {
    if (typeof XLSX === "undefined") { toast("Excel library did not load."); return; }
    const wb = XLSX.utils.book_new(), title = DIMS[+$("bRows").value][0] + " by " + DIMS[+$("bCols").value][0];
    const aoa = [[title + (progFilter ? " – " + progFilter : "") + " – " + B_FILTERS[+$("bFilter").value][0]], []].concat(tableToAoa("bTable"));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Breakdown");
    try { XLSX.writeFile(wb, "Sozo breakdown – " + title + ".xlsx"); toast("Excel file downloaded"); } catch (e) { toast("Could not create the Excel file."); }
  });

  /* ---------- Applicants table ---------- */
  $("fStatus").innerHTML = '<option value="">All statuses</option>' + STATUSES.map(s => `<option>${esc(s)}</option>`).join("");
  $("globalProg").innerHTML = '<option value="">All schools</option>' + PROGS.map(p => `<option>${esc(p)}</option>`).join("");
  $("globalProg").addEventListener("change", () => { progFilter = $("globalProg").value; page = 0; render(); });
  $("fGender").innerHTML = '<option value="">All genders</option>' + C.GENDERS.map(g => `<option>${esc(g)}</option>`).join("");
  const GROUPS = { neet: a => a.neet === "Yes", disability: a => a.disability === "Yes", foreign: a => a.nationality !== "South Africa",
    parent: a => a.hasChildren === "Yes", food: a => a.foodInsecure === "Yes", orphan: a => a.orphan === "Yes", flags: a => flagsOf(a).length > 0 };
  ["search", "fStatus", "fAge", "fFit", "fFee", "fGender", "fGroup"].forEach(id => $(id).addEventListener("input", () => { page = 0; renderTable(); }));
  document.querySelectorAll("th.sortable").forEach(th => th.addEventListener("click", () => {
    const k = th.dataset.sort; sortDir = sortKey === k ? -sortDir : (k === "scoreTotal" ? -1 : 1); sortKey = k; renderTable();
  }));
  $("prevPage").addEventListener("click", () => { if (page > 0) { page--; renderTable(); } });
  $("nextPage").addEventListener("click", () => { page++; renderTable(); });

  function tableRows() {
    const q = $("search").value.trim().toLowerCase(), st = $("fStatus").value, ag = $("fAge").value, ft = $("fFit").value, fe = $("fFee").value;
    const gd = $("fGender").value, gp = $("fGroup").value;
    return filtered().filter(a => {
      if (st && a.status !== st) return false;
      if (ag && a.ageGroup !== ag) return false;
      if (ft && a.fit !== ft) return false;
      if (fe && feeState(a) !== fe) return false;
      if (gd && a.gender !== gd) return false;
      if (gp && !GROUPS[gp](a)) return false;
      if (!q) return true;
      return [a.firstName, a.surname, a.docNumber, a.phone, a.reference, a.area, a.areaOther].join(" ").toLowerCase().includes(q);
    }).sort((x, y) => {
      const a = x[sortKey], b = y[sortKey];
      return (typeof a === "number" ? a - b : String(a).localeCompare(String(b))) * sortDir;
    });
  }

  function renderTable() {
    const rows = tableRows();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (page >= pages) page = pages - 1;
    const slice = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    $("tbody").innerHTML = slice.length ? slice.map(a => `
      <tr data-ref="${esc(a.reference)}" tabindex="0">
        <td data-label="Ref"><strong>${esc(a.reference)}</strong>${a.possibleDuplicate ? ' <span title="' + esc(a.possibleDuplicate) + '" style="color:var(--err)">⚠</span>' : ""}</td>
        <td data-label="Name">${esc(a.firstName)} ${esc(a.surname)}</td>
        <td data-label="School">${esc(a.programme)}</td>
        <td data-label="Age" class="num">${a.age}</td>
        <td data-label="Fit">${fitChip(a)}</td>
        <td data-label="Area">${esc(areaOf(a))}</td>
        <td data-label="Phone">${esc(a.phone)}</td>
        <td data-label="Status"><span class="badge ${BADGE[a.status] || "b-received"}">${esc(a.status)}</span></td>
        <td data-label="Fee">${feeChip(a)}</td>
        <td data-label="Submitted">${esc(a.submitted)}</td>
      </tr>`).join("") : '<tr><td colspan="10" class="empty" style="text-align:center;padding:30px">No applicants match these filters.</td></tr>';
    $("pageInfo").textContent = rows.length ? `Showing ${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + slice.length} of ${rows.length}` : "0 results";
    $("prevPage").disabled = page === 0; $("nextPage").disabled = page >= pages - 1;
  }
  $("tbody").addEventListener("click", e => { const tr = e.target.closest("tr[data-ref]"); if (tr) openDrawer(tr.dataset.ref); });
  document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("tr[data-ref]")) openDrawer(e.target.dataset.ref); });

  /* ---------- Drawer ---------- */
  let openRef = null;
  $("dStatus").innerHTML = STATUSES.map(s => `<option>${esc(s)}</option>`).join("");

  function openDrawer(ref) {
    const a = all.find(x => x.reference === ref); if (!a) return;
    openRef = ref;
    $("dName").textContent = a.firstName + " " + a.surname;
    $("dRef").textContent = a.reference + " · " + a.programme;
    $("dWarn").innerHTML = a.possibleDuplicate ? `<div class="alert alert-warn">Possible duplicate: ${esc(a.possibleDuplicate)}. Check before callbacks.</div>` : "";
    const sc = [["Interest", a.scoreInterest], ["Judgement", a.scoreJudgement], ["Knowledge", a.scoreKnowledge], ["Readiness", a.scoreReadiness]];
    $("dAssess").innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">${fitChip(a)}<span style="font-size:13px;color:var(--muted)">out of 100</span></div>
      <div class="score-grid">${sc.map(([l, v]) => `<span>${l}</span><div class="bar-track"><div class="bar-fill" style="width:${v}%"></div></div><span class="num">${v}</span>`).join("")}</div>
      ${flagsOf(a).length ? "<div>" + flagsOf(a).map(f => `<span class="flag-chip">${esc(f)}</span>`).join("") + "</div>" : '<p style="font-size:13px;color:var(--muted);margin:0">No flags.</p>'}`;
    let answers = {}; try { answers = JSON.parse(a.answers || "{}"); } catch (e) { /* ignore */ }
    $("dAnswers").innerHTML = A.build(a.programme).map(q => {
      const ans = answers[q.id], opt = q.options.find(o => o[0] === ans);
      let mark = "";
      if (q.section === "knowledge" && opt) mark = opt[1] ? ' <span class="ok">✓ correct</span>' : ' <span class="bad">✗</span>';
      if (q.section === "judgement" && opt) mark = ` <span class="${opt[1] === 2 ? "ok" : opt[1] === 0 ? "bad" : ""}">(${opt[1]}/2)</span>`;
      return `<div class="ans-item"><b>${esc(q.q)}</b>${esc(ans || "—")}${mark}</div>`;
    }).join("");
    const rows = [
      ["Identity", ""], ["Nationality", a.nationality], ["Document", a.docType + ": " + a.docNumber], ["Status", a.citizenship],
      ["Date of birth", a.dob], ["Age", a.age + " (" + a.ageGroup + ")"], ["Gender", a.gender],
      ["Contact", ""], ["Cellphone", a.phone], ["Alt. number", a.altPhone || "—"], ["Email", a.email || "—"], ["Prefers", a.preferredContact], ["Phone access", a.deviceAccess],
      ["Family", ""], ["Relationship", a.maritalStatus], ["Lives with", a.livingWith], ["Parents alive", a.orphanhood],
      ["Own children", a.hasChildren === "Yes" ? a.numChildren : a.hasChildren], ["Time in area", a.yearsInArea],
      ["Location", ""], ["Area", areaOf(a)], ["Municipality", a.municipality], ["Province", a.province], ["Ward", a.ward || "—"], ["Home", a.dwelling],
      ["Profile", ""], ["Home language", a.homeLanguage], ["Population group", a.race], ["Religion", a.religion],
      ["Disability (WG-SS)", a.disability], ...C.WG_QUESTIONS.filter(q => a[q.key] && a[q.key] !== "No difficulty").map(q => ["– " + q.key.replace("wg", ""), a[q.key]]),
      ["Support needs", a.supportNeeds || "—"],
      ["Baseline", ""], ["Education", a.education], ["Studying now", a.inEducation], ["Work situation", a.employment], ["NEET", a.neet],
      ["Last worked", a.lastWorked], ["Own income", a.personalIncome], ["Household income", a.householdIncome],
      ["Main income source", a.incomeSource], ["Hungry (past 4 wks)", a.hunger], ["Household size", a.householdSize], ["Dependants", a.dependants], ["Head of household", a.headOfHousehold], ["Grants", a.grants],
      ["Prior training", a.priorTraining + (a.priorTrainingDetail ? " – " + a.priorTrainingDetail : "")],
      ["Work readiness", ""], ["Bank account", a.bankAccount], ["CV", a.hasCV], ["Licence", a.licence], ["Job-seeker registration", a.jobseeker],
      ["English comfort", a.englishComfort], ["Previous Sozo", a.previousSozo],
      ["Other", ""], ["Heard about us", a.heardAbout], ["Follow-up consent", a.followUpConsent], ["Submitted", a.submitted],
      ["Last updated", a.updated + (a.updatedBy ? " by " + a.updatedBy : "")]
    ];
    $("dList").innerHTML = rows.map(([k, v]) => v === "" ? `<dt style="grid-column:1/-1;color:var(--brand);font-weight:700;margin-top:8px">${esc(k)}</dt>` : `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("") +
      `<dt>Motivation</dt><dd class="long">${esc(a.motivation)}</dd>`;
    $("dStatus").value = a.status; $("dMsg").value = a.statusMessage || ""; $("dAlert").innerHTML = "";
    $("dFee").value = a.feeStatus || "Unpaid"; $("dReceipt").value = a.feeReceipt || "";
    $("dFeeAlert").innerHTML = a.feeStatus === "Paid" ? `<p style="font-size:13px;color:var(--muted)">Paid ${esc(a.feeDate)}${a.feeRecordedBy ? " · recorded by " + esc(a.feeRecordedBy) : ""}</p>`
      : feeState(a) === "Due" ? `<p style="font-size:13px;color:var(--warn)">Fee is due because this applicant is ${esc(a.status.toLowerCase())}.</p>` : "";
    $("drawer").hidden = false; $("drawerBg").hidden = false; document.body.style.overflow = "hidden";
    $("drawer").scrollTop = 0; $("closeDrawer").focus();
  }
  function closeDrawer() { $("drawer").hidden = true; $("drawerBg").hidden = true; document.body.style.overflow = ""; openRef = null; }
  $("closeDrawer").addEventListener("click", closeDrawer);
  $("drawerBg").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("drawer").hidden) closeDrawer(); });

  const stamp = () => { const n = new Date(), p2 = x => String(x).padStart(2, "0"); return n.getFullYear() + "-" + p2(n.getMonth() + 1) + "-" + p2(n.getDate()) + " " + p2(n.getHours()) + ":" + p2(n.getMinutes()); };

  async function save(btnId, alertId, label, action, payload, apply) {
    const btn = $(btnId); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving…';
    try {
      const r = await S.api(action, Object.assign({ token: session.token, reference: openRef }, payload));
      if (r.authError) { toast("Session expired."); return logout(); }
      if (!r.ok) throw new Error(r.error || "Could not save");
      const a = all.find(x => x.reference === openRef);
      apply(a); a.updated = stamp(); a.updatedBy = session.username;
      const ref = openRef; render(); openDrawer(ref); toast("Saved");
    } catch (err) {
      $(alertId).innerHTML = `<div class="alert alert-error">${esc(err.message)}</div>`;
    }
    btn.disabled = false; btn.textContent = label;
  }
  $("saveStatus").addEventListener("click", () => save("saveStatus", "dAlert", "Save status", "updateStatus",
    { status: $("dStatus").value, statusMessage: $("dMsg").value.trim() },
    a => { a.status = $("dStatus").value; a.statusMessage = $("dMsg").value.trim(); }));
  $("saveFee").addEventListener("click", () => {
    if ($("dFee").value === "Paid" && !$("dReceipt").value.trim()) { $("dFeeAlert").innerHTML = '<div class="alert alert-error">Enter the receipt number for this payment.</div>'; return; }
    save("saveFee", "dFeeAlert", "Save fee", "recordFee", { feeStatus: $("dFee").value, feeReceipt: $("dReceipt").value.trim() },
      a => { a.feeStatus = $("dFee").value; a.feeReceipt = $("dReceipt").value.trim(); a.feeDate = a.feeStatus === "Unpaid" ? "" : stamp().slice(0, 10); a.feeRecordedBy = session.username; });
  });

  /* ---------- Navigation ---------- */
  const TITLES = { overview: "Overview", programmes: "Schools", assessment: "Assessment", mne: "M&E report", breakdown: "Breakdowns", applicants: "Applicants" };
  function setView(v) {
    document.querySelectorAll(".side-nav button").forEach(b => b.classList.toggle("active", b.dataset.view === v));
    document.querySelectorAll("section[data-view]").forEach(s => { s.hidden = s.dataset.view !== v; });
    $("viewTitle").textContent = TITLES[v];
    window.scrollTo(0, 0);
  }
  $("sideNav").addEventListener("click", e => { const b = e.target.closest("button"); if (b) setView(b.dataset.view); });

  /* ---------- Excel export ---------- */
  const COLS = [
    ["Reference", "reference"], ["Submitted", "submitted"], ["School", "programme"], ["First name", "firstName"], ["Surname", "surname"],
    ["Nationality", "nationality"], ["Document type", "docType"], ["Document number", "docNumber"], ["Citizenship status", "citizenship"],
    ["Date of birth", "dob"], ["Age", "age"], ["Age group", "ageGroup"], ["Gender", "gender"],
    ["Cellphone", "phone"], ["Alt. number", "altPhone"], ["Email", "email"], ["Preferred contact", "preferredContact"], ["Phone access", "deviceAccess"],
    ["Home language", "homeLanguage"], ["Population group", "race"], ["Religion", "religion"],
    ["Province", "province"], ["Municipality", "municipality"], ["Area", "area"], ["Area (other)", "areaOther"], ["Ward", "ward"], ["Dwelling", "dwelling"],
    ["WG seeing", "wgSeeing"], ["WG hearing", "wgHearing"], ["WG mobility", "wgMobility"], ["WG cognition", "wgCognition"], ["WG self-care", "wgSelfcare"], ["WG communication", "wgCommunication"],
    ["Disability (WG-SS)", "disability"], ["Support needs", "supportNeeds"],
    ["Highest education", "education"], ["Currently studying", "inEducation"], ["Work situation", "employment"], ["Employed", "employed"], ["NEET", "neet"],
    ["Last worked", "lastWorked"], ["Personal income", "personalIncome"], ["Household income", "householdIncome"], ["Household size", "householdSize"],
    ["Dependants", "dependants"], ["Head of household", "headOfHousehold"], ["Grants", "grants"], ["Any grant", "anyGrant"],
    ["Prior training", "priorTraining"], ["Prior training detail", "priorTrainingDetail"], ["Heard about us", "heardAbout"], ["Motivation", "motivation"],
    ["Years in area", "yearsInArea"], ["Lives with", "livingWith"], ["Relationship status", "maritalStatus"], ["Parents alive", "orphanhood"], ["Orphan", "orphan"],
    ["Has children", "hasChildren"], ["Number of children", "numChildren"], ["Main income source", "incomeSource"], ["Hunger past 4 weeks", "hunger"], ["Food insecure", "foodInsecure"],
    ["English comfort", "englishComfort"], ["Previous Sozo", "previousSozo"], ["Bank account", "bankAccount"], ["Has CV", "hasCV"], ["Driver's licence", "licence"], ["Job-seeker registration", "jobseeker"],
    ["Score total", "scoreTotal"], ["Fit", "fit"], ["Interest", "scoreInterest"], ["Judgement", "scoreJudgement"], ["Knowledge (pre-test)", "scoreKnowledge"], ["Readiness", "scoreReadiness"], ["Flags", "flags"],
    ["Status", "status"], ["Status message", "statusMessage"], ["Fee status", "feeStatus"], ["Fee date", "feeDate"], ["Receipt no.", "feeReceipt"], ["Fee recorded by", "feeRecordedBy"],
    ["Possible duplicate", "possibleDuplicate"], ["POPIA consent", "consent"], ["Follow-up consent", "followUpConsent"], ["Last updated", "updated"], ["Updated by", "updatedBy"], ["Answers (JSON)", "answers"]
  ];
  const NUMERIC = ["age", "householdSize", "dependants", "scoreTotal", "scoreInterest", "scoreJudgement", "scoreKnowledge", "scoreReadiness"];
  function sheetFor(rows) {
    const aoa = [COLS.map(c => c[0])].concat(rows.map(r => COLS.map(c => NUMERIC.includes(c[1]) ? +r[c[1]] || 0 : String(r[c[1]] == null ? "" : r[c[1]]))));
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = COLS.map(c => ({ wch: c[1] === "motivation" || c[1] === "answers" ? 50 : Math.max(11, c[0].length + 2) }));
    ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: COLS.length - 1 } }) };
    return ws;
  }
  function indicatorSheet() {
    const aoa = [["Sozo Skills Programme – baseline M&E indicators"], ["Exported", new Date().toLocaleString("en-ZA")], [],
      ["Indicator", "Definition"].concat(...PROGS.map(p => [p + " (n)", p + " (%)"]), ["All (n)", "All (%)"])];
    INDICATORS.forEach(ind => {
      if (ind.group) { aoa.push([], [ind.group]); return; }
      const cell = rows => { const c = indicatorCell(ind, rows); return [c.n, c.pct != null ? c.pct : ""]; };
      aoa.push([ind.label, ind.def || ""].concat(...PROGS.map(p => cell(all.filter(a => a.programme === p))), cell(all)));
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 44 }, { wch: 40 }].concat(Array(PROGS.length * 2 + 2).fill({ wch: 13 }));
    return ws;
  }
  function summarySheet() {
    const aoa = [["Sozo Skills Programme – recruitment summary"], ["Exported", new Date().toLocaleString("en-ZA")], [],
      ["School", "Total", "Aged 16–20", "Aged 21–35", "Female", "Male", "Strong fit", "Avg score", "Accepted", "Fees paid", "R collected"]];
    const line = (name, r) => [name, r.length, r.filter(a => a.ageGroup === "16–20").length, r.filter(a => a.ageGroup === "21–35").length,
      r.filter(a => a.gender === "Female").length, r.filter(a => a.gender === "Male").length, r.filter(a => a.fit === "Strong fit").length,
      avg(r, "scoreTotal"), r.filter(a => a.status === "Accepted").length, r.filter(a => a.feeStatus === "Paid").length, r.filter(a => a.feeStatus === "Paid").length * C.FEE_AMOUNT];
    PROGS.forEach(p => aoa.push(line(p, all.filter(a => a.programme === p))));
    aoa.push(line("Total", all));
    const block = (title, fn) => {
      aoa.push([], [title, ...PROGS, "Total"]);
      const m = countBy(all, fn);
      [...m.keys()].sort().forEach(k => aoa.push([k, ...PROGS.map(p => all.filter(a => a.programme === p && (fn(a) || "Not given") === k).length), m.get(k)]));
    };
    block("Area", areaOf); block("Population group", r => r.race); block("Religion", r => r.religion); block("Age group", r => r.ageGroup); block("Nationality", r => r.nationality);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 30 }].concat(Array(10).fill({ wch: 14 }));
    return ws;
  }
  function exportExcel(onlyProg) {
    if (typeof XLSX === "undefined") { toast("Excel library did not load. Check your internet connection."); return; }
    const wb = XLSX.utils.book_new();
    const day = new Date().toISOString().slice(0, 10);
    try {
      if (onlyProg) {
        XLSX.utils.book_append_sheet(wb, sheetFor(all.filter(a => a.programme === onlyProg).sort((a, b) => b.scoreTotal - a.scoreTotal)), onlyProg.slice(0, 31));
        XLSX.writeFile(wb, "Sozo " + onlyProg + " applicants " + day + ".xlsx");
      } else {
        XLSX.utils.book_append_sheet(wb, summarySheet(), "Summary");
        XLSX.utils.book_append_sheet(wb, indicatorSheet(), "M&E indicators");
        XLSX.utils.book_append_sheet(wb, sheetFor(all), "All applications");
        PROGS.forEach(p => XLSX.utils.book_append_sheet(wb, sheetFor(all.filter(a => a.programme === p).sort((a, b) => b.scoreTotal - a.scoreTotal)), p.slice(0, 31)));
        XLSX.writeFile(wb, "Sozo Skills Programme applications " + day + ".xlsx");
      }
      toast("Excel file downloaded");
    } catch (e) { toast("Could not create the Excel file."); }
  }
  $("exportBtn").addEventListener("click", () => exportExcel(progFilter || null));

  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
  }

  /* ---------- Boot ---------- */
  setView("overview");
  session = loadSession();
  if (session) start();
})();
