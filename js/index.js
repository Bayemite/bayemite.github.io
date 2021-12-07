import './modules/main.js'
import { Deck } from './modules/deck.js'

let decks = null;

window.onload = function()
{
    loadDecks();
}

function loadDecks()
{

    let json = localStorage.getItem('user-decks');
    decks = json ? JSON.parse(json) : [];

    let content = document.getElementById('main-content');
    if (decks.length === 0)
    {
        content.innerHTML = "<p>No flashcard decks. </p><a href='create-deck.html'>Create a new deck?</a>";
    }
    else
    {
        let cardList = document.createElement('div');
        cardList.id = 'cardlist';
        for (let i = 0; i < decks.length; ++i)
        {
            // Serialise while also iterating for deck names
            decks[i] = Deck.unserialise(decks[i]);

            cardList.innerHTML +=
                '<p>Deck #' + (i + 1) + ": "
                + "<a href='review-deck.html?deck-index=" + i + "'>"
                + decks[i].name + '</a></p>';
        }
        content.appendChild(cardList);
    }
}