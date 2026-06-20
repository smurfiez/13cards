function formatPayout(n) {
    if (n > 0) return `+${n}`;
    if (n < 0) return `${n}`;
    return '—';
}

function createMiniCardEl(card, { draggable = true, selected = false, onClick } = {}) {
    const el = document.createElement('div');
    el.className = `mini-card ${card.color}${selected ? ' is-selected' : ''}`;
    el.dataset.cardId = card.id;
    el.innerHTML = `<span>${card.display}</span><span class="suit-sm">${card.symbol}</span>`;
    if (draggable) {
        el.draggable = true;
        el.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/card-id', card.id);
            e.dataTransfer.effectAllowed = 'move';
            el.classList.add('is-dragging');
        });
        el.addEventListener('dragend', () => el.classList.remove('is-dragging'));
    }
    if (onClick) {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            hapticTap();
            onClick(card, el);
        });
    }
    return el;
}

function bindDropZone(el, onDropCardId) {
    el.addEventListener('dragover', (e) => {
        e.preventDefault();
        el.classList.add('drop-target');
    });
    el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
    el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('drop-target');
        const id = e.dataTransfer.getData('text/card-id');
        if (id) onDropCardId(id);
    });
}

function parseCardIds(text) {
    const ids = text.split(/[\s,]+/).filter(Boolean);
    if (ids.length !== 13) throw new Error('Enter exactly 13 card ids (e.g. As Kh Qd …).');
    const deckIds = new Set(buildFullDeck().map(c => c.id));
    const seen = new Set();
    const cards = [];
    for (const id of ids) {
        if (!deckIds.has(id) || seen.has(id)) throw new Error(`Invalid or duplicate card: ${id}`);
        seen.add(id);
        const suit = SUITS.find(s => s.id === id.slice(-1));
        cards.push(buildCard(id.slice(0, -1), suit));
    }
    return cards;
}
