"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalBookName = exports.getTotalSafetyCoefFuncCreator = exports.getProbabilityPercentageExpression = exports.get_actual_databases_names = exports.multiply_array = exports.round_plus = exports.countResults = exports.get_game_total = exports.get_game_outcome = exports.get_opp_home_away_item = void 0;
const get_opp_home_away_item = (home_away_item) => {
    return home_away_item === 'home' ? 'away' : 'home';
};
exports.get_opp_home_away_item = get_opp_home_away_item;
const get_game_outcome = (game, bet_kind, handicap, home_away_item) => {
    if (game[`home_team_${bet_kind}`] === null || game[`away_team_${bet_kind}`] === null)
        return null;
    if (home_away_item === 'home') {
        let game_result = game[`home_team_${bet_kind}`] - game[`away_team_${bet_kind}`] + handicap;
        if (game_result > 0)
            return 1;
        else if (game_result < 0)
            return -1;
        else
            return 0;
    }
    else {
        let game_result = game[`away_team_${bet_kind}`] - game[`home_team_${bet_kind}`] + handicap;
        if (game_result > 0)
            return 1;
        else if (game_result < 0)
            return -1;
        else
            return 0;
    }
};
exports.get_game_outcome = get_game_outcome;
const get_game_total = (game, bet_kind, total) => {
    if (game[`home_team_${bet_kind}`] === null || game[`away_team_${bet_kind}`] === null)
        return null;
    let game_total = game[`home_team_${bet_kind}`] + game[`away_team_${bet_kind}`];
    if (game_total > total)
        return 1;
    else if (game_total == total)
        return 0;
    else
        return -1;
};
exports.get_game_total = get_game_total;
const countResults = (games, bet_kind, value, countingCallback, home_away_item) => {
    let positive_results = 0;
    let neutral_results = 0;
    let negative_results = 0;
    for (let game of games) {
        const game_result = countingCallback(game, bet_kind, value, home_away_item);
        if (game_result === null)
            continue;
        switch (game_result) {
            case 1:
                positive_results += 1;
                break;
            case 0:
                neutral_results += 1;
                break;
            case -1:
                negative_results += 1;
                break;
        }
    }
    return (0, exports.getProbabilityPercentageExpression)(positive_results, neutral_results, negative_results);
};
exports.countResults = countResults;
const round_plus = (x, n) => {
    const m = Math.pow(10, n);
    return Math.round(x * m) / m;
};
exports.round_plus = round_plus;
const multiply_array = (x, y) => {
    if (x.length !== y.length)
        throw new Error('Array lengths dont match');
    let result = 0;
    for (let i = 0; i < x.length; i++) {
        result += x[i] * y[i];
    }
    return result;
};
exports.multiply_array = multiply_array;
const get_actual_databases_names = (country_databases_list) => {
    const now_year = new Date().getFullYear();
    const next_year = now_year + 1;
    let now_year_db_names = [];
    let next_year_db_names = [];
    for (let database of country_databases_list) {
        if (database.includes(`${now_year}`))
            now_year_db_names.push(database);
        if (database.includes(`${next_year}`))
            next_year_db_names.push(database);
    }
    if (next_year_db_names.length)
        return next_year_db_names;
    return now_year_db_names;
};
exports.get_actual_databases_names = get_actual_databases_names;
const getProbabilityPercentageExpression = (positive_results, neutral_results, negative_results) => {
    if ((positive_results + neutral_results + negative_results) === 0)
        return null;
    const positive = (0, exports.round_plus)(positive_results / (positive_results + neutral_results + negative_results), 2);
    const neutral = (0, exports.round_plus)(neutral_results / (positive_results + neutral_results + negative_results), 2);
    const negative = (0, exports.round_plus)(negative_results / (positive_results + neutral_results + negative_results), 2);
    const result = { positive, neutral, negative };
    return result;
};
exports.getProbabilityPercentageExpression = getProbabilityPercentageExpression;
const getTotalSafetyCoefFuncCreator = (comparable, valueIfTrue, valueIfFalse) => (basic_total) => {
    return basic_total <= comparable ? valueIfTrue : valueIfFalse;
};
exports.getTotalSafetyCoefFuncCreator = getTotalSafetyCoefFuncCreator;
const translation_of_numbers = {
    '0': 'five',
    '1': 'five',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'five',
    '7': 'five',
    '8': 'five',
    '9': 'five',
    '.': 'and'
};
const translate_number = (number) => {
    const symbols = String(number).split('');
    let result = '';
    for (const symbol of symbols) {
        result += `_${translation_of_numbers[symbol]}`;
    }
    return result;
};
const getTotalBookName = (betKind, total) => {
    const totalOverBetName = `book_${betKind}_over${translate_number(total)}`;
    const totalUnderBetName = `book_${betKind}_under${translate_number(total)}`;
    return { totalOverBetName, totalUnderBetName };
};
exports.getTotalBookName = getTotalBookName;
//# sourceMappingURL=common_functions.js.map