const config = {
    traditional_chinese_poker: {
        royalties_bonuses: {
            front_3_cards: { three_of_a_kind: 3 },
            middle_5_cards: { full_house: 2, four_of_a_kind: 8, straight_flush: 10 },
            back_5_cards: { four_of_a_kind: 4, straight_flush: 5 }
        },
        naturals_automatic_wins: {
            dragon: 13, clean_dragon: 39, all_colors: 10,
            six_pairs: 3, three_flushes: 3, three_straights: 3
        }
    },
    vietnamese_mau_binh: {
        royalties_bonuses: {
            front_3_cards: { three_of_a_kind: 3 },
            middle_5_cards: { full_house: 2, four_of_a_kind: 8, straight_flush: 10 },
            back_5_cards: { four_of_a_kind: 4, straight_flush: 5 }
        },
        ace_payouts: {
            no_aces_penalty: -4, two_aces: 4, three_aces: 8,
            three_aces_front_hand: 12, four_aces: 16
        },
        naturals_automatic_wins: {
            dragon_same_suit: 24, dragon_mixed_suit: 12, five_pairs_one_trips: 6,
            six_pairs: 3, three_flushes: 3, three_straights: 3
        }
    }
};

const NATURAL_LABELS = {
    dragon: 'Dragon',
    clean_dragon: 'Clean Dragon',
    all_colors: 'All Red or All Black',
    six_pairs: 'Six Pairs',
    three_flushes: 'Three Flushes',
    three_straights: 'Three Straights',
    dragon_same_suit: 'Dragon (Same Suit)',
    dragon_mixed_suit: 'Dragon (Mixed Suit)',
    five_pairs_one_trips: 'Five Pairs + One Trips'
};

const ROYALTY_LABELS = {
    three_of_a_kind: 'Three of a Kind',
    full_house: 'Full House',
    four_of_a_kind: 'Four of a Kind',
    straight_flush: 'Straight Flush'
};

const ACE_LABELS = {
    no_aces_penalty: 'No Aces',
    two_aces: 'Two Aces',
    three_aces: 'Three Aces',
    three_aces_front_hand: 'Three Aces in Front',
    four_aces: 'Four Aces'
};

const ROW_LABELS = {
    front_3_cards: 'Front (3 cards)',
    middle_5_cards: 'Middle (5 cards)',
    back_5_cards: 'Back (5 cards)'
};
