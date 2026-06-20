// --- Combinatorics ---
function combinations(arr, k) {
    const res = [];
    function helper(start, combo) {
        if (combo.length === k) { res.push(combo.slice()); return; }
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            helper(i + 1, combo);
            combo.pop();
        }
    }
    helper(0, []);
    return res;
}

// --- Poker helpers ---
function rankCounts(hand) {
    const counts = {};
    hand.forEach(c => { counts[c.r] = (counts[c.r] || 0) + 1; });
    return counts;
}

function isFlush(hand) {
    if (!hand.length) return false;
    const s = hand[0].s;
    return hand.every(c => c.s === s);
}

function straightHigh(hand) {
    const vals = [...new Set(hand.map(c => c.r))].sort((a, b) => a - b);
    if (vals.length !== hand.length) return null;
    const max = Math.max(...vals), min = Math.min(...vals);
    if (max - min === hand.length - 1) return max;
    if (vals.includes(14)) {
        const low = vals.map(v => v === 14 ? 1 : v).sort((a, b) => a - b);
        const mx = Math.max(...low), mn = Math.min(...low);
        if (low.length === hand.length && mx - mn === hand.length - 1) return 5;
    }
    return null;
}

function isStraight(hand) { return straightHigh(hand) !== null; }
function isStraightFlush(hand) { return isFlush(hand) && isStraight(hand); }
function isFourOfAKind(hand) { return Object.values(rankCounts(hand)).includes(4); }
function isFullHouse(hand) {
    const v = Object.values(rankCounts(hand));
    return v.includes(3) && v.includes(2);
}
function isThreeOfAKind(hand) { return Object.values(rankCounts(hand)).includes(3); }

function sortedRanksDesc(hand) {
    return hand.map(c => c.r).sort((a, b) => b - a);
}

function evalFront(cards) {
    const counts = rankCounts(cards);
    const entries = Object.entries(counts).map(([r, n]) => [+r, n]).sort((a, b) => b[0] - a[0]);
    if (entries.some(([, n]) => n === 3)) {
        const trip = entries.find(([, n]) => n === 3)[0];
        return { cat: 2, name: 'Three of a Kind', kickers: [trip] };
    }
    if (entries.some(([, n]) => n === 2)) {
        const pair = entries.find(([, n]) => n === 2)[0];
        const kicker = entries.find(([, n]) => n === 1)[0];
        return { cat: 1, name: 'Pair', kickers: [pair, kicker] };
    }
    const ks = sortedRanksDesc(cards);
    return { cat: 0, name: 'High Card', kickers: ks };
}

function evalFive(cards) {
    const counts = rankCounts(cards);
    const byCount = Object.entries(counts).map(([r, n]) => ({ r: +r, n })).sort((a, b) => b.n - a.n || b.r - a.r);
    const ranks = sortedRanksDesc(cards);
    const flush = isFlush(cards);
    const sh = straightHigh(cards);
    const sf = flush && sh !== null;

    if (sf) return { cat: 8, name: 'Straight Flush', kickers: [sh] };
    if (byCount[0].n === 4) {
        const quad = byCount[0].r, kicker = byCount[1].r;
        return { cat: 7, name: 'Four of a Kind', kickers: [quad, kicker] };
    }
    if (byCount[0].n === 3 && byCount[1].n === 2) {
        return { cat: 6, name: 'Full House', kickers: [byCount[0].r, byCount[1].r] };
    }
    if (flush) return { cat: 5, name: 'Flush', kickers: ranks };
    if (sh !== null) return { cat: 4, name: 'Straight', kickers: [sh] };
    if (byCount[0].n === 3) {
        const trip = byCount[0].r;
        const kickers = ranks.filter(r => r !== trip);
        return { cat: 3, name: 'Three of a Kind', kickers: [trip, ...kickers] };
    }
    if (byCount[0].n === 2 && byCount[1].n === 2) {
        const hi = Math.max(byCount[0].r, byCount[1].r), lo = Math.min(byCount[0].r, byCount[1].r);
        const k = byCount.find(x => x.n === 1).r;
        return { cat: 2, name: 'Two Pair', kickers: [hi, lo, k] };
    }
    if (byCount[0].n === 2) {
        const pair = byCount[0].r;
        const kickers = ranks.filter(r => r !== pair);
        return { cat: 1, name: 'Pair', kickers: [pair, ...kickers] };
    }
    return { cat: 0, name: 'High Card', kickers: ranks };
}

function compareEval(a, b) {
    if (a.cat !== b.cat) return a.cat - b.cat;
    const len = Math.max(a.kickers.length, b.kickers.length);
    for (let i = 0; i < len; i++) {
        const av = a.kickers[i] || 0, bv = b.kickers[i] || 0;
        if (av !== bv) return av - bv;
    }
    return 0;
}

/** 5-card vs 5-card: positive if handA wins */
function beatsFive(handA, handB) {
    return compareEval(evalFive(handA), evalFive(handB)) > 0;
}

/**
 * Chinese poker foul rule: middle must beat front.
 * Cross-size comparison — e.g. front pair needs middle pair+ with higher kickers,
 * front trips only allows middle three-of-a-kind+ (not pair or two pair).
 */
function beatsFront(middle, front) {
    const m = evalFive(middle);
    const f = evalFront(front);

    if (f.cat === 2) {
        if (m.cat < 3) return false;
        return compareEval(m, f) > 0;
    }
    if (f.cat === 1) {
        if (m.cat === 0) return false;
        if (m.cat > 1) return true;
        return compareEval(m, { cat: 1, kickers: f.kickers }) > 0;
    }
    if (m.cat >= 1) return true;
    return compareEval(m, f) > 0;
}

function isValidArrangement(front, middle, back) {
    return beatsFive(back, middle) && beatsFront(middle, front);
}

function encodeEval(e) {
    let kickers = 0;
    for (const k of e.kickers) kickers = kickers * 100 + k;
    return e.cat * 1e10 + kickers;
}

function handStrengthScore(front, middle, back) {
    return encodeEval(evalFive(back)) * 1e12
        + encodeEval(evalFive(middle)) * 1e6
        + encodeEval(evalFront(front));
}

// --- Royalties ---
function getRowRoyalty(hand, row, variant) {
    const cfg = config[variant].royalties_bonuses;
    let key = null, payout = 0;
    if (row === 'front') {
        if (isThreeOfAKind(hand)) { key = 'three_of_a_kind'; payout = cfg.front_3_cards.three_of_a_kind; }
    } else if (row === 'middle') {
        if (isStraightFlush(hand)) { key = 'straight_flush'; payout = cfg.middle_5_cards.straight_flush; }
        else if (isFourOfAKind(hand)) { key = 'four_of_a_kind'; payout = cfg.middle_5_cards.four_of_a_kind; }
        else if (isFullHouse(hand)) { key = 'full_house'; payout = cfg.middle_5_cards.full_house; }
    } else if (row === 'back') {
        if (isStraightFlush(hand)) { key = 'straight_flush'; payout = cfg.back_5_cards.straight_flush; }
        else if (isFourOfAKind(hand)) { key = 'four_of_a_kind'; payout = cfg.back_5_cards.four_of_a_kind; }
    }
    return { key, payout, label: key ? ROYALTY_LABELS[key] : null };
}

function getArrangementRoyalties(front, middle, back, variant) {
    const f = getRowRoyalty(front, 'front', variant);
    const m = getRowRoyalty(middle, 'middle', variant);
    const b = getRowRoyalty(back, 'back', variant);
    return { front: f, middle: m, back: b, total: f.payout + m.payout + b.payout };
}

function detectPossibleRoyalties(cards, variant) {
    const idx = [...Array(13).keys()];
    const possible = new Set();
    combinations(idx, 3).forEach(fIdx => {
        const front = fIdx.map(i => cards[i]);
        const rem = idx.filter(i => !fIdx.includes(i));
        combinations(rem, 5).forEach(mIdx => {
            const middle = mIdx.map(i => cards[i]);
            const bIdx = rem.filter(i => !mIdx.includes(i));
            const back = bIdx.map(i => cards[i]);
            if (!isValidArrangement(front, middle, back)) return;
            if (isThreeOfAKind(front)) possible.add('front:three_of_a_kind');
            const mr = getRowRoyalty(middle, 'middle', variant);
            const br = getRowRoyalty(back, 'back', variant);
            if (mr.key) possible.add(`middle:${mr.key}`);
            if (br.key) possible.add(`back:${br.key}`);
        });
    });
    return [...possible];
}

// --- Naturals ---
function detectThreeOfType(cards, predicate, sizes) {
    const idx = [...Array(cards.length).keys()];
    for (const c1 of combinations(idx, sizes[0])) {
        const hand1 = c1.map(i => cards[i]);
        if (!predicate(hand1)) continue;
        const rem1 = idx.filter(i => !c1.includes(i));
        for (const c2 of combinations(rem1, sizes[1])) {
            const hand2 = c2.map(i => cards[i]);
            if (!predicate(hand2)) continue;
            const rem2 = rem1.filter(i => !c2.includes(i));
            const hand3 = rem2.map(i => cards[i]);
            if (hand3.length === sizes[2] && predicate(hand3)) return true;
        }
    }
    return false;
}

function isRedSuit(s) { return s === 'h' || s === 'd'; }

function isAllSameColor(cards) {
    return cards.every(c => isRedSuit(c.s)) || cards.every(c => !isRedSuit(c.s));
}

function detectNaturals(cards, variant) {
    const found = [];
    const counts = rankCounts(cards);
    const rankVals = Object.keys(counts).map(Number);
    const uniqueRanks = rankVals.length;
    const suitVals = {};
    cards.forEach(c => { suitVals[c.s] = (suitVals[c.s] || 0) + 1; });
    const pairs = Object.values(counts).filter(n => n === 2).length;
    const trips = Object.values(counts).filter(n => n === 3).length;
    const natCfg = config[variant].naturals_automatic_wins;

    if (variant === 'traditional_chinese_poker') {
        if (uniqueRanks === 13 && Object.keys(suitVals).length === 1) found.push({ key: 'clean_dragon', payout: natCfg.clean_dragon });
        else if (uniqueRanks === 13) found.push({ key: 'dragon', payout: natCfg.dragon });
        if (isAllSameColor(cards)) found.push({ key: 'all_colors', payout: natCfg.all_colors });
    } else {
        if (uniqueRanks === 13 && Object.keys(suitVals).length === 1) {
            found.push({ key: 'dragon_same_suit', payout: natCfg.dragon_same_suit });
        } else if (uniqueRanks === 13) {
            found.push({ key: 'dragon_mixed_suit', payout: natCfg.dragon_mixed_suit });
        }
        if (pairs === 5 && trips === 1) found.push({ key: 'five_pairs_one_trips', payout: natCfg.five_pairs_one_trips });
    }

    if (pairs === 6) found.push({ key: 'six_pairs', payout: natCfg.six_pairs });
    if (detectThreeOfType(cards, isFlush, [3, 5, 5])) found.push({ key: 'three_flushes', payout: natCfg.three_flushes });
    if (detectThreeOfType(cards, isStraight, [3, 5, 5])) found.push({ key: 'three_straights', payout: natCfg.three_straights });

    return found;
}

function getAcePayout(front, cards, variant) {
    if (variant !== 'vietnamese_mau_binh') return { key: null, payout: 0, label: null };
    const aceCount = cards.filter(c => c.r === 14).length;
    const frontAces = front.filter(c => c.r === 14).length;
    const ap = config.vietnamese_mau_binh.ace_payouts;
    if (aceCount === 0) return { key: 'no_aces_penalty', payout: ap.no_aces_penalty, label: 'No Aces' };
    if (aceCount === 4) return { key: 'four_aces', payout: ap.four_aces, label: 'Four Aces' };
    if (aceCount === 3 && frontAces === 3) return { key: 'three_aces_front_hand', payout: ap.three_aces_front_hand, label: 'Three Aces (Front)' };
    if (aceCount === 3) return { key: 'three_aces', payout: ap.three_aces, label: 'Three Aces' };
    if (aceCount === 2) return { key: 'two_aces', payout: ap.two_aces, label: 'Two Aces' };
    return { key: null, payout: 0, label: null };
}

// --- Solver ---
function solveHands(cards, variant) {
    const idx = [...Array(13).keys()];
    const valid = [];

    for (const fIdx of combinations(idx, 3)) {
        const front = fIdx.map(i => cards[i]);
        const rem1 = idx.filter(i => !fIdx.includes(i));
        for (const mIdx of combinations(rem1, 5)) {
            const middle = mIdx.map(i => cards[i]);
            const bIdx = rem1.filter(i => !mIdx.includes(i));
            const back = bIdx.map(i => cards[i]);
            if (!isValidArrangement(front, middle, back)) continue;

            const frontEval = evalFront(front);
            const midEval = evalFive(middle);
            const backEval = evalFive(back);
            const royalties = getArrangementRoyalties(front, middle, back, variant);
            const ace = getAcePayout(front, cards, variant);
            const royaltyTotal = royalties.total;
            const totalPayout = royaltyTotal + ace.payout;
            const strength = handStrengthScore(front, middle, back);
            const arrangementScore = strength + ace.payout * 1e7;

            valid.push({
                front, middle, back,
                frontEval, midEval, backEval,
                royalties, ace,
                royaltyTotal, totalPayout, strength, arrangementScore,
                hasRoyalties: royaltyTotal > 0
            });
        }
    }

    valid.sort((a, b) => {
        if (b.royaltyTotal !== a.royaltyTotal) return b.royaltyTotal - a.royaltyTotal;
        return b.arrangementScore - a.arrangementScore;
    });

    const naturals = detectNaturals(cards, variant);
    const possibleRoyalties = detectPossibleRoyalties(cards, variant);
    const hasRoyaltyPotential = possibleRoyalties.length > 0;

    return {
        arrangements: valid.slice(0, 8),
        naturals,
        possibleRoyalties,
        hasRoyaltyPotential,
        totalValid: valid.length
    };
}

window.solveHands = solveHands;
