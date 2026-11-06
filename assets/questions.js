/* Generated from api/_lib/questions.js by `npm run questions`. Do not edit by hand. */
window.PLS_Q = {
 "REGISTRATION": {
  "id": "register",
  "steps": [
   {
    "id": "practice",
    "title": "Your practice",
    "intro": "Who is at the table. We use this for your table card, your lunch group and the comparisons in your report.",
    "questions": [
     {
      "k": "practice",
      "type": "text",
      "label": "Practice name",
      "req": true,
      "max": 120,
      "auto": "organization",
      "why": "Your table card, badges and every page of your report.",
      "feeds": [
       "profile"
      ]
     },
     {
      "k": "town",
      "type": "text",
      "label": "Town",
      "req": true,
      "max": 80,
      "placeholder": "e.g. Clifton",
      "w": "half",
      "why": "We review your local market before Day 1 and seat nearby practices at different tables.",
      "feeds": [
       "market"
      ]
     },
     {
      "k": "website",
      "type": "url",
      "label": "Website",
      "hint": "optional",
      "max": 200,
      "placeholder": "yourpractice.com",
      "w": "half",
      "why": "We look at how patients see you online before the weekend.",
      "feeds": [
       "market",
       "positioning"
      ]
     },
     {
      "k": "type",
      "type": "choice",
      "label": "Which describes you best?",
      "req": true,
      "opts": [
       "Startup (under 5 years)",
       "Established, one location",
       "Multi-site"
      ],
      "why": "Lunch tables mix by practice type, and your report compares you with practices like yours.",
      "feeds": [
       "profile"
      ]
     }
    ]
   },
   {
    "id": "team",
    "title": "Who’s coming",
    "intro": "The owner plus the people who will run the plan with you. Each person gets a badge and a CE certificate by email.",
    "questions": [
     {
      "k": "seats",
      "type": "seats",
      "label": "How many people?",
      "req": true,
      "why": "Sets your ticket and price.",
      "feeds": [
       "ops"
      ]
     },
     {
      "k": "kasper",
      "type": "check",
      "label": "We’re a current Kasper customer",
      "hint": "20% off a standard team of three",
      "why": "Applies the customer rate.",
      "feeds": [
       "ops"
      ]
     },
     {
      "k": "owner",
      "type": "owner",
      "label": "Practice owner",
      "req": true,
      "why": "Confirmations, the invoice and the welcome call go to the owner.",
      "feeds": [
       "ops"
      ]
     },
     {
      "k": "members",
      "type": "members",
      "label": "The rest of your team",
      "why": "Names and roles set badges and who sits where in role play; emails receive CE certificates.",
      "feeds": [
       "team",
       "ops"
      ]
     },
     {
      "k": "invoiceEmail",
      "type": "email",
      "label": "Send the invoice to",
      "hint": "only if not the owner",
      "max": 120,
      "why": "So the invoice reaches whoever pays it.",
      "feeds": [
       "ops"
      ]
     }
    ]
   },
   {
    "id": "care",
    "title": "Looking after you",
    "intro": "So the weekend runs smoothly for everyone at your table.",
    "questions": [
     {
      "k": "hotel",
      "type": "choice",
      "label": "Do you need hotel rooms?",
      "hint": "for teams driving 45 minutes or more",
      "opts": [
       "No room needed",
       "Friday night",
       "Saturday night",
       "Friday and Saturday"
      ],
      "why": "We size the hotel room block.",
      "feeds": [
       "ops"
      ]
     },
     {
      "k": "diet",
      "type": "text",
      "label": "Dietary needs",
      "hint": "halal, kosher, vegetarian, gluten-free, allergies",
      "max": 200,
      "why": "Catering for every person at your table.",
      "feeds": [
       "ops"
      ]
     },
     {
      "k": "access",
      "type": "text",
      "label": "Accessibility needs",
      "max": 200,
      "why": "Room set-up and seating.",
      "feeds": [
       "ops"
      ]
     },
     {
      "k": "heard",
      "type": "choice",
      "label": "How did you hear about the summit?",
      "opts": [
       "Kasper",
       "Global Academy of Dentistry",
       "Another practice (referral)",
       "Greater New York Dental Meeting",
       "Other"
      ],
      "why": "Tells us which channels work, for the next summit.",
      "feeds": [
       "ops"
      ]
     },
     {
      "k": "referredBy",
      "type": "text",
      "label": "Which practice referred you?",
      "max": 120,
      "showIf": [
       "heard",
       "Another practice (referral)"
      ],
      "why": "The referring practice earns a WinDSO referral ticket.",
      "feeds": [
       "ops"
      ]
     }
    ]
   },
   {
    "id": "confirm",
    "title": "Confirm",
    "intro": "Check your table, choose what we may send you, and claim it. We invoice after you register; no card today.",
    "questions": [
     {
      "k": "consents",
      "type": "consents",
      "label": "Your choices",
      "why": "Photo use, updates and partner introductions only with your permission.",
      "feeds": [
       "ops"
      ]
     }
    ]
   }
  ]
 },
 "PREWORK": {
  "id": "prework",
  "steps": [
   {
    "id": "find",
    "title": "Find your table",
    "intro": "So your answers land on the right practice. Your registration number is in your confirmation email.",
    "questions": [
     {
      "k": "number",
      "type": "text",
      "label": "Registration number",
      "hint": "e.g. 7 or PLS-007",
      "req": true,
      "max": 12,
      "w": "half",
      "inputmode": "numeric",
      "why": "Links your pre-work to your registration.",
      "feeds": [
       "ops"
      ]
     },
     {
      "k": "practice",
      "type": "text",
      "label": "Practice name",
      "req": true,
      "max": 120,
      "w": "half",
      "why": "A second check that we match the right practice.",
      "feeds": [
       "ops"
      ]
     },
     {
      "k": "email",
      "type": "email",
      "label": "Your email",
      "req": true,
      "max": 120,
      "why": "Where we send your report and book the welcome call.",
      "feeds": [
       "ops"
      ]
     },
     {
      "k": "answeredBy",
      "type": "choice",
      "label": "You are the…",
      "req": true,
      "opts": [
       "Owner dentist",
       "Practice or office manager",
       "Associate dentist",
       "Other team member"
      ],
      "why": "Owners and managers often see the practice differently. We note whose view this is.",
      "feeds": [
       "profile",
       "selfview"
      ]
     }
    ]
   },
   {
    "id": "size",
    "title": "Your practice today",
    "intro": "Sizes your practice, so every comparison is like with like.",
    "questions": [
     {
      "k": "years",
      "type": "number",
      "label": "Years open",
      "min": 0,
      "max": 80,
      "w": "third",
      "why": "Startups and established practices are benchmarked separately.",
      "feeds": [
       "profile"
      ]
     },
     {
      "k": "locations",
      "type": "number",
      "label": "Locations",
      "min": 1,
      "max": 50,
      "w": "third",
      "value": 1,
      "why": "Multi-site practices get a separate operations lens.",
      "feeds": [
       "profile"
      ]
     },
     {
      "k": "operatories",
      "type": "number",
      "label": "Operatories",
      "hint": "all locations",
      "min": 1,
      "max": 300,
      "w": "third",
      "why": "Chair capacity. Production per chair is a core benchmark.",
      "feeds": [
       "profile",
       "finances"
      ]
     },
     {
      "k": "dentists",
      "type": "number",
      "label": "Dentists",
      "hint": "full-time equivalent",
      "min": 0,
      "max": 100,
      "step": 0.5,
      "w": "third",
      "why": "New patients and production are compared per dentist.",
      "feeds": [
       "profile",
       "patients"
      ]
     },
     {
      "k": "hygienists",
      "type": "number",
      "label": "Hygienists",
      "hint": "full-time equivalent",
      "min": 0,
      "max": 100,
      "step": 0.5,
      "w": "third",
      "why": "Hygiene capacity drives recall and steady production.",
      "feeds": [
       "profile",
       "team"
      ]
     },
     {
      "k": "teamSize",
      "type": "number",
      "label": "Whole team",
      "hint": "every role",
      "min": 1,
      "max": 500,
      "w": "third",
      "why": "Team size against production shows staffing efficiency.",
      "feeds": [
       "profile",
       "team"
      ]
     },
     {
      "k": "software",
      "type": "select",
      "label": "Practice management software",
      "opts": [
       "Dentrix",
       "Dentrix Ascend",
       "Eaglesoft",
       "Open Dental",
       "Curve Dental",
       "Denticon",
       "Other"
      ],
      "why": "Tells our technology experts what can be automated in the system you already pay for.",
      "feeds": [
       "technology"
      ]
     }
    ]
   },
   {
    "id": "patients",
    "title": "Patients",
    "intro": "Where growth comes from and whether patients stay. Rough figures are fine.",
    "questions": [
     {
      "k": "newPatients",
      "type": "number",
      "label": "New patients a month",
      "min": 0,
      "max": 5000,
      "w": "half",
      "why": "The main growth signal, compared with peers per dentist.",
      "feeds": [
       "patients"
      ]
     },
     {
      "k": "activePatients",
      "type": "select",
      "label": "Active patients",
      "hint": "seen in the last 18 months",
      "w": "half",
      "opts": [
       "Under 1,000",
       "1,000–2,500",
       "2,500–5,000",
       "5,000–10,000",
       "Over 10,000",
       "Not sure"
      ],
      "why": "With new patients a month, shows whether you are growing or replacing losses.",
      "feeds": [
       "patients"
      ]
     },
     {
      "k": "payer",
      "type": "pct3",
      "label": "Payer mix",
      "hint": "should add up to about 100%",
      "parts": [
       {
        "k": "ppo",
        "label": "Insurance (PPO)"
       },
       {
        "k": "medicaid",
        "label": "Medicaid and CHIP"
       },
       {
        "k": "ffs",
        "label": "Fee-for-service or membership"
       }
      ],
      "why": "Payer mix shapes pricing power and which growth paths fit, such as scaling with Medicaid.",
      "feeds": [
       "patients",
       "finances",
       "direction"
      ]
     },
     {
      "k": "npSource",
      "type": "choice",
      "label": "Where do most new patients come from?",
      "opts": [
       "Patient referrals",
       "Google and online search",
       "Insurance directory",
       "Social media",
       "Location and walk-ins",
       "Other"
      ],
      "why": "Your marketing baseline.",
      "feeds": [
       "patients",
       "market"
      ]
     },
     {
      "k": "reappoint",
      "type": "choice",
      "label": "Hygiene patients who leave with their next visit booked",
      "opts": [
       "80% or more",
       "60–80%",
       "Under 60%",
       "We don't track it"
      ],
      "why": "The strongest sign that patients stay, and the steadiest source of production.",
      "feeds": [
       "patients"
      ]
     }
    ]
   },
   {
    "id": "money",
    "title": "Money",
    "intro": "Ranges only. Seen by your facilitators, never shared with other practices.",
    "questions": [
     {
      "k": "production",
      "type": "choice",
      "label": "Monthly production, roughly",
      "opts": [
       "Under $100k",
       "$100k–$200k",
       "$200k–$400k",
       "$400k–$800k",
       "Over $800k"
      ],
      "why": "Sets your scale. With operatories, gives production per chair.",
      "feeds": [
       "finances"
      ]
     },
     {
      "k": "trend",
      "type": "choice",
      "label": "Compared with last year",
      "opts": [
       "Up more than 10%",
       "Up a little",
       "About the same",
       "Down",
       "Open less than a year"
      ],
      "why": "Direction matters more than size.",
      "feeds": [
       "finances"
      ]
     },
     {
      "k": "overhead",
      "type": "choice",
      "label": "Overhead as a share of collections",
      "opts": [
       "Under 60%",
       "60–70%",
       "70–80%",
       "Over 80%",
       "Not sure"
      ],
      "why": "Profitability, and how much room there is to invest in the plan. “Not sure” is a useful answer too.",
      "feeds": [
       "finances",
       "plan"
      ]
     },
     {
      "k": "caseAccept",
      "type": "choice",
      "label": "Treatment plans patients accept",
      "opts": [
       "70% or more",
       "About half",
       "Less than half",
       "We don't track it"
      ],
      "why": "Often the fastest revenue lever. It feeds Day 2, What to fix first.",
      "feeds": [
       "finances",
       "priorities"
      ]
     }
    ]
   },
   {
    "id": "teamtech",
    "title": "Team and technology",
    "intro": "The people and tools that will carry your plan.",
    "questions": [
     {
      "k": "turnover",
      "type": "choice",
      "label": "People who left in the last 12 months",
      "opts": [
       "Nobody",
       "1–2 people",
       "3–5 people",
       "6 or more"
      ],
      "why": "How stable the team is that has to run the plan.",
      "feeds": [
       "team",
       "readiness"
      ]
     },
     {
      "k": "hardestRole",
      "type": "choice",
      "label": "Hardest role to fill",
      "opts": [
       "Hygienist",
       "Dental assistant",
       "Front desk",
       "Associate dentist",
       "Office manager",
       "None, we're fully staffed"
      ],
      "why": "Hiring needs feed Day 2, Resources, learning and investment.",
      "feeds": [
       "team",
       "plan"
      ]
     },
     {
      "k": "meetings",
      "type": "choice",
      "label": "How often does the whole team meet?",
      "opts": [
       "Daily huddle",
       "Weekly",
       "Monthly",
       "Rarely"
      ],
      "why": "Tells us how your 90-day plan will be followed up at the practice.",
      "feeds": [
       "team",
       "plan"
      ]
     },
     {
      "k": "tools",
      "type": "multi",
      "label": "Which of these do you use today?",
      "hint": "tap all that apply",
      "opts": [
       "Online booking",
       "Digital intake forms",
       "Automated reminders",
       "Two-way texting",
       "Text-to-pay or online payments",
       "In-house membership plan",
       "Intraoral scanner",
       "CBCT",
       "AI tools (notes, X-rays or calls)"
      ],
      "why": "Your technology baseline, matched to the expert clinics on Day 2.",
      "feeds": [
       "technology"
      ]
     },
     {
      "k": "change",
      "type": "choice",
      "label": "When something changes, our team usually…",
      "opts": [
       "Embraces it quickly",
       "Comes along once convinced",
       "Resists quietly",
       "Pushes back openly"
      ],
      "why": "Shapes your coaching in Negotiating change with your team.",
      "feeds": [
       "readiness"
      ]
     }
    ]
   },
   {
    "id": "direction",
    "title": "Where you’re heading",
    "intro": "Your view of today and where you want to go. This is where Day 1 starts.",
    "questions": [
     {
      "k": "scores",
      "type": "scores",
      "label": "Rate your practice today",
      "hint": "1 is weak, 5 is strong",
      "parts": [
       {
        "k": "sPatients",
        "label": "Patients"
       },
       {
        "k": "sTeam",
        "label": "Team"
       },
       {
        "k": "sTech",
        "label": "Technology"
       },
       {
        "k": "sFinances",
        "label": "Finances"
       },
       {
        "k": "sMarket",
        "label": "Market position"
       }
      ],
      "why": "We compare your view with your numbers. Where they differ is where the conversation starts.",
      "feeds": [
       "selfview"
      ]
     },
     {
      "k": "chosenFor",
      "type": "multi",
      "pick": 2,
      "label": "Why do patients choose you over others nearby?",
      "hint": "pick up to two",
      "opts": [
       "Convenience and location",
       "Insurance we accept",
       "Price",
       "Quality and reputation",
       "Specific services",
       "Relationships and trust",
       "Hours and availability"
      ],
      "why": "The raw material for your positioning on Day 1.",
      "feeds": [
       "positioning"
      ]
     },
     {
      "k": "compared",
      "type": "text",
      "label": "Who do patients compare you with?",
      "hint": "one to three practices or chains nearby",
      "max": 300,
      "why": "The competitors we benchmark you against.",
      "feeds": [
       "market",
       "positioning"
      ]
     },
     {
      "k": "direction",
      "type": "choice",
      "label": "Your main direction for the next three years",
      "opts": [
       "Grow this location",
       "Open another location",
       "Add a specialty or new service",
       "Scale with Medicaid",
       "Fix the basics first",
       "Prepare to sell or partner"
      ],
      "why": "Anchors your areas of focus on Day 1.",
      "feeds": [
       "direction"
      ]
     },
     {
      "k": "challenges",
      "type": "list3",
      "label": "Your three biggest challenges right now",
      "hint": "a few words each",
      "req": true,
      "max": 200,
      "why": "The starting list for Day 2, What to fix first.",
      "feeds": [
       "priorities"
      ]
     },
     {
      "k": "goodWeekend",
      "type": "textarea",
      "label": "What would make this weekend a success for your team?",
      "max": 1500,
      "why": "What we measure the weekend against on your Day-30 call.",
      "feeds": [
       "plan"
      ]
     },
     {
      "k": "callTime",
      "type": "choice",
      "label": "Best time for your 20-minute welcome call",
      "opts": [
       "Dec 14–18, mornings",
       "Dec 14–18, afternoons",
       "Dec 14–18, evenings",
       "Jan 4–6 (late registrants)"
      ],
      "why": "We book the call where your report is walked through.",
      "feeds": [
       "ops"
      ]
     }
    ]
   }
  ]
 },
 "REPORT_SECTIONS": {
  "profile": "Practice profile",
  "patients": "Scorecard · Patients",
  "team": "Scorecard · Team",
  "technology": "Scorecard · Technology",
  "finances": "Scorecard · Finances",
  "market": "Scorecard · Market position",
  "selfview": "How you see yourselves",
  "positioning": "Positioning",
  "direction": "Direction and areas of focus",
  "priorities": "Priorities",
  "readiness": "Readiness for change",
  "plan": "90-day plan and follow-up",
  "ops": "Event operations (not in the report)"
 }
};
