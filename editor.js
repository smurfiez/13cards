const ROW_LIMITS = { front: 3, middle: 5, back: 5 };
const ROW_ORDER = ['back', 'middle', 'front'];
const ROW_LABELS_UI = { front: 'Front', middle: 'Middle', back: 'Back' };

function evaluateLayout(rows, allCards, variant) {
    const { front, middle, back } = rows;
    const complete = front.length === 3 && middle.length === 5 && back.length === 5;
    if (!complete) {
        return {
            complete: false,
            valid: false,
            foul: false,
            frontEval: null,
            midEval: null,
            backEval: null,
            royalties: null,
            royaltyTotal: 0,
            ace: null,
            message: `${13 - (front.length + middle.length + back.length)} cards unassigned`
        };
    }
    const valid = isValidArrangement(front, middle, back);
    const frontEval = evalFront(front);
    const midEval = evalFive(middle);
    const backEval = evalFive(back);
    const royalties = getArrangementRoyalties(front, middle, back, variant);
    const ace = getAcePayout(front, allCards, variant);
    let message = valid ? 'Valid — back > middle > front' : 'FOUL — middle must beat front and back must beat middle';
    if (!valid) {
        if (!beatsFive(back, middle)) message = 'FOUL — back must beat middle';
        else if (!beatsFront(middle, front)) message = 'FOUL — middle must beat front';
    }
    return {
        complete: true,
        valid,
        foul: !valid,
        frontEval,
        midEval,
        backEval,
        royalties,
        royaltyTotal: royalties.total,
        ace,
        totalPayout: royalties.total + ace.payout,
        message
    };
}

function createManualRowEditor(container, options = {}) {
    const state = {
        variant: options.variant || 'traditional_chinese_poker',
        rows: { front: [], middle: [], back: [] },
        pool: [],
        selectedId: null,
        onChange: options.onChange || (() => {})
    };

    const root = document.createElement('div');
    root.className = 'row-editor';
    container.innerHTML = '';
    container.appendChild(root);

    function findCard(id) {
        for (const row of ROW_ORDER) {
            const c = state.rows[row].find(x => x.id === id);
            if (c) return { card: c, row };
        }
        const p = state.pool.find(x => x.id === id);
        return p ? { card: p, row: 'pool' } : null;
    }

    function removeFrom(row, id) {
        if (row === 'pool') state.pool = state.pool.filter(c => c.id !== id);
        else state.rows[row] = state.rows[row].filter(c => c.id !== id);
    }

    function moveCard(id, toRow) {
        const found = findCard(id);
        if (!found) return;
        if (toRow !== 'pool' && state.rows[toRow].length >= ROW_LIMITS[toRow]) return;
        removeFrom(found.row, id);
        if (toRow === 'pool') state.pool.push(found.card);
        else state.rows[toRow].push(found.card);
        state.selectedId = null;
        render();
        state.onChange(getLayout());
    }

    function syncCards(cards) {
        const ids = new Set(cards.map(c => c.id));
        ROW_ORDER.forEach(row => {
            state.rows[row] = state.rows[row].filter(c => ids.has(c.id));
        });
        state.pool = state.pool.filter(c => ids.has(c.id));
        const placed = new Set([
            ...state.rows.front, ...state.rows.middle, ...state.rows.back
        ].map(c => c.id));
        cards.forEach(c => {
            if (!placed.has(c.id) && !state.pool.some(p => p.id === c.id)) {
                const inRow = ROW_ORDER.some(r => state.rows[r].some(x => x.id === c.id));
                if (!inRow) state.pool.push(c);
            }
        });
        render();
        state.onChange(getLayout());
    }

    function applyArrangement(front, middle, back) {
        state.rows.front = [...front];
        state.rows.middle = [...middle];
        state.rows.back = [...back];
        const placed = new Set([...front, ...middle, ...back].map(c => c.id));
        state.pool = state.pool.filter(c => !placed.has(c.id));
        render();
        state.onChange(getLayout());
    }

    function getLayout() {
        const allCards = [...state.rows.front, ...state.rows.middle, ...state.rows.back, ...state.pool];
        const eval_ = evaluateLayout(state.rows, allCards, state.variant);
        return { rows: { ...state.rows }, pool: [...state.pool], ...eval_ };
    }

    function setVariant(v) {
        state.variant = v;
        render();
        state.onChange(getLayout());
    }

    function handleCardClick(card) {
        if (state.selectedId === card.id) {
            state.selectedId = null;
            render();
            return;
        }
        if (state.selectedId) {
            const from = findCard(state.selectedId);
            const targetRow = findCard(card.id)?.row;
            if (from && targetRow && targetRow !== 'pool' && from.row !== targetRow) {
                moveCard(state.selectedId, targetRow);
                return;
            }
        }
        state.selectedId = card.id;
        render();
    }

    function renderRow(rowKey) {
        const wrap = document.createElement('div');
        wrap.className = `editor-row${rowKey === 'back' ? ' row-back' : ''}`;
        const head = document.createElement('div');
        head.className = 'editor-row-head';
        head.innerHTML = `<span class="editor-row-label">${ROW_LABELS_UI[rowKey]}</span><span class="editor-row-count">${state.rows[rowKey].length}/${ROW_LIMITS[rowKey]}</span>`;
        wrap.appendChild(head);

        const zone = document.createElement('div');
        zone.className = 'editor-dropzone';
        zone.dataset.row = rowKey;
        bindDropZone(zone, (id) => moveCard(id, rowKey));
        zone.addEventListener('click', () => {
            if (state.selectedId) {
                moveCard(state.selectedId, rowKey);
                hapticTap();
            }
        });

        state.rows[rowKey].forEach(card => {
            zone.appendChild(createMiniCardEl(card, {
                selected: state.selectedId === card.id,
                onClick: handleCardClick
            }));
        });
        const empty = ROW_LIMITS[rowKey] - state.rows[rowKey].length;
        for (let i = 0; i < empty; i++) {
            const slot = document.createElement('div');
            slot.className = 'editor-slot';
            slot.setAttribute('aria-hidden', 'true');
            zone.appendChild(slot);
        }
        wrap.appendChild(zone);
        return wrap;
    }

    function render() {
        const layout = getLayout();
        root.innerHTML = '';

        const status = document.createElement('div');
        status.className = 'editor-status' + (layout.complete ? (layout.valid ? ' is-valid' : ' is-foul') : '');
        let statusHtml = layout.message;
        if (layout.complete) {
            statusHtml = `${layout.message}<span class="editor-hands">Back: ${layout.backEval.name} · Middle: ${layout.midEval.name} · Front: ${layout.frontEval.name}</span>`;
            if (layout.royaltyTotal > 0) statusHtml += `<span class="editor-royalty">Royalties ${formatPayout(layout.royaltyTotal)}</span>`;
            if (layout.ace?.label) statusHtml += `<span class="editor-royalty">${layout.ace.label} ${formatPayout(layout.ace.payout)}</span>`;
        }
        status.innerHTML = statusHtml;
        root.appendChild(status);

        ROW_ORDER.forEach(rowKey => root.appendChild(renderRow(rowKey)));

        const poolWrap = document.createElement('div');
        poolWrap.className = 'editor-pool-wrap';
        poolWrap.innerHTML = '<div class="editor-row-head"><span class="editor-row-label">Pool</span><span class="editor-row-hint">Tap card → tap row · or drag</span></div>';
        const pool = document.createElement('div');
        pool.className = 'editor-dropzone editor-pool';
        pool.dataset.row = 'pool';
        bindDropZone(pool, (id) => moveCard(id, 'pool'));
        state.pool.forEach(card => {
            pool.appendChild(createMiniCardEl(card, {
                selected: state.selectedId === card.id,
                onClick: handleCardClick
            }));
        });
        poolWrap.appendChild(pool);
        root.appendChild(poolWrap);
    }

    render();

    return {
        syncCards,
        applyArrangement,
        setVariant,
        getLayout,
        moveCard
    };
}
