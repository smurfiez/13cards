function exportRow(cards, eval_, royalty) {
    const row = { cards: cards.map(c => c.id), hand: eval_.name };
    if (royalty && royalty.key) row.royalty = { type: royalty.key, payout: royalty.payout };
    return row;
}

function buildTestCase(cards, variant, solveResult) {
    const testCase = {
        variant,
        cards: cards.map(c => c.id)
    };
    const top = solveResult && solveResult.arrangements && solveResult.arrangements[0];
    if (top) {
        testCase.expected_setup = {
            front: exportRow(top.front, top.frontEval, top.royalties.front),
            middle: exportRow(top.middle, top.midEval, top.royalties.middle),
            back: exportRow(top.back, top.backEval, top.royalties.back),
            royalty_total: top.royaltyTotal,
            total_payout: top.totalPayout
        };
        if (top.ace && top.ace.key) {
            testCase.expected_setup.ace_bonus = {
                type: top.ace.key,
                payout: top.ace.payout,
                label: top.ace.label
            };
        }
    }
    if (solveResult && solveResult.naturals && solveResult.naturals.length) {
        testCase.naturals = solveResult.naturals.map(n => ({ type: n.key, payout: n.payout }));
    }
    return testCase;
}

function testCaseToJson(testCase) {
    return JSON.stringify(testCase, null, 2);
}

function parseTestCase(raw) {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || !Array.isArray(data.cards) || data.cards.length !== 13) {
        throw new Error('JSON must include a "cards" array with exactly 13 card ids.');
    }
    const deckIds = new Set(buildFullDeck().map(c => c.id));
    const seen = new Set();
    const cards = [];
    for (const id of data.cards) {
        if (typeof id !== 'string' || !deckIds.has(id) || seen.has(id)) {
            throw new Error(`Invalid or duplicate card id: ${id}`);
        }
        seen.add(id);
        const suitId = id.slice(-1);
        const rank = id.slice(0, -1);
        const suit = SUITS.find(s => s.id === suitId);
        if (!suit || !RANKS.includes(rank)) throw new Error(`Invalid card id: ${id}`);
        cards.push(buildCard(rank, suit));
    }
    const variant = data.variant || 'traditional_chinese_poker';
    if (!config[variant]) throw new Error(`Unknown variant: ${variant}`);
    return { variant, cards, expected_setup: data.expected_setup || null };
}

function compareSetupToExpected(actualArr, expectedSetup) {
    if (!expectedSetup || !actualArr) return null;
    const rows = ['front', 'middle', 'back'];
    const mismatches = [];
    rows.forEach(row => {
        const exp = expectedSetup[row];
        if (!exp || !exp.cards) return;
        const expSet = new Set(exp.cards);
        const actIds = actualArr[row].map(c => c.id);
        const actSet = new Set(actIds);
        if (expSet.size !== actSet.size || [...expSet].some(id => !actSet.has(id))) {
            mismatches.push(row);
        }
    });
    return mismatches.length ? mismatches : null;
}
