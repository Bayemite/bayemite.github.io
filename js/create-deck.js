import './modules/main.js'
import { Deck } from './modules/deck.js'

// Notes:
// > data-id attribute for the flashcards is used as an index, must be in strict
// order
//   - see deleteCard function

let lastCard = null;

window.onload = function()
{
    lastCard = document.getElementsByClassName('flashcard')[0];

    let cardDel = document.getElementById("flashcardDelete");
    let qInput = document.getElementById("questionInput");
    let aInput = document.getElementById("ansInput");
    let submit = document.getElementById("submitDeck");

    cardDel.addEventListener("click", function() { deleteCard(cardDel.parentNode) });
    qInput.addEventListener("input", function() { addCard(qInput.parentNode) });
    aInput.addEventListener("input", function() { addCard(aInput.parentNode) });
    submit.addEventListener("click", createDeck);
};

function impl_addCard()
{
    let newCard = lastCard.cloneNode(true);
    let newCardId = Number(lastCard.getAttribute('data-id')) + 1;

    newCard.setAttribute('data-id', newCardId);
    newCard.getElementsByTagName('label')[0].innerHTML = 'Card ' + newCardId;
    for (let input of newCard.getElementsByTagName('textarea'))
        input.value = '';

    lastCard.insertAdjacentElement('afterend', newCard);
    lastCard = newCard;
}

// Automatically adds next card
// if inputtedCard was the previously added card
function addCard(edittedCard)
{
    if (edittedCard === lastCard)
        impl_addCard();
}

function deleteCard(card)
{
    let cards = document.getElementsByClassName('flashcard');
    if (cards.length == 1)
        return;
    if (card === lastCard)
    { // No need to rename the cards following it + don't delete 'starter card'
        lastCard = card.previousElementSibling;
        card.remove();
    }
    else
    {
        let i = Number(card.getAttribute('data-id')) - 1;
        card.remove();
        for (; i < cards.length; ++i)
        {
            let card = cards[i];
            card.setAttribute("data-id", i + 1); // 1 less than previously for the card
            card.getElementsByTagName('label')[0].innerHTML = 'Card ' + (i + 1);
        }
    }
}

function createDeck()
{
    let deckName = document.getElementById("deck-name").value;
    if (deckName === "")
        deckName = "Unnamed Deck";
    let deckDescription = document.getElementById("deck-description").value;
    let cards = document.getElementsByClassName('flashcard');

    let deck = new Deck(deckName, deckDescription, cards);

    let decks = window.localStorage.getItem('user-decks');
    decks = decks ? JSON.parse(decks) : [];
    decks.push(deck.serialise());
    window.localStorage.setItem('user-decks', JSON.stringify(decks));

    console.log("Saved deck. Name: '" + deck.name + "' to localStorage.");
    window.location.href = "index.html";
}