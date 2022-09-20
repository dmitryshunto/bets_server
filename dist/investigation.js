"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.totalBetSuccessInvestigation = exports.totals_investigation = exports.individual_totals_investigation = exports.outcomes_investigation = void 0;
const classes_1 = require("./classes");
const config_1 = require("./config");
const mysql_1 = require("./mysql");
const fs_functions_1 = require("./fs_functions");
const common_functions_1 = require("./common_functions");
const condition_creator = (prediction, bottom, top, home_away_item, investigaion_type) => {
    if (prediction[investigaion_type][home_away_item] > bottom && prediction[investigaion_type][home_away_item] <= top)
        return true;
    return false;
};
const outcomes_investigation = (bet_kind, investigation_type, home_away_item, from, to) => __awaiter(void 0, void 0, void 0, function* () {
    const db_names = yield (0, mysql_1.get_databases_names)(config_1.country_names);
    const all_db_names = db_names['all'];
    let get_average_outcomes;
    const full_data = [];
    for (let min_games_num = 6; min_games_num < 11; min_games_num++) {
        const data = [];
        let standart_deviation = 0;
        let match_number = 0;
        for (let bottom = from; bottom < to; bottom = bottom + config_1.steps[investigation_type][bet_kind]) {
            let filtered_games = [];
            for (let db_name of all_db_names) {
                const championship = yield classes_1.Championhip.CreateAsync(db_name);
                if (!get_average_outcomes)
                    get_average_outcomes = championship.get_average_outcomes.bind(championship);
                for (let game of championship.completed_games) {
                    const prediction = championship.create_prediction(game, bet_kind, min_games_num);
                    if (prediction) {
                        const condition = condition_creator(prediction, bottom, bottom + config_1.steps[investigation_type][bet_kind], home_away_item, investigation_type);
                        if (condition) {
                            filtered_games.push(game);
                        }
                    }
                }
            }
            let key = home_away_item === 'home' ? 'positive' : 'negative';
            let fact = get_average_outcomes(bet_kind, filtered_games)[key];
            let item_standart_deviation = Math.abs(Math.pow(fact, 2) - Math.pow(bottom + config_1.steps[investigation_type][bet_kind] / 2, 2)) * filtered_games.length;
            let data_item = [bottom, bottom + config_1.steps[investigation_type][bet_kind], fact, filtered_games.length, item_standart_deviation];
            standart_deviation += item_standart_deviation;
            match_number += filtered_games.length ? filtered_games.length : 0;
            data.push(data_item);
        }
        full_data[min_games_num] = [...data, [null, null, null, null, standart_deviation / match_number]];
    }
    (0, fs_functions_1.create_xlsx)(bet_kind, `${config_1.weight_kefs.outcomes[bet_kind]}`, full_data, investigation_type, home_away_item);
});
exports.outcomes_investigation = outcomes_investigation;
const individual_totals_investigation = (bet_kind, investigation_type, home_away_item, from, to) => __awaiter(void 0, void 0, void 0, function* () {
    const db_names = yield (0, mysql_1.get_databases_names)(config_1.country_names);
    const all_db_names = db_names['all'];
    const full_data = [];
    let get_games_average_parameter;
    for (let min_games_num = 6; min_games_num < 11; min_games_num++) {
        const all_games = [];
        const all_predictions = [];
        let standart_deviation = 0;
        let match_number = 0;
        for (let db_name of all_db_names) {
            const championship = yield classes_1.Championhip.CreateAsync(db_name);
            if (!get_games_average_parameter)
                get_games_average_parameter = championship.get_games_average_parameter.bind(championship);
            for (let game of championship.completed_games) {
                const prediction = championship.create_prediction(game, bet_kind, min_games_num);
                if (prediction) {
                    all_games.push(game);
                    all_predictions.push(prediction);
                }
            }
        }
        const data = [];
        for (let bottom = from; bottom < to; bottom = bottom + config_1.steps[investigation_type][bet_kind]) {
            let filtered_games = [];
            for (let game_index = 0; game_index < all_games.length; game_index++) {
                const condition = condition_creator(all_predictions[game_index], bottom, bottom + config_1.steps[investigation_type][bet_kind], home_away_item, investigation_type);
                if (condition) {
                    filtered_games.push(all_games[game_index]);
                }
            }
            let fact = get_games_average_parameter(filtered_games, `${home_away_item}_team_${bet_kind}`);
            let item_standart_deviation = Math.abs(Math.pow(fact, 2) - Math.pow(bottom + config_1.steps[investigation_type][bet_kind] / 2, 2)) * filtered_games.length;
            let data_item = [bottom, bottom + config_1.steps[investigation_type][bet_kind], fact, filtered_games.length, item_standart_deviation];
            standart_deviation += item_standart_deviation;
            match_number += filtered_games.length ? filtered_games.length : 0;
            data.push(data_item);
        }
        full_data[min_games_num] = [...data, [null, null, null, null, standart_deviation / match_number]];
    }
    (0, fs_functions_1.create_xlsx)(bet_kind, `${config_1.weight_kefs[investigation_type][bet_kind]}`, full_data, investigation_type, home_away_item);
});
exports.individual_totals_investigation = individual_totals_investigation;
const totals_investigation = (bet_kind) => __awaiter(void 0, void 0, void 0, function* () {
    const { all_games, all_predictions } = yield getAllPredictions(bet_kind);
    let total_cef_step = config_1.steps['individual_totals'][bet_kind];
    const minOdd = 1.87;
    // bet type loop (TO, TU)
    for (let bet_type of config_1.total_bet_types) {
        const book_data = [];
        let [bottom_basic_total, top_basic_total] = config_1.totals_range[bet_kind];
        // basic total loop
        for (let basic_total = bottom_basic_total; basic_total <= top_basic_total; basic_total = basic_total + 0.5) {
            const { totalOverBetName, totalUnderBetName } = (0, common_functions_1.getTotalBookName)(bet_kind, basic_total);
            const sheet_data = [];
            // safety coef loop
            let [bottom_total_coef, top_total_coef] = config_1.totals_coefficient_range[bet_kind];
            for (let total_coefficient = bottom_total_coef; total_coefficient <= top_total_coef; total_coefficient = total_coefficient + total_cef_step) {
                let filtered_games = [];
                for (let game_index = 0; game_index < all_games.length; game_index++) {
                    let game = all_games[game_index];
                    let prediction = all_predictions[game_index];
                    const odds = {
                        'TO': game[totalOverBetName],
                        'TU': game[totalUnderBetName]
                    };
                    if (game[`home_team_${bet_kind}`] === null || game[`away_team_${bet_kind}`] === null || !prediction)
                        continue;
                    if (odds[bet_type] < minOdd)
                        continue;
                    const predictionTotal = prediction['total'];
                    let condition;
                    if (bet_type === "TO") {
                        condition = predictionTotal > (basic_total + total_coefficient) && predictionTotal <= (basic_total + total_coefficient + total_cef_step);
                    }
                    else {
                        condition = predictionTotal < (basic_total - total_coefficient) && predictionTotal >= (basic_total - total_coefficient - total_cef_step);
                    }
                    if (condition)
                        filtered_games.push(game);
                }
                const results = classes_1.Championhip.countResults(filtered_games, bet_kind, basic_total, common_functions_1.get_game_total);
                if (!results)
                    continue;
                const { positive, neutral, negative } = results;
                const row_data = [total_coefficient, total_coefficient + total_cef_step, positive, neutral, negative, filtered_games.length];
                sheet_data.push(row_data);
            }
            book_data[basic_total * 10] = sheet_data;
        }
        (0, fs_functions_1.create_xlsx)(bet_kind, bet_type, book_data, 'totals');
    }
});
exports.totals_investigation = totals_investigation;
const getAllPredictions = (bet_kind) => __awaiter(void 0, void 0, void 0, function* () {
    const db_names = yield (0, mysql_1.get_databases_names)(config_1.country_names);
    const all_db_names = db_names['all'];
    const all_games = [];
    const all_predictions = [];
    // const all_db_names = ['australia_a_league_2020_2021']
    for (let db_name of all_db_names) {
        const championship = yield classes_1.Championhip.CreateAsync(db_name);
        for (let game of championship.completed_games) {
            const prediction = championship.create_prediction(game, bet_kind);
            if (prediction) {
                all_games.push(game);
                all_predictions.push(prediction);
            }
        }
    }
    return { all_games, all_predictions };
});
const totalBetSuccessInvestigation = (bet_kind) => __awaiter(void 0, void 0, void 0, function* () {
    const { all_games, all_predictions } = yield getAllPredictions(bet_kind);
    const minOdd = 1.87;
    let [bottom_basic_total, top_basic_total] = config_1.totals_range[bet_kind];
    const bookData = [];
    for (let betType of config_1.total_bet_types) {
        const sheetData = [];
        for (let basic_total = bottom_basic_total; basic_total <= top_basic_total; basic_total = basic_total + 0.5) {
            const { totalOverBetName, totalUnderBetName } = (0, common_functions_1.getTotalBookName)(bet_kind, basic_total);
            let match_number = 0;
            let win_bet = 0;
            let balance = 0;
            const safety_coef = config_1.safety_coefs['totals'][betType][bet_kind](basic_total);
            for (let game_index = 0; game_index < all_games.length; game_index++) {
                let game = all_games[game_index];
                let prediction = all_predictions[game_index];
                const odds = {
                    'TO': game[totalOverBetName],
                    'TU': game[totalUnderBetName]
                };
                if (game[`home_team_${bet_kind}`] === null || game[`away_team_${bet_kind}`] === null || !prediction)
                    continue;
                if (odds[betType] < minOdd)
                    continue;
                const predictionTotal = prediction['total'];
                let condition;
                if (betType === "TO") {
                    condition = (predictionTotal - safety_coef) > basic_total;
                }
                else {
                    condition = (predictionTotal + safety_coef) < basic_total;
                }
                if (condition) {
                    match_number++;
                    let betResult = (0, common_functions_1.get_game_total)(game, bet_kind, basic_total);
                    if (betResult === 1) {
                        win_bet++;
                        balance += (odds[betType] - 1);
                    }
                    if (betResult === -1)
                        balance -= 1;
                }
            }
            sheetData.push([basic_total, balance, match_number, (0, common_functions_1.round_plus)(win_bet / match_number, 2)]);
        }
        bookData.push(sheetData);
    }
    (0, fs_functions_1.create_xlsx)(bet_kind, 'total_bets', bookData, 'totals');
});
exports.totalBetSuccessInvestigation = totalBetSuccessInvestigation;
//# sourceMappingURL=investigation.js.map