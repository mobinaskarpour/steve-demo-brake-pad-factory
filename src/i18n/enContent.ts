/* Auto-generated English overlays for bilingual demo content — 04-brake-pad-factory */
export const enContent = {
  "config": {
    "brandName": "AryaTormoz Brake Factory",
    "shortName": "AryaTormoz",
    "tagline": "Unified business command center",
    "scopeLabel": "AryaTormoz Brake Factory • All businesses",
    "askSteveIntro": "Ask about operations, approvals, risks, and today's priorities.",
    "planQuestion": "Where are we going, and what must happen next?",
    "intelligenceQuestion": "What does the evidence say, and how well does Steve understand the business?",
    "workQuestion": "What is currently in motion?",
    "mapQuestion": "How is the business structured, directed, and governed?",
    "agentsQuestion": "What is the current state of this node or specialist agent?",
    "communicationQuestion": "Who needs to know, respond, decide, or follow up?",
    "trendTitle": "Primary KPI trend",
    "trendSubtitle": "Last 7 days",
    "askPrompts": [
      "Show the latest visual monitoring view",
      "Which production batch is currently on quality hold or quarantine?",
      "What is the status of BATCH-2417 and QC sheet QC-0241?",
      "Why was BR-MR-184 created for phenolic resin?",
      "What impact does Press 2 downtime have on PROD-1148?",
      "Explain the delivery commitment for SO-3092",
      "Should we approve BR-MNT-442 today?",
      "Which raw material threatens this week's production plan?",
      "What is the batch reject rate over the last 30 days?",
      "Is FG-8842 inventory enough for SO-3092?",
      "What stage is the 8D corrective action for BATCH-2417 in?",
      "What delay occurs if BR-MR-184 is rejected?",
      "How much Press 1 capacity is free after Press 2 downtime?",
      "Which customer order is at risk of late delivery?"
    ],
    "sidebarBlurb": "Unified monitoring of operations, finance, and correspondence",
    "userName": "Eng. Arash Arya",
    "userRole": "Executive"
  },
  "brief": {
    "greeting": "Good morning, Eng. Arya",
    "dateLabel": "Saturday, 8 Aug 2026",
    "paragraphs": [
      "The line is running one press down: hydraulic press 2 has been stopped since 06:40 for a leak, and its maintenance cost (transaction BR-MNT-442) is queued in finance. The emergency friction-material purchase (request BR-MR-184) is also still waiting for your approval, while phenolic resin SP-1068 has dropped below its reorder point.",
      "Batch BATCH-2417 failed the friction-coefficient test and was quarantined under certificate QC-0241; with a shortage of 640 pairs of FG-8842, the SO-3092 delivery commitment to Ghate’Gostar Pars cannot be met unless production order PROD-1148 is released. The customer letter 412/K also remains unanswered.",
      "Before noon, approval of BR-MR-184, disposition of BATCH-2417, and the press 2 restart need to be clear so the 10:00 production planning meeting and the 12:30 quality committee can decide on the real state of the line."
    ],
    "lines": [
      {
        "label": "Since your last review",
        "text": "Batch BATCH-2418 entered the curing oven; BR-MR-184 and BR-MNT-442 remained in the approval queue."
      },
      {
        "label": "Still open",
        "text": "The BATCH-2417 quarantine, the press 2 stoppage, and the unanswered customer letter."
      },
      {
        "label": "Today's focus",
        "text": "Remove the press 2 blocker and release PROD-1148 before the 10:00 meeting."
      },
      {
        "label": "Prepare now",
        "text": "Production planning meeting at 10:00 and quality committee at 12:30."
      }
    ]
  },
  "units": {
    "unit-holding": {
      "name": "AryaTormoz Plant Management",
      "kind": "Command center",
      "kpiLabel": "Units under watch",
      "kpiValue": "9",
      "summary": "Unified oversight of planning, production, quality, procurement, warehousing, sales, and finance across the plant.",
      "alert": "Line downtime",
      "owner": "Eng. Arash Arya"
    },
    "unit-fuel": {
      "name": "Production & Pressing",
      "kind": "Production line",
      "kpiLabel": "Output yesterday",
      "kpiValue": "11.6k pairs",
      "summary": "Mixing, hot pressing, curing, and finishing of brake pads on two 400-tonne hydraulic press lines.",
      "alert": "Press 2 has been down since 06:40",
      "owner": "Press Line Supervisor"
    },
    "unit-plan": {
      "name": "Production Planning",
      "kind": "Planning",
      "kpiLabel": "Open production orders",
      "kpiValue": "6",
      "summary": "Translating sales orders into production orders, sequencing batches, and balancing press and curing-oven capacity.",
      "alert": "PROD-1148 slipped because of the press stoppage",
      "owner": "Planning Specialist"
    },
    "unit-agri": {
      "name": "Quality Control",
      "kind": "Quality",
      "kpiLabel": "Batch rejection rate",
      "kpiValue": "3.1%",
      "summary": "Friction coefficient, shear, thickness, and NVH testing on a sample from every batch before product release.",
      "alert": "Batch BATCH-2417 failed the friction test",
      "owner": "Laboratory Manager"
    },
    "unit-proc": {
      "name": "Material Procurement",
      "kind": "Procurement",
      "kpiLabel": "Open requests",
      "kpiValue": "3",
      "summary": "Sourcing resin, fibres, mineral fillers, and backing plates from approved suppliers.",
      "alert": "Friction material below reorder point",
      "owner": "Procurement Specialist"
    },
    "unit-hr": {
      "name": "Maintenance",
      "kind": "Maintenance",
      "kpiLabel": "Open stoppages",
      "kpiValue": "1",
      "summary": "Preventive maintenance and repair of presses, the curing oven, mixers, and the finishing line.",
      "alert": "Hydraulic leak on press 2",
      "owner": "Maintenance Supervisor"
    },
    "unit-wh": {
      "name": "Material & Product Warehouse",
      "kind": "Warehousing",
      "kpiLabel": "Below reorder point",
      "kpiValue": "5 SKUs",
      "summary": "Raw materials, backing plates, packaging items, and finished goods ready to ship.",
      "alert": "Phenolic resin SP-1068 close to stock-out",
      "owner": "Warehouse Supervisor"
    },
    "unit-re": {
      "name": "Sales & Orders",
      "kind": "Sales",
      "kpiLabel": "Open orders",
      "kpiValue": "14",
      "summary": "OEM and aftermarket orders, delivery commitments, and shipping coordination with customers.",
      "alert": "SO-3092 at risk of late delivery",
      "owner": "Sales Manager"
    },
    "unit-fin": {
      "name": "Finance",
      "kind": "Finance",
      "kpiLabel": "Open approvals",
      "kpiValue": "3",
      "summary": "Supplier payments, per-batch costing, and control of line-downtime cost.",
      "alert": "Press maintenance cost and emergency purchase pending",
      "owner": "Finance Manager"
    },
    "unit-corr": {
      "name": "Correspondence & Technical Records",
      "kind": "Correspondence",
      "kpiLabel": "Overdue letters",
      "kpiValue": "1",
      "summary": "Logging and following up OEM customer correspondence, conformity reports, and corrective-action files — the exact approval flow is not yet finalised and is shown here as a demo example.",
      "alert": "Customer corrective-action request unanswered",
      "owner": "Technical Secretariat"
    }
  },
  "alerts": {
    "alert-inv-friction": {
      "title": "Phenolic resin friction material shortage",
      "summary": "Stock is at 14 sacks, roughly 2.3 days of cover. Purchase request BR-MR-184 is awaiting your approval.",
      "type": "Inventory"
    },
    "alert-qc-556": {
      "title": "QC failure on batch BATCH-2417",
      "summary": "The sample friction coefficient fell outside the allowed window; 980 kg of the batch was quarantined — QC-0241.",
      "type": "Quality"
    },
    "alert-press-stop": {
      "title": "Hydraulic press 2 stoppage",
      "summary": "Hydraulic leak since 06:40; each shift of downtime removes about 2.8k pairs of output.",
      "type": "Line stoppage"
    },
    "alert-fin-maint": {
      "title": "Approve press 2 maintenance cost",
      "summary": "Transaction BR-MNT-442 for 320 million IRT is awaiting plant management approval.",
      "type": "Finance"
    },
    "alert-so-3092": {
      "title": "SO-3092 delivery commitment at risk",
      "summary": "FG-8842 stock is not enough to complete the order; the 22 Mordad delivery cannot be met without a replacement batch.",
      "type": "Delivery commitment"
    },
    "alert-so-backlog": {
      "title": "Production order PROD-1148 overdue",
      "summary": "SO-3081 has been queued for nine days; PROD-1148 has not been issued because of the press 2 stoppage and is pushing the weekly plan back.",
      "type": "Sales order"
    },
    "alert-corr-412": {
      "title": "Customer corrective-action request unanswered",
      "summary": "Letter 412/K from Ghateh Gostar Pars requires an 8D report by 20 Mordad.",
      "type": "Correspondence"
    },
    "alert-hr-late": {
      "title": "Attendance delay for the press 2 operator",
      "summary": "Ali Mousavi arrived 35 minutes late for the press line morning shift.",
      "type": "Attendance"
    }
  },
  "inventory": {
    "inv-oil-10w40": {
      "sku": "Phenolic resin SP-1068 (friction material)",
      "warehouse": "Raw material warehouse",
      "unit": "25 kg sack"
    },
    "inv-fiber": {
      "sku": "Aramid fibre AR-9",
      "warehouse": "Raw material warehouse",
      "unit": "sack"
    },
    "inv-backplate": {
      "sku": "Steel backing plate BP-24",
      "warehouse": "Raw material warehouse",
      "unit": "pc"
    },
    "inv-powder": {
      "sku": "Black epoxy powder coating",
      "warehouse": "Auxiliary material warehouse",
      "unit": "drum"
    },
    "inv-fg-8842": {
      "sku": "Finished goods FG-8842 — passenger disc brake pad",
      "warehouse": "Finished goods warehouse",
      "unit": "pair"
    },
    "inv-pack": {
      "sku": "Cartons and shrink packaging",
      "warehouse": "Finished goods warehouse",
      "unit": "pc"
    }
  },
  "purchases": {
    "BR-MR-184": {
      "title": "Emergency purchase of friction material — phenolic resin SP-1068",
      "reason": "Stock has fallen to 14 sacks; at an average draw of 6 sacks per day that is roughly 2.3 days of cover, after which mixing for the next batches will stop.",
      "vendor": "",
      "amountLabel": "486 million IRT"
    },
    "BR-MR-191": {
      "title": "Purchase epoxy powder coating for the finishing line",
      "reason": "Approaching the reorder point before the FG-8845 production run starts.",
      "vendor": "",
      "amountLabel": "92 million IRT"
    },
    "PR-196": {
      "title": "Purchase a spare die for press 2 (code T-118)",
      "reason": "Wear on the current die is affecting final thickness and raising the risk of repeat QC rejections.",
      "vendor": "",
      "amountLabel": "264 million IRT"
    }
  },
  "transactions": {
    "BR-MNT-442": {
      "title": "Emergency maintenance cost for hydraulic press 2",
      "amountLabel": "320 million IRT",
      "party": "",
      "category": "Maintenance"
    },
    "TX-468": {
      "title": "Scrap cost for rejected batch BATCH-2417",
      "amountLabel": "74 million IRT",
      "party": "",
      "category": "Scrap"
    },
    "BR-FRT-451": {
      "title": "Emergency freight cost for raw materials",
      "category": "Freight"
    },
    "BR-REV-460": {
      "title": "Realised sales for the FG-8840 run — consolidated",
      "category": "Sales"
    }
  },
  "employees": {
    "emp-mosavi": {
      "name": "Ali Mousavi",
      "role": "Press 2 Operator",
      "shift": ""
    },
    "emp-karimi": {
      "name": "Maryam Karimi",
      "role": "Quality Laboratory Inspector",
      "shift": ""
    },
    "emp-nouri": {
      "name": "Hossein Nouri",
      "role": "Raw Material Storekeeper",
      "shift": ""
    },
    "emp-rasouli": {
      "name": "Saeed Rasouli",
      "role": "Hydraulic Maintenance Technician",
      "shift": ""
    }
  },
  "correspondence": {
    "BR-CORR-412": {
      "number": "412/K",
      "title": "Request for a corrective-action report on batch BATCH-2417",
      "from": "Ghateh Gostar Pars — Quality Assurance",
      "to": "AryaTormoz Brake Pad Factory",
      "owner": "Technical Secretariat",
      "summary": "The OEM customer has requested an 8D report and release documentation for subsequent batches by the stated deadline."
    }
  },
  "workItems": {
    "work-wh-1": {
      "title": "Emergency supply of phenolic resin friction material",
      "type": "Purchase",
      "stage": "Observe",
      "description": "BR-MR-184 was raised to prevent mixing and pressing from stopping on batch B-2419 onwards.",
      "owner": "Procurement Agent"
    },
    "work-wh-2": {
      "title": "Replenish powder coating for the finishing line",
      "type": "Purchase",
      "stage": "Prepare",
      "description": "BR-MR-191, ahead of the FG-8845 run.",
      "owner": "Warehouse Agent"
    },
    "work-maint-1": {
      "title": "Fix the hydraulic leak and restart press 2",
      "type": "Maintenance",
      "stage": "Executing",
      "description": "Down since 06:40; valve replacement and main cylinder resealing, dependent on approval of BR-MNT-442.",
      "owner": "Maintenance Agent"
    },
    "work-qc-1": {
      "title": "Corrective action on rejected batch BATCH-2417",
      "type": "Quality",
      "stage": "Executing",
      "description": "QC-0241 record: 980 kg quarantined, sample retest, and review of the curing oven temperature profile.",
      "owner": "Quality Control Agent"
    },
    "work-fin-1": {
      "title": "Approve emergency maintenance cost for press 2",
      "type": "Finance",
      "stage": "Observe",
      "description": "Transaction BR-MNT-442 / APR-102 is awaiting plant manager approval.",
      "owner": "Finance Agent"
    },
    "work-fin-2": {
      "title": "Review the emergency material freight cost",
      "type": "Finance",
      "stage": "Executing",
      "description": "19% anomaly in freight cost — BR-FRT-451.",
      "owner": "Finance Agent"
    },
    "work-re-1": {
      "title": "Resolve the SO-3092 delivery commitment",
      "type": "Sales",
      "stage": "Observe",
      "description": "A 640-pair shortfall of FG-8842 for the Ghateh Gostar Pars order; options are allocating from BATCH-2418 or a phased delivery.",
      "owner": "Sales Agent"
    },
    "work-plan-1": {
      "title": "Issue the production order for backlogged order SO-3081",
      "type": "Planning",
      "stage": "Prepare",
      "description": "PROD-1148 can be issued once press 2 capacity is released.",
      "owner": "Planning Agent"
    },
    "work-fuel-1": {
      "title": "Stabilise the press line 1 output rate",
      "type": "Production",
      "stage": "Authorized",
      "description": "Offset part of the press 2 stoppage with a compressed shift on press 1.",
      "owner": "Press Line Supervisor"
    },
    "work-ship-1": {
      "title": "Prepare shipment SH-1207",
      "type": "Shipping",
      "stage": "Executing",
      "description": "Load 720 pairs of FG-8842 and issue shipping documents for the aftermarket customer.",
      "owner": "Sales Agent"
    },
    "work-proc-1": {
      "title": "Revise reorder points for fibre and resin",
      "type": "Procurement",
      "stage": "Propose",
      "description": "Reset reorder points against actual 30-day consumption and supplier lead time.",
      "owner": "Procurement Agent"
    },
    "work-corr-1": {
      "title": "Reply to corrective-action letter 412/K",
      "type": "Correspondence",
      "stage": "Executing",
      "description": "Prepare the 8D report and attach the BATCH-2417 retest results.",
      "owner": "Correspondence Agent"
    },
    "work-hr-1": {
      "title": "Follow up on the press 2 operator delay",
      "type": "Workforce",
      "stage": "Propose",
      "description": "35-minute delay logged; a conversation with the shift supervisor is required.",
      "owner": "Press Line Supervisor"
    },
    "work-aux-1": {
      "title": "Calibrate the curing oven thermocouple",
      "type": "Quality",
      "owner": "Quality Control Agent",
      "description": "Routine plant work kept open in the day’s queue."
    },
    "work-aux-2": {
      "title": "Cycle count raw materials in the warehouse",
      "type": "Warehouse",
      "owner": "Warehouse Agent",
      "description": "Routine plant work kept open in the day’s queue."
    },
    "work-aux-3": {
      "title": "Chase the resin supplier invoice",
      "type": "Finance",
      "owner": "Finance Agent",
      "description": "Routine plant work kept open in the day’s queue."
    },
    "work-aux-4": {
      "title": "Prepare the weekly production report",
      "type": "Management",
      "owner": "Planning Agent",
      "description": "Routine plant work kept open in the day’s queue."
    },
    "work-aux-5": {
      "title": "Inspect the press 1 dies",
      "type": "Maintenance",
      "owner": "Maintenance Agent",
      "description": "Routine plant work kept open in the day’s queue."
    },
    "work-aux-6": {
      "title": "Update the OEM customer file",
      "type": "Sales",
      "owner": "Sales Agent",
      "description": "Routine plant work kept open in the day’s queue."
    },
    "work-aux-7": {
      "title": "Audit the batch record sheets",
      "type": "Quality",
      "owner": "Quality Control Agent",
      "description": "Routine plant work kept open in the day’s queue."
    },
    "work-aux-8": {
      "title": "Archive the BATCH-2416 test certificate",
      "type": "Correspondence",
      "owner": "Correspondence Agent",
      "description": "Routine plant work kept open in the day’s queue."
    },
    "work-aux-9": {
      "title": "Review the material purchase approval ceiling",
      "type": "Finance",
      "owner": "Finance Agent",
      "description": "Routine plant work kept open in the day’s queue."
    },
    "work-aux-10": {
      "title": "Service mixer number 3",
      "type": "Maintenance",
      "owner": "Maintenance Agent",
      "description": "Routine plant work kept open in the day’s queue."
    },
    "work-aux-11": {
      "title": "Check the finished-goods issue note",
      "type": "Warehouse",
      "owner": "Warehouse Agent",
      "description": "Routine plant work kept open in the day’s queue."
    },
    "work-aux-12": {
      "title": "Settle the hydraulic maintenance contractor",
      "type": "Finance",
      "owner": "Finance Agent",
      "description": "Routine plant work kept open in the day’s queue."
    }
  },
  "threads": {
    "thr-br-mr-184": {
      "title": "Purchase approval BR-MR-184 — friction material",
      "channel": "Procurement",
      "preview": "Purchase request BR-MR-184 has been sent for approval."
    },
    "thr-br-mnt-442": {
      "title": "Press 2 emergency maintenance and BR-MNT-442 approval",
      "channel": "Maintenance",
      "preview": "BR-MNT-442 is ready for approval."
    },
    "thr-qc-556": {
      "title": "QC-0241 rejection on batch BATCH-2417",
      "channel": "Quality",
      "preview": "Batch BATCH-2417 has been quarantined."
    },
    "thr-so-3092": {
      "title": "SO-3092 delivery commitment — Ghateh Gostar Pars",
      "channel": "Sales",
      "preview": "A 640-pair shortfall to complete the order."
    },
    "thr-corr-412": {
      "title": "Customer letter 412/K — 8D report",
      "channel": "Correspondence",
      "preview": "The reply deadline is 20 Mordad."
    },
    "thr-hr-late": {
      "title": "Press line morning-shift delay",
      "channel": "Production",
      "preview": "Suggested opening a follow-up task."
    }
  },
  "agents": {
    "agent-exec": {
      "name": "Executive Oversight Agent",
      "role": "Command center",
      "domain": "Plant management",
      "summary": "Monitors the production line, quality, and supply together, and prioritises the plant manager’s decisions for today.",
      "kpis": [
        {
          "label": "Items needing a decision",
          "value": "8",
          "hint": "Today"
        },
        {
          "label": "Monthly goal progress",
          "value": "56%",
          "hint": "5 active goals"
        },
        {
          "label": "Units in alert",
          "value": "5",
          "hint": "Production, quality, maintenance, warehouse, sales"
        },
        {
          "label": "Data freshness",
          "value": "09:42",
          "hint": "Last sync"
        }
      ]
    },
    "agent-fin": {
      "name": "Finance & Settlements",
      "role": "Finance & Settlements",
      "domain": "Finance & Settlements",
      "summary": "Cash is stable, but maintenance cost, an emergency purchase, and batch scrap are all in the approval queue.",
      "kpis": [
        {
          "label": "Operating cash",
          "value": "8.4 billion",
          "hint": "After the payment queue"
        },
        {
          "label": "Weekly sales",
          "value": "3.12 billion",
          "hint": "vs 7-day average"
        },
        {
          "label": "Open approvals",
          "value": "3",
          "hint": "BR-MNT-442 · BR-FRT-451 · TX-468"
        },
        {
          "label": "Line downtime cost",
          "value": "210 million",
          "hint": "Estimated today"
        }
      ]
    },
    "agent-wh": {
      "name": "Warehouse Agent",
      "role": "Material & product inventory",
      "domain": "Warehousing",
      "summary": "Friction material is below the reorder point, and finished-goods stock is also short for SO-3092.",
      "kpis": [
        {
          "label": "Below reorder point",
          "value": "5",
          "hint": "SKUs"
        },
        {
          "label": "Days of friction material left",
          "value": "2.3",
          "hint": "Based on 7-day consumption"
        },
        {
          "label": "Open requests",
          "value": "3",
          "hint": "BR-MR-184 / BR-MR-191 / PR-196"
        },
        {
          "label": "FG-8842 on hand",
          "value": "1,860 pairs",
          "hint": "Short for SO-3092"
        }
      ]
    },
    "agent-fuel": {
      "name": "Production",
      "role": "Production operations",
      "domain": "Production",
      "summary": "Press line 1 is stable, but the press 2 stoppage has put today’s plan under pressure.",
      "kpis": [
        {
          "label": "Output yesterday",
          "value": "11.6k pairs",
          "hint": "vs 7-day average"
        },
        {
          "label": "Line efficiency (OEE)",
          "value": "74%",
          "hint": "Impact of the press 2 stoppage"
        },
        {
          "label": "Batch in progress",
          "value": "BATCH-2418",
          "hint": "Curing stage"
        },
        {
          "label": "Downtime today",
          "value": "3 hours",
          "hint": "Press 2"
        }
      ]
    },
    "agent-plan": {
      "name": "Production Planning Agent",
      "role": "Planning & batch sequencing",
      "domain": "Planning",
      "summary": "Six production orders are open and one backlogged order is waiting for press capacity to be released.",
      "kpis": [
        {
          "label": "Open production orders",
          "value": "6",
          "hint": "PROD-1141 to PROD-1148"
        },
        {
          "label": "Orders without a production order",
          "value": "1",
          "hint": "SO-3081"
        },
        {
          "label": "Press capacity load",
          "value": "89%",
          "hint": "This week"
        },
        {
          "label": "Plan variance",
          "value": "−2.4k pairs",
          "hint": "Today"
        }
      ]
    },
    "agent-agri": {
      "name": "Quality Control Agent",
      "role": "Batch testing & release",
      "domain": "Quality",
      "summary": "The BATCH-2417 rejection is the third in 30 days and points to a curing-parameter pattern.",
      "kpis": [
        {
          "label": "Batch rejection rate",
          "value": "3.1%",
          "hint": "30 days"
        },
        {
          "label": "Quarantined batches",
          "value": "1",
          "hint": "BATCH-2417"
        },
        {
          "label": "Released today",
          "value": "2",
          "hint": "BATCH-2415 / BATCH-2416"
        },
        {
          "label": "Open corrective actions",
          "value": "1",
          "hint": "QC-0241"
        }
      ]
    },
    "agent-proc": {
      "name": "Supply",
      "role": "Supply & production dependency",
      "domain": "Supply",
      "summary": "Two emergency purchases in the last ten days show the reorder point for core materials needs revising.",
      "kpis": [
        {
          "label": "Open requests",
          "value": "3",
          "hint": "BR-MR-184 / BR-MR-191 / PR-196"
        },
        {
          "label": "Emergency buys in 10 days",
          "value": "2",
          "hint": "Friction material"
        },
        {
          "label": "Supplier lead time",
          "value": "4 days",
          "hint": "Kaveh Polymer Chemistry"
        },
        {
          "label": "Price variance",
          "value": "−3%",
          "hint": "Against the previous quote"
        }
      ]
    },
    "agent-hr": {
      "name": "Maintenance Agent",
      "role": "Maintenance & repair",
      "domain": "Maintenance",
      "summary": "Press 2 is down and its repair is tied to approval of cost BR-MNT-442.",
      "kpis": [
        {
          "label": "Open stoppages",
          "value": "1",
          "hint": "Press 2"
        },
        {
          "label": "MTTR",
          "value": "4.2 hours",
          "hint": "30-day average"
        },
        {
          "label": "Preventive maintenance done",
          "value": "78%",
          "hint": "Monthly plan"
        },
        {
          "label": "Open work",
          "value": "2",
          "hint": "work-maint-1 / PR-196"
        }
      ]
    },
    "agent-re": {
      "name": "Sales Agent",
      "role": "Orders & delivery commitments",
      "domain": "Sales",
      "summary": "Fourteen orders are open, and SO-3092 will miss its delivery commitment without a replacement batch.",
      "kpis": [
        {
          "label": "Open orders",
          "value": "14",
          "hint": "OEM and aftermarket"
        },
        {
          "label": "On-time delivery",
          "value": "91%",
          "hint": "30 days"
        },
        {
          "label": "Orders at risk",
          "value": "1",
          "hint": "SO-3092"
        },
        {
          "label": "Shipment today",
          "value": "SH-1207",
          "hint": "Loading"
        }
      ]
    },
    "agent-corr": {
      "name": "Correspondence Agent",
      "role": "Correspondence & technical records",
      "domain": "Correspondence",
      "summary": "The OEM customer corrective-action letter is still awaiting a reply.",
      "kpis": [
        {
          "label": "Overdue letters",
          "value": "1",
          "hint": "412/K"
        },
        {
          "label": "Nearest deadline",
          "value": "20 Mordad",
          "hint": "2 days"
        },
        {
          "label": "Open 8D reports",
          "value": "1",
          "hint": "Batch BATCH-2417"
        },
        {
          "label": "Documents archived today",
          "value": "4",
          "hint": "Test certificates"
        }
      ]
    },
    "agent-wh-n": {
      "name": "Warehouse Agent",
      "role": "Material & product inventory",
      "domain": "Warehousing",
      "summary": "Warehouse node on the organisation map, linked to the material and product warehouse.",
      "kpis": []
    },
    "agent-qc-n": {
      "name": "Quality Control Agent",
      "role": "Batch testing & release",
      "domain": "Quality",
      "summary": "Quality node on the organisation map, linked to the quality control unit.",
      "kpis": []
    },
    "agent-fin-n": {
      "name": "Finance Agent",
      "role": "Finance & costing",
      "domain": "Finance",
      "summary": "Finance node on the organisation map, linked to the finance unit.",
      "kpis": []
    }
  },
  "goals": {
    "goal-1": {
      "title": "Reach monthly output of 320,000 brake pad pairs",
      "description": "",
      "owner": "Production & Pressing Agent",
      "target": "320,000 pairs"
    },
    "goal-2": {
      "title": "Cut press line downtime below 4%",
      "description": "",
      "owner": "Maintenance Agent",
      "target": "No more than 4% downtime",
      "risk": "BR-MNT-442 is still unapproved and press 2 is down"
    },
    "goal-3": {
      "title": "Cut the batch rejection rate below 2%",
      "description": "",
      "owner": "Quality Control Agent",
      "target": "Under 2% rejection",
      "risk": "Third rejected batch in 30 days"
    },
    "goal-4": {
      "title": "Keep on-time order delivery above 95%",
      "description": "",
      "owner": "Sales Agent",
      "target": "95% OTD",
      "risk": "SO-3092 exposed to delay"
    },
    "goal-5": {
      "title": "Stabilise core material supply and end emergency buying",
      "description": "",
      "owner": "Procurement Agent",
      "target": "No more than 2 SKUs below reorder point",
      "risk": "BR-MR-184 awaiting approval"
    }
  },
  "initiatives": {
    "init-1": {
      "title": "Balance batch sequencing against curing-oven capacity"
    },
    "init-2": {
      "title": "Preventive maintenance programme for the presses"
    },
    "init-3": {
      "title": "Stabilise curing parameters and revisit the formulation"
    },
    "init-4": {
      "title": "Align finished-goods allocation with delivery commitments"
    },
    "init-5": {
      "title": "Revise reorder points for friction materials"
    }
  },
  "insights": {
    "ins-1": {
      "title": "Batch rejections trace back to the curing oven temperature profile",
      "summary": "All three batches rejected in the last 30 days were cured in a window where zone-two oven temperature ran 12 degrees below setpoint.",
      "recommendation": "Calibrate the zone-two thermocouple and hold release of every batch cured in that window until retest.",
      "category": "Quality",
      "impact": "Removes roughly 74 million IRT of scrap per month"
    },
    "ins-2": {
      "title": "The press 2 stoppage is this week’s delivery bottleneck",
      "summary": "If the stoppage runs into the night shift, the output shortfall reaches 5.6k pairs and SO-3092 cannot be delivered.",
      "recommendation": "Approve BR-MNT-442 immediately and move the priority SO-3092 batch to press 1.",
      "category": "Operations",
      "impact": "Risk of late-delivery penalties and lost OEM credibility"
    },
    "ins-3": {
      "title": "Emergency friction-material buying has become a repeating pattern",
      "summary": "Two emergency purchases in ten days and a 19% rise in freight cost show the reorder point is out of step with real consumption.",
      "recommendation": "Raise the reorder point to 45 sacks and sign a monthly supply contract with Kaveh Polymer Chemistry.",
      "category": "Supply risk",
      "impact": "Lower freight cost and less risk of stopping the mixers"
    },
    "ins-4": {
      "title": "On-time delivery improves with earlier finished-goods allocation",
      "summary": "Over the last 30 days, 70% of delays came from allocating finished-goods stock to orders too late, not from a lack of production capacity.",
      "recommendation": "Allocate stock at order entry and trigger an automatic alert when cover drops below 10 days.",
      "category": "Sales",
      "impact": "4-point improvement in the on-time delivery rate"
    }
  },
  "calendarEvents": {
    "cal-1": {
      "title": "Weekly production planning meeting",
      "type": "Management",
      "date": "Today"
    },
    "cal-2": {
      "title": "Quality committee — review of batch BATCH-2417",
      "type": "Quality",
      "date": "Today"
    },
    "cal-3": {
      "title": "Press 2 repair status review",
      "type": "Maintenance",
      "date": "Today"
    },
    "cal-4": {
      "title": "Loading of shipment SH-1207",
      "type": "Shipping",
      "date": "Tomorrow"
    },
    "cal-5": {
      "title": "Reply deadline for letter 412/K",
      "type": "Correspondence",
      "date": "Upcoming"
    },
    "cal-6": {
      "title": "Batch costing review",
      "type": "Finance",
      "date": "Upcoming"
    }
  },
  "activityFeed": {
    "act-1": {
      "text": "Batch BATCH-2418 entered the curing oven; estimated release on 20 Mordad.",
      "unit": "Production"
    },
    "act-2": {
      "text": "A 640-pair shortfall of FG-8842 was reported against order SO-3092.",
      "unit": "Sales"
    },
    "act-3": {
      "text": "Loading of shipment SH-1207 for the aftermarket customer has begun.",
      "unit": "Finished goods warehouse"
    },
    "act-4": {
      "text": "BR-MR-184 for friction material was raised and sent to the approval queue.",
      "unit": "Procurement"
    },
    "act-5": {
      "text": "Quarantine record QC-0241 was issued for batch BATCH-2417.",
      "unit": "Quality"
    },
    "act-6": {
      "text": "A stoppage on hydraulic press 2 was logged following a leak.",
      "unit": "Maintenance"
    }
  },
  "visualFeeds": {
    "vf-press": {
      "title": "Hydraulic press line",
      "location": "Production hall"
    },
    "vf-qc": {
      "title": "Quality inspection bench",
      "location": "QC unit"
    },
    "vf-fg": {
      "title": "Finished goods warehouse",
      "location": "FG warehouse"
    }
  },
  "mapNodes": {
    "holding": {
      "label": "AryaTormoz Brake Pad Factory"
    },
    "plan": {
      "label": "Production Planning"
    },
    "fuel": {
      "label": "Production & Pressing"
    },
    "agri": {
      "label": "Quality Control"
    },
    "wh": {
      "label": "Material & Product Warehouse"
    },
    "re": {
      "label": "Sales & Orders"
    },
    "proc": {
      "label": "Material Procurement"
    },
    "maint": {
      "label": "Maintenance"
    },
    "fin": {
      "label": "Finance"
    },
    "corr": {
      "label": "Correspondence & Technical Records"
    },
    "agent-wh-n": {
      "label": "Warehouse Agent"
    },
    "agent-qc-n": {
      "label": "Quality Control Agent"
    },
    "agent-fin-n": {
      "label": "Finance Agent"
    },
    "sys-mes": {
      "label": "Line monitoring and batch recording system"
    },
    "sys-qms": {
      "label": "Laboratory and QC records"
    }
  }
} as const

export type EnContent = typeof enContent

export function getEnField(collection: string, id: string, field: string, fallback: string): string {
  const root = enContent as Record<string, unknown>
  const bag = root[collection]
  if (!bag || typeof bag !== 'object') return fallback

  // Flat bags: config / brief scalars
  if (collection === 'config') {
    const v = (bag as Record<string, unknown>)[field] ?? (bag as Record<string, unknown>)[id]
    if (typeof v === 'string' && v.trim()) return v
    if (field === 'askPrompts' && Array.isArray((bag as Record<string, unknown>).askPrompts)) {
      return fallback
    }
    return fallback
  }
  if (collection === 'brief') {
    const v = (bag as Record<string, unknown>)[field]
    if (typeof v === 'string' && v.trim()) return v
    if (field === 'paragraphs' && Array.isArray(v)) return fallback
    return fallback
  }

  const entity = (bag as Record<string, Record<string, unknown>>)[id]
  if (!entity) return fallback
  const val = entity[field]
  if (typeof val === 'string' && val.trim()) return val
  return fallback
}

export function getEnConfig(): Record<string, unknown> {
  return (enContent as { config: Record<string, unknown> }).config || {}
}

export function getEnBrief(): Record<string, unknown> {
  return (enContent as { brief: Record<string, unknown> }).brief || {}
}
