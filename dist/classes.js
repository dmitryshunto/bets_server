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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prediction = exports.Championhip = void 0;
const mysql_1 = require("./mysql");
const config_1 = require("./config");
const common_functions_1 = require("./common_functions");
class Championhip {
    constructor(db_name, games) {
        this.db_name = db_name;
        this.games = games;
        this.completed_games = games.filter((game) => game[`home_team_goals`] !== null);
    }
    get_completed_games(bet_kind) {
        const param = bet_kind ? bet_kind : 'goals';
        return this.games.filter((game) => game[`home_team_${param}`] !== null);
    }
    get_games_filtered_by_callback(cb, games) {
        const result = [];
        if (!games)
            games = this.games;
        for (let game of games) {
            if (cb(game))
                result.push(game);
        }
        return result;
    }
    get_games_average_parameter(games, parameter) {
        let number = 0;
        let sum = games.reduce((prev, current) => {
            if (current[parameter] !== null) {
                number++;
                return prev + current[parameter];
            }
            return prev;
        }, 0);
        if (number)
            return sum / number;
        return 0;
    }
    get_average_total(bet_kind) {
        return this.completed_games.reduce((prev, current) => {
            const parameter = current[`home_team_${bet_kind}`] + current[`away_team_${bet_kind}`];
            return prev + parameter;
        }, 0) / this.completed_games.length;
    }
    get_team_games(team_id, home_away_item, last_games_number, last_match_date) {
        let team_games = this.completed_games.filter((game) => {
            if (game[`${home_away_item}_team_id`] === team_id) {
                if (last_match_date && game['date_of_match'] < last_match_date) {
                    return game;
                }
                if (!last_match_date)
                    return game;
            }
        });
        if (last_games_number) {
            let copied_team_games = [...team_games];
            copied_team_games.sort((a, b) => Number(b.date_of_match) - Number(a.date_of_match));
            let result = [];
            for (let game_index = 0; game_index < last_games_number; game_index++) {
                result.push(copied_team_games[game_index]);
            }
            team_games = result;
        }
        return team_games;
    }
    is_game_ready_to_prediction(game, min_games_num = 6) {
        const home_team_games = this.get_team_games(game['home_team_id'], 'home', undefined, game['date_of_match']);
        const away_team_games = this.get_team_games(game['away_team_id'], 'away', undefined, game['date_of_match']);
        if (home_team_games.length < min_games_num || away_team_games.length < min_games_num)
            return false;
        if (!game['home_team_id'] || !game['away_team_id'])
            return false;
        return true;
    }
    countResults(games, bet_kind, value, countingCallback, home_away_item) {
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
        return (0, common_functions_1.getProbabilityPercentageExpression)(positive_results, neutral_results, negative_results);
    }
    get_total_probability(games, bet_kind, total) {
        let positive_results = 0;
        let neutral_results = 0;
        let negative_results = 0;
        for (let game of games) {
            let game_total = game[`home_team_${bet_kind}`] + game[`away_team_${bet_kind}`];
            if (game_total > total)
                positive_results++;
            else if (game_total == total)
                neutral_results++;
            else
                negative_results++;
        }
        return (0, common_functions_1.getProbabilityPercentageExpression)(positive_results, neutral_results, negative_results);
    }
    get_average_outcomes(bet_kind, games) {
        if (!games)
            games = this.completed_games;
        const home_team_results = this.countResults(games, bet_kind, -.5, common_functions_1.get_game_outcome, 'home');
        const away_team_results = this.countResults(games, bet_kind, -.5, common_functions_1.get_game_outcome, (0, common_functions_1.get_opp_home_away_item)('home'));
        if (!home_team_results || !away_team_results)
            return null;
        const positive = home_team_results['positive'];
        const negative = away_team_results['positive'];
        const neutral = 1 - positive - negative;
        const team_outcome_probability = { positive, neutral, negative };
        return team_outcome_probability;
    }
    get_team_statistic_for_prediction(home_away_item, bet_kind, game) {
        let result = {};
        for (let last_games_number of config_1.last_games_numbers) {
            for (let scored_missed of config_1.scored_missed_items) {
                let necessary_home_away_item;
                if (home_away_item === 'home') {
                    if (scored_missed === 'scored')
                        necessary_home_away_item = 'home';
                    else
                        necessary_home_away_item = 'away';
                }
                else {
                    if (scored_missed === 'scored')
                        necessary_home_away_item = 'away';
                    else
                        necessary_home_away_item = 'home';
                }
                let parameter = `${necessary_home_away_item}_team_${bet_kind}`;
                let key = last_games_number ? `current_${scored_missed}` : scored_missed;
                const team_games = this.get_team_games(game[`${home_away_item}_team_id`], home_away_item, last_games_number, game['date_of_match']);
                result[key] = this.get_games_average_parameter(team_games, parameter);
            }
        }
        const individual_totals = new IndividualTotals(result['scored'], result['missed'], result['current_scored'], result['current_missed']);
        const team_games = this.get_team_games(game[`${home_away_item}_team_id`], home_away_item, null, game['date_of_match']);
        const team_outcome_probability = this.get_average_outcomes(bet_kind, team_games);
        return new TeamStatistic(individual_totals, team_outcome_probability);
    }
    create_prediction(game, bet_kind, min_games_num = 6) {
        const is_game_ready_to_prediction = this.is_game_ready_to_prediction(game, min_games_num);
        if (is_game_ready_to_prediction) {
            // temporary variablues for map data for type
            let scored = {};
            let teams = {};
            for (let home_away_item of config_1.HomeAwayItems) {
                scored[home_away_item] = this.get_games_average_parameter(this.completed_games, `${home_away_item}_team_${bet_kind}`);
                teams[home_away_item] = this.get_team_statistic_for_prediction(home_away_item, bet_kind, game);
            }
            const league_average_scored = new HomeAwayDataObj(scored['home'], scored['away']);
            const teams_statistic = new HomeAwayDataObj(teams['home'], teams['away']);
            const game_statistic = new GameStatistic(teams_statistic, league_average_scored);
            const prediction = {};
            for (const home_away_item of config_1.HomeAwayItems) {
                const opponent_home_away_item = (0, common_functions_1.get_opp_home_away_item)(home_away_item);
                //counting expected individual totals
                let individual_totals = game_statistic.teams_statistic[home_away_item].individual_totals;
                let opp_individual_totals = game_statistic.teams_statistic[opponent_home_away_item].individual_totals;
                const individual_total_items = [
                    (individual_totals['scored'] + opp_individual_totals['missed']) / 2,
                    individual_totals['scored'] * opp_individual_totals['missed'] / game_statistic.league_average_scored[opponent_home_away_item],
                    (individual_totals['current_scored'] + opp_individual_totals['current_missed']) / 2
                ];
                prediction[`${home_away_item}_team`] = (0, common_functions_1.multiply_array)(individual_total_items, config_1.weight_kefs.individual_totals[bet_kind]);
                //counting outcomes in percentage
                let outcomes = game_statistic.teams_statistic[home_away_item].outcomes;
                let opp_outcomes = game_statistic.teams_statistic[opponent_home_away_item].outcomes;
                let key = home_away_item === 'home' ? 'positive' : 'negative';
                prediction[`${home_away_item}_win`] = null;
                if (outcomes && opp_outcomes) {
                    prediction[`${home_away_item}_win`] = (outcomes[key] + opp_outcomes[key]) / 2;
                }
            }
            return new Prediction(prediction['home_team'], prediction['away_team'], prediction['home_win'], prediction['away_win']);
        }
        return null;
    }
    static countResults(games, bet_kind, value, countingCallback, home_away_item) {
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
        return (0, common_functions_1.getProbabilityPercentageExpression)(positive_results, neutral_results, negative_results);
    }
}
exports.Championhip = Championhip;
_a = Championhip;
Championhip.CreateAsync = (db_name) => __awaiter(void 0, void 0, void 0, function* () {
    const games = yield (0, mysql_1.get_all_games)(db_name);
    return new Championhip(db_name, games);
});
class Prediction {
    constructor(home_team_total, away_team_total, home_win, away_win) {
        this.individual_totals = new HomeAwayDataObj(home_team_total, away_team_total);
        this.outcomes = new HomeAwayDataObj(home_win, away_win);
        this.draw = 1 - home_win - away_win;
        this.result = home_team_total - away_team_total;
        this.total = home_team_total + away_team_total;
    }
}
exports.Prediction = Prediction;
class IndividualTotals {
    constructor(scored, missed, current_scored, current_missed) {
        this.scored = scored;
        this.missed = missed;
        this.current_scored = current_scored;
        this.current_missed = current_missed;
    }
}
class TeamStatistic {
    constructor(individual_totals, team_outcome_probability) {
        this.individual_totals = individual_totals;
        this.outcomes = team_outcome_probability;
    }
}
class GameStatistic {
    constructor(teams_statistic, league_average_scored) {
        this.teams_statistic = teams_statistic;
        this.league_average_scored = league_average_scored;
    }
}
class HomeAwayDataObj {
    constructor(home, away) {
        this.home = home;
        this.away = away;
    }
}
//# sourceMappingURL=classes.js.map