/* ============================================================
   Module data — 3 Game Modules × 15 screens each.
   Based on the Design Matrix & Storyboard (expanded from the
   original 9 slides to 15 per module; added slides marked NEW).

   All icons/scenery are TEMPORARY emoji placeholders.
   ============================================================ */

import type { GameModule } from "../types";

export const MODULES: GameModule[] = [

  /* ==========================================================
     MODULE 1 — Road to the Harvest Festival (Tatay Ben)
     Competencies: plot fractions on number line, represent
     fractions using models, order dissimilar fractions
     ========================================================== */
  {
    id: "m1",
    title: "Road to the Harvest Festival",
    subtitle: "with Tatay Ben, the Wise Farmer",
    npc: { icon: "👨🏽‍🌾", name: "Tatay Ben", role: "The Wise Farmer" },
    competencies: [
      "Plot fractions on the number line",
      "Represent fractions using models",
      "Order dissimilar fractions",
    ],
    scenery: "🌾🐃🌽🛖🌾🐓🌾",
    sceneryImgs: [
      "/icons/game/palay.png",
      "/icons/game/cart.png",
      "/icons/game/tree.png",
      "/icons/game/festival-stall.png",
    ],
    themeColor: "#689f38",
    screens: [
      {
        id: "m1s2", type: "dialogue", slide: "Slide 2: Mission Briefing",
        banner: "MISSION BRIEFING",
        dialogue:
          "Welcome, {name}! The Harvest Festival is near, but the delivery carts cannot pass — the road markers are missing. A road is like a number line from 0 to 1; help us place the fractions correctly!",
        demo: "numberline", buttonLabel: "I'm Ready!",
        rme: "Guidance Principle", reward: 50,
      },
      {
        id: "m1s3", type: "cut-share", slide: "Slide 3: Share the Timber (NEW)",
        banner: "GIVE EACH CARPENTER AN EQUAL SHARE",
        dialogue:
          "Two carpenters will repair the footbridge. Use the ✂️ cutting tool so each carpenter gets an equal piece of this plank!",
        eaters: 2, eaterIcon: "👷🏽", itemLabel: "wooden plank",
        rme: "Activity Principle", reward: 15,
      },
      {
        id: "m1s4", type: "numberline", slide: "Slide 4: Fraction Trail Map",
        banner: "PLACE THE ROAD MARKERS ON THE TRAIL",
        dialogue:
          "Place the missing fraction signs on the correct locations so the rice carts can travel safely!",
        den: 4, targets: [1, 2, 3],
        rme: "Activity Principle", reward: 30,
      },
      {
        id: "m1s5", type: "dialogue", slide: "Slide 5: Immediate Feedback",
        banner: "THE BRIDGE IS OPEN!",
        dialogue:
          "Excellent! The bridge to Sitio Mabunga is now open! When markers sit on the right spot, the carts know exactly how far they have traveled.",
        art: "🌉🛺✨", buttonLabel: "Continue the Journey",
        rme: "Guidance Principle", reward: 10,
      },
      {
        id: "m1s6", type: "numberline", slide: "Slide 6: The Long Road (NEW)",
        banner: "MARK THE LONGER ROAD TO THE MARKET",
        dialogue:
          "This longer road is divided into ten equal parts. Place the markers so even the slow carabao carts will not get lost!",
        den: 10, targets: [3, 7, 9],
        rme: "Activity Principle", reward: 30,
      },
      {
        id: "m1s7", type: "model-shade", slide: "Slide 7: Model Builder Area",
        banner: "PLANT 3/4 OF THE GARDEN BED",
        dialogue: "Use the garden plots to represent the fractions. Shade the beds we will plant with seedlings!",
        frac: { n: 3, d: 4 }, shape: "bar",
        rme: "Level Principle", reward: 20,
      },
      {
        id: "m1s7b", type: "numberline", slide: "Slide 7b: Trail to Sitio Lima (NEW)",
        banner: "MARK THE SHORTCUT IN FIFTHS",
        dialogue:
          "This shortcut to Sitio Lima is divided into five equal parts. Place every road sign so no cart gets lost!",
        den: 5, targets: [1, 3, 4],
        rme: "Activity Principle", reward: 30,
      },
      {
        id: "m1s8", type: "model-shade", slide: "Slide 8: Greenhouse Grid (NEW)",
        banner: "FILL 7/10 OF THE GREENHOUSE GRID",
        dialogue: "The community greenhouse has ten planting beds. Show me seven-tenths — every seedling counts!",
        frac: { n: 7, d: 10 }, shape: "grid",
        rme: "Level Principle", reward: 20,
      },
      {
        id: "m1s9", type: "cut-share", slide: "Slide 9: Merienda Time (NEW)",
        banner: "SHARE THE BIBINGKA FAIRLY",
        dialogue:
          "Merienda break! Four hardworking kids helped carry the tools. Cut the bibingka so everyone gets a fair share — no crumbs of argument!",
        eaters: 4, eaterIcon: "🧒🏽", itemLabel: "bibingka rice cake",
        rme: "Level Principle", reward: 20,
      },
      {
        id: "m1s9b", type: "bridge-build", slide: "Slide 9b: The Creek Crossing (NEW)",
        banner: "REPAIR THE CREEK BRIDGE!",
        dialogue:
          "One more crossing before the festival! 📏 Measure this narrow gap, ✂️ cut planks that fit exactly, then 🧴 glue them tight.",
        den: 8, gapNum: 3, walker: "👧🏽",
        rme: "Activity Principle", reward: 35,
      },
      {
        id: "m1s10", type: "order", slide: "Slide 10: Compare Farm Lots",
        banner: "ARRANGE THE LOTS: SMALLEST → LARGEST",
        dialogue: "Which farm lot is the largest? Arrange the land titles from smallest to largest share!",
        fracs: [{ n: 1, d: 2 }, { n: 1, d: 3 }, { n: 1, d: 5 }],
        rme: "Level Principle", reward: 25,
      },
      {
        id: "m1s11", type: "order", slide: "Slide 11: The Harvest Ledger (NEW)",
        banner: "ORDER THE HARVEST SHARES",
        dialogue: "Four families harvested different shares of the field. Order them from smallest to largest — no arguments at the festival table!",
        fracs: [{ n: 3, d: 4 }, { n: 1, d: 2 }, { n: 2, d: 5 }, { n: 7, d: 10 }],
        rme: "Level Principle", reward: 30,
      },
      {
        id: "m1s12", type: "bridge-build", slide: "Slide 12: The Broken Bridge (NEW)",
        banner: "REPAIR THE BRIDGE — MEASURE, CUT, GLUE!",
        dialogue:
          "Bunso can't cross to the market! 📏 Measure the gap with the ruler, ✂️ cut the plank so the pieces fit, then 🧴 glue them in place.",
        den: 5, gapNum: 2, walker: "👦🏽",
        rme: "Interactivity Principle", reward: 30,
      },
      {
        id: "m1s13", type: "boss", slide: "Slide 13: Boss Mission",
        banner: "COMPLETE ALL PATHS BEFORE SUNSET! 🌅",
        dialogue: "The Harvest Festival begins tonight! Complete all fraction paths before sunset!",
        seconds: 120,
        questions: [
          {
            question: "Which point is 1/2 on a road cut into 4 equal parts?",
            choices: [{ label: "1st mark" }, { label: "2nd mark" }, { label: "3rd mark" }],
            answer: 1,
          },
          {
            question: "Which model shows 2/3?",
            choices: [{ bar: { shaded: 2, parts: 3 } }, { bar: { shaded: 3, parts: 2 } }, { bar: { shaded: 2, parts: 5 } }],
            answer: 0,
          },
          {
            question: "Which is the SMALLEST?",
            choices: [{ frac: { n: 1, d: 2 } }, { frac: { n: 1, d: 8 } }, { frac: { n: 1, d: 4 } }],
            answer: 1,
          },
          {
            question: "Which is the LARGEST?",
            choices: [{ frac: { n: 2, d: 5 } }, { frac: { n: 1, d: 2 } }, { frac: { n: 9, d: 10 } }],
            answer: 2,
          },
          {
            question: "7/10 sits between which markers?",
            choices: [{ label: "1/2 and 1" }, { label: "0 and 1/2" }, { label: "after 1" }],
            answer: 0,
          },
        ],
        rme: "Intertwinement Principle", reward: 50,
      },
      {
        id: "m1s14", type: "dialogue", slide: "Slide 14: Sunset Report (NEW)",
        banner: "ALL ROADS RESTORED!",
        dialogue:
          "Look at that sunset — and look at those roads! Every marker, every bridge, every farm lot is in perfect order because of you.",
        art: "🌅🛤️🐃", buttonLabel: "To the Festival!",
        rme: "Reality Principle", reward: 10,
      },
      {
        id: "m1s15", type: "dialogue", slide: "Slide 15: Reward Screen",
        banner: "🎉 CONGRATULATIONS, MASTER RANGER! 🎉",
        dialogue:
          "Congratulations, {name}! The roads are restored, and the festival can now begin! You've earned the Master Ranger Badge — Module 2 is now unlocked!",
        art: "🎆🏮🎊", buttonLabel: "Claim Rewards",
        rme: "Reality Principle", reward: 50,
      },
    ],
  },

  /* ==========================================================
     MODULE 2 — The Honest Assistant (Ate Lalay)
     Competencies: equivalent fractions, multiples up to 100,
     reduce fractions to simplest form
     ========================================================== */
  {
    id: "m2",
    title: "The Honest Assistant",
    subtitle: "with Manang Lalay, the Honest Storekeeper",
    npc: { icon: "👩🏽‍💼", name: "Manang Lalay", role: "The Honest Storekeeper" },
    competencies: [
      "Determine equivalent fractions",
      "Identify multiples of numbers up to 100",
      "Reduce fractions into simplest form",
    ],
    scenery: "🏪🍬⚖️🧃🍪🧺🍭",
    sceneryImgs: [
      "/icons/game/sardinas.png",
      "/icons/game/milo.png",
      "/icons/game/scale.png",
      "/icons/game/coke.png",
      "/icons/game/basket.png",
    ],
    themeColor: "#f57c00",
    screens: [
      {
        id: "m2s2", type: "dialogue", slide: "Slide 2: Mission Briefing",
        banner: "EQUIVALENT FRACTIONS 101",
        dialogue:
          "Mabuhay, {name}! Welcome to the store — I need a sharp assistant! Customers ask for different forms: 2/4 of a jar is the same as 4/8. Let's review how we scale fractions using factors and multiples.",
        demo: "equivalent", buttonLabel: "Got It!",
        rme: "Guidance Principle", reward: 50,
      },
      {
        id: "m2s3", type: "jar-fill", slide: "Slide 3: The Candy Jar Counter (NEW)",
        banner: "SERVE 1/2 A JAR — HALF-JARS ARE SOLD OUT!",
        dialogue:
          "A customer wants 1/2 a jar of candies, but our half-size jars are sold out! Use the 🫙 divider to pick a different jar size, then fill the SAME amount.",
        target: { n: 1, d: 2 }, forbidden: 2, customerIcon: "🧒🏽",
        rme: "Activity Principle", reward: 20,
      },
      {
        id: "m2s4", type: "sort-bins", slide: "Slide 4: Multiples Matching",
        banner: "SORT THE BOXES TO THE RIGHT SHELVES",
        dialogue:
          "Check the inventory number on each box and sort it to the shelf representing its multiple!",
        bins: [4, 5], items: [8, 15, 12, 25, 16, 35],
        rme: "Activity Principle", reward: 30,
      },
      {
        id: "m2s5", type: "dialogue", slide: "Slide 5: Immediate Feedback",
        banner: "INVENTORY CHECK: PERFECT!",
        dialogue:
          "Perfect! Your counting is completely accurate! When every box sits on its multiple shelf, restocking is lightning fast.",
        art: "📦✅🗄️", buttonLabel: "Next Shipment",
        rme: "Guidance Principle", reward: 10,
      },
      {
        id: "m2s6", type: "sort-bins", slide: "Slide 6: The Big Shipment (NEW)",
        banner: "BIG SHIPMENT! SORT UP TO 100",
        dialogue:
          "This delivery truck is packed! These boxes have bigger tracking numbers — sort them to their base shelves, up to 100!",
        bins: [6, 7, 9], items: [24, 49, 81, 48, 77, 99],
        rme: "Activity Principle", reward: 35,
      },
      {
        id: "m2s7", type: "balance", slide: "Slide 7: Balance the Scales",
        banner: "BALANCE THE SUGAR SCALE",
        dialogue:
          "A customer needs 3/5 of a kilo of sugar, but our cups are marked in tenths! Find the sack that balances the scale.",
        target: { n: 3, d: 5 },
        choices: [{ n: 6, d: 10 }, { n: 4, d: 5 }, { n: 5, d: 10 }, { n: 3, d: 10 }],
        rme: "Level Principle", reward: 25,
      },
      {
        id: "m2s8", type: "balance", slide: "Slide 8: The Rice Weigh-In (NEW)",
        banner: "BALANCE THE RICE SCALE",
        dialogue: "Now a customer needs 2/3 of a kilo of rice, but the weights come in twelfths. Which weight balances it?",
        target: { n: 2, d: 3 },
        choices: [{ n: 6, d: 12 }, { n: 8, d: 12 }, { n: 3, d: 4 }, { n: 4, d: 9 }],
        rme: "Level Principle", reward: 25,
      },
      {
        id: "m2s8b", type: "sort-bins", slide: "Slide 8b: Weekend Delivery (NEW)",
        banner: "SORT THE WEEKEND DELIVERY",
        dialogue:
          "Weekend delivery is here! These crates track by threes and tens — sort them to the right shelves so the inventory stays honest!",
        bins: [3, 10], items: [9, 40, 21, 70, 27, 100],
        rme: "Activity Principle", reward: 30,
      },
      {
        id: "m2s9", type: "simplify", slide: "Slide 9: Simplification Station",
        banner: "REDUCE THE LABEL: 4/8",
        dialogue:
          "Let's write our labels in simplest terms! Divide both numbers by a common factor to reduce this tag.",
        frac: { n: 4, d: 8 },
        rme: "Level Principle", reward: 20,
      },
      {
        id: "m2s10", type: "simplify", slide: "Slide 10: Bulk Bag Labels (NEW)",
        banner: "REDUCE THE LABEL: 12/18",
        dialogue: "This bulk bag's label is too complicated for customers. Reduce 12/18 all the way to simplest form!",
        frac: { n: 12, d: 18 },
        rme: "Level Principle", reward: 25,
      },
      {
        id: "m2s11", type: "jar-fill", slide: "Slide 11: The Big Peanut Order (NEW)",
        banner: "SERVE 2/3 A JAR IN A DIFFERENT SIZE",
        dialogue:
          "Another customer needs 2/3 of a jar of peanuts — but the third-size jars just ran out too! Divide a new jar and fill the exact same amount.",
        target: { n: 2, d: 3 }, forbidden: 3, customerIcon: "👵🏽",
        rme: "Level Principle", reward: 25,
      },
      {
        id: "m2s11b", type: "jar-fill", slide: "Slide 11b: Merienda Jars (NEW)",
        banner: "SERVE 3/4 A JAR — QUARTER JARS ARE RESERVED!",
        dialogue:
          "A tricycle driver wants 3/4 of a jar of biscuits, but all the quarter-marked jars are reserved! Build the exact same amount in a different jar size.",
        target: { n: 3, d: 4 }, forbidden: 4, customerIcon: "👷🏽",
        rme: "Level Principle", reward: 25,
      },
      {
        id: "m2s12", type: "mcq", slide: "Slide 12: Peer Inventory Check",
        banner: "DO THE LEDGERS MATCH?",
        dialogue:
          "Let's make sure our logs match! Work with a teammate: one ledger says 3/4, the other says 9/12. Same final amount?",
        question: "Are 3/4 and 9/12 equivalent?",
        choices: [
          { label: "Yes — multiply 3/4 by 3/3 and you get 9/12" },
          { label: "No — 9/12 is a bigger amount" },
          { label: "No — 3/4 is a bigger amount" },
        ],
        answer: 0,
        rme: "Interactivity Principle", reward: 25,
      },
      {
        id: "m2s13", type: "boss", slide: "Slide 13: Rush Hour Challenge",
        banner: "⏰ AFTERNOON RUSH HOUR! SERVE EVERYONE!",
        dialogue:
          "It's afternoon rush hour! Everyone needs their orders simplified and sorted before the store closes. Go!",
        seconds: 120,
        questions: [
          {
            question: "Which is equivalent to 1/4?",
            choices: [{ frac: { n: 2, d: 8 } }, { frac: { n: 2, d: 4 } }, { frac: { n: 1, d: 8 } }],
            answer: 0,
          },
          {
            question: "Which number is a multiple of 8?",
            choices: [{ label: "44" }, { label: "56" }, { label: "68" }],
            answer: 1,
          },
          {
            question: "6/9 in simplest form is…",
            choices: [{ frac: { n: 3, d: 4 } }, { frac: { n: 2, d: 3 } }, { frac: { n: 1, d: 3 } }],
            answer: 1,
          },
          {
            question: "Which pair is equivalent?",
            choices: [
              { label: "2/5 and 4/10" },
              { label: "3/4 and 4/3" },
              { label: "1/2 and 2/3" },
            ],
            answer: 0,
          },
          {
            question: "15/20 in simplest form is…",
            choices: [{ frac: { n: 3, d: 4 } }, { frac: { n: 5, d: 10 } }, { frac: { n: 4, d: 5 } }],
            answer: 0,
          },
        ],
        rme: "Intertwinement Principle", reward: 50,
      },
      {
        id: "m2s14", type: "dialogue", slide: "Slide 14: Closing Time (NEW)",
        banner: "STORE CLOSED — LEDGER BALANCED!",
        dialogue:
          "Whew! The last customer is happy, the shelves are neat, and every label is in simplest form. You handled the rush like a pro!",
        art: "🌆🏪🔑", buttonLabel: "Count the Earnings",
        rme: "Reality Principle", reward: 10,
      },
      {
        id: "m2s15", type: "dialogue", slide: "Slide 15: Reward Screen",
        banner: "🏅 CERTIFIED HONEST ASSISTANT! 🏅",
        dialogue:
          "Superb work, {name}! Our inventory is flawless, and the ledger balances perfectly. Here is your well-earned share — Module 3 is unlocked!",
        art: "💰🏅⭐", buttonLabel: "Claim Rewards",
        rme: "Reality Principle", reward: 50,
      },
    ],
  },

  /* ==========================================================
     MODULE 3 — Fiesta sa Nayon (Kuya Onyok)
     Competencies: add/subtract dissimilar fractions using
     models, compute pairs, solve multi-step word problems
     ========================================================== */
  {
    id: "m3",
    title: "Fiesta sa Nayon",
    subtitle: "with Kuya Onyok, the Community Organizer",
    npc: { icon: "🕺🏽", name: "Kuya Onyok", role: "The Community Organizer" },
    competencies: [
      "Add and subtract dissimilar fractions using models",
      "Add and subtract pairs of dissimilar fractions",
      "Solve multi-step word problems",
    ],
    scenery: "🎪🎏🥤🎊🍚🎶🏮",
    sceneryImgs: [
      "/icons/game/parol.png",
      "/icons/game/balloons.png",
      "/icons/game/plants.png",
      "/icons/game/signpost.png",
    ],
    themeColor: "#7b1fa2",
    screens: [
      {
        id: "m3s2", type: "dialogue", slide: "Slide 2: Mission Briefing",
        banner: "FINDING COMMON GROUND (LCD)",
        dialogue:
          "Maligayang Fiesta, {name}! To hang flag lines and mix punch, we must add and subtract dissimilar fractions. Let's see how we find common ground using common denominators!",
        demo: "lcd", buttonLabel: "Let's Do This!",
        rme: "Guidance Principle", reward: 50,
      },
      {
        id: "m3s3", type: "punch-mix", slide: "Slide 3: Punch Practice (NEW)",
        banner: "FILL THE BOWL EXACTLY TO THE 5/6 LINE",
        dialogue:
          "Practice round! Pour juice with the 🥄 ladles until the bowl reaches EXACTLY the 5/6 line. Careful — overflow means spilled punch!",
        target: { n: 5, d: 6 },
        ladles: [{ n: 1, d: 2 }, { n: 1, d: 3 }, { n: 1, d: 6 }],
        rme: "Activity Principle", reward: 20,
      },
      {
        id: "m3s4", type: "equation", slide: "Slide 4: Ang Pagkabit ng Banderitas",
        banner: "COMBINE THE FLAG STRINGS",
        dialogue:
          "One string is 1/3 of a meter, and the other is 1/2 of a meter. Combine them precisely!",
        story: "String A = 1/3 m, String B = 1/2 m. Total length?",
        expr: "1/3 + 1/2 = ?",
        answer: { n: 5, d: 6 },
        hint: "Convert to sixths: 1/3 = 2/6 and 1/2 = 3/6.",
        rme: "Activity Principle", reward: 30,
      },
      {
        id: "m3s5", type: "dialogue", slide: "Slide 5: Immediate Feedback",
        banner: "THE FLAG LINE IS UP!",
        dialogue:
          "Fabulous! The main gate looks absolutely beautiful with those flags safely hung! Common denominators keep our strings from sagging.",
        art: "🎏🎊🎉", buttonLabel: "Next Task",
        rme: "Guidance Principle", reward: 10,
      },
      {
        id: "m3s6", type: "equation", slide: "Slide 6: Second Gate Strings (NEW)",
        banner: "STRINGS FOR THE SECOND GATE",
        dialogue: "The second gate needs a longer line. Add these two ribbon rolls together!",
        story: "Roll A = 2/5 m, Roll B = 1/2 m. Total length?",
        expr: "2/5 + 1/2 = ?",
        answer: { n: 9, d: 10 },
        hint: "Convert to tenths: 2/5 = 4/10 and 1/2 = 5/10.",
        rme: "Activity Principle", reward: 30,
      },
      {
        id: "m3s7", type: "equation", slide: "Slide 7: The Punch Station",
        banner: "MIX THE FIESTA PUNCH 🥤",
        dialogue:
          "Mix our fiesta punch! Combine 1 1/4 cups of calamansi juice with 2/3 cup of mango nectar. Calculate the total volume!",
        story: "1 1/4 cups calamansi + 2/3 cup mango = ? cups",
        expr: "1 1/4 + 2/3 = ?",
        answer: { w: 1, n: 11, d: 12 },
        allowWhole: true,
        hint: "LCD of 4 and 3 is 12: 1 3/12 + 8/12.",
        rme: "Level Principle", reward: 35,
      },
      {
        id: "m3s8", type: "equation", slide: "Slide 8: Sweetness Check (NEW)",
        banner: "ADJUST THE SYRUP",
        dialogue: "Too sweet! We poured 5/6 cup of syrup — scoop out 1/3 cup to fix the taste. How much syrup stays in the punch?",
        story: "5/6 cup − 1/3 cup = ? cup",
        expr: "5/6 − 1/3 = ?",
        answer: { n: 1, d: 2 },
        hint: "Convert 1/3 to sixths: 5/6 − 2/6.",
        rme: "Level Principle", reward: 30,
      },
      {
        id: "m3s9", type: "equation", slide: "Slide 9: Banderitas Clean-Up",
        banner: "MEASURE THE LEFTOVER TWINE",
        dialogue:
          "We started with 3 meters of twine. If we cut away 1 2/5 meters for the stage, how much is left in reserve?",
        story: "3 m − 1 2/5 m = ? m",
        expr: "3 − 1 2/5 = ?",
        answer: { w: 1, n: 3, d: 5 },
        allowWhole: true,
        hint: "Rename 3 as 2 5/5, then subtract 1 2/5.",
        rme: "Level Principle", reward: 35,
      },
      {
        id: "m3s10", type: "punch-mix", slide: "Slide 10: The Second Batch (NEW)",
        banner: "MIX THE SECOND BATCH: EXACTLY 3/4",
        dialogue:
          "More guests are coming! Mix a second batch up to exactly the 3/4 mark. Different ladles this time — choose wisely!",
        target: { n: 3, d: 4 },
        ladles: [{ n: 1, d: 2 }, { n: 1, d: 4 }, { n: 1, d: 8 }],
        rme: "Level Principle", reward: 25,
      },
      {
        id: "m3s10b", type: "equation", slide: "Slide 10b: Ang Bilao ng Kakanin (NEW)",
        banner: "HOW MUCH KAKANIN IS LEFT?",
        dialogue:
          "The bilao still had 7/8 of its kakanin, then the street dancers ate 1/4 of the tray. How much remains for the visitors?",
        story: "7/8 − 1/4 = ? of the bilao",
        expr: "7/8 − 1/4 = ?",
        answer: { n: 5, d: 8 },
        hint: "Convert to eighths: 7/8 − 2/8.",
        rme: "Level Principle", reward: 30,
      },
      {
        id: "m3s11", type: "equation", slide: "Slide 11: The Sugar Ledger (NEW)",
        banner: "MULTI-STEP: THE SUGAR SUPPLY",
        dialogue:
          "Multi-step mission! We had 5/6 kg of sugar. The punch used 1/3 kg and the kakanin used 1/4 kg. How much sugar is left?",
        story: "5/6 − 1/3 − 1/4 = ? kg",
        expr: "5/6 − 1/3 − 1/4 = ?",
        answer: { n: 1, d: 4 },
        hint: "Use twelfths: 10/12 − 4/12 − 3/12.",
        rme: "Level Principle", reward: 40,
      },
      {
        id: "m3s11b", type: "punch-mix", slide: "Slide 11b: The Grand Batch (NEW)",
        banner: "GRAND BATCH: EXACTLY 11/12!",
        dialogue:
          "The mayor is arriving — mix the grandest batch yet! Reach exactly the 11/12 line using three different ladles. Zero spills!",
        target: { n: 11, d: 12 },
        ladles: [{ n: 1, d: 2 }, { n: 1, d: 4 }, { n: 1, d: 6 }],
        rme: "Level Principle", reward: 35,
      },
      {
        id: "m3s12", type: "mcq", slide: "Slide 12: Shared Booth Setup",
        banner: "HOW MUCH WALL DO THE BOOTHS NEED?",
        dialogue:
          "The rice cake booth and ice drop booth share wall space. Coordinate with a teammate: Booth A needs 1/4 of the wall, Booth B needs 3/8. Total?",
        question: "1/4 + 3/8 = ?",
        choices: [{ frac: { n: 5, d: 8 } }, { frac: { n: 4, d: 8 } }, { frac: { n: 4, d: 12 } }, { frac: { n: 1, d: 2 } }],
        answer: 0,
        rme: "Interactivity Principle", reward: 25,
      },
      {
        id: "m3s13", type: "boss", slide: "Slide 13: Grand Opening Count",
        banner: "🎺 THE GATES OPEN IN MINUTES! 🎺",
        dialogue:
          "The gates open in minutes! Solve these multi-step problems to balance our decoration lines and juice stocks!",
        seconds: 150,
        questions: [
          {
            question: "1/2 + 1/4 = ?",
            choices: [{ frac: { n: 3, d: 4 } }, { frac: { n: 2, d: 6 } }, { frac: { n: 2, d: 4 } }],
            answer: 0,
          },
          {
            question: "2/3 − 1/6 = ?",
            choices: [{ frac: { n: 1, d: 3 } }, { frac: { n: 1, d: 2 } }, { frac: { n: 1, d: 6 } }],
            answer: 1,
          },
          {
            question: "Flags: 1/4 m + 2/8 m = ?",
            choices: [{ frac: { n: 1, d: 2 } }, { frac: { n: 3, d: 12 } }, { frac: { n: 3, d: 8 } }],
            answer: 0,
          },
          {
            question: "Punch: 2 cups − 3/4 cup = ?",
            choices: [
              { label: "1 1/4 cups" },
              { label: "1 3/4 cups" },
              { label: "1 1/2 cups" },
            ],
            answer: 0,
          },
          {
            question: "Twine: 1/2 + 1/3 − 1/6 = ?",
            choices: [{ frac: { n: 2, d: 3 } }, { frac: { n: 5, d: 6 } }, { frac: { n: 1, d: 2 } }],
            answer: 0,
          },
        ],
        rme: "Intertwinement Principle", reward: 60,
      },
      {
        id: "m3s14", type: "dialogue", slide: "Slide 14: Gates Open! (NEW)",
        banner: "WELCOME, EVERYONE — FIESTA TIME!",
        dialogue:
          "Listen to that crowd! The banderitas are high, the punch is sweet, and every booth fits perfectly. Enjoy the fiesta, partner!",
        art: "🎆🕺🏽💃🏽", buttonLabel: "Join the Celebration",
        rme: "Reality Principle", reward: 10,
      },
      {
        id: "m3s15", type: "dialogue", slide: "Slide 15: Reward Screen",
        banner: "🏆 MASTER MATH COORDINATOR! 🏆",
        dialogue:
          "We did it! Together with Tatay Ben and Ate Lalay, the whole barangay thanks you, {name}. You are our Master Math Coordinator!",
        art: "🏆👨🏽‍🌾👩🏽‍💼", buttonLabel: "View Final Score",
        rme: "Reality Principle", reward: 100,
      },
    ],
  },
];
