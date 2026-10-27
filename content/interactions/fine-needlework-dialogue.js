'use strict';

// Authored content only. Quest and party authorities own every state change.
const FINE_NEEDLEWORK_CONTENT = (() => {
  const pages = entries => Object.freeze(entries.map(([speakerId, line]) =>
    Object.freeze({speakerId, lines:Object.freeze(['“' + line + '”'])})));
  const warning = [
    ['esla', 'Embroideries. Of course. Lély, he’s asking you to smuggle for him. Please don’t take it.'],
    ['esla', 'I won’t be part of this. If you accept, I’ll wait at the Ledger House here in Mornay. You’ll be making that journey without me.'],
  ];
  return Object.freeze({
    title:'Fine Needlework',
    pages:Object.freeze({
      dismissed:pages([
        ['mornay_chuggie', 'I don’t talk business with Imperial agents. Find another table.'],
      ]),
      unallied:pages([
        ['mornay_chuggie', 'Nothing for you. I’m waiting for someone.'],
      ]),
      offer:pages([
        ['mornay_chuggie', 'You’re the one who came to an arrangement with Polwick. I have some embroideries for him.'],
        ['mornay_chuggie', 'Our usual associates won’t take the road now. Too dangerous, they say. Get the parcel to Polwick at the old fen post, and he’ll pay you 1,500 gold.'],
        ...warning,
      ]),
      declined:pages([
        ['mornay_chuggie', 'Then leave the parcel where it is.'],
      ]),
      accepted:pages([
        ['mornay_chuggie', 'Keep it tied. Polwick knows what he’s expecting.'],
        ['esla', 'I’ll be at the Ledger House when you’ve finished with it.'],
      ]),
      carrying:pages([
        ['mornay_chuggie', 'Polwick’s at the old fen post. Or you can hand it back to me. No delivery, no payment.'],
      ]),
      returned:pages([
        ['mornay_chuggie', 'Still tied. Good. No delivery, no payment. We’ll leave it there.'],
      ]),
      awaitReunion:pages([
        ['mornay_chuggie', 'Go and find your friend at the Ledger House. I’m not handing you another parcel while she’s waiting on the last one.'],
      ]),
      reoffer:pages([
        ['mornay_chuggie', 'Changed your mind? Same parcel, same road. Polwick pays 1,500 gold on delivery.'],
        ...warning,
      ]),
      completed:pages([
        ['mornay_chuggie', 'Polwick got his embroideries. That’s our business finished.'],
      ]),
      delivery:pages([
        ['polwick', 'Chuggie’s embroideries. He said he might find someone.'],
        ['polwick', 'Still tied. Good. Fifteen hundred, as agreed.'],
      ]),
      earlyReunion:pages([
        ['esla', 'You still have his parcel. I meant what I said. Deliver it or give it back to Chuggie. I’ll wait here.'],
      ]),
      reunion:pages([
        ['esla', 'I’m not going to ask what you’ve been doing. Please don’t tell me.'],
        ['esla', 'Right. Let’s get back to it.'],
      ]),
      acceptanceUnavailable:pages([
        ['esla', 'You’re in no condition to make that journey alone. Get treated first. The parcel can wait.'],
      ]),
      noEsla:pages([
        ['mornay_chuggie', 'Bring your travelling companion before we talk business. I don’t need a disagreement at my table after you’ve taken the parcel.'],
      ]),
      polwickUnavailable:pages([
        ['mornay_chuggie', 'If you can’t get it to Polwick, bring it back here. I’ll take it off your hands. There’s no payment for that.'],
      ]),
    }),
    choices:Object.freeze({
      offer:Object.freeze(['Accept', 'Decline']),
      cargo:Object.freeze(['Return parcel', 'Keep carrying']),
    }),
    journal:Object.freeze({
      carrying:'Deliver Chuggie’s parcel of “embroideries” to Polwick at the old fen post for 1,500 gold, or return it to Chuggie at Wold’s Gate Inn in Mornay without payment. Esla is waiting at the Ledger House in Mornay and will not travel with you while you carry it.',
      deliveredAwaitingReunion:'Delivered Chuggie’s parcel to Polwick and received 1,500 gold. Return to Esla at the Ledger House in Mornay.',
      withdrawnAwaitingReunion:'Returned Chuggie’s parcel to him at Wold’s Gate Inn without payment. The job was withdrawn. Esla is ready to rejoin you at the Ledger House in Mornay.',
      withdrawn:'Withdrew from Chuggie’s job and returned his parcel without payment. Esla has rejoined you. Chuggie may offer the job again at Wold’s Gate Inn in Mornay.',
      completed:'Delivered Chuggie’s parcel to Polwick for 1,500 gold. Esla has rejoined you.',
    }),
    parcelNote:'Chuggie’s tied parcel of “embroideries”, intended for Polwick at the old fen post. Return it to Chuggie at Wold’s Gate Inn if you withdraw.',
  });
})();
