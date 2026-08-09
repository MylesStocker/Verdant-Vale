'use strict';

// Drenwick interior interactions: office, inn, school, harbormaster, guild, wash house, infirmary, provision store, tavern.
// Interaction functions moved verbatim from interactions.js by the regional-content-split.
// Loaded BEFORE interactions.js, which keeps the generic engine, MAP_FEATURES merge,
// and the INTERACT_HANDLERS / OVERWORLD_INTERACT_HANDLERS tables that reference these.

function interactDrenwickOffice() {
  // District Supervisor Harrow's desk (col 7 row 4). Harrow runs the district but
  // is not in the room — the player does business with Officer Veth in person.
  // This used to present "Supervisor Harrow" speaking from an empty tile (no NPC
  // body ever existed there); it's now the (empty) desk itself, so Harrow is a
  // named offscreen authority consistent with the rest of the game (which only
  // ever refers to "Harrow's office"), not a phantom you talk to.
  {
    const hx = player.x - 7.5 * TILE;
    const hy = player.y - 4.5 * TILE;
    if (Math.sqrt(hx * hx + hy * hy) < TALK_RADIUS) {
      dialogue.name  = 'Supervisor\u2019s Desk';
      dialogue.pages = dispatch_delivered
        ? [
            ['The district supervisor\u2019s desk. The nameplate reads HARROW; the chair is empty.',
             'Your filed letter sits in the corner tray among a dozen others.'],
          ]
        : [
            ['The district supervisor\u2019s desk. The nameplate reads HARROW; the chair is empty \u2014 Harrow is back in the district offices somewhere.'],
            ['A placard is propped on the blotter: \u201cCorrespondence from the western postings \u2192 Officer Veth.\u201d His is the desk in the corner.'],
          ];
      dialogue.open = true;
      dialogue.page = 0;
      return true;
    }
  }
  // Officer Veth — receives the Dispatch Letter when the player has it
  const veth = SIMPLE_NPCS.find(n => n.id === 'district_officer');
  if (veth) {
    const vx = player.x - veth.x;
    const vy = player.y - veth.y;
    if (Math.sqrt(vx * vx + vy * vy) < TALK_RADIUS) {
      const hasLetter = stats.items.some(i => i.name === 'Dispatch Letter');
      if (dispatch_quest_started && !dispatch_delivered && hasLetter) {
        dialogue.name  = 'Officer Veth';
        dialogue.pages = [
          ['He notices the letter before you say anything.',
           '\u201cCalwick.\u201d',
           'He holds out his hand.'],
          ['\u201cI handle their correspondence.',
           'Harrow doesn\u2019t like paperwork from the western postings.',
           'Something about the formatting.\u201d'],
          ['He checks the seal, opens it, reads it quickly.',
           '\u201cRoutine.\u201d',
           'He sets it in a tray beside his elbow.'],
          ['\u201cTell your supervisor it\u2019s received and logged.',
           'He\u2019ll get the countersignature through the weekly packet.\u201d'],
        ];
        dialogue.callbacks = [function() {
          stats.items = stats.items.filter(i => i.name !== 'Dispatch Letter');
          dispatch_delivered = true;
          syncQuestFlagsToWindow();
        }];
        dialogue.open = true;
        dialogue.page = 0;
        return true;
      }
      if (dispatch_delivered) {
        dialogue.name  = 'Officer Veth';
        dialogue.pages = [
          ['\u201cCalwick posting.\u201d',
           '\u201cLetter\u2019s been logged.',
           'Anything further?\u201d'],
          ...veth.dialogue.slice(1),
        ];
        dialogue.open  = true;
        dialogue.page  = 0;
        return true;
      }
      dialogue.name  = veth.name;
      dialogue.pages = veth.dialogue;
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
  }
  // Officer Sable (thread officer)
  const sable = SIMPLE_NPCS.find(n => n.id === 'thread_officer');
  if (sable) {
    const sx = player.x - sable.x;
    const sy = player.y - sable.y;
    if (Math.sqrt(sx * sx + sy * sy) < TALK_RADIUS) {
      dialogue.name  = sable.name;
      dialogue.pages = sable.dialogue;
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
  }
  // Records shelving (east wall, col 13 rows 6-10) — randomized rummage
  // flavor from the same pool as the Calwick office cabinets. Wider radius
  // (like the school wall display) since the unit spans several rows.
  const rsx = player.x - 13.5 * TILE;
  const rsy = player.y -  8.5 * TILE;
  if (Math.sqrt(rsx * rsx + rsy * rsy) < TALK_RADIUS * 1.5) {
    dialogue.name  = 'Records Shelf';
    dialogue.pages = randomCabinetPages();
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  // Reference cabinet (west wall, col 2 rows 7-9) — holds the district's posted
  // guidance on how the IJC classifies dangerous creatures.
  const rcx = player.x - 2.5 * TILE;
  const rcy = player.y - 8.5 * TILE;
  if (Math.sqrt(rcx * rcx + rcy * rcy) < TALK_RADIUS * 1.5) {
    dialogue.name  = 'Reference Cabinet';
    dialogue.pages = [
      ['The Administrative Classification of Monsters',
       '“Monster” is an ordinary word, not a precise scholarly category.',
       'Imperial offices classify dangerous creatures according to observable behaviour and the response they require, without claiming to understand their ultimate origin.'],
      ['Ordinary fauna includes wolves, bears, serpents and other natural animals, even when they threaten people.',
       'They fall under hunting, livestock or pest law rather than monster-removal procedure.'],
      ['Altered fauna are living creatures with recognizable needs and life cycles but abnormal anatomy, resilience or behaviour. Many fen creatures fall into this category.',
       'They eat, breed, defend territory and can sometimes be managed like dangerous wildlife, although their forms may descend from ecological damage left by the Century War.'],
      ['Remnant entities are associated with ruins, persistent resonant conditions or places where ordinary ecology does not explain them.',
       'They may appear not to breed, survive impossible injuries, return after apparent destruction or remain confined to a particular structure.',
       'The Empire calls them remnants without asserting what they are remnants of.'],
      ['An incident is designated unresolved when the evidence does not fit any established classification.',
       'Speech, deliberate tool use, coordinated behaviour, possession of sorted or minted currency, reappearance after verified destruction, or effects described locally as curses generally require this designation and an IJC investigation.'],
      ['Classification determines the response: hunting permission, a local bounty, a site-specific removal contract, quarantine or a formal investigation.',
       'It is always provisional. A creature may be reclassified when a field report establishes facts the original notice did not contain — which is why an investigator is expected to observe before deciding what they have encountered.'],
    ];
    dialogue.open = true;
    dialogue.page = 0;
    return true;
  }
  // Holt and any other office NPCs caught by interactSimpleNPCs
  interactSimpleNPCs();
  return true;
}

function interactDrenwickInn() {
  const ix = player.x - DRENWICK_INNKEEPER.x;
  const iy = player.y - DRENWICK_INNKEEPER.y;
  if (Math.sqrt(ix * ix + iy * iy) < TALK_RADIUS) {
    dialogue.name  = 'Innkeeper';
    dialogue.pages = [
      ['\u201cRoom for the night?\u201d',
       '\u201c' + DRENWICK_INN_PRICE + ' gold. Same as always.\u201d'],
    ];
    dialogue.callbacks = [function() {
      choice.title     = 'Innkeeper';
      choice.options   = ['Rest  (' + DRENWICK_INN_PRICE + 'g)', 'Leave'];
      choice.cursor    = 0;
      choice.callbacks = [
        function rest() {
          if (stats.gold >= DRENWICK_INN_PRICE) {
            stats.gold -= DRENWICK_INN_PRICE;
            stats.hp    = stats.maxHp;
            if (hasStatusEffect('poison'))  removeStatusEffect('poison');
            if (hasStatusEffect('muddied')) removeStatusEffect('muddied');
            if (hasStatusEffect('slither')) removeStatusEffect('slither');
            if (hasStatusEffect('cursed'))  removeStatusEffect('cursed');
            day++;
            dialogue.name  = 'Innkeeper';
            dialogue.pages = [['You sleep soundly.', 'HP fully restored.']];
            dialogue.open  = true;
            dialogue.page  = 0;
          } else {
            dialogue.name  = 'Innkeeper';
            dialogue.pages = [['\u201cNot enough gold.\u201d']];
            dialogue.open  = true;
            dialogue.page  = 0;
          }
        },
        function leave() {},
      ];
      choice.open = true;
    }];
    dialogue.open = true;
    dialogue.page = 0;
    return true;
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactDrenwickSchool() {
  // Ground floor: bookshelf on the west wall holding the Ancient Textbook.
  // (Moved off the student desk at col 5 row 6, which is drenwick_gs_2's tile —
  // that student's ordinary dialogue now reaches via interactSimpleNPCs below.)
  if (activeMap === DRENWICK_SCHOOL_GROUND_MAP) {
    const dkx = player.x - DRENWICK_SCHOOL_GROUND_SHELF.x;
    const dky = player.y - DRENWICK_SCHOOL_GROUND_SHELF.y;
    if (Math.sqrt(dkx * dkx + dky * dky) < TALK_RADIUS) {
      dialogue.name  = 'Ancient Textbook';
      dialogue.pages = [
        ['A heavy volume sits open on the desk, its pages darkened at the edges.',
         'The chapter heading reads:',
         '\u2018THE TWIN VICTORIES OF THE BLUE JAY EMPIRE:\nA History of Humanity\u2019s Last Stands\u2019'],
        ['\u2018In the age before the great reckoning, when the southern kingdoms had driven',
         'humanity to the edge of extinction, there rose from the city of the great inland',
         'lake a company of twenty-five. They were called the Blue Jays.\u2019'],
        ['\u2018In the First Last Stand, the Blue Jays faced the Atlanta Horde and did not',
         'break. The battle was long and the cost was great, but humanity held.',
         'The right to exist was purchased for one more age.\u2019'],
        ['\u2018Yet the dark forces returned. In the Second Last Stand, the Horde of',
         'Philadelphia came with redoubled fury, certain that what had been won could',
         'be taken back. They were mistaken.\u2019'],
        ['\u2018At the final gate, as the light failed and all seemed lost, it was Carter',
         'who stepped forward. Carter the Great. Carter the Unyielding.',
         'The sphere rose from his hand into the last of the evening sky.',
         'It did not come back down. It never came back down.\u2019'],
        ['\u2018But the ancient texts are clear on this: Carter did not stand alone.',
         'White was at his side. Alomar, who some say was the greatest of the age.',
         'Molitor, whose precision never wavered. Borders, the keeper of the gate.',
         'Olerud, steady as the ground itself.\u2019'],
        ['\u2018Henderson, who had seen wars older than memory.',
         'Ward, who held the line when all else gave way.',
         'Guzman, whose arm had become the thing the enemy feared most.',
         'And the rest of the twenty-five, whose names the text demands you learn.\u2019'],
        ['\u2018Those who stood in the First Last Stand shall not be forgotten either.',
         'Their names are recorded in the appendix, as the law requires.',
         'A student who cannot name them has not yet read this chapter.',
         'This chapter is not optional.\u2019'],
        ['A handwritten note in the margin reads:',
         '\u2018Examination question: List all 25 heroes of the Second Last Stand.',
         'Name at least 12 of the First.\u2019',
         'Someone has written below it, in smaller script:',
         '\u2018Why do we keep fighting the same enemies.\u2019'],
      ];
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
  }
  // Upper floor only: locked document cabinet and apprenticeship posting board
  if (activeMap === DRENWICK_SCHOOL_UPPER_MAP) {
    const cabx = player.x - DRENWICK_SCHOOL_CABINET.x;
    const caby = player.y - DRENWICK_SCHOOL_CABINET.y;
    if (Math.sqrt(cabx * cabx + caby * caby) < TALK_RADIUS) {
      dialogue.name  = 'Document Cabinet';
      dialogue.pages = [
        ['Rows of student report cards, one folder to a child, sorted by year.',
         'Marks, attendance, and a line or two in the teacher’s hand at the end of each term.'],
        ['One folder is tabbed for a parent meeting. Another has a gold star stuck slightly crooked to the cover.',
         'The drawer smells of chalk and old paper.'],
      ];
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
    const brdx = player.x - DRENWICK_SCHOOL_BOARD.x;
    const brdy = player.y - DRENWICK_SCHOOL_BOARD.y;
    if (Math.sqrt(brdx * brdx + brdy * brdy) < TALK_RADIUS) {
      dialogue.name  = 'Placements Board';
      dialogue.pages = [
        ['GUILD APPRENTICESHIPS \u2014 CURRENT CYCLE',
         'Canal Engineers\u2019 Guild: one position, second apprentice. Preference for candidates with arithmetic certification. Apply in person to the guild office.'],
        ['Imperial Grain Office, Drenwick: one clerk intake position.',
         'Shortlist reviewed by district registry. No direct applications \u2014 refer to Ms. Farne.',
         '\u2014',
         'Further positions will be posted as confirmed. Write directly to the relevant office for unlisted enquiries.'],
      ];
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
  }
  // Basement archive
  if (activeMap === DRENWICK_SCHOOL_BASEMENT_MAP) {
    // ── Wall display: mounted copy of the Accord of Threads ──────────────
    // Moved from the lower bookshelf to a proper framed display on the north wall.
    const wdx = player.x - DRENWICK_SCHOOL_ACCORD_DISPLAY.x;
    const wdy = player.y - DRENWICK_SCHOOL_ACCORD_DISPLAY.y;
    if (Math.sqrt(wdx * wdx + wdy * wdy) < TALK_RADIUS * 1.6) {
      dialogue.name  = 'Wall Display';
      dialogue.pages = [
        ['A framed document mounted under glass.',
         'The title plate reads: \u2018ACCORD OF THREADS\u2019.',
         '\u2018Imperial Instrument No. 7 of Year 700 \u2014 in full.\u2019'],
      ];
      dialogue.callbacks = [function() {
        choice.title   = 'Accord of Threads';
        choice.options = ['Read the full instrument', 'Leave it'];
        choice.cursor  = 0;
        choice.callbacks = [
          function readAccord() {
            // Open the dedicated accord panel rather than the dialogue box.
            // Text is unchanged — just displayed in a wider, paginated reader.
            accordPanel.pages = [
              // Title page
              ['IMPERIAL INSTRUMENT NO. 7 OF YEAR 700',
               'On the Harmonisation of Enforcement Standards in Respect of Persistent Heritable Conditions Among the Imperial Subject Population, Together with Provisions for Registry, Oversight, and the Revision of Prior Death Warrants Issued Under Statutes of the Third Year After Century and Thereafter.',
               'Known commonly as: The Accord of Threads.'],
              // Preamble pt 1
              ['PREAMBLE',
               'In recognition of existing realities, and in furtherance of the Empire\u2019s enduring charge to preserve order, continuity, and the common peace of the realm, let it be declared and set forth as follows.',
               'From the founding of unified time and law, the Empire has borne responsibility for the safety of its subjects and the integrity of its dominion. In the discharge of that responsibility, prior statutes were enacted to address certain conditions observed among the population, deemed at the time to pose grave and immediate risk to public order.'],
              // Preamble pt 2
              ['In the long years since, the realm has changed. The reach of law has extended. Knowledge has advanced. Conditions once addressed solely by exclusion and final remedy are now more fully understood in their persistence and effect.',
               'It is neither just nor practicable that governance remain bound to instruments no longer suited to the realities they were meant to contain.'],
              // Preamble pt 3
              ['Accordingly, and without prejudice to the authority of the Empire to act in defense of the realm, this Accord is issued to bring existing law into alignment with present necessity; to replace inconsistent application with uniform governance; and to establish a durable framework by which certain inherent conditions, observable among a minority of subjects, may be addressed without recourse to disorder, concealment, or unchecked harm.',
               'This Accord does not diminish the sovereignty of the Empire, nor does it excuse noncompliance with lawful authority. Rather, it affirms that stability is best preserved where law is made explicit, oversight is continuous, and responsibility is shared.',
               'Let it therefore be known that the provisions herein are declared binding throughout the realm and its dominions, subject to lawful administration by the Empire and its duly constituted authorities, from this day forward and without term. So ordered.'],
              // Article I
              ['ARTICLE I \u2014 ON THE RESCISSION OF PRIOR DEATH WARRANTS',
               'All warrants, statutes, proclamations, and delegated authorities enacted under Imperial Law in the Third Year After Century and thereafter, insofar as they prescribe death, immediate execution, or irreversible penalty solely on the basis of the condition herein addressed, are hereby rescinded.',
               'No person shall, from the issuance of this Accord forward, be subject to summary execution, extrajudicial killing, or standing death warrant by reason of such condition alone.'],
              // Article I cont.
              ['This rescission shall apply notwithstanding the date of issuance of any prior order, decree, or local judgment, whether dormant or active, and such instruments shall be held invalid where they conflict with the provisions herein.',
               'Nothing in this Article shall be construed to limit the authority of the Empire or its duly empowered agents to impose penalties, including death, for acts of violence, sedition, concealment, or refusal of lawful compliance, where such acts are established under prevailing law.',
               'The withdrawal of prior death warrants shall not be interpreted as absolution for past acts, nor as immunity from future judgment, but as a correction of method in the maintenance of order.'],
              // Article II
              ['ARTICLE II \u2014 ON THE RECOGNITION OF A PERSISTENT CONDITION',
               'It is acknowledged that a persistent and inhering condition exists among a minority of subjects of the Empire, observable through outward and measurable signs, and known to manifest without regard to lineage, inheritance, or intent.',
               'Such condition shall be understood to arise at birth, to endure through life, and to be neither voluntarily assumed nor divested by the person so affected.'],
              // Article II cont.
              ['The presence of this condition shall not, in itself, constitute guilt, criminality, or intent to harm; however, where its manifestation bears upon public safety, civic order, or the integrity of law, it shall be subject to regulation as herein provided.',
               'Determination of the presence of the condition shall rest with duly appointed authorities of the Empire, acting in accordance with uniform standards and established notice. No private judgment, customary practice, or local belief shall supersede such determination once made.'],
              // Article III
              ['ARTICLE III \u2014 ON NOTICE, REGISTRY, AND OBLIGATION TO REPORT',
               'In order that the provisions of this Accord may be administered with consistency and restraint, the Empire shall maintain a Registry of persons determined to bear the condition described herein.',
               'Notice of the presence or reasonable suspicion of such condition shall be made without delay to imperial or delegated authority by: parents or guardians; those attending birth or early care; and any magistrate, healer, or officer acting in an official capacity.'],
              // Article III cont.
              ['Where notice is willfully withheld, obscured, or delayed, liability shall extend not only to the individual so withholding, but to any person or body acting in concert to effect such concealment, as shall be determined under law.',
               'Failure of notice shall constitute a material breach of civic obligation and may give rise to penalties upon individuals, households, or communities, according to statute.',
               'Registration shall not be optional, nor shall concealment be excused by custom, fear, or private judgment.'],
              // Article IV
              ['ARTICLE IV \u2014 ON EVALUATION, INSTRUCTION, AND COMPULSORY ATTENDANCE',
               'Where a person is determined to bear the condition described herein, the Empire may require evaluation, instruction, or supervised containment, as necessary to preserve public order and prevent harm.',
               'For this purpose, an Academy shall be established under imperial authority, empowered to assess, instruct, and certify such persons according to standards set forth by the Council of Thirty-Three.',
               'Attendance, when directed, shall be mandatory. Refusal, evasion, or resistance shall constitute noncompliance with lawful authority and shall be punishable by penalties up to and including death, as determined by competent judgment.',
               'Completion of instruction shall not, in itself, extinguish oversight, nor shall it confer immunity from further regulation.'],
              // Article V
              ['ARTICLE V \u2014 ON PROPERTY AND CIVIC BALANCE',
               'Persons recognized under this Accord may hold property, enter contracts, and conduct lawful enterprise as subjects of the Empire, and shall not be dispossessed by reason of condition alone.',
               'However, where the exercise of such condition may reasonably be expected to influence value, outcome, safety, or public confidence, the Empire reserves the right to regulate, limit, license, or sequester such property or enterprise in the interest of civic balance.'],
              // Article V cont.
              ['No accumulation of land, capital, labor, or obligation shall be permitted where the stability of the realm may become contingent upon the restraint, presence, or favor of any such person.',
               'Distinct obligations of disclosure, inspection, levy, or limitation may be imposed by statute where required for public order.',
               'Nothing in this Article shall be construed to grant immunity from future regulation, nor to deny the ordinary use of property consistent with law.'],
              // Article VI
              ['ARTICLE VI \u2014 ON LICENSE, STANDING, AND CONTINUED COMPLIANCE',
               'Where instruction or evaluation has been completed in accordance with this Accord, the Empire may grant certification permitting the lawful exercise of ordinary civic life under continued oversight.',
               'Such certification shall constitute a license of standing, contingent upon ongoing compliance with imperial law and regulation.',
               'Certification may be suspended, restricted, or revoked where conduct, concealment, instability, or refusal of lawful directive is established, and such revocation shall restore the Empire\u2019s full authority to act in defense of the realm.',
               'No person shall claim entitlement to standing by reason of prior compliance alone.'],
              // Article VII
              ['ARTICLE VII \u2014 ON DEFERENCE, DELEGATION, AND LOCAL ADMINISTRATION',
               'The provisions of this Accord shall apply throughout the realm and its dominions. Administration thereof may be delegated to provincial, municipal, or customary authorities, provided such administration does not contravene the substance of this Accord.',
               'Where local law is silent, inconsistent, or inadequate, imperial authority shall prevail.',
               'Nothing herein shall be interpreted to require uniform method where uniform outcome is achieved.'],
              // Article VIII
              ['ARTICLE VIII \u2014 ON INTERPRETATION AND AUTHORITY',
               'Interpretation of this Accord, and of statutes arising therefrom, shall rest with the Council of Thirty-Three, acting in concert with duly constituted imperial courts.',
               'No local decree, customary judgment, or private interpretation shall supersede the determinations so made.',
               'Where ambiguity arises, such ambiguity shall be resolved in favor of public order and continuity of governance.'],
              // Article IX
              ['ARTICLE IX \u2014 ON CONTINUITY AND SUPREMACY',
               'This Accord shall stand as binding law from the date of its issuance. All statutes, customs, or instruments inconsistent herewith are superseded to the extent of such inconsistency.',
               'Amendments, where permitted, shall be enacted only by lawful authority and shall not impair the central provisions herein without express declaration.'],
              // Seal
              ['SEAL AND DATING',
               'Issued under the Seal of the Empire, in the presence of the Council of Thirty-Three, in the Seven Hundredth Year After Century, and entered into force forthwith.'],
            ];
            accordPanel.title = 'IMPERIAL INSTRUMENT NO. 7 OF YEAR 700 — ACCORD OF THREADS';
            accordPanel.page = 0;
            accordPanel.open = true;
          },
          function leave() {
            // do nothing
          },
        ];
        choice.open = true;
      }];
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
    // ── Lower bookshelf: general archive material (no longer holds the Accord) ──
    const bsx = player.x - DRENWICK_SCHOOL_BOOKSHELF.x;
    const bsy = player.y - DRENWICK_SCHOOL_BOOKSHELF.y;
    if (Math.sqrt(bsx * bsx + bsy * bsy) < TALK_RADIUS) {
      dialogue.name  = 'Archive Bookshelf';
      dialogue.pages = [
        ['Bound ledgers, most unlabelled.',
         'Canal traffic records from decades back. Inspection logs.',
         'One volume is catalogued: \u2018Classification Registers, Drenwick District, Years 680-695.\u2019',
         'It\u2019s been checked out and never returned. The slip inside says the borrower was Orwen.'],
      ];
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactHarbormaster() {
  // Weighmaster counter — the balance scale and cargo log
  const wmx = player.x - DRENWICK_WEIGHMASTER_COUNTER.x;
  const wmy = player.y - DRENWICK_WEIGHMASTER_COUNTER.y;
  if (Math.sqrt(wmx * wmx + wmy * wmy) < TALK_RADIUS) {
    dialogue.name  = 'Weighmaster Counter';
    dialogue.pages = [
      ['A balance scale sits at one end, calibration weights in a rack beside it.',
       'The day\u2019s log is open to a half-filled page. Each entry records cargo type, declared weight, certified weight, and the certifying officer.'],
      ['The most recent entry: \u2018Reed bales, 14 units. Declared 420 stone. Certified 418 stone. Variance within tolerance.\u2019'],
    ];
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  // Navigation charts — rolled and stacked on the north shelf
  const chx = player.x - HARBOR_CHARTS.x;
  const chy = player.y - HARBOR_CHARTS.y;
  if (Math.sqrt(chx * chx + chy * chy) < TALK_RADIUS) {
    dialogue.name  = 'Navigation Charts';
    dialogue.pages = [
      ['A row of rolled charts, each tied with a red cord and labelled in a cramped hand.',
       'One is unrolled partially — a survey of the main channel and its tributary sluice gates, with depth markings at each lock point.'],
      ['A notation at the bottom corner: \u2018Section B-7 shoaling. Reported to district. No action taken. — R.\u2019',
       'Below that, in different ink: \u2018Reported again. Still no action. — R.\u2019'],
    ];
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  // Mooring log — the traffic and berth record on the east counter
  const mlx = player.x - HARBOR_MOORING_LOG.x;
  const mly = player.y - HARBOR_MOORING_LOG.y;
  if (Math.sqrt(mlx * mlx + mly * mly) < TALK_RADIUS) {
    dialogue.name  = 'Mooring Log';
    dialogue.pages = [
      ['A bound ledger lying open on the counter. Each entry records vessel name, origin, cargo, berth number, and days moored.',
       'Recent arrivals: the \u2018Needham Stout\u2019 (grain, three days), the \u2018Fen Runner\u2019 (pressed reed, one day), and an unnamed flatboat noted only as \u2018unladen, private.\u2019'],
      ['A note in red ink at the bottom of the page: \u2018Unladen vessels using berth without cargo declaration to be reported to the district officer on third occurrence.\u2019',
       'The tally mark beside it shows: two.'],
    ];
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  // Harbormaster Renn — Weight Discrepancy quest (interior, work days only)
  if (day % 5 !== 0) {
    const rennInt = SIMPLE_NPCS.find(n => n.id === 'harbormaster_interior');
    if (rennInt) {
      const rdx = player.x - rennInt.x;
      const rdy = player.y - rennInt.y;
      if (Math.sqrt(rdx * rdx + rdy * rdy) < TALK_RADIUS) {
        if (weight_quest_stage === 0) {
          // First approach — Renn explains the problem; player can accept or decline
          dialogue.name  = 'Harbormaster Renn';
          dialogue.pages = [
            ['\u201cYou saw the notice?\u201d',
             '\u201cGood. I\u2019ve had a certificate sitting on this desk for three weeks that doesn\u2019t match what the Calwick office has on record.\u201d'],
            ['\u201cA barge came through — standard grain load, properly declared.\u201d',
             '\u201cMy certified weight is 312 stone. The Calwick ledger entry, copied here, says 304.\u201d',
             '\u201cEight stone. That\u2019s not a transcription error.\u201d'],
            ['\u201cI need someone to carry this query note to the district records clerk in Calwick.',
             '\u2018Aldric\u2019 — he\u2019ll know the entry I mean.\u201d',
             '\u201cThere may be a countersignature required. Corvin keeps the ledger for that period.\u201d'],
          ];
          dialogue.callbacks = [function() {
            choice.title     = 'Harbormaster Renn';
            choice.options   = ['Take the query', 'Not now'];
            choice.cursor    = 0;
            choice.callbacks = [
              function take() {
                weight_quest_stage = 1;
                refreshJobBoard();
                syncQuestFlagsToWindow();
                dialogue.name  = 'Harbormaster Renn';
                dialogue.pages = [
                  ['\u201cAldric. District records, Calwick office.\u201d',
                   '\u201cHe\u2019ll understand the note.\u201d',
                   '\u201cCome back once it\u2019s resolved.\u201d'],
                ];
                dialogue.open  = true;
                dialogue.page  = 0;
              },
              function notNow() {
                dialogue.name  = 'Harbormaster Renn';
                dialogue.pages = [['\u201cThe query will still be here.\u201d']];
                dialogue.open  = true;
                dialogue.page  = 0;
              },
            ];
            choice.open = true;
          }];
          dialogue.open  = true;
          dialogue.page  = 0;
        } else if (weight_quest_stage === 1) {
          dialogue.name  = 'Harbormaster Renn';
          dialogue.pages = [['\u201cAldric. District records, Calwick.\u201d',
                              '\u201cBring the countersigned note back when you have it.\u201d']];
          dialogue.open  = true;
          dialogue.page  = 0;
        } else if (weight_quest_stage === 2) {
          dialogue.name  = 'Harbormaster Renn';
          dialogue.pages = [['\u201cCorvin\u2019s countersignature — that\u2019s what Aldric needs?\u201d',
                              '\u201cCorvin\u2019s in the office most days. Inn on the fifth.\u201d',
                              '\u201cBring it back once he\u2019s signed.\u201d']];
          dialogue.open  = true;
          dialogue.page  = 0;
        } else if (weight_quest_stage === 3) {
          // Player returns with Corvin's note — Renn pays
          dialogue.name  = 'Harbormaster Renn';
          dialogue.pages = [
            ['\u201cBoth signatures.\u201d',
             'He checks the note against the original entry.',
             '\u201cTranscription error on the Calwick side. Corvin\u2019s figure matches mine.\u201d'],
            ['\u201cI\u2019ll file the correction with the district.\u201d',
             '\u201cIt\u2019s a small thing. But these things add up over a season.\u201d'],
            ['\u201cSixty gold for your time.\u201d',
             '\u201cThe district would take a month to process this. You did it in a day.\u201d'],
          ];
          dialogue.callbacks = [function() {
            stats.gold += 60;
            weight_quest_stage = 4;
            refreshJobBoard();
            syncQuestFlagsToWindow();
          }];
          dialogue.open  = true;
          dialogue.page  = 0;
        } else {
          dialogue.name  = 'Harbormaster Renn';
          dialogue.pages = [['\u201cVariance note\u2019s filed. District will process it in its own time.\u201d',
                              '\u201cThank you for that.\u201d']];
          dialogue.open  = true;
          dialogue.page  = 0;
        }
        return true;
      }
    }
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactDrenwickGuildHall() {
  // Posting board — northeast corner of the hall
  const gbx = player.x - GUILD_HALL_BOARD.x;
  const gby = player.y - GUILD_HALL_BOARD.y;
  if (Math.sqrt(gbx * gbx + gby * gby) < TALK_RADIUS) {
    dialogue.name  = 'Posting Board';
    dialogue.pages = [
      ['CANAL ENGINEERS\u2019 GUILD \u2014 CURRENT NOTICES'],
      ['APPRENTICE POST (2nd, east line)\n'
       + 'Arithmetic certification required. Apply in person to the registrar.',
       'Shortlist reviewed fourth day of each cycle.'],
      ['DUES REMINDER: All members, cycle 4.',
       'Late dues carry a standard surcharge.',
       'Queries to Foss.'],
      ['TENDERS \u2014 East sluice remediation, phase 2.',
       'Guild members holding level 3 gate certification may apply.',
       'Work commences subject to district approval.'],
      ['Members\u2019 Notice (handwritten, pinned at an angle):',
       '\u201cWhoever has been borrowing the survey rod from the equipment room \u2014',
       'please sign it out. That is all.\u201d'],
    ];
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactWashHouse() {
  // Posted notice — hours and rules on the east wall of the basin row
  const wnx = player.x - WASH_NOTICE.x;
  const wny = player.y - WASH_NOTICE.y;
  if (Math.sqrt(wnx * wnx + wny * wny) < TALK_RADIUS) {
    dialogue.name  = 'Posted Notice';
    dialogue.pages = [
      ['DRENWICK CIVIC WASH HOUSE',
       'Hot water: first bell to third bell. Cold basin available all hours.',
       'Rate: two coins. Includes soap and towel hire.',
       'Return towels before leaving. Lost towels billed to the household register.'],
      ['No more than three persons to a basin at one time.',
       'Children under ten must be accompanied.',
       'The management reserves the right to refuse service to those causing a disturbance.',
       '\u2014 District Civic Office, Drenwick'],
    ];
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  // Private bath stalls (east corner) — standing in either tub opens the wash choice
  const nearBath = [WASH_BASIN, WASH_BASIN_2].some(function(b) {
    const dx = player.x - b.x, dy = player.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS;
  });
  if (nearBath) {
    choice.title     = 'Wash House';
    choice.options   = ['Wash  (2g)', 'Leave'];
    choice.cursor    = 0;
    choice.callbacks = [
      function wash() {
        if (stats.gold >= 2) {
          const wasMuddied = hasStatusEffect('muddied');
          stats.gold -= 2;
          if (wasMuddied) removeStatusEffect('muddied');
          const midLine = wasMuddied
            ? 'The mud loosens. It takes a few changes before the water runs clear.'
            : 'You spend longer than you meant to.';
          dialogue.name  = '';
          dialogue.pages = [
            ['The water is warm.', midLine],
            ['You feel considerably more human.'],
          ];
          dialogue.open  = true;
          dialogue.page  = 0;
        } else {
          dialogue.name  = '';
          dialogue.pages = [['Kern\u2019s rate is two coins.', 'You\u2019re short.']];
          dialogue.open  = true;
          dialogue.page  = 0;
        }
      },
      function leave() {},
    ];
    choice.open = true;
    return true;
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactDrenwickInfirmary() {
  // The Doctor's Letter, left on the dispensary counter (row 10, cols 11-12).
  // Picked up once; after that it's a Special Item and the drawn letter is gone.
  const lx = 11.5 * TILE, ly = 10.5 * TILE;
  const ldx = player.x - lx, ldy = player.y - ly;
  if (Math.sqrt(ldx * ldx + ldy * ldy) < TALK_RADIUS * 1.3 &&
      !stats.items.some(it => it.name === "Doctor's Letter")) {
    grantItem("Doctor's Letter");
    dialogue.name  = "Doctor's Letter";
    dialogue.pages = [
      ['A letter on the counter, its wax seal already broken. The hand is old and careful.', 'Doctor\'s Letter \u2014 added to items.'],
      ['\u201cTo whoever keeps this room after me \u2014\u201d',
       '\u201cYou will manage the cuts and the fevers and the drownings well enough. Those are honest work, and I have taught Fisk what I can.\u201d'],
      ['\u201cIt is the other cases I cannot hand over. The ones the fen sends back wrong. A cold no stove will touch. A sleep that is not sleep. People who have been somewhere and cannot say where.\u201d'],
      ['\u201cI mended what bodies I could. I never learned to mend what they had heard out there, and I am too old now to keep listening for it.\u201d'],
      ['\u201cDo not go looking for the source of it. That is the one prescription I am sure of.\u201d',
       '\u201c\u2014 Yeddin\u201d'],
    ];
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactProvisionStore() {
  // Order ledger on east shelving
  const mnx = player.x - DRENWICK_PROVISION_LEDGER.x;
  const mny = player.y - DRENWICK_PROVISION_LEDGER.y;
  if (Math.sqrt(mnx * mnx + mny * mny) < TALK_RADIUS) {
    dialogue.name  = 'Order Ledger';
    dialogue.pages = [
      ['IMPERIAL CIVIC PROVISIONS \u2014 ORDER LEDGER, CURRENT CYCLE',
       'Dry rations: in stock. Salted catch: in stock. Preserved roots: low stock, restock next delivery, cycle 4.',
       'Reed oil: on order, awaiting delivery. Preserved fruit: out of stock \u2014 orderable for the next barge.'],
      ['At the bottom, a handwritten amendment: \u2018Reed oil delivery delayed pending route inspection north of Thornmere. No revised date confirmed.\u2019',
       'The amendment is signed with an initial and an official stamp \u2014 the ink slightly smeared.'],
    ];
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  // Central stock crates — inspect the stamped imperial goods
  const scx = player.x - PROVISION_STOCK_CRATE.x;
  const scy = player.y - PROVISION_STOCK_CRATE.y;
  if (Math.sqrt(scx * scx + scy * scy) < TALK_RADIUS) {
    dialogue.name  = 'Stock Crates';
    dialogue.pages = [
      ['Heavy wooden crates stamped with the imperial supply mark \u2014 a red cross on a field of ochre.',
       'The stencil is slightly off-centre on two of them, as if applied in haste or by someone unfamiliar with the stamp.'],
      ['The nearest crate is stencilled: \u2018SALTED CATCH \u2014 CYCLE 4 \u2014 DRENWICK CIVIC\u2019.',
       'A smaller mark below reads \u2018INSPECT BEFORE WEEK 2.\u2019',
       'It is currently week three.'],
    ];
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactDrenwickTavern() {
  // Brenn the keeper \u2014 sells Mushroom Wine
  const tkx = player.x - DRENWICK_TAVERN_KEEPER.x;
  const tky = player.y - DRENWICK_TAVERN_KEEPER.y;
  if (Math.sqrt(tkx * tkx + tky * tky) < TALK_RADIUS) {
    dialogue.name  = 'Brenn';
    dialogue.pages = [
      ['\u201cQuiet night.\u201d',
       'He wipes down the counter without looking up.',
       '\u201cFunny how the waterfront gets loud and then\u2014 nothing.\u201d'],
      ['\u201cGot mushroom wine in, if you want it.',
       'Comes up from the fen settlements. Eight gold a cup.',
       'It\u2019s\u2026 something.\u201d'],
    ];
    dialogue.callbacks = [function() {
      choice.title     = 'Brenn';
      choice.options   = ['Buy Mushroom Wine  (8g)', 'Leave'];
      choice.cursor    = 0;
      choice.callbacks = [
        function buy() {
          if (stats.gold >= 8) {
            stats.gold -= 8;
            grantItem('Mushroom Wine');
            dialogue.name  = 'Brenn';
            dialogue.pages = [
              ['\u201cThere you go.\u201d',
               'He sets the cup on the counter and slides it across with two fingers.',
               '\u201cDon\u2019t think about it too hard.\u201d'],
            ];
            dialogue.open  = true;
            dialogue.page  = 0;
          } else {
            dialogue.name  = 'Brenn';
            dialogue.pages = [['\u201cNot quite enough.\u201d']];
            dialogue.open  = true;
            dialogue.page  = 0;
          }
        },
        function leave() {},
      ];
      choice.open = true;
    }];
    dialogue.open  = true;
    dialogue.page  = 0;
    return true;
  }
  interactSimpleNPCs();
  return interactionUiOpened();
}

// ── DRENWICK_INTERIOR_MAP_FEATURES: region-owned MAP_FEATURES entries (merged in interactions.js) ──
const DRENWICK_INTERIOR_MAP_FEATURES = {
};
