/* Applicant site logic */
(function () {
  "use strict";
  const C = window.SOZO_CONFIG, S = window.Sozo, A = window.SOZO_ASSESSMENT, esc = S.esc;
  const $ = id => document.getElementById(id);
  const TOTAL_STEPS = 7;

  const ICONS = {
    coffee: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/></svg>',
    bake: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a8 5 0 0 1 16 0v1H4z"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/><path d="M9 8.5l1 2M14 8.5l-1 2"/></svg>',
    beauty: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/><path d="M5 16l.6 1.4L7 18l-1.4.6L5 20l-.6-1.4L3 18l1.4-.6z"/></svg>',
    hair: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/></svg>'
  };

  /* ---------- Static content ---------- */
  if (S.DEMO) $("demoBanner").hidden = false;
  $("intakeName").textContent = C.INTAKE_NAME;
  $("year").textContent = new Date().getFullYear();
  $("feeText").textContent = C.FEE_TEXT;
  const closing = new Date(C.CLOSING_DATE);
  const closingText = closing.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" }) + ", 23:59";
  $("closingText").textContent = closingText;
  $("closedOn").textContent = closingText;
  const contacts = [];
  if (C.CONTACT_PHONE) contacts.push("Call " + esc(C.CONTACT_PHONE));
  if (C.CONTACT_EMAIL) contacts.push("Email " + esc(C.CONTACT_EMAIL));
  $("contactLine").innerHTML = contacts.join(" · ");

  $("navToggle").addEventListener("click", () => {
    const open = $("nav").classList.toggle("open");
    $("navToggle").setAttribute("aria-expanded", open);
  });
  $("nav").addEventListener("click", e => { if (e.target.tagName === "A") $("nav").classList.remove("open"); });

  $("programmeGrid").innerHTML = C.PROGRAMMES.map(p => `
    <article class="programme-card">
      <div class="p-icon">${ICONS[p.icon] || ""}</div>
      <h3>${esc(p.name)}</h3>
      <p class="tagline">${esc(p.tagline)}</p>
      <p>${esc(p.description)}</p>
      <strong>What you will learn</strong>
      <ul>${p.learn.map(l => "<li>" + esc(l) + "</li>").join("")}</ul>
      <div class="meta">
        <p><strong>Who it's for:</strong> ${esc(p.ideal)}</p>
        <p><strong>Duration:</strong> ${esc(p.duration)}</p>
        <p><strong>Registration fee:</strong> R${C.FEE_AMOUNT}, payable only if shortlisted</p>
      </div>
      <a href="#apply" class="btn btn-outline apply-for" data-prog="${esc(p.name)}">Apply for ${esc(p.name)}</a>
    </article>`).join("");

  $("programmeChoices").innerHTML = C.PROGRAMMES.map((p, i) => `
    <div class="choice">
      <input type="radio" name="programme" id="prog${i}" value="${esc(p.name)}">
      <label for="prog${i}"><span class="p-icon">${ICONS[p.icon] || ""}</span><span><strong>${esc(p.name)}</strong><br><small style="color:var(--muted)">${esc(p.tagline)}</small></span></label>
    </div>`).join("");

  let current = 1;
  document.querySelectorAll(".apply-for").forEach(a => a.addEventListener("click", () => {
    const r = document.querySelector('input[name=programme][value="' + a.dataset.prog + '"]');
    if (r && current === 1) r.checked = true;
  }));

  function fillSelect(id, items, selected) {
    $(id).innerHTML = '<option value="">Select…</option>' + items.map(i => `<option${i === selected ? " selected" : ""}>${esc(i)}</option>`).join("");
  }
  fillSelect("nationality", C.NATIONALITIES); fillSelect("docType", C.DOC_TYPES); fillSelect("gender", C.GENDERS);
  fillSelect("preferredContact", C.CONTACT_METHODS); fillSelect("deviceAccess", C.DEVICE_ACCESS);
  fillSelect("homeLanguage", C.LANGUAGES); fillSelect("race", C.RACES); fillSelect("religion", C.RELIGIONS);
  fillSelect("province", C.PROVINCES, "Western Cape"); fillSelect("area", C.AREAS); fillSelect("dwelling", C.DWELLINGS);
  fillSelect("education", C.EDUCATION); fillSelect("employment", C.EMPLOYMENT); fillSelect("lastWorked", C.LAST_WORKED);
  fillSelect("personalIncome", C.INCOME_BANDS); fillSelect("householdIncome", C.INCOME_BANDS); fillSelect("heardAbout", C.HEARD_ABOUT);
  fillSelect("yearsInArea", C.YEARS_IN_AREA); fillSelect("livingWith", C.LIVING_WITH); fillSelect("maritalStatus", C.MARITAL);
  fillSelect("orphanhood", C.ORPHANHOOD); fillSelect("incomeSource", C.INCOME_SOURCES); fillSelect("hunger", C.HUNGER);
  fillSelect("englishComfort", C.ENGLISH_COMFORT); fillSelect("previousSozo", C.PREVIOUS_SOZO); fillSelect("licence", C.LICENCE);

  // Date of birth as three drop-downs (works on every phone and browser)
  (function () {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const y = new Date().getFullYear();
    $("dobDay").innerHTML = '<option value="">Day</option>' + Array.from({ length: 31 }, (_, i) => `<option value="${String(i + 1).padStart(2, "0")}">${i + 1}</option>`).join("");
    $("dobMonth").innerHTML = '<option value="">Month</option>' + months.map((m, i) => `<option value="${String(i + 1).padStart(2, "0")}">${m}</option>`).join("");
    $("dobYear").innerHTML = '<option value="">Year</option>' + Array.from({ length: C.MAX_AGE - C.MIN_AGE + 4 }, (_, i) => y - C.MIN_AGE + 1 - i).map(v => `<option>${v}</option>`).join("");
    const sync = () => {
      const d = $("dobDay").value, m = $("dobMonth").value, yr = $("dobYear").value;
      $("dob").value = d && m && yr ? yr + "-" + m + "-" + d : "";
      docCheck();
    };
    ["dobDay", "dobMonth", "dobYear"].forEach(id => $(id).addEventListener("change", sync));
  })();

  // Job-seeker registrations
  $("jobseekerBlock").innerHTML = C.JOBSEEKER.map((g, i) =>
    `<label class="checkbox"><input type="checkbox" name="jobseeker" id="js${i}" value="${esc(g)}"><span>${esc(g)}</span></label>`).join("");
  const noneIdx = C.JOBSEEKER.indexOf("None");
  $("jobseekerBlock").addEventListener("change", e => {
    if (e.target.value === "None" && e.target.checked) document.querySelectorAll("input[name=jobseeker]").forEach(c => { if (c !== e.target) c.checked = false; });
    else if (e.target.checked && noneIdx >= 0) $("js" + noneIdx).checked = false;
  });
  $("hasChildren").addEventListener("change", () => { $("numChildrenField").hidden = $("hasChildren").value !== "Yes"; });

  // Washington Group questions
  $("wgBlock").innerHTML = C.WG_QUESTIONS.map(w => `
    <div class="wg-q q-card" id="card-${w.key}">
      <span class="q-text">${esc(w.q)} <span class="req">*</span></span>
      <div class="q-opts">${C.WG_ANSWERS.map((a, i) => `<div class="q-opt"><input type="radio" name="${w.key}" id="${w.key}${i}" value="${esc(a)}"><label for="${w.key}${i}">${esc(a)}</label></div>`).join("")}</div>
    </div>`).join("");

  // Grants
  $("grantsBlock").innerHTML = ["No grants"].concat(C.GRANTS).map((g, i) =>
    `<label class="checkbox"><input type="checkbox" name="grants" id="grant${i}" value="${esc(g)}"><span>${esc(g)}</span></label>`).join("");
  $("grantsBlock").addEventListener("change", e => {
    if (e.target.value === "No grants" && e.target.checked) document.querySelectorAll("input[name=grants]").forEach(c => { if (c !== e.target) c.checked = false; });
    else if (e.target.checked) $("grant0").checked = false;
  });

  $("area").addEventListener("change", () => { $("areaOtherField").hidden = $("area").value !== "Other"; });
  $("priorTraining").addEventListener("change", () => { $("priorDetailField").hidden = $("priorTraining").value !== "Yes"; });
  $("motivation").addEventListener("input", () => { $("motCount").textContent = $("motivation").value.length; });

  /* ---------- Countdown ---------- */
  let timer;
  function tick() {
    const diff = closing.getTime() - Date.now();
    if (diff <= 0) { setClosed(); clearInterval(timer); return; }
    $("cdDays").textContent = Math.floor(diff / 864e5);
    $("cdHours").textContent = String(Math.floor(diff / 36e5) % 24).padStart(2, "0");
    $("cdMins").textContent = String(Math.floor(diff / 6e4) % 60).padStart(2, "0");
    $("cdSecs").textContent = String(Math.floor(diff / 1e3) % 60).padStart(2, "0");
  }
  function setClosed() {
    $("countdownOpen").hidden = true; $("countdownClosed").hidden = false;
    if ($("successPanel").hidden) { $("formPanel").hidden = true; $("formClosed").hidden = false; }
    $("heroApply").textContent = "Applications closed"; $("heroApply").href = "#status";
    $("navApply").textContent = "Closed"; $("navApply").href = "#status";
  }
  tick(); timer = setInterval(tick, 1000);

  /* ---------- Identity document ---------- */
  function normalisePhone(v) {
    let d = String(v || "").replace(/[^\d+]/g, "");
    if (d.startsWith("+27")) d = "0" + d.slice(3);
    else if (d.startsWith("27") && d.length === 11) d = "0" + d.slice(2);
    return /^0\d{9}$/.test(d) ? d : null;
  }

  function updateDocUI() {
    const t = $("docType").value, isSA = t === "South African ID";
    $("dobField").hidden = !t || isSA;
    $("docNumber").inputMode = isSA ? "numeric" : "text";
    $("docNumber").maxLength = isSA ? 13 : 30;
    $("docNumberLabel").innerHTML = (isSA ? "SA ID number" : t ? t.replace(/ \(.*\)/, "") + " number" : "Document number") + ' <span class="req">*</span>';
    $("docHint").textContent = isSA ? "13 digits. Used to check your age and to make sure each person applies only once."
      : "Type the number exactly as it appears on your document. It is used to make sure each person applies only once.";
    idState.checkedKey = null;
    docCheck();
  }
  $("nationality").addEventListener("change", () => {
    if (!$("docType").value) $("docType").value = $("nationality").value === "South Africa" ? "South African ID" : "";
    updateDocUI();
  });
  $("docType").addEventListener("change", updateDocUI);

  let idState = { checkedKey: null, exists: false };
  function docCheck() {
    const t = $("docType").value, pv = $("idPreview");
    if (t === "South African ID") $("docNumber").value = $("docNumber").value.replace(/\D/g, "");
    const raw = $("docNumber").value.trim();
    if (!t || !raw || (t === "South African ID" && raw.length < 13) || (t !== "South African ID" && !$("dob").value)) { pv.textContent = ""; return null; }
    const info = S.parseDocument(t, raw, $("dob").value);
    if (!info.valid) { pv.className = "id-preview bad"; pv.textContent = info.error; return info; }
    if (info.age < C.MIN_AGE || info.age > C.MAX_AGE) {
      pv.className = "id-preview bad";
      pv.textContent = "You are " + info.age + " years old. This programme is for ages " + C.MIN_AGE + " to " + C.MAX_AGE + ".";
      return Object.assign({}, info, { valid: false, error: pv.textContent });
    }
    pv.className = "id-preview";
    pv.textContent = "✓ Age " + info.age + " (age group " + S.ageGroup(info.age) + ")";
    if (info.gender && !$("gender").value) $("gender").value = info.gender;
    return info;
  }
  $("docNumber").addEventListener("input", docCheck);

  /* ---------- Assessment ---------- */
  let assessFor = null;
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const SECTION_TITLES = { interest: "Part A – About you", judgement: "Part B – At work: what would you do?", knowledge: "Part C – Quick questions (no experience needed)", readiness: "Part D – Getting ready for training" };

  function renderAssessment() {
    const prog = programmeValue();
    if (assessFor === prog) return;
    assessFor = prog;
    $("assessTitle").textContent = prog + " assessment";
    const qs = A.build(prog);
    let html = "", lastSection = "", n = 0;
    qs.forEach(q => {
      if (q.section !== lastSection) { html += `<span class="section-tag">${SECTION_TITLES[q.section]}</span>`; lastSection = q.section; }
      n++;
      const opts = (q.section === "judgement" || q.section === "knowledge") ? shuffle(q.options) : q.options;
      const likert = q.section === "interest";
      html += `<div class="q-card" id="qc-${q.id}"><span class="q-num">Question ${n} of ${qs.length}</span>
        <span class="q-text">${likert ? "“" + esc(q.q) + "”" : esc(q.q)}</span>
        <div class="q-opts${likert ? " likert" : ""}">${opts.map((o, i) =>
          `<div class="q-opt"><input type="radio" name="as_${q.id}" id="as_${q.id}_${i}" value="${esc(o[0])}"><label for="as_${q.id}_${i}">${esc(o[0])}</label></div>`).join("")}</div></div>`;
    });
    $("assessBlock").innerHTML = html;
  }
  function assessmentAnswers() {
    const out = {};
    A.build(programmeValue()).forEach(q => { const c = document.querySelector(`input[name="as_${q.id}"]:checked`); if (c) out[q.id] = c.value; });
    return out;
  }

  /* ---------- Wizard ---------- */
  const form = $("appForm");
  const programmeValue = () => (form.querySelector("input[name=programme]:checked") || {}).value || "";

  function setError(el, on, msg) {
    const f = el.closest(".field") || el.closest(".q-card");
    if (!f) return;
    f.classList.toggle("invalid", on);
    if (msg) { const m = f.querySelector(".error-msg"); if (m) m.textContent = msg; }
  }

  function validateStep(step) {
    let ok = true, first = null;
    const fail = (el, msg) => { setError(el, true, msg); ok = false; if (!first) first = el; };
    const pass = el => setError(el, false);
    const val = id => $(id).value.trim();
    const need = ids => ids.forEach(id => val(id) ? pass($(id)) : fail($(id)));

    if (step === 1) {
      const chosen = programmeValue();
      form.querySelector('[data-for="programme"]').classList.toggle("invalid", !chosen);
      if (!chosen) { ok = false; first = form.querySelector("input[name=programme]"); }
    }
    if (step === 2) {
      ["firstName", "surname"].forEach(id => val(id).length >= 2 ? pass($(id)) : fail($(id)));
      need(["nationality", "docType"]);
      if (val("docType") && val("docType") !== "South African ID") {
        if (val("dob")) pass($("dobDay")); else { setError($("dobDay"), true); ok = false; if (!first) first = $("dobDay"); }
      }
      const info = docCheck();
      if (!info || !info.valid) fail($("docNumber"), info && info.error ? info.error : "Please enter a valid document number.");
      else pass($("docNumber"));
      need(["gender", "preferredContact", "deviceAccess"]);
      normalisePhone(val("phone")) ? pass($("phone")) : fail($("phone"));
      (!val("altPhone") || normalisePhone(val("altPhone"))) ? pass($("altPhone")) : fail($("altPhone"));
      (!val("email") || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val("email"))) ? pass($("email")) : fail($("email"));
    }
    if (step === 3) {
      need(["homeLanguage", "race", "religion", "province", "area", "dwelling", "yearsInArea", "livingWith", "maritalStatus", "orphanhood"]);
      val("municipality").length >= 2 ? pass($("municipality")) : fail($("municipality"));
      if (val("area") === "Other") val("areaOther").length >= 2 ? pass($("areaOther")) : fail($("areaOther"));
      C.WG_QUESTIONS.forEach(w => {
        const c = $("card-" + w.key), done = !!document.querySelector(`input[name=${w.key}]:checked`);
        c.classList.toggle("invalid", !done);
        if (!done) { ok = false; if (!first) first = c.querySelector("input"); }
      });
    }
    if (step === 4) {
      need(["headOfHousehold", "hasChildren", "householdIncome", "incomeSource", "hunger"]);
      const hs = +val("householdSize"), dp = val("dependants");
      (hs >= 1 && hs <= 30) ? pass($("householdSize")) : fail($("householdSize"));
      (dp !== "" && +dp >= 0 && +dp <= 20) ? pass($("dependants")) : fail($("dependants"));
      if (val("hasChildren") === "Yes") { const nc = +val("numChildren"); (nc >= 1 && nc <= 15) ? pass($("numChildren")) : fail($("numChildren")); }
      const anyGrant = document.querySelectorAll("input[name=grants]:checked").length > 0;
      $("grantsField").classList.toggle("invalid", !anyGrant);
      if (!anyGrant) { ok = false; if (!first) first = $("grant0"); }
    }
    if (step === 5) {
      need(["education", "inEducation", "employment", "lastWorked", "personalIncome", "englishComfort", "priorTraining", "previousSozo", "bankAccount", "hasCV", "licence", "heardAbout"]);
      const anyJs = document.querySelectorAll("input[name=jobseeker]:checked").length > 0;
      $("jobseekerField").classList.toggle("invalid", !anyJs);
      if (!anyJs) { ok = false; if (!first) first = $("js0"); }
      val("motivation").length >= 30 ? pass($("motivation")) : fail($("motivation"));
    }
    if (step === 6) {
      const ans = assessmentAnswers();
      A.build(programmeValue()).forEach(q => {
        const c = $("qc-" + q.id), done = ans[q.id] != null;
        c.classList.toggle("invalid", !done);
        if (!done) { ok = false; if (!first) first = c.querySelector("input"); }
      });
      if (!ok) showAlert("error", "Please answer every question. Unanswered questions are marked in red.");
    }
    if (step === 7) {
      $("feeAck").checked ? pass($("feeAck")) : fail($("feeAck"));
      $("consent").checked ? pass($("consent")) : fail($("consent"));
    }
    if (first) first.focus();
    return ok;
  }

  function showAlert(type, html) {
    $("formAlert").innerHTML = html ? `<div class="alert alert-${type}">${html}</div>` : "";
    if (html) $("formAlert").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function goTo(step) {
    current = step;
    if (step === 6) renderAssessment();
    form.querySelectorAll("fieldset").forEach(fs => { fs.hidden = +fs.dataset.step !== step; });
    document.querySelectorAll(".stepper div").forEach(d => {
      const n = +d.dataset.step;
      d.className = n === step ? "active" : n < step ? "done" : "";
    });
    $("stepCount").textContent = "Step " + step + " of " + TOTAL_STEPS;
    $("backBtn").hidden = step === 1;
    $("nextBtn").hidden = step === TOTAL_STEPS;
    $("submitBtn").hidden = step !== TOTAL_STEPS;
    if (step === TOTAL_STEPS) buildReview();
    $("formPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function data() {
    const v = id => $(id).value.trim();
    const radio = n => (document.querySelector(`input[name=${n}]:checked`) || {}).value || "";
    const doc = S.parseDocument(v("docType"), v("docNumber"), v("dob"));
    const grants = [...document.querySelectorAll("input[name=grants]:checked")].map(c => c.value);
    const answers = assessmentAnswers();
    const sc = A.score(programmeValue(), answers);
    const d = {
      programme: programmeValue(), firstName: v("firstName"), surname: v("surname"),
      nationality: v("nationality"), docType: v("docType"), docNumber: v("docNumber"), dob: doc.valid ? doc.dobText : v("dob"),
      gender: v("gender"), phone: normalisePhone(v("phone")) || "", altPhone: normalisePhone(v("altPhone")) || "",
      email: v("email").toLowerCase(), preferredContact: v("preferredContact"), deviceAccess: v("deviceAccess"),
      homeLanguage: v("homeLanguage"), race: v("race"), religion: v("religion"), province: v("province"),
      municipality: v("municipality"), area: v("area"), areaOther: v("area") === "Other" ? v("areaOther") : "", ward: v("ward"),
      dwelling: v("dwelling"), supportNeeds: v("supportNeeds"),
      education: v("education"), inEducation: v("inEducation"), employment: v("employment"), lastWorked: v("lastWorked"),
      personalIncome: v("personalIncome"), householdIncome: v("householdIncome"), householdSize: v("householdSize"),
      dependants: v("dependants"), headOfHousehold: v("headOfHousehold"),
      grants: grants.includes("No grants") ? "None" : grants.join(", "),
      priorTraining: v("priorTraining"), priorTrainingDetail: v("priorTraining") === "Yes" ? v("priorTrainingDetail") : "",
      motivation: v("motivation"), heardAbout: v("heardAbout"),
      yearsInArea: v("yearsInArea"), livingWith: v("livingWith"), maritalStatus: v("maritalStatus"), orphanhood: v("orphanhood"),
      hasChildren: v("hasChildren"), numChildren: v("hasChildren") === "Yes" ? v("numChildren") : "0",
      incomeSource: v("incomeSource"), hunger: v("hunger"), englishComfort: v("englishComfort"), previousSozo: v("previousSozo"),
      bankAccount: v("bankAccount"), hasCV: v("hasCV"), licence: v("licence"),
      jobseeker: [...document.querySelectorAll("input[name=jobseeker]:checked")].map(c => c.value).join(", "),
      scoreInterest: sc.interest, scoreJudgement: sc.judgement, scoreKnowledge: sc.knowledge, scoreReadiness: sc.readiness,
      scoreTotal: sc.total, fit: sc.fit, flags: sc.flags.join("; "), answers: JSON.stringify(answers),
      feeAcknowledged: $("feeAck").checked, consent: $("consent").checked, followUpConsent: $("followUpConsent").checked ? "Yes" : "No"
    };
    C.WG_QUESTIONS.forEach(w => { d[w.key] = radio(w.key); });
    if (doc.valid) d.age = doc.age;
    return d;
  }

  function buildReview() {
    const d = data();
    const rows = [
      ["School", d.programme], ["Name", d.firstName + " " + d.surname], ["Nationality", d.nationality],
      [d.docType, d.docNumber], ["Age", d.age != null ? d.age + " (" + S.ageGroup(d.age) + ")" : ""], ["Gender", d.gender],
      ["Cellphone", d.phone], ["Contact by", d.preferredContact], ["Email", d.email || "—"],
      ["Lives in", (d.area === "Other" ? d.areaOther : d.area) + ", " + d.municipality + ", " + d.province],
      ["Education", d.education], ["Work situation", d.employment], ["Household", d.householdSize + " people, " + d.householdIncome + " per month"],
      ["Lives with", d.livingWith], ["Children", d.hasChildren === "Yes" ? d.numChildren : d.hasChildren],
      ["Assessment", "Completed ✓"]
    ];
    $("reviewList").innerHTML = rows.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join("");
  }

  $("nextBtn").addEventListener("click", async () => {
    showAlert();
    if (!validateStep(current)) return;
    if (current === 2) {
      const info = docCheck();
      if (idState.checkedKey !== info.key) {
        const btn = $("nextBtn"); btn.disabled = true; btn.textContent = "Checking…";
        try {
          const r = await S.api("checkId", { docType: $("docType").value, docNumber: $("docNumber").value, dob: $("dob").value });
          idState = { checkedKey: info.key, exists: !!(r && r.exists) };
        } catch (e) { idState = { checkedKey: null, exists: false }; }
        btn.disabled = false; btn.textContent = "Continue";
      }
      if (idState.exists) {
        setError($("docNumber"), true, "This document number has already been used to apply.");
        showAlert("error", "<strong>You have already applied.</strong> Only one application per person is allowed for this intake. Please <a href=\"#status\">check your status</a> instead.");
        return;
      }
    }
    goTo(current + 1);
  });
  $("backBtn").addEventListener("click", () => { showAlert(); goTo(current - 1); });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    showAlert();
    if (!validateStep(TOTAL_STEPS)) return;
    if (S.isClosed()) { setClosed(); return; }
    const btn = $("submitBtn");
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Submitting…';
    try {
      const d = data();
      const r = await S.api("submit", d);
      if (r.ok) {
        $("formPanel").hidden = true;
        $("sucName").textContent = d.firstName;
        $("sucProg").textContent = r.programme || d.programme;
        $("sucRef").textContent = r.reference;
        $("successPanel").hidden = false;
        $("successPanel").scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (r.duplicate) {
        showAlert("error", "<strong>You have already applied.</strong> Only one application per person is allowed. Please <a href=\"#status\">check your status</a> instead.");
      } else {
        showAlert("error", esc(r.error || "Something went wrong. Please try again."));
      }
    } catch (err) {
      showAlert("error", "We could not submit your application. Please check your internet connection and try again.");
    }
    btn.disabled = false; btn.textContent = "Submit application";
  });

  /* ---------- Status check ---------- */
  const BADGE = { "Received": "b-received", "Under review": "b-review", "Shortlisted": "b-short", "Interview scheduled": "b-interview", "Accepted": "b-accepted", "Waiting list": "b-wait", "Not successful": "b-no" };
  const FEE_DUE = ["Shortlisted", "Interview scheduled", "Accepted"];

  $("statusForm").addEventListener("submit", async e => {
    e.preventDefault();
    const idEl = $("stId"), snEl = $("stSurname"), out = $("statusResult");
    let ok = true;
    if (idEl.value.replace(/[^A-Za-z0-9]/g, "").length < 5) { setError(idEl, true); ok = false; } else setError(idEl, false);
    if (snEl.value.trim().length < 2) { setError(snEl, true); ok = false; } else setError(snEl, false);
    if (!ok) return;
    const btn = $("statusBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Checking…';
    try {
      const r = await S.api("status", { docNumber: idEl.value.trim(), surname: snEl.value.trim() });
      if (r.ok) {
        const a = r.application;
        const msg = a.statusMessage || C.STATUS_INFO[a.status] || "";
        let fee = "";
        if (FEE_DUE.includes(a.status)) {
          fee = a.feeStatus === "Paid" ? '<dt>Registration fee</dt><dd><span class="badge b-accepted">Paid</span></dd>'
            : a.feeStatus === "Waived" ? '<dt>Registration fee</dt><dd><span class="badge b-accepted">Not required</span></dd>'
            : `<dt>Registration fee</dt><dd><span class="badge b-short">R${C.FEE_AMOUNT} due</span><br><span style="font-weight:400;font-size:14px">Pay at the Sozo office. Bring your reference number and ID or document.</span></dd>`;
        }
        out.innerHTML = `
          <div class="alert alert-info" style="margin:0">
            <p style="margin-bottom:8px">Hi <strong>${esc(a.firstName)}</strong>, here is your application:</p>
            <dl class="review-list" style="grid-template-columns:140px 1fr;margin-bottom:10px">
              <dt>Reference</dt><dd>${esc(a.reference)}</dd>
              <dt>School</dt><dd>${esc(a.programme)}</dd>
              <dt>Submitted</dt><dd>${esc(a.submitted)}</dd>
              <dt>Status</dt><dd><span class="badge ${BADGE[a.status] || "b-received"}">${esc(a.status)}</span></dd>
              ${fee}
            </dl>
            <p style="margin:0">${esc(msg)}</p>
          </div>`;
      } else if (r.notFound) {
        out.innerHTML = '<div class="alert alert-warn" style="margin:0">We could not find an application with these details. Check that your document number and surname are exactly as you entered them on your application.</div>';
      } else {
        out.innerHTML = `<div class="alert alert-error" style="margin:0">${esc(r.error || "Something went wrong. Please try again.")}</div>`;
      }
    } catch (err) {
      out.innerHTML = '<div class="alert alert-error" style="margin:0">We could not reach the server. Please check your connection and try again.</div>';
    }
    btn.disabled = false; btn.textContent = "Check status";
  });
})();
