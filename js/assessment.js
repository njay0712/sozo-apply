/* =====================================================================
   TRADE ASSESSMENTS – edit questions here.
   Each school has 4 sections:
     interest  – 4 statements, answered 1–4 (Not like me … Very much like me)
     judgement – workplace situations, each option scores 0, 1 or 2
     knowledge – baseline knowledge test, one correct answer (pre-test;
                 reuse at the end of training as a post-test)
     readiness – shared questions (attendance, transport, standing) plus
                 flag-only questions that never lower the score
   Overall score = 30% interest + 25% judgement + 15% knowledge + 30% readiness
   Results are shown to admins only.
   ===================================================================== */
window.SOZO_ASSESSMENT = (function () {
  "use strict";

  const LIKERT = ["Not like me", "A little like me", "Mostly like me", "Very much like me"];
  const WEIGHTS = { interest: 0.30, judgement: 0.25, knowledge: 0.15, readiness: 0.30 };

  const READINESS = [
    { id: "r_attend", q: "Can you attend every training day for the full programme? (Days and times are confirmed at interview.)",
      options: [["Yes", 2], ["Not sure yet", 1], ["No", 0]], flagIf: { "No": "Cannot attend full programme", "Not sure yet": "Unsure about attendance" } },
    { id: "r_transport", q: "How will you get to the Sozo training venue?",
      options: [["Walk", 2], ["Taxi or bus", 2], ["Lift from family or friends", 2], ["I'm not sure yet", 0]], flagIf: { "I'm not sure yet": "No transport plan" } },
    { id: "r_stand", q: "Training is practical. Are you able to stand and work with your hands for most of the day?",
      options: [["Yes, comfortably", 2], ["Yes, with short breaks", 1], ["No", 0]], flagIf: { "No": "Cannot stand for long periods – discuss support" } },
    { id: "r_care", q: "If you look after children or family members, do you have care arranged while you are at training?",
      options: [["Not applicable", null], ["Yes", null], ["I'm working on it", null], ["No", null]], flagIf: { "No": "No childcare / care arranged", "I'm working on it": "Care arrangements pending" } },
    { id: "r_fee", q: "If you are shortlisted, will you be able to pay the once-off R100 registration fee at the Sozo office?",
      options: [["Yes", null], ["I would need some time", null], ["I would need help with the fee", null]], flagIf: { "I would need help with the fee": "Needs fee support", "I would need some time": "Needs time to pay fee" } }
  ];

  const HEALTH = {
    food: { id: "r_health", q: "Do you have an allergy or health condition that affects working with food or drinks (for example wheat, milk, eggs, nuts or coffee)?",
      options: [["No", null], ["Yes", null], ["Not sure", null]], flagIf: { "Yes": "Food allergy / condition – discuss safety", "Not sure": "Unsure about food allergies" } },
    chem: { id: "r_health", q: "Do you have skin allergies or sensitivity to products such as hair dye, relaxer, nail polish remover or latex gloves?",
      options: [["No", null], ["Yes", null], ["Not sure", null]], flagIf: { "Yes": "Skin / chemical sensitivity – discuss safety", "Not sure": "Unsure about skin sensitivity" } }
  };

  const TRADES = {
    "Barista School": {
      health: "food",
      interest: [
        "I enjoy talking to and helping new people every day.",
        "I stay calm when lots of people need something from me at once.",
        "I like making things with my hands and getting them exactly right.",
        "I would enjoy working early mornings or weekends in a café."
      ],
      judgement: [
        { q: "A customer says their coffee is too cold. What do you do?",
          options: [["Apologise and offer to make a fresh one", 2], ["Explain that it was hot when you made it", 0], ["Ask your manager to deal with it", 1]] },
        { q: "A long queue is building while you are making drinks. What is best?",
          options: [["Greet the waiting customers, tell them you'll be with them soon, and keep working", 2], ["Skip cleaning the milk steamer to go faster", 0], ["Keep your head down and focus only on the machine", 1]] },
        { q: "You spill milk on the floor behind the counter during a rush.",
          options: [["Wipe it up straight away so nobody slips", 2], ["Leave it until the rush is over", 0], ["Tell a colleague about it and carry on", 1]] }
      ],
      knowledge: [
        { q: "What is an espresso?", answer: "Strong coffee made by pushing hot water through finely ground coffee under pressure",
          wrong: ["Coffee mixed with a lot of milk", "Instant coffee made with boiling water", "Cold coffee served with ice"] },
        { q: "Which of these drinks usually has the most milk?", answer: "Latte", wrong: ["Espresso", "Macchiato", "Ristretto"] },
        { q: "Why must you wash your hands often when making food and drinks?", answer: "To stop germs from spreading to customers",
          wrong: ["To make the cups shine", "So the coffee tastes stronger", "It is only needed at the end of the day"] },
        { q: "Where should fresh milk be kept in a café?", answer: "In the fridge", wrong: ["On the counter", "Next to the coffee machine to keep it warm", "In a cupboard"] },
        { q: "A customer pays for a R45 coffee with a R100 note. How much change do you give?", answer: "R55", wrong: ["R65", "R45", "R50"] }
      ]
    },
    "Baking School": {
      health: "food",
      interest: [
        "I enjoy following a recipe step by step.",
        "I don't mind early starts and working in a hot kitchen.",
        "I am patient when something takes time to rise or bake.",
        "I would like to sell my own baked goods one day."
      ],
      judgement: [
        { q: "Your bread did not rise. What do you do?",
          options: [["Check the recipe and your steps to find what went wrong, then try again", 2], ["Sell it anyway", 0], ["Ask someone else to do the baking next time", 1]] },
        { q: "A recipe needs 500 g of flour but there is only 400 g left.",
          options: [["Tell your supervisor and adjust all the ingredients in the same proportion", 2], ["Use 400 g and keep everything else the same", 0], ["Wait until more flour arrives", 1]] },
        { q: "You see a colleague touch raw dough and then a finished cake without washing their hands.",
          options: [["Politely remind them to wash their hands and tell the supervisor about the cake", 2], ["Say nothing", 0], ["Throw the cake away without telling anyone", 1]] }
      ],
      knowledge: [
        { q: "What makes most bread dough rise?", answer: "Yeast", wrong: ["Salt", "Sugar", "Butter"] },
        { q: "How many grams are in 1 kilogram?", answer: "1 000 g", wrong: ["100 g", "10 g", "500 g"] },
        { q: "Why do bakers preheat the oven?", answer: "So the food bakes evenly at the right temperature from the start",
          wrong: ["To save electricity", "To clean the oven", "It makes no difference"] },
        { q: "A recipe makes 12 muffins. You need 24. What should you do?", answer: "Double all the ingredients",
          wrong: ["Double only the flour", "Bake them for twice as long", "Use a bigger tray"] },
        { q: "Which of these is a kitchen hygiene rule?", answer: "Tie long hair back and wash hands before handling food",
          wrong: ["Taste food with your fingers", "Wear rings and bracelets while baking", "Wipe your hands on your clothes"] }
      ]
    },
    "Beauty School": {
      health: "chem",
      interest: [
        "I enjoy helping people feel good about themselves.",
        "I am comfortable working closely with clients, including their hands, feet and faces.",
        "I pay attention to small details and like neat work.",
        "I like keeping my workspace very clean and organised."
      ],
      judgement: [
        { q: "During a facial, a client says her skin is burning. What do you do?",
          options: [["Stop, gently remove the product with cool water, and tell the supervisor", 2], ["Tell her it is normal and carry on", 0], ["Ask her if she wants you to continue", 1]] },
        { q: "You are running late and your next client is waiting.",
          options: [["Politely tell them you are running late and how long the wait will be", 2], ["Rush your current client to catch up", 0], ["Ask reception to deal with it", 1]] },
        { q: "A client asks for a treatment you have not been trained to do.",
          options: [["Explain honestly and offer a trained colleague or another service", 2], ["Try it anyway", 0], ["Tell them the salon doesn't offer it", 1]] }
      ],
      knowledge: [
        { q: "Why must tools be cleaned and disinfected between clients?", answer: "To stop infections spreading between clients",
          wrong: ["To make them look new", "Only so they don't rust", "It is not necessary"] },
        { q: "What is a cuticle?", answer: "The thin layer of skin at the base of the nail", wrong: ["The tip of the nail", "A type of nail polish", "A nail file"] },
        { q: "What should you do before using a new product on a client's skin?", answer: "Do a patch test to check for an allergic reaction",
          wrong: ["Apply extra product so it works faster", "Nothing – all products are safe", "Mix it with another product"] },
        { q: "What is used to remove nail polish?", answer: "Nail polish remover (acetone)", wrong: ["Water", "Hand cream", "Shampoo"] },
        { q: "A manicure costs R120 and a pedicure costs R180. What does a client pay for both?", answer: "R300", wrong: ["R280", "R320", "R250"] }
      ]
    },
    "Hair School": {
      health: "chem",
      interest: [
        "I enjoy doing my own or other people's hair.",
        "I can stand and work with my hands for many hours.",
        "I like keeping up with new hairstyles and trends.",
        "I am comfortable asking clients what they want and giving advice."
      ],
      judgement: [
        { q: "A client does not like the finished hairstyle.",
          options: [["Listen calmly, ask what they would like changed, and fix what you can", 2], ["Tell them it looks fine", 0], ["Call the supervisor straight away", 1]] },
        { q: "Before a chemical treatment, you notice sores or a rash on the client's scalp.",
          options: [["Do not apply chemicals; explain politely and suggest they see a clinic first", 2], ["Carry on carefully", 0], ["Ask the supervisor what to do", 1]] },
        { q: "The salon is busy and you finish with your client early.",
          options: [["Clean your station and help your colleagues", 2], ["Use your phone until the next client arrives", 0], ["Wait to be told what to do", 1]] }
      ],
      knowledge: [
        { q: "Why is a test done on a small area before using hair dye?", answer: "To check for an allergic reaction and how the hair takes colour",
          wrong: ["To make the dye last longer", "To save product", "It is not needed"] },
        { q: "What should you do with combs and brushes between clients?", answer: "Clean and disinfect them", wrong: ["Rinse them with water only", "Nothing", "Put them in a drawer"] },
        { q: "Which is a sign of damaged hair?", answer: "Split ends and breakage", wrong: ["Shine", "Strength", "Smoothness"] },
        { q: "What can happen when hair is braided too tightly?", answer: "Hair loss around the hairline (traction alopecia)",
          wrong: ["The hair grows faster", "The hair becomes thicker", "Nothing"] },
        { q: "A client pays R250 for braids and gives a R30 tip. How much did you receive in total?", answer: "R280", wrong: ["R220", "R250", "R300"] }
      ]
    }
  };

  /* Build the full list of questions for one school (stable ids) */
  function build(programme) {
    const t = TRADES[programme];
    if (!t) return [];
    const qs = [];
    t.interest.forEach((s, i) => qs.push({ id: "i" + i, section: "interest", q: s, options: LIKERT.map((l, n) => [l, n + 1]) }));
    t.judgement.forEach((j, i) => qs.push({ id: "j" + i, section: "judgement", q: j.q, options: j.options }));
    t.knowledge.forEach((k, i) => qs.push({ id: "k" + i, section: "knowledge", q: k.q,
      options: [[k.answer, 1]].concat(k.wrong.map(w => [w, 0])) }));
    READINESS.forEach(r => qs.push(Object.assign({ section: "readiness" }, r)));
    qs.push(Object.assign({ section: "readiness" }, HEALTH[t.health]));
    return qs;
  }

  /* answers: { questionId: optionText } → scores, fit, flags */
  function score(programme, answers) {
    const qs = build(programme);
    const sums = { interest: [0, 0], judgement: [0, 0], knowledge: [0, 0], readiness: [0, 0] };
    const flags = [];
    qs.forEach(q => {
      const a = answers[q.id];
      const opt = q.options.find(o => o[0] === a);
      if (q.flagIf && q.flagIf[a]) flags.push(q.flagIf[a]);
      const pts = opt ? opt[1] : null;
      const max = Math.max.apply(null, q.options.map(o => o[1] == null ? 0 : o[1]));
      if (q.options[0][1] == null) return;                // flag-only question
      const min = q.section === "interest" ? 1 : 0;
      sums[q.section][0] += (pts == null ? min : pts) - min;
      sums[q.section][1] += max - min;
    });
    const pct = s => s[1] ? Math.round(s[0] / s[1] * 100) : 0;
    const res = { interest: pct(sums.interest), judgement: pct(sums.judgement), knowledge: pct(sums.knowledge), readiness: pct(sums.readiness) };
    res.total = Math.round(res.interest * WEIGHTS.interest + res.judgement * WEIGHTS.judgement + res.knowledge * WEIGHTS.knowledge + res.readiness * WEIGHTS.readiness);
    const B = (window.SOZO_CONFIG && window.SOZO_CONFIG.FIT_BANDS) || { strong: 75, moderate: 55 };
    res.fit = res.total >= B.strong ? "Strong fit" : res.total >= B.moderate ? "Moderate fit" : "Low fit";
    res.flags = flags;
    return res;
  }

  return { build, score, TRADES, WEIGHTS, LIKERT };
})();
