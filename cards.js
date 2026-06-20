const SUITS = [
    { id: 's', symbol: '♠', color: 'card-black' },
    { id: 'h', symbol: '♥', color: 'card-red' },
    { id: 'c', symbol: '♣', color: 'card-black' },
    { id: 'd', symbol: '♦', color: 'card-red' }
];
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

const PRESET_KEY = 'presetCards';

function getCardValue(rank) {
    if (rank === 'A') return 14;
    if (rank === 'K') return 13;
    if (rank === 'Q') return 12;
    if (rank === 'J') return 11;
    if (rank === 'T') return 10;
    return parseInt(rank);
}

function buildCard(rank, suit) {
    return {
        id: `${rank}${suit.id}`,
        r: getCardValue(rank),
        s: suit.id,
        symbol: suit.symbol,
        display: rank,
        color: suit.color
    };
}

function buildFullDeck() {
    const deck = [];
    SUITS.forEach(suit => RANKS.forEach(rank => deck.push(buildCard(rank, suit))));
    return deck;
}

function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function random13() {
    const deck = shuffleInPlace(buildFullDeck());
    return deck.slice(0, 13);
}

function savePreset(cardIds) {
    sessionStorage.setItem(PRESET_KEY, JSON.stringify(cardIds));
}

function loadPreset() {
    const raw = sessionStorage.getItem(PRESET_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PRESET_KEY);
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}
