import { Deck } from './modules/deck.js'

let deck = null;
let deckIndex = null;
let session = null;
let numCorrect = 0;
let currentCard = null;

let ansEntered = false; // User has entered the answer, now waiting to move to next question

// DOM tags, less typing (document.getElementBy...)
let ansInput = null;
let question = null;
let msg = null;

let synced = false;
function syncDeck()
{
    if (!synced)
    {
        let json = localStorage.getItem('user-decks');
        decks = json ? JSON.parse(json) : [];
        decks[deckIndex] = deck.serialise();
        localStorage.setItem("user-decks", JSON.stringify(decks));
        synced = true;
    }
}

window.onload = function()
{
    document.body.onbeforeunload = function()
    {
        syncDeck();
    }

    document.body.addEventListener("keypress", globalOnKeyPress);
    
    let urlParams = new URLSearchParams(window.location.search);
    deckIndex = urlParams.get('deck-index');

    openDeck(deckIndex);
}

function openDeck(deckIndex)
{
    let json = localStorage.getItem('user-decks');
    decks = json ? JSON.parse(json) : [];
    deck = Deck.unserialise(decks[deckIndex]);

    let content = document.getElementById('main-content');
    content.classList.add("center"); // Make everything text-centered
    content.innerHTML = "<p style='text-align: left;'><b>" + deck.name + "</b></p>";

    if (deck.cards.length === 0)
    {
        content.innerHTML +=
            "<p>Interesting... there are no cards in this deck.</p>"
            + "<a href='index.html'>Back to home page?</a>";
        return;
    }

    session = deck.review();
    currentCard = session.nextCard();
    if (currentCard === null)
    {
        content.innerHTML +=
            "<p>No cards scheduled for review.</p>"
            + "<a href='index.html'>Back to home page?</a>";
        return;
    }

    content.innerHTML +=
        "<p id='question'>" + currentCard.q + "</p>"
        + "<input id='answer-input' placeholder='Answer' autofocus>"
        + "<p id='msg'></p>";

    question = document.getElementById("question");
    ansInput = document.getElementById("answer-input");
    msg = document.getElementById("msg");
}

// 'Enter' is captured from body, data is from input
function globalOnKeyPress(event)
{
    let key = event.which || event.keyCode;
    if (key === 13) // Enter key
    {
        if (ansEntered)
        {
            ansInput.removeAttribute("disabled");
            loadQuestion();
            return;
        }

        let ans = ansInput.value.trim();
        if (ans === "")
            return;

        let correctAns = currentCard.ans.trim();
        ansInput.setAttribute("disabled", "");
        ansEntered = true;
        msg.innerHTML = "Press enter for next card.";

        if (ans === correctAns)
        {
            ansInput.style.backgroundColor = "#88CC00";
            ++numCorrect;
            session.logAns(true);
        }
        else
        {
            ansInput.style.backgroundColor = "#FF0033";
            session.logAns(false);
        }

    }

}

function loadQuestion()
{
    currentCard = session.nextCard();
    if (currentCard === null)
    {
        closeDeck();
        return;
    }

    question.innerHTML = currentCard.q;
    ansInput.focus();
    ansEntered = false;

    msg.innerHTML = "";
    ansInput.style.backgroundColor = "";
    ansInput.value = "";
}

function loadSummary()
{
    let summary = session.getSummary();
    let content = document.getElementById('main-content');
    let toHTML = function(cardArray)
    {
        if (cardArray.length === 0)
            return "";
        let html = "<ul style='margin: 0;padding-left:1.5em;'>";
        for (let card of cardArray)
        {
            html += "<li>" + card.q + "</li>";
        }
        html += "</ul>"
        return html;
    };
    let correct = toHTML(summary.correct);
    let incorrect = toHTML(summary.incorrect);
    let total = summary.correct.length + summary.incorrect.length;
    if (correct == "")
        correct = "<p>=( So sad, no correct cards.</p>";
    if (incorrect == "")
        incorrect = "<p>Yay! No incorrect cards.</p>";

    content.classList.remove("center");
    content.innerHTML = "Finished studying <b>" + deck.name + "</b>."
        + "<p><b>" + Math.round(summary.correct.length / total * 100) + "%</b> correct.</p>"
        + "<br><b>Correct cards</b>" + correct
        + "<br><b>Wrong cards</b>" + incorrect
        + "<br><a href='index.html'>Back to home?</a>";
}

// paired with openDeck, reverses openDeck
function closeDeck()
{
    loadSummary();
    syncDeck();
}