/* =====================================================================
   SOZO SKILLS PROGRAMME – SITE SETTINGS
   This is the only file you normally need to edit.
   ===================================================================== */
window.SOZO_CONFIG = {
  /* Paste your Google Apps Script Web App URL between the quotes
     (see SETUP-GUIDE.html). Leave it empty to run in DEMO MODE,
     where data is only kept in your own browser for testing. */
  API_URL: "https://script.google.com/macros/s/AKfycbwL2byHM8Dp6EvnULBE4_DxNGd1YEzHsfKxb43mYYgP_4F_bePAXNgWgCsr7ZI7xwGO/exec",

  ORG_NAME: "The Sozo Foundation",
  INTAKE_NAME: "Skills Programme 2027 Intake",

  /* Applications close at 23:59 (South African time) on 28 January 2027 */
  CLOSING_DATE: "2027-01-28T23:59:59+02:00",

  /* Shown in the footer and on the status page. Leave empty to hide. */
  CONTACT_EMAIL: "nigel@sozo.org.za",
  CONTACT_PHONE: "0218255529",

  /* Fit bands for the assessment (overall score out of 100) */
  FIT_BANDS: { strong: 75, moderate: 55 },

  MIN_AGE: 16,
  MAX_AGE: 35,

  /* The four schools. Edit the wording freely – keep the "name" values
     identical to PROGRAMMES in Code.gs. */
  PROGRAMMES: [
    {
      id: "barista",
      name: "Barista School",
      icon: "coffee",
      tagline: "Craft great coffee and serve customers with confidence.",
      description:
        "A hands-on course in coffee preparation and café service. You will learn to use a commercial espresso machine and run a busy coffee station like a professional.",
      learn: [
        "Espresso extraction and milk texturing",
        "Classic coffee menu and basic latte art",
        "Machine cleaning, hygiene and food safety",
        "Customer service, till work and teamwork"
      ],
      duration: "Duration and schedule confirmed at interview",
      ideal: "You enjoy people, work well under pressure and want a job in hospitality."
    },
    {
      id: "baking",
      name: "Baking School",
      icon: "bake",
      tagline: "Learn the foundations of baking and pastry.",
      description:
        "A practical kitchen-based course covering breads, cakes and pastries, with a focus on the skills employers and small food businesses need.",
      learn: [
        "Breads, cakes, biscuits and basic pastry",
        "Measuring, recipes and costing",
        "Kitchen safety, hygiene and food handling",
        "Packaging and selling your products"
      ],
      duration: "Duration and schedule confirmed at interview",
      ideal: "You are patient, detail-minded and dream of working in a bakery or starting your own."
    },
    {
      id: "beauty",
      name: "Beauty School",
      icon: "beauty",
      tagline: "Build skills for a career in the beauty industry.",
      description:
        "A practical course in core beauty treatments, salon hygiene and client care, preparing you to work in a salon or spa or to start your own small business.",
      learn: [
        "Manicures, pedicures and nail care",
        "Skin care basics and facials",
        "Make-up application",
        "Salon hygiene, client care and bookings"
      ],
      duration: "Duration and schedule confirmed at interview",
      ideal: "You are creative, caring and love helping people look and feel their best."
    },
    {
      id: "hair",
      name: "Hair School",
      icon: "hair",
      tagline: "Train in hairdressing and styling skills.",
      description:
        "A hands-on hairdressing course covering washing, treatments, cutting and styling for different hair types, plus how to run a salon chair professionally.",
      learn: [
        "Hair and scalp care, washing and treatments",
        "Braiding, styling and finishing",
        "Introduction to cutting techniques",
        "Client consultation and salon business basics"
      ],
      duration: "Duration and schedule confirmed at interview",
      ideal: "You have steady hands, an eye for style and want to work in a salon."
    }
  ],

  /* Drop-down lists used on the form (and in the dashboard charts) */
  AREAS: [
    "Vrygrond", "Capricorn", "Seawinds", "Lavender Hill", "Overcome Heights",
    "Steenberg", "Retreat", "Muizenberg", "Hillview", "Grassy Park",
    "Parkwood", "Ottery", "Mitchells Plain", "Philippi", "Other"
  ],
  RACES: ["Black African", "Coloured", "Indian / Asian", "White", "Other", "Prefer not to say"],
  RELIGIONS: [
    "Christianity", "Islam", "Hinduism", "Judaism", "African Traditional",
    "No religion", "Other", "Prefer not to say"
  ],
  /* ---- Registration fee (paid at the Sozo office after shortlisting) ---- */
  FEE_AMOUNT: 100,
  FEE_TEXT: "A once-off R100 registration fee is payable only if you are shortlisted. Pay it in person at the Sozo office. Bring your reference number and your ID or document. You do not pay anything to apply.",

  /* ---- Identity documents (SA and foreign nationals) ---- */
  DOC_TYPES: [
    "South African ID",
    "Passport",
    "Asylum seeker permit (Section 22)",
    "Refugee ID / Refugee status (Section 24)"
  ],
  NATIONALITIES: [
    "South Africa", "Zimbabwe", "Malawi", "Mozambique", "DR Congo", "Congo (Brazzaville)",
    "Somalia", "Ethiopia", "Burundi", "Rwanda", "Nigeria", "Lesotho", "Eswatini", "Angola",
    "Zambia", "Namibia", "Botswana", "Cameroon", "Ghana", "Kenya", "Tanzania", "Uganda", "Other"
  ],
  GENDERS: ["Female", "Male", "Non-binary / other", "Prefer not to say"],
  LANGUAGES: [
    "Afrikaans", "English", "isiXhosa", "isiZulu", "isiNdebele", "Sepedi", "Sesotho", "Setswana",
    "siSwati", "Tshivenda", "Xitsonga", "South African Sign Language",
    "Shona", "Chichewa", "Portuguese", "French", "Swahili", "Somali", "Other"
  ],

  /* ---- Location ---- */
  PROVINCES: [
    "Western Cape", "Eastern Cape", "Northern Cape", "Free State", "KwaZulu-Natal",
    "Gauteng", "Limpopo", "Mpumalanga", "North West"
  ],
  DWELLINGS: [
    "Formal house or flat", "RDP / government house", "Backyard room (brick)",
    "Backyard shack (wendy house)", "Shack in informal settlement", "Other"
  ],

  /* ---- Disability: Washington Group Short Set (WG-SS) ---- */
  WG_QUESTIONS: [
    { key: "wgSeeing", q: "Do you have difficulty seeing, even if wearing glasses?" },
    { key: "wgHearing", q: "Do you have difficulty hearing, even if using a hearing aid?" },
    { key: "wgMobility", q: "Do you have difficulty walking or climbing steps?" },
    { key: "wgCognition", q: "Do you have difficulty remembering or concentrating?" },
    { key: "wgSelfcare", q: "Do you have difficulty with self-care, such as washing all over or dressing?" },
    { key: "wgCommunication", q: "Using your usual language, do you have difficulty communicating, for example understanding or being understood?" }
  ],
  WG_ANSWERS: ["No difficulty", "Some difficulty", "A lot of difficulty", "Cannot do at all"],

  /* ---- Education and work (baseline) ---- */
  EDUCATION: [
    "No schooling", "Grade 7 or lower", "Grade 8–9", "Grade 10 (NQF 2)", "Grade 11 (NQF 3)",
    "Grade 12 / Matric (NQF 4)", "Higher Certificate (NQF 5)", "Diploma (NQF 6)",
    "Degree (NQF 7+)", "Foreign school qualification"
  ],
  EMPLOYMENT: [
    "Unemployed – looking for work",
    "Unemployed – not looking (discouraged)",
    "Unemployed – not looking (caring for family / other)",
    "Employed – full-time",
    "Employed – part-time or temporary",
    "Informal work / piece jobs",
    "Self-employed / own business",
    "Full-time learner or student"
  ],
  EMPLOYED_VALUES: [
    "Employed – full-time", "Employed – part-time or temporary",
    "Informal work / piece jobs", "Self-employed / own business"
  ],
  LAST_WORKED: ["Working now", "Less than 6 months ago", "6–12 months ago", "1–2 years ago", "More than 2 years ago", "Never worked"],
  INCOME_BANDS: [
    "No income", "R1 – R1 000", "R1 001 – R3 500", "R3 501 – R7 500",
    "R7 501 – R15 000", "More than R15 000", "Don't know / prefer not to say"
  ],
  GRANTS: [
    "Child Support Grant", "Older Persons Grant", "Disability Grant", "Foster Child Grant",
    "Care Dependency Grant", "SRD grant", "Other grant"
  ],
  /* ---- Additional demographics (v3) ---- */
  MARITAL: ["Single", "In a relationship (not living together)", "Living with partner", "Married", "Divorced or separated", "Widowed", "Prefer not to say"],
  LIVING_WITH: ["Both parents", "One parent", "Grandparent(s)", "Other relatives", "Partner or spouse", "Friends", "On my own", "Foster or care home", "Other"],
  ORPHANHOOD: ["Both parents alive", "Mother has passed away", "Father has passed away", "Both parents have passed away", "Don't know", "Prefer not to say"],
  YEARS_IN_AREA: ["Less than 1 year", "1–5 years", "More than 5 years", "All my life"],
  INCOME_SOURCES: ["Salary or wages", "Social grants", "Informal work or piece jobs", "Own business", "Money from family elsewhere", "Pension", "No regular income", "Don't know"],
  HUNGER: ["Never", "Sometimes (1–2 times)", "Often (3–10 times)", "Very often (more than 10 times)", "Prefer not to say"],
  YES_NO: ["No", "Yes"],
  LICENCE: ["No", "Learner's licence", "Driver's licence"],
  JOBSEEKER: ["SAYouth.mobi", "ESSA (Department of Employment and Labour)", "Harambee", "A recruitment agency", "None"],
  ENGLISH_COMFORT: ["Very comfortable", "Comfortable", "A little uncomfortable", "Very uncomfortable"],
  PREVIOUS_SOZO: ["No", "Yes – Sozo youth or school programme", "Yes – another Sozo skills school", "Yes – other Sozo programme"],

  DEVICE_ACCESS: ["My own smartphone", "A shared phone", "No phone with internet"],
  CONTACT_METHODS: ["Phone call", "WhatsApp", "SMS", "Email"],

  HEARD_ABOUT: [
    "Friend or family", "Social media", "Church or community organisation",
    "School", "Sozo staff or past participant", "Poster or flyer", "Other"
  ],

  /* Applicant-facing explanation of each status */
  STATUS_INFO: {
    "Received": "Your application has been received and is waiting to be reviewed.",
    "Under review": "Our team is currently reviewing your application.",
    "Shortlisted": "Good news – you have been shortlisted. We will contact you to arrange the next step. Your R100 registration fee is now payable at the Sozo office.",
    "Interview scheduled": "You have been invited for an interview. Please check your phone and email for details.",
    "Accepted": "Congratulations! You have been accepted into the programme. We will contact you with start details.",
    "Waiting list": "You are on our waiting list. We will contact you if a place becomes available.",
    "Not successful": "Unfortunately your application was not successful this time. Thank you for applying – we encourage you to apply for future intakes."
  }
};
