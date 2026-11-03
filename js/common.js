/* Shared helpers: document validation, M&E derivations, API calls, demo backend. */
(function () {
  "use strict";
  const C = window.SOZO_CONFIG;

  /* ---------- Identity documents ---------- */
  function luhnValid(id) {
    let sum = 0;
    for (let i = 0; i < id.length; i++) {
      let d = +id[id.length - 1 - i];
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return sum % 10 === 0;
  }

  function ageOn(dob, date) {
    let age = date.getFullYear() - dob.getFullYear();
    const m = date.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && date.getDate() < dob.getDate())) age--;
    return age;
  }
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());

  function parseSAID(raw) {
    const id = String(raw || "").replace(/\s/g, "");
    if (!/^\d{13}$/.test(id)) return { valid: false, error: "An SA ID number has exactly 13 digits." };
    if (!luhnValid(id)) return { valid: false, error: "This ID number is not valid. Please check it carefully." };
    const yy = +id.slice(0, 2), mm = +id.slice(2, 4), dd = +id.slice(4, 6);
    const year = yy > new Date().getFullYear() % 100 ? 1900 + yy : 2000 + yy;
    const dob = new Date(year, mm - 1, dd);
    if (dob.getFullYear() !== year || dob.getMonth() !== mm - 1 || dob.getDate() !== dd) {
      return { valid: false, error: "The date of birth in this ID number is not valid." };
    }
    return {
      valid: true, number: id, dob: dob, dobText: ymd(dob), age: ageOn(dob, new Date()),
      gender: +id.slice(6, 10) < 5000 ? "Female" : "Male",
      citizenship: id[10] === "0" ? "SA citizen" : "Permanent resident"
    };
  }

  /* Returns {valid, number, key, dob, dobText, age, gender?, citizenship} */
  function parseDocument(docType, raw, dobInput) {
    if (docType === "South African ID") {
      const r = parseSAID(raw);
      if (r.valid) r.key = "SAID:" + r.number;
      return r;
    }
    if (!docType) return { valid: false, error: "Please choose your document type." };
    const number = String(raw || "").toUpperCase().replace(/[^A-Z0-9/-]/g, "");
    const core = number.replace(/[^A-Z0-9]/g, "");
    if (core.length < 5 || core.length > 25) return { valid: false, error: "Please enter your full document number exactly as it appears on the document." };
    if (!dobInput) return { valid: false, error: "Please enter your date of birth.", needDob: true };
    const dob = new Date(dobInput + "T12:00:00");
    if (isNaN(dob) || dob > new Date()) return { valid: false, error: "Please enter a valid date of birth.", needDob: true };
    const typeCode = docType.startsWith("Passport") ? "PASS" : docType.startsWith("Asylum") ? "ASYL" : "REFU";
    return { valid: true, number: number, key: typeCode + ":" + core, dob: dob, dobText: ymd(dob), age: ageOn(dob, new Date()),
      citizenship: docType.startsWith("Refugee") ? "Refugee" : docType.startsWith("Asylum") ? "Asylum seeker" : "Foreign national" };
  }

  function ageGroup(age) {
    if (age >= 16 && age <= 20) return "16–20";
    if (age >= 21 && age <= 35) return "21–35";
    return "Other";
  }

  /* ---------- M&E derived indicators ---------- */
  function derive(r) {
    const wg = C.WG_QUESTIONS.map(q => r[q.key]);
    r.disability = wg.some(v => v === "A lot of difficulty" || v === "Cannot do at all") ? "Yes" : "No";
    const employed = C.EMPLOYED_VALUES.indexOf(r.employment) >= 0;
    const learning = r.inEducation === "Yes" || r.employment === "Full-time learner or student";
    r.employed = employed ? "Yes" : "No";
    r.neet = !employed && !learning ? "Yes" : "No";
    r.anyGrant = r.grants && r.grants !== "None" ? "Yes" : "No";
    r.foreignNational = r.nationality && r.nationality !== "South Africa" ? "Yes" : "No";
    r.ageGroup = ageGroup(+r.age);
    r.foodInsecure = /^(Sometimes|Often|Very often)/.test(r.hunger || "") ? "Yes" : "No";
    r.orphan = /passed away/.test(r.orphanhood || "") ? "Yes" : "No";
    return r;
  }

  function isClosed() { return Date.now() > new Date(C.CLOSING_DATE).getTime(); }

  /* ---------- API ---------- */
  const DEMO = !C.API_URL;

  async function api(action, payload) {
    if (DEMO) return demoBackend(action, payload || {});
    const res = await fetch(C.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },   // avoids a CORS pre-flight
      body: JSON.stringify(Object.assign({ action: action }, payload || {}))
    });
    if (!res.ok) throw new Error("The server could not be reached (" + res.status + ").");
    return res.json();
  }

  /* ---------- Demo backend (browser storage only) ---------- */
  const KEY = "sozo_demo_applications_v3";
  const DEMO_ADMINS = { admin1: "Admin One", admin2: "Admin Two", admin3: "Admin Three" };

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(rows) { try { localStorage.setItem(KEY, JSON.stringify(rows)); } catch (e) { /* ignore */ } }

  function makeRef(rows) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s;
    do { s = "SZ27-"; for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]; }
    while (rows && rows.some(r => r.reference === s));
    return s;
  }
  function nowStamp() { const d = new Date(); return ymd(d) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }

  function docKeyOf(r) {
    const p = parseDocument(r.docType, r.docNumber, r.dob);
    return p.valid ? p.key : null;
  }
  function findByDoc(rows, number) {
    const core = String(number || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return rows.find(r => String(r.docNumber).toUpperCase().replace(/[^A-Z0-9]/g, "") === core);
  }

  async function demoBackend(action, p) {
    await new Promise(r => setTimeout(r, 300));
    const rows = load();
    const authed = String(p.token || "").startsWith("demo-");
    switch (action) {
      case "submit": {
        if (isClosed()) return { ok: false, error: "Applications are closed." };
        const doc = parseDocument(p.docType, p.docNumber, p.dob);
        if (!doc.valid) return { ok: false, error: doc.error };
        if (rows.some(r => docKeyOf(r) === doc.key)) {
          return { ok: false, duplicate: true, error: "An application with this document number already exists. Only one application per person is allowed." };
        }
        const twin = rows.find(r => r.dob === doc.dobText && r.surname.toLowerCase() === String(p.surname).trim().toLowerCase() && r.firstName.toLowerCase() === String(p.firstName).trim().toLowerCase());
        const rec = Object.assign({}, p, {
          reference: makeRef(rows), submitted: nowStamp(), docNumber: doc.number, dob: doc.dobText, age: doc.age,
          gender: doc.gender || p.gender, citizenship: doc.citizenship,
          status: "Received", statusMessage: "", feeStatus: "Unpaid", feeDate: "", feeReceipt: "", feeRecordedBy: "",
          possibleDuplicate: twin ? "Same name and date of birth as " + twin.reference : "",
          consent: "Yes – " + nowStamp(), updated: nowStamp(), updatedBy: ""
        });
        delete rec.action;
        derive(rec);
        rows.push(rec); save(rows);
        return { ok: true, reference: rec.reference, programme: rec.programme };
      }
      case "checkId": {
        const doc = parseDocument(p.docType, p.docNumber, p.dob || "2000-01-01");
        return { ok: true, exists: !!(doc.valid && rows.some(r => docKeyOf(r) === doc.key)) };
      }
      case "status": {
        const r = findByDoc(rows, p.docNumber);
        if (!r || r.surname.trim().toLowerCase() !== String(p.surname || "").trim().toLowerCase()) return { ok: false, notFound: true };
        return { ok: true, application: { reference: r.reference, firstName: r.firstName, programme: r.programme, submitted: r.submitted,
          status: r.status, statusMessage: r.statusMessage, updated: r.updated, feeStatus: r.feeStatus } };
      }
      case "login":
        if (DEMO_ADMINS[p.username] && p.password === "demo") return { ok: true, token: "demo-" + p.username, name: DEMO_ADMINS[p.username], username: p.username };
        return { ok: false, error: "Incorrect username or password." };
      case "list":
        if (!authed) return { ok: false, authError: true };
        return { ok: true, applications: rows };
      case "updateStatus": {
        if (!authed) return { ok: false, authError: true };
        const r = rows.find(x => x.reference === p.reference);
        if (!r) return { ok: false, error: "Application not found." };
        r.status = p.status; r.statusMessage = p.statusMessage || ""; r.updated = nowStamp(); r.updatedBy = p.token.slice(5);
        save(rows); return { ok: true };
      }
      case "recordFee": {
        if (!authed) return { ok: false, authError: true };
        const r = rows.find(x => x.reference === p.reference);
        if (!r) return { ok: false, error: "Application not found." };
        r.feeStatus = p.feeStatus; r.feeReceipt = p.feeReceipt || ""; r.feeDate = p.feeStatus === "Unpaid" ? "" : (p.feeDate || ymd(new Date()));
        r.feeRecordedBy = p.token.slice(5); r.updated = nowStamp(); r.updatedBy = p.token.slice(5);
        save(rows); return { ok: true };
      }
      case "logout": return { ok: true };
      default: return { ok: false, error: "Unknown action" };
    }
  }

  /* Sample data for the demo dashboard */
  function seedDemo(n) {
    const rows = load();
    const first = ["Thando", "Aisha", "Liam", "Zinhle", "Jason", "Nadia", "Sipho", "Megan", "Yusuf", "Chloe", "Ayanda", "Ruben", "Lerato", "Tasneem", "Keegan", "Tendai", "Chipo", "Amani", "Grace", "Blessing"];
    const last = ["Adams", "Jacobs", "Mokoena", "Petersen", "Daniels", "Ndlovu", "Isaacs", "Williams", "Hendricks", "Mbeki", "Abrahams", "Arendse", "Moyo", "Banda", "Mutombo"];
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const wpick = (a, w) => { let x = Math.random() * w.reduce((s, v) => s + v, 0); for (let i = 0; i < a.length; i++) { x -= w[i]; if (x < 0) return a[i]; } return a[0]; };
    const statuses = Object.keys(C.STATUS_INFO);
    const A = window.SOZO_ASSESSMENT;
    for (let i = 0, made = 0; made < n && i < n * 5; i++) {
      const foreign = Math.random() < 0.18;
      const age = 16 + Math.floor(Math.random() * 20);
      const y = new Date().getFullYear() - age - 1, m = 1 + Math.floor(Math.random() * 12), d = 1 + Math.floor(Math.random() * 28);
      let docType = "South African ID", docNumber = "", dob = "";
      if (!foreign) {
        const base = String(y % 100).padStart(2, "0") + pad(m) + pad(d) + String(Math.floor(Math.random() * 10000)).padStart(4, "0") + "08";
        for (let c = 0; c < 10; c++) if (luhnValid(base + c)) { docNumber = base + c; break; }
      } else {
        docType = wpick(C.DOC_TYPES.slice(1), [4, 3, 2]);
        docNumber = (docType.startsWith("Passport") ? "FN" : "CTR") + Math.floor(1e6 + Math.random() * 8e6);
        dob = y + "-" + pad(m) + "-" + pad(d);
      }
      const doc = parseDocument(docType, docNumber, dob);
      if (!doc.valid || doc.age < C.MIN_AGE || doc.age > C.MAX_AGE || rows.some(r => docKeyOf(r) === doc.key)) continue;
      const programme = pick(C.PROGRAMMES).name;
      const qs = A.build(programme), answers = {};
      const skill = 0.25 + Math.random() * 0.6;
      qs.forEach(q => {
        const opts = q.options.slice();
        if (q.options[0][1] == null) { answers[q.id] = Math.random() < 0.8 ? opts[0][0] : pick(opts)[0]; return; }
        opts.sort((a, b) => b[1] - a[1]);
        answers[q.id] = Math.random() < skill ? opts[0][0] : pick(opts)[0];
      });
      const sc = A.score(programme, answers);
      const employment = wpick(C.EMPLOYMENT, [40, 12, 8, 3, 6, 12, 5, 14]);
      const status = Math.random() < 0.55 ? "Received" : pick(statuses);
      const paid = ["Shortlisted", "Interview scheduled", "Accepted"].includes(status) && Math.random() < 0.6;
      const wg = {};
      C.WG_QUESTIONS.forEach(q => { wg[q.key] = wpick(C.WG_ANSWERS, [90, 8, 1.5, 0.5]); });
      const rec = Object.assign({
        reference: makeRef(rows), submitted: nowStamp(), programme: programme,
        firstName: pick(first), surname: pick(last), docType: docType, docNumber: doc.number,
        nationality: foreign ? wpick(C.NATIONALITIES.slice(1, 8), [5, 3, 2, 3, 1, 2, 1]) : "South Africa",
        citizenship: doc.citizenship, dob: doc.dobText, age: doc.age, gender: doc.gender || pick(["Female", "Male"]),
        homeLanguage: foreign ? pick(["Shona", "Chichewa", "French", "Portuguese", "Swahili"]) : wpick(["Afrikaans", "English", "isiXhosa", "isiZulu"], [40, 20, 35, 5]),
        race: foreign ? "Black African" : wpick(C.RACES, [35, 55, 3, 2, 2, 3]), religion: wpick(C.RELIGIONS, [70, 15, 1, 0.5, 3, 6, 2, 3]),
        phone: "07" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0"), altPhone: "", email: "", preferredContact: wpick(C.CONTACT_METHODS, [3, 6, 1, 1]),
        province: "Western Cape", municipality: "City of Cape Town", area: pick(C.AREAS), areaOther: "", ward: "",
        dwelling: wpick(C.DWELLINGS, [25, 25, 10, 20, 18, 2]),
        education: wpick(C.EDUCATION, [1, 3, 10, 14, 18, 40, 5, 4, 2, foreign ? 6 : 0]), inEducation: Math.random() < 0.12 ? "Yes" : "No",
        employment: employment, lastWorked: employment.startsWith("Employed") ? "Working now" : wpick(C.LAST_WORKED.slice(1), [10, 15, 20, 25, 30]),
        personalIncome: wpick(C.INCOME_BANDS, [50, 20, 15, 8, 2, 0.5, 5]), householdIncome: wpick(C.INCOME_BANDS, [8, 25, 30, 20, 8, 2, 7]),
        householdSize: String(2 + Math.floor(Math.random() * 7)), dependants: String(Math.random() < 0.6 ? 0 : 1 + Math.floor(Math.random() * 3)),
        headOfHousehold: Math.random() < 0.2 ? "Yes" : "No",
        grants: Math.random() < 0.55 ? wpick(C.GRANTS, [60, 15, 8, 4, 2, 25, 2]) : "None",
        priorTraining: Math.random() < 0.2 ? "Yes" : "No", priorTrainingDetail: "", deviceAccess: wpick(C.DEVICE_ACCESS, [75, 20, 5]),
        yearsInArea: wpick(C.YEARS_IN_AREA, foreign ? [20, 50, 25, 5] : [5, 15, 30, 50]),
        livingWith: wpick(C.LIVING_WITH, [25, 30, 15, 12, 8, 2, 5, 1, 2]),
        maritalStatus: wpick(C.MARITAL, [55, 20, 10, 8, 3, 1, 3]),
        orphanhood: wpick(C.ORPHANHOOD, [65, 6, 18, 5, 3, 3]),
        hasChildren: wpick(["No", "Yes", "Prefer not to say"], [55, 42, 3]),
        incomeSource: wpick(C.INCOME_SOURCES, [30, 35, 15, 6, 4, 3, 6, 1]),
        hunger: wpick(C.HUNGER, [45, 30, 15, 5, 5]),
        englishComfort: wpick(C.ENGLISH_COMFORT, [40, 35, 18, 7]),
        previousSozo: wpick(C.PREVIOUS_SOZO, [75, 15, 5, 5]),
        bankAccount: Math.random() < 0.7 ? "Yes" : "No", hasCV: Math.random() < 0.55 ? "Yes" : "No",
        licence: wpick(C.LICENCE, [80, 12, 8]),
        jobseeker: wpick(["None", "SAYouth.mobi", "SAYouth.mobi, Harambee", "ESSA (Department of Employment and Labour)", "Harambee"], [45, 25, 10, 12, 8]),
        heardAbout: pick(C.HEARD_ABOUT), motivation: "I want to build practical skills so I can find work and support my family.",
        scoreInterest: sc.interest, scoreJudgement: sc.judgement, scoreKnowledge: sc.knowledge, scoreReadiness: sc.readiness,
        scoreTotal: sc.total, fit: sc.fit, flags: sc.flags.join("; "), answers: JSON.stringify(answers),
        status: status, statusMessage: "", feeStatus: paid ? "Paid" : "Unpaid", feeDate: paid ? ymd(new Date()) : "", feeReceipt: paid ? "RC" + (1000 + made) : "", feeRecordedBy: paid ? "admin1" : "",
        possibleDuplicate: "", consent: "Yes", followUpConsent: Math.random() < 0.92 ? "Yes" : "No", updated: nowStamp(), updatedBy: ""
      }, wg);
      rec.numChildren = rec.hasChildren === "Yes" ? String(1 + Math.floor(Math.random() * 3)) : "0";
      derive(rec);
      rows.push(rec); made++;
    }
    save(rows);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  window.Sozo = { parseSAID, parseDocument, ageGroup, derive, isClosed, api, DEMO, seedDemo, clearDemo: () => save([]), esc, ageOn };
})();
