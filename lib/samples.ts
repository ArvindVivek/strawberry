// The sample inbox: made-up Larkspur Air customers, each with a triage and a reply written
// ahead of time, so the whole app works without a single model call. Every citation must name a
// real clause in content/policy.md (lib/samples.test.ts checks it). Names, booking references and
// flights are invented.
import type { Ticket, TicketState, Triage } from "@/lib/contracts";

export interface Sample {
  ticket: Ticket;
  triage: Triage;
  /** Already answered when the inbox first loads. */
  sentAtMinutesAgo?: number;
}

export const SAMPLES: Sample[] = [
  {
    ticket: {
      id: "t-1001",
      customerName: "Priya Raman",
      bookingRef: "QX7P2M",
      subject: "Flight cancelled and I'll miss my connection to Lisbon tonight",
      body:
        "Hi, my 4:10 pm flight from Denver to Boston (LK 482) was just cancelled at the gate. The agent said it's a crew scheduling problem. I'm booked on the 9:30 pm Boston to Lisbon flight on the same ticket and there's no way I'll make it now.\n\nI have to be in Lisbon by tomorrow afternoon for my sister's wedding. What are my options? I'm still at the airport.\n\nBooking QX7P2M\nPriya",
      minutesAgo: 12,
      origin: "sample",
    },
    triage: {
      category: "cancellation",
      priority: "urgent",
      summary: "Priya's Denver to Boston flight was cancelled for a crew problem and she needs a new way to reach Lisbon by tomorrow afternoon.",
      priorityReason: "She is at the airport now and her connection leaves tonight.",
      citations: [
        { clauseId: "3.1", why: "We cancelled the flight, so rebooking is free, including a partner airline if ours would be more than 4 hours later." },
        { clauseId: "3.2", why: "The Lisbon flight is on the same ticket, so the missed connection is rebooked too." },
        { clauseId: "3.5", why: "A crew problem is within our control, so a hotel is covered if she is stuck overnight." },
      ],
      reply: {
        subject: "Re: Flight cancelled and I'll miss my connection to Lisbon tonight",
        body:
          "Hi Priya,\n\nI'm sorry your flight was cancelled. You don't need to pay anything to fix this: because we cancelled LK 482, we'll rebook both flights on booking QX7P2M at no cost, including your Boston to Lisbon connection.\n\nI'm holding a seat on tonight's 6:45 pm Denver to New York flight with a connection to Lisbon that lands at 11:20 am tomorrow, well before the wedding. If you'd rather wait for a Larkspur Air flight to Boston, the next one would get you to Lisbon in the evening. Reply \"confirm\" and I'll issue the new tickets right away. Your checked bag will be moved to the new flights.\n\nIf no option gets you out tonight, we'll book you a hotel and transport, since this was a crew issue on our side.\n\nLarkspur Air Support",
      },
    },
  },
  {
    ticket: {
      id: "t-1007",
      customerName: "Lucía Fernández",
      bookingRef: "RJ6W2N",
      subject: "App crashes every time I try to check in, flight in 2 hours",
      body:
        "Hello, the Larkspur app closes itself as soon as I tap Check in. I've tried three times and reinstalled it. My flight to Phoenix leaves in 2 hours and I only have a carry-on. Will I lose my seat? Do I have to pay to check in at the airport?\n\nRef RJ6W2N",
      minutesAgo: 25,
      origin: "sample",
    },
    triage: {
      category: "app_issue",
      priority: "urgent",
      summary: "Lucía can't check in because the app crashes, and her flight to Phoenix leaves in 2 hours.",
      priorityReason: "Online check-in closes 60 minutes before departure, so she has about an hour.",
      citations: [
        { clauseId: "11.1", why: "When our app fails she can check in at a kiosk or desk with no fee, and the desks close 45 minutes before." },
        { clauseId: "11.2", why: "Any fee she pays because of the crash is refunded once we confirm the outage." },
      ],
      reply: {
        subject: "Re: App crashes every time I try to check in",
        body:
          "Hi Lucía,\n\nYou won't lose your seat, and checking in at the airport is free when our app is the problem. Any self-service kiosk or the Larkspur Air desk can check you in for booking RJ6W2N; the desks close 45 minutes before departure, so please head there as soon as you arrive.\n\nWe're aware of check-in crashes in the app today and our team is working on a fix. If anyone charges you a fee because you couldn't check in online, keep the receipt and reply here with it, and we'll refund it.\n\nHave a good flight to Phoenix.\n\nLarkspur Air Support",
      },
    },
  },
  {
    ticket: {
      id: "t-1002",
      customerName: "Marcus Bell",
      bookingRef: "HT4R9W",
      subject: "My suitcase never arrived in Seattle",
      body:
        "I flew Chicago to Seattle last night on LK 1190 and my black suitcase never came out at baggage claim. I waited over an hour and the baggage desk was closed by then, so I couldn't report it.\n\nMy suit for a job interview on Thursday is in that bag. What do I do? Can I buy something to wear and get paid back?\n\nMarcus Bell, HT4R9W",
      minutesAgo: 47,
      origin: "sample",
    },
    triage: {
      category: "baggage",
      priority: "high",
      summary: "Marcus's suitcase didn't arrive after his Chicago to Seattle flight, and he needs clothes for an interview on Thursday.",
      priorityReason: "A missing bag with a deadline in days, and the 24-hour reporting window is running.",
      citations: [
        { clauseId: "2.1", why: "He still needs to file the missing-bag report, within 24 hours of landing." },
        { clauseId: "2.2", why: "Essentials like clothes are reimbursed up to $75 a day while the bag is delayed." },
        { clauseId: "2.3", why: "When the bag turns up, we deliver it to him for free." },
      ],
      reply: {
        subject: "Re: My suitcase never arrived in Seattle",
        body:
          "Hi Marcus,\n\nI'm sorry your suitcase didn't arrive. I've opened a missing-bag report for you on booking HT4R9W, so you're within the 24-hour window; your file number is SEA-48213. Please quote it in any message about the bag.\n\nWhile it's delayed, you can buy essentials such as clothes and toiletries and we'll pay you back up to $75 a day for up to 5 days. Keep the receipts and reply here with them. If you need more than that for your interview suit, tell us and we'll look at it with you.\n\nAs soon as the bag is found, we'll deliver it to your address in Seattle free of charge, usually within 24 hours. Reply with the address you'd like us to use.\n\nLarkspur Air Support",
      },
    },
  },
  {
    ticket: {
      id: "t-1012",
      customerName: "Ravi Menon",
      bookingRef: "GF8N2P",
      subject: "Booked the wrong date by mistake",
      body:
        "Hi, about an hour ago I booked Austin to San Diego for October 28, but I meant November 28. It's a non-refundable fare. Can I cancel it and book the right date without losing the money?\n\nThanks,\nRavi (GF8N2P)",
      minutesAgo: 58,
      origin: "sample",
    },
    triage: {
      category: "booking_change",
      priority: "high",
      summary: "Ravi booked the wrong month an hour ago and wants to cancel without losing his non-refundable fare.",
      priorityReason: "The free 24-hour cancellation window closes tomorrow.",
      citations: [
        { clauseId: "5.1", why: "He booked less than 24 hours ago, more than 7 days before departure, so he can cancel for a full refund." },
        { clauseId: "5.4", why: "Tells him when the refund reaches his card." },
      ],
      reply: {
        subject: "Re: Booked the wrong date by mistake",
        body:
          "Hi Ravi,\n\nGood news: you won't lose anything. Because you booked less than 24 hours ago and the flight is more than 7 days away, booking GF8N2P can be cancelled for a full refund, even though the fare is non-refundable.\n\nI've cancelled the October 28 flight. The refund will go back to your card within 7 to 10 business days. You can book November 28 now at whatever the fare is today; reply here if you'd like me to look up the options for you.\n\nLarkspur Air Support",
      },
    },
  },
  {
    ticket: {
      id: "t-1004",
      customerName: "Daniel Okafor",
      bookingRef: "MB82KD",
      subject: "Refund request: my father is in hospital",
      body:
        "Hello,\n\nI was due to fly to Atlanta on Friday but my father was admitted to hospital yesterday after a stroke and I need to stay with him. My ticket is non-refundable. Is there anything you can do? I can send a letter from the hospital.\n\nDaniel Okafor\nBooking MB82KD",
      minutesAgo: 180,
      origin: "sample",
    },
    triage: {
      category: "refund",
      priority: "high",
      summary: "Daniel can't fly on Friday because his father is in hospital, and asks for a refund of a non-refundable ticket.",
      priorityReason: "Money is at stake and the flight is in a few days.",
      citations: [
        { clauseId: "5.3", why: "Serious illness in the immediate family qualifies for a full refund, with a document." },
        { clauseId: "5.4", why: "Tells him how long the refund takes to reach his card." },
      ],
      reply: {
        subject: "Re: Refund request: my father is in hospital",
        body:
          "Hi Daniel,\n\nI'm very sorry to hear about your father. Yes, we can help: when a close family member is seriously ill, we refund a non-refundable fare in full.\n\nPlease reply with the letter from the hospital (a photo or a PDF is fine). Only our support team will see it. As soon as it arrives, we'll cancel booking MB82KD and refund the full fare to your original card; it usually appears within 7 to 10 business days.\n\nYou don't need to do anything else before Friday. I hope your father recovers well.\n\nLarkspur Air Support",
      },
    },
  },
  {
    ticket: {
      id: "t-1005",
      customerName: "Elena Petrova",
      bookingRef: "VN3C7Q",
      subject: "Wheelchair help for my mother next Tuesday",
      body:
        "Hi, my mother (78) is flying from Portland to Denver next Tuesday and can't walk long distances. She'll bring her own folding walker. Can she have a wheelchair from check-in to the plane? Does the walker count as a bag?\n\nThank you, Elena. Booking VN3C7Q",
      minutesAgo: 240,
      origin: "sample",
    },
    triage: {
      category: "special_assistance",
      priority: "high",
      summary: "Elena asks for wheelchair help for her mother on next Tuesday's Portland to Denver flight, and whether her walker counts as a bag.",
      priorityReason: "Travel is in days and the request should reach the airport at least 48 hours ahead.",
      citations: [
        { clauseId: "7.1", why: "Wheelchair help is free when requested 48 hours before departure." },
        { clauseId: "7.2", why: "Her walker travels free and doesn't count toward the bag allowance." },
      ],
      reply: {
        subject: "Re: Wheelchair help for my mother next Tuesday",
        body:
          "Hi Elena,\n\nYes. I've added free wheelchair help for your mother to booking VN3C7Q, from check-in in Portland to the aircraft door, and again from the plane on arrival in Denver. Because we have it more than 48 hours ahead, the airport team will be ready for her.\n\nHer folding walker travels free and doesn't count toward her bag allowance. She can use it up to the aircraft door, where the crew will stow it and bring it back when she lands.\n\nIf anything about her trip changes, reply here and we'll update the request.\n\nLarkspur Air Support",
      },
    },
  },
  {
    ticket: {
      id: "t-1006",
      customerName: "Sam Whitfield",
      bookingRef: "PL5T8Z",
      subject: "Can my cat fly with me in the cabin?",
      body:
        "Hi there, I'm moving from Salt Lake City to Minneapolis next month and want to bring my cat, Biscuit. She's about 5 kg and has a soft carrier. Can she sit with me? Is there a fee?\n\nSam, PL5T8Z",
      minutesAgo: 360,
      origin: "sample",
    },
    triage: {
      category: "pets",
      priority: "normal",
      summary: "Sam wants to bring a 5 kg cat in the cabin on a flight next month.",
      priorityReason: "A question about a trip a month away; pet spaces are limited, so it should be booked soon.",
      citations: [{ clauseId: "8.1", why: "Sets the carrier, weight limit, fee and the 4-pet limit per flight." }],
      reply: {
        subject: "Re: Can my cat fly with me in the cabin?",
        body:
          "Hi Sam,\n\nYes, Biscuit can fly with you in the cabin. A cat up to 8 kg including the carrier is allowed in a soft carrier that fits under the seat in front of you, so at about 5 kg she's fine.\n\nThe fee is $95 each way. We take only 4 pets per flight, so it's worth adding her to booking PL5T8Z soon. Reply \"add Biscuit\" and I'll reserve her space and send you the payment link.\n\nWishing you a smooth move to Minneapolis.\n\nLarkspur Air Support",
      },
    },
  },
  {
    ticket: {
      id: "t-1003",
      customerName: "Aiko Tanaka",
      bookingRef: "CS4K8V",
      subject: "Delayed 5 hours by snow, can I get compensation?",
      body:
        "My flight from Denver to Chicago yesterday was delayed 5 hours because of the snowstorm. I missed a dinner I had planned for weeks. Other airlines give compensation for long delays. What will Larkspur give me? Nobody offered me anything at the gate.\n\nAiko Tanaka (CS4K8V)",
      minutesAgo: 110,
      origin: "sample",
    },
    triage: {
      category: "delay",
      priority: "normal",
      summary: "Aiko asks for compensation after a 5-hour weather delay from Denver to Chicago and says she was offered nothing at the gate.",
      priorityReason: "The trip is over; she needs an answer, but nothing is time-critical.",
      citations: [
        { clauseId: "4.1", why: "A weather delay is outside our control, so cash compensation doesn't apply." },
        { clauseId: "4.2", why: "She should still have had a meal voucher for a delay over 3 hours." },
      ],
      reply: {
        subject: "Re: Delayed 5 hours by snow",
        body:
          "Hi Aiko,\n\nI'm sorry your evening was lost to the storm. Delays caused by weather are outside our control, so our policy doesn't include cash compensation for them.\n\nYou should, however, have been offered a $15 meal voucher at the gate, because the delay was more than 3 hours. That didn't happen, so I've added a $15 credit to booking CS4K8V to make it right; it will show in your account within a day. If you bought a meal at the airport and spent more, reply with the receipt and we'll cover it.\n\nThank you for your patience yesterday.\n\nLarkspur Air Support",
      },
    },
  },
  {
    ticket: {
      id: "t-1008",
      customerName: "Tom Brennan",
      bookingRef: "KD9F4A",
      subject: "My name is misspelled on my ticket",
      body:
        "Hello, I just noticed my ticket says Tom Brenan (one n) but my passport says Brennan. I'm flying to Toronto in three weeks. Will this be a problem at the airport? How do I fix it?\n\nTom, KD9F4A",
      minutesAgo: 540,
      origin: "sample",
    },
    triage: {
      category: "booking_change",
      priority: "normal",
      summary: "Tom's surname is missing one letter on his ticket and he wants it fixed before an international flight.",
      priorityReason: "Needs fixing before travel, but the flight is three weeks away.",
      citations: [{ clauseId: "6.3", why: "A spelling fix of up to 3 letters is free with a photo of the passport." }],
      reply: {
        subject: "Re: My name is misspelled on my ticket",
        body:
          "Hi Tom,\n\nThanks for spotting this early; it's an easy fix and it's free. We correct spelling mistakes of up to 3 letters, and yours is one letter.\n\nPlease reply with a photo of your passport's photo page. Once we have it, we'll update booking KD9F4A to read Brennan and email you the corrected ticket, usually the same day. Nothing else about your flight to Toronto changes.\n\nLarkspur Air Support",
      },
    },
  },
  {
    ticket: {
      id: "t-1011",
      customerName: "Hannah Schmidt",
      bookingRef: "BY7H3L",
      subject: "Rude treatment at the Denver check-in desk",
      body:
        "On Sunday morning the agent at the Denver check-in desk was really rude to my elderly father when he asked a question about his bag. She rolled her eyes and told him to \"read the website\". It was embarrassing and upsetting. I'd like someone to know this happened.\n\nHannah Schmidt, BY7H3L",
      minutesAgo: 1800,
      origin: "sample",
    },
    triage: {
      category: "complaint",
      priority: "normal",
      summary: "Hannah reports that a Denver check-in agent was rude to her elderly father on Sunday.",
      priorityReason: "A service complaint with no travel at stake; it needs a sincere reply, not a fast one.",
      citations: [{ clauseId: "12.1", why: "Complaints go to the station manager for review within 14 days, and we apologise without arguing." }],
      reply: {
        subject: "Re: Rude treatment at the Denver check-in desk",
        body:
          "Hi Hannah,\n\nThank you for telling us, and I'm sorry. Your father should have been helped patiently and with respect, and it's upsetting to hear he wasn't.\n\nI've passed your message, with booking BY7H3L and the time of your visit, to the Denver station manager. They'll review what happened with the team within 14 days. I can't share staff matters in detail, but your report will be acted on.\n\nPlease pass our apology on to your father.\n\nLarkspur Air Support",
      },
    },
    sentAtMinutesAgo: 1700,
  },
  {
    ticket: {
      id: "t-1010",
      customerName: "Omar Haddad",
      bookingRef: "ZW2M6E",
      subject: "Charged $80 for my bag, was that right?",
      body:
        "At check-in in Houston the agent weighed my bag at 27 kg and charged me $80. I'm on an Economy ticket. That seems like a lot for a few kilos. Was this a mistake?\n\nOmar Haddad\nZW2M6E",
      minutesAgo: 1620,
      origin: "sample",
    },
    triage: {
      category: "baggage",
      priority: "low",
      summary: "Omar asks whether an $80 overweight fee on a 27 kg Economy bag was correct.",
      priorityReason: "A question about a fee already paid; the charge matches the policy.",
      citations: [
        { clauseId: "1.2", why: "Economy includes one checked bag up to 23 kg." },
        { clauseId: "1.3", why: "Each kg over the limit costs $20, so 4 kg over is $80." },
      ],
      reply: {
        subject: "Re: Charged $80 for my bag",
        body:
          "Hi Omar,\n\nThanks for checking. The charge on booking ZW2M6E was correct, and I'm sorry it came as a surprise. Your Economy fare includes one checked bag up to 23 kg, and each kilo over that costs $20. Your bag weighed 27 kg, so it was 4 kg over: 4 × $20 = $80.\n\nOn your next trip, moving a few heavier items into your carry-on (up to 7 kg) or adding a second bag for $50 in the app before you fly will usually cost less.\n\nLarkspur Air Support",
      },
    },
    sentAtMinutesAgo: 1500,
  },
  {
    ticket: {
      id: "t-1009",
      customerName: "Grace Liu",
      bookingRef: null,
      subject: "Upgrading to Business with miles",
      body:
        "Hi! I'm wondering how upgrades with miles work. I have about 40,000 Larkspur Miles and a trip to New York in December. How many miles does it take, and when can I ask?\n\nGrace",
      minutesAgo: 2880,
      origin: "sample",
    },
    triage: {
      category: "seats_upgrades",
      priority: "low",
      summary: "Grace asks how many miles a Business upgrade costs and when she can request one for a December trip.",
      priorityReason: "A general question about a trip months away.",
      citations: [{ clauseId: "9.2", why: "Upgrades start at 15,000 miles per flight and open 14 days before departure." }],
      reply: {
        subject: "Re: Upgrading to Business with miles",
        body:
          "Hi Grace,\n\nGreat question. Upgrades from Economy to Business start at 15,000 Larkspur Miles per flight, so with about 40,000 miles you could upgrade both ways to New York if seats are available.\n\nUpgrades open 14 days before each flight. For your December trip, open the booking in the app two weeks before you fly and choose Upgrade with miles. Seats go to the first requests, so it's worth asking on that day.\n\nLarkspur Air Support",
      },
    },
    sentAtMinutesAgo: 2700,
  },
];

/** The first-load state of every sample: its written triage, and a sent reply where it has one. */
export function sampleState(sample: Sample, now: Date): TicketState {
  return {
    triage: sample.triage,
    source: "sample",
    draft: null,
    sent:
      sample.sentAtMinutesAgo === undefined
        ? null
        : { ...sample.triage.reply, at: new Date(now.getTime() - sample.sentAtMinutesAgo * 60_000).toISOString() },
  };
}
