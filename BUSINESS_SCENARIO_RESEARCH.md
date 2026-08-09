# Business Scenario Research — کارخانه لنت ترمز آریاترمز

Per-scenario research grounding the Persian brake-pad factory demo. Core spine: **SO → PROD → BATCH → QC → quarantine/rework → FG → shipment**, with downtime, material risk, and batch traceability.

## Shared sources

1. [TuobaPro — Brake Pad Production Line](https://tuobapro.com/brake-pad-production-line/) — weighing/mixing → hot press → cure → finish → inspection; phenolic binder resins as gated inputs.
2. [FMG / REMSA — How Brake Pads Are Produced](https://www.fmgbrakes.com/remsa/how-are-brake-pads-produced/) — mixing → hot pressing → oven curing → scorching → machining → pack; press cycle binds capacity.
3. [JINLI Brakes — Manufacturing Process & Performance](https://jinlibrakes.com/brake-pad-manufacturing-process-performance/) — molding density, cure, bond, and inspection drive fade/noise/warranty; corrective action after failed lots.

---

### Scenario — QC fail / quarantine (BATCH-2417 / QC-0241)

**Industry logic**
- Friction coefficient / bond windows are release gates; out-of-window lots are quarantined, not shipped.
- Failed lots trigger corrective action (8D-style) for OEM / fleet buyers.
- Traceability ties batch → mix → press parameters → FG.

**Key business objects:** Batch, QC sheet, quarantine hold, rework/scrap, finished goods.

**Typical workflow:** Inspect lot → fail friction/bond → quarantine mass → open CAPA → rework or scrap → release or rewrite plan.

**Sources:** TuobaPro inspection stage; JINLI process-control / corrective-action expectations; FMG curing completeness.

**Our implementation:** `BATCH-2417` friction fail → `QC-0241` quarantine ۹۸۰ kg; `work-qc-1`; alert `alert-qc-556`; links to `SO-3092` and `FG-8842`.

**Deviations:** Demo collapses lab methods to a single friction-fail narrative; no full MES parameter log.

---

### Scenario — Material shortage / emergency buy (BR-MR-184)

**Industry logic**
- Phenolic binder resin shortage stops mixing before the press.
- Emergency buys protect scheduled batches when coverage falls to ~2 days.
- Supplier lead time is part of production risk, not only warehouse math.

**Key business objects:** Friction material SKU, reorder point, purchase request, approved supplier.

**Typical workflow:** Coverage alert → raise material request → approve → receive → resume mixing.

**Sources:** TuobaPro gated raw inputs (resins/fibers/fillers).

**Our implementation:** Resin SP-1068 (`inv-oil-10w40` id retained) → pending `BR-MR-184` (۶۰ bags); Today button; `work-wh-1`.

**Deviations:** Single SKU spotlight; multi-ingredient BOM simplified.

---

### Scenario — Press downtime / maintenance (BR-MNT-442)

**Industry logic**
- Hot-press hydraulic stop = lost finished pairs per shift.
- Emergency maintenance spend is gated by plant-manager approval.
- Capacity moves to remaining presses only after explicit replanning.

**Key business objects:** Press/line, downtime event, maintenance work order, maintenance payment.

**Typical workflow:** Fault → isolate press → raise maintenance cost → approve → repair → restore capacity.

**Sources:** FMG hot-pressing as capacity bottleneck; TuobaPro press-parameter discipline.

**Our implementation:** Press 2 stop from ۰۶:۴۰; pending `BR-MNT-442`; `work-maint-1`; Today button.

**Deviations:** One press / one hydraulic leak story; CMMS detail omitted.

---

### Scenario — Delivery commitment at risk (SO-3092)

**Industry logic**
- Customer SO commits FG quantity/date; scrap + downtime create shortfalls.
- Sales and planning negotiate priority batches vs available presses.
- Traceable FG lots are required before shipment.

**Key business objects:** Sales order, FG inventory, shipment, delivery promise.

**Typical workflow:** SO → allocate FG → detect shortfall → escalate → resequence production / partial ship.

**Sources:** FMG pack/ship end of line; JINLI commercial expectation after quality events.

**Our implementation:** `SO-3092` (قطعه‌گستر پارس) short ۶۴۰ pair `FG-8842`; alerts + `work-re-1`.

**Deviations:** Shipment docs simplified; OEM EDI not modeled.

---

### Scenario — Production order blocked (PROD-1148)

**Industry logic**
- SO converts to production orders sequenced against press/cure capacity.
- Orders wait when press OEE collapses.
- Planning KPI is schedule attainment, not only daily output.

**Key business objects:** Production order, capacity load, batch sequence.

**Typical workflow:** SO confirmed → create PROD → check capacity/materials → release batch → press/cure.

**Sources:** TuobaPro / FMG line discipline; capacity implied by press cycle time.

**Our implementation:** `PROD-1148` blocked until press capacity frees; `work-plan-1`; agent planning KPI.

**Deviations:** No full APS; one blocked order as the demo hook.

---

### Scenario — Customer corrective-action letter (BR-CORR-412)

**Industry logic**
- After failed lots, customers request formal CAPA / 8D evidence.
- Response links quarantine batch to process fix and retest.

**Key business objects:** Correspondence, 8D report, QC retest.

**Typical workflow:** Customer letter → assign CAPA work → attach QC evidence → reply by deadline.

**Sources:** JINLI corrective-action / buyer audit expectation.

**Our implementation:** `BR-CORR-412` + `work-corr-1` tied to `BATCH-2417` / `QC-0241`.

**Deviations:** Letter content is summary-level, not a full 8D form.

---

### Scenario — Manager dual approvals (BR-MR-184 + BR-MNT-442)

**Industry logic**
- Plant manager morning queue mixes material and maintenance spend that both unblock today’s plan.

**Key business objects:** Purchase approval, maintenance payment, Needs You queue.

**Typical workflow:** Brief → open both approvals → approve → observe Work/Today/Activity convergence.

**Sources:** Composite of material + downtime research above.

**Our implementation:** Today brief buttons `BR-MR-184` / `BR-MNT-442`; Ask Steve control-room card.

**Deviations:** Dual queue is demo choreography, not a separate ERP module.

---

## Design constraints

- Manufacturing-only copy (mixing / press / cure / QC / FG); no fuel retail or Amin Holding branding in UI copy.
- Legacy technical ids (`unit-fuel`, `fuelSeries`, `inv-oil-10w40`) may remain for store compatibility; Persian labels are industry-correct.
- Stable demo IDs: `BATCH-2417`, `QC-0241`, `BR-MR-184`, `BR-MNT-442`, `SO-3092`, `PROD-1148`.
