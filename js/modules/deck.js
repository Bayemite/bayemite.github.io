// Time to wait for next review in milliseconds for each stage
let stageWait = {
    0: 4 * 60 * 60 * 1000, // 4 hrs, only for new deck cards init (see ctor)
    1: 4 * 60 * 60 * 1000, // 4 hrs
    2: 8 * 60 * 60 * 1000, // 8 hrs
    3: 24 * 60 * 60 * 1000, // 1 day
    4: 24 * 60 * 60 * 1000 * 2, // 2 days
    5: 24 * 7 * 60 * 60 * 1000, // 1 week
    6: 24 * 7 * 60 * 60 * 1000 * 2, // 2 weeks
    7: 30 * 24 * 60 * 60 * 1000, // 1 month
    8: 30 * 24 * 60 * 60 * 1000 * 2  // 4 months
}

function requiredArgs(funcName, /*Check for undefined args, variadic...*/)
{
    for (var i = 1; i < arguments.length; i++)
    {
        if (arguments[i] === undefined)
            throw new TypeError("Failed to execute '" + funcName + "'. Missing argument(s).");
    }
}

function roundMsToHour(milliseconds)
{
    p = 60 * 60 * 1000; // milliseconds in an hour
    return (Math.round(milliseconds / p) * p);
}

class Deck
{
    // Cards without question or answer are discarded
    constructor(name, description, cards)
    {
        // See create-deck.html & create-deck.js
        this.name = name;
        this.description = description;
        this.cards = [];
        if (cards != null)
        {
            for (let i = 0; i < cards.length; ++i)
            {
                let card = cards[i];
                let question = card.getElementsByClassName("question")[0].value;
                let answer = card.getElementsByClassName("answer")[0].value;
                if (question === "" || answer === "")
                    continue;

                // Next review in ms
                this.cards.push({ "q": question, "ans": answer, "nextReview": 0, "stage": 0 });
            }
        }
    }

    review()
    {
        return new ReviewSession(this.cards);
    }

    static unserialise(json)
    {
        requiredArgs("loadFromJSON", json);
        let deck = new Deck();
        Object.assign(deck, JSON.parse(json));
        return deck;

    }

    serialise()
    {
        this.reviews = [];
        console.log(JSON.stringify(this));
        return JSON.stringify(this);
    }
}

class ReviewSession
{
    constructor(cards)
    {
        requiredArgs("ReviewSession constructor", cards);
        this.reviewList = []; // Stores card indexes
        this.correctList = []; // index of correctly answered cards
        this.cards = cards;
        this.i = 0;
        this.cardIndex = null;
        this.done = false;

        let currentTime = Date.now();
        for (let i = 0; i < this.cards.length; ++i)
        {
            let card = this.cards[i];
            if (currentTime > card["nextReview"])
                this.reviewList.push(i);
        }

        if (this.reviewList.length > 0)
            this.cardIndex = this.reviewList[this.i];
        else
            this.done = true;
    }

    // Will return the same card until logAns is called
    nextCard()
    {
        if (this.done)
            return null;
        return this.cards[this.cardIndex];
    }

    // Record answer in response to nextCard()
    logAns(isCorrect)
    {
        if (this.done)
            return;

        requiredArgs("logAns", isCorrect);
        let currentTime = Date.now();
        let card = this.cards[this.cardIndex];

        if (isCorrect === true)
        {
            card.stage += 1;
            this.correctList.push(this.cardIndex);
        }
        else if (card.stage > 1)
        {
            card.stage -= 1;
        }
        card.nextReview = roundMsToHour(currentTime + stageWait[card.stage]);

        if ((this.i + 1) >= this.reviewList.length)
            this.done = true;
        else
        {
            ++this.i;
            this.cardIndex = this.reviewList[this.i];
        }
    }

    // Summary of finished cards
    // {
    //    "correct": [/*cards*/]
    //    "incorrect": [/*cards*/]
    // }
    getSummary()
    {
        let summary = { "correct": [], "incorrect": [] };
        for (let i = 0; i <= this.i; ++i)
        {
            let index = this.reviewList[i];
            if (this.correctList.includes(index))
                summary.correct.push(this.cards[index]);
            else
                summary.incorrect.push(this.cards[index]);
        }
        return summary;
    }
}

export { Deck };