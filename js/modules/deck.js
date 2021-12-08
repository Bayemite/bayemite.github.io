import Queue from '../../_snowpack/pkg/yocto-queue.js'; // Time to wait for next review in milliseconds for each stage

const stageWait = {
  0: 4 * 60 * 60 * 1000,
  // Above=4 hrs, only for new deck cards init (see ctor). 
  // This is to allow stage increment before updating (so much easier than logic restructuring, I think)
  1: 4 * 60 * 60 * 1000,
  // 4 hrs
  2: 8 * 60 * 60 * 1000,
  // 8 hrs
  3: 24 * 60 * 60 * 1000,
  // 1 day
  4: 24 * 60 * 60 * 1000 * 2,
  // 2 days
  5: 24 * 7 * 60 * 60 * 1000,
  // 1 week
  6: 24 * 7 * 60 * 60 * 1000 * 2,
  // 2 weeks
  7: 30 * 24 * 60 * 60 * 1000,
  // 1 month
  8: 30 * 24 * 60 * 60 * 1000 * 2 // 4 months

};
const maxStage = 8;

function requiredArgs(funcName
/*Check for undefined args, variadic...*/
) {
  for (var i = 1; i < arguments.length; i++) {
    if (arguments[i] === undefined) throw new TypeError("Failed to execute '" + funcName + "'. Missing argument(s).");
  }
}

function floorMsToHour(milliseconds) {
  let p = 60 * 60 * 1000; // milliseconds in an hour

  return Math.floor(milliseconds / p) * p;
}

class Deck {
  // Cards without question or answer are discarded
  // Answers are trimmed
  constructor(name, description, cards) {
    // See create-deck.html & create-deck.js
    this.name = name;
    this.description = description;
    this.cards = [];

    if (cards != null) {
      for (let i = 0; i < cards.length; ++i) {
        let card = cards[i];
        let question = card.getElementsByClassName("question")[0].value;
        let answer = card.getElementsByClassName("answer")[0].value.trim();
        if (question === "" || answer === "") continue; // Next review in ms

        this.cards.push({
          "q": question,
          "ans": answer,
          "nextReview": 0,
          "stage": 0
        });
      }
    }
  } // ReviewSession changes the cards of this object


  review() {
    return new ReviewSession(this.cards);
  }

  static unserialise(json) {
    requiredArgs("loadFromJSON", json);
    let deck = new Deck();
    Object.assign(deck, JSON.parse(json));
    return deck;
  }

  serialise() {
    this.reviews = [];
    return JSON.stringify(this);
  }

}

class ReviewSession {
  constructor(cards) {
    requiredArgs("ReviewSession constructor", cards);
    this.reviewQueue = new Queue(); // Stores {'card':card, 'numWrong':number of times answered wrong in this session}

    this.summary = {
      'correct': [],
      'wrong': []
    }; // arrays of cards

    this.cards = cards;
    this.current = null; // Currently reviewed card, same as reviewQueue content. Null for nothing

    let currentTime = Date.now();

    for (let i = 0; i < this.cards.length; ++i) {
      let card = this.cards[i];
      if (currentTime > card["nextReview"] && card.stage <= maxStage) this.reviewQueue.enqueue({
        'card': this.cards[i],
        'numWrong': 0
      });
    }

    if (this.reviewQueue.size > 0) this.current = this.reviewQueue.dequeue();
  } // Will return the same card until logAns is called
  // Wrongly answered cards are requeued
  // Returns null if no cards are available for SRS review


  nextCard() {
    if (this.current === null) return null;
    return this.current.card;
  } // Record answer in response to nextCard()
  // Wrong answers are requeued for nextCard()
  // returns correct: boolean


  logAns(ans) {
    requiredArgs("logAns", ans);
    if (this.done) return;
    let currentTime = Date.now();
    let card = this.current.card;
    let isCorrect = false;

    if (ans.trim() === card.ans) {
      isCorrect = true; // Src: https://knowledge.wanikani.com/wanikani/srs-stages/

      if (this.current.numWrong > 0) {
        let penaltyFactor = card.stage >= 5 ? 2 : 1;
        let newStage = card.stage - Math.ceil(this.current.numWrong / 2 * penaltyFactor);
        card.stage = newStage > 0 ? newStage : 1;
        this.summary.wrong.push(card);
      } else {
        card.stage += 1;
        this.summary.correct.push(card);
      }
    } else {
      this.reviewQueue.enqueue({
        'card': card,
        'numWrong': this.current.numWrong + 1
      });
    }

    card.nextReview = floorMsToHour(currentTime + stageWait[card.stage]);
    if (this.reviewQueue.size === 0) this.current = null;else this.current = this.reviewQueue.dequeue();
    return isCorrect;
  }

}

export { Deck };