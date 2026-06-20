function compareFrontRow(handA, handB) {
    return compareEval(evalFront(handA), evalFront(handB));
}

function compareMiddleRow(handA, handB) {
    return compareEval(evalFive(handA), evalFive(handB));
}

function compareBackRow(handA, handB) {
    return compareEval(evalFive(handA), evalFive(handB));
}

function isPlayerFouled(setup) {
    return !isValidArrangement(setup.front, setup.middle, setup.back);
}

function rowRoyaltyPayout(hand, row, variant) {
    return getRowRoyalty(hand, row, variant).payout;
}

/**
 * Score one pairing (1-6 method base + row royalties when row is won).
 * Returns { a, b, breakdown } where scores are points for player A vs B.
 */
function scorePairing(playerA, playerB, variant) {
    const setupA = playerA.setup;
    const setupB = playerB.setup;
    const foulA = isPlayerFouled(setupA);
    const foulB = isPlayerFouled(setupB);
    const breakdown = { rows: [], foulA, foulB, bonuses: { a: 0, b: 0 }, royalties: { a: 0, b: 0 }, naturals: { a: 0, b: 0 }, aces: { a: 0, b: 0 } };
    let scoreA = 0, scoreB = 0;

    if (foulA && foulB) {
        return { netA: 0, netB: 0, grossA: 0, grossB: 0, breakdown: { ...breakdown, note: 'Both fouled — no points' } };
    }
    if (foulA) {
        return { netA: -6, netB: 6, grossA: 0, grossB: 6, breakdown: { ...breakdown, note: `${playerA.name} fouled — ${playerB.name} wins scoop (6)` } };
    }
    if (foulB) {
        return { netA: 6, netB: -6, grossA: 6, grossB: 0, breakdown: { ...breakdown, note: `${playerB.name} fouled — ${playerA.name} wins scoop (6)` } };
    }

    const rowDefs = [
        { key: 'front', label: 'Front', cmp: compareFrontRow },
        { key: 'middle', label: 'Middle', cmp: compareMiddleRow },
        { key: 'back', label: 'Back', cmp: compareBackRow }
    ];

    let winsA = 0, winsB = 0;

    rowDefs.forEach(({ key, label, cmp }) => {
        const cmpVal = cmp(setupA[key], setupB[key]);
        let rowA = 0, rowB = 0, winner = 'tie';
        if (cmpVal > 0) {
            winsA++;
            rowA = 1;
            rowA += rowRoyaltyPayout(setupA[key], key, variant);
            winner = 'a';
        } else if (cmpVal < 0) {
            winsB++;
            rowB = 1;
            rowB += rowRoyaltyPayout(setupB[key], key, variant);
            winner = 'b';
        }
        scoreA += rowA;
        scoreB += rowB;
        breakdown.rows.push({
            label,
            winner,
            a: rowA,
            b: rowB,
            handA: key === 'front' ? evalFront(setupA[key]).name : evalFive(setupA[key]).name,
            handB: key === 'front' ? evalFront(setupB[key]).name : evalFive(setupB[key]).name
        });
        breakdown.royalties.a += rowA > 1 ? rowA - 1 : 0;
        breakdown.royalties.b += rowB > 1 ? rowB - 1 : 0;
    });

    if (winsA === 2) { scoreA += 1; breakdown.bonuses.a += 1; }
    if (winsB === 2) { scoreB += 1; breakdown.bonuses.b += 1; }
    if (winsA === 3) { scoreA += 3; breakdown.bonuses.a += 3; }
    if (winsB === 3) { scoreB += 3; breakdown.bonuses.b += 3; }

    const naturalsA = detectNaturals(playerA.cards, variant);
    const naturalsB = detectNaturals(playerB.cards, variant);
    const royaltyPotentialA = detectPossibleRoyalties(playerA.cards, variant).length > 0;
    const royaltyPotentialB = detectPossibleRoyalties(playerB.cards, variant).length > 0;

    if (naturalsA.length && !royaltyPotentialA) {
        const nat = naturalsA.reduce((s, n) => s + n.payout, 0);
        scoreA += nat;
        breakdown.naturals.a = nat;
    }
    if (naturalsB.length && !royaltyPotentialB) {
        const nat = naturalsB.reduce((s, n) => s + n.payout, 0);
        scoreB += nat;
        breakdown.naturals.b = nat;
    }

    if (variant === 'vietnamese_mau_binh') {
        const aceA = getAcePayout(setupA.front, playerA.cards, variant).payout;
        const aceB = getAcePayout(setupB.front, playerB.cards, variant).payout;
        scoreA += aceA;
        scoreB += aceB;
        breakdown.aces.a = aceA;
        breakdown.aces.b = aceB;
    }

    return { netA: scoreA - scoreB, netB: scoreB - scoreA, grossA: scoreA, grossB: scoreB, breakdown };
}

function scoreHeadToHead(players, variant) {
    const n = players.length;
    const totals = players.map(() => 0);
    const matrix = Array.from({ length: n }, () => Array(n).fill(null));

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const result = scorePairing(players[i], players[j], variant);
            totals[i] += result.netA;
            totals[j] += result.netB;
            matrix[i][j] = result;
            matrix[j][i] = {
                netA: result.netB,
                netB: result.netA,
                grossA: result.grossB,
                grossB: result.grossA,
                breakdown: result.breakdown
            };
        }
    }

    return { totals, matrix, players };
}

function autoSetupFromCards(cards, variant) {
    const result = solveHands(cards, variant);
    const top = result.arrangements[0];
    if (!top) throw new Error('No valid arrangement for these cards.');
    return {
        front: top.front,
        middle: top.middle,
        back: top.back,
        solverMeta: top
    };
}
