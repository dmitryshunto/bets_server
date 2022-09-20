"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.total_bet_types = exports.safety_coefs = exports.weight_kefs = exports.totals_coefficient_range = exports.totals_range = exports.individual_totals_range = exports.steps = exports.country_names = exports.handicapRow = exports.scored_missed_items = exports.last_games_numbers = exports.HomeAwayItems = exports.BetKinds = exports.port = exports.host = exports.password = exports.user = void 0;
const common_functions_1 = require("./common_functions");
exports.user = 'dmitry';
exports.password = 'dmitry';
exports.host = 'localhost';
exports.port = 3306;
exports.BetKinds = ['goals', 'corners', 'yellow_cards', 'fouls', 'shots_on_goal'];
exports.HomeAwayItems = ['home', 'away'];
exports.last_games_numbers = [null, 3];
exports.scored_missed_items = ['scored', 'missed'];
exports.handicapRow = [-0.5, 0.5];
exports.country_names = ['austria', 'denmark', 'greece', 'australia', 'south_korea', 'colombia', 'egypt', 'ecuador', 'usa', 'uruguay', 'finland',
    'mexico', 'morocco', 'paraguay', 'russia', 'portugal', 'scotland', 'spain', 'belgium', 'poland', 'turkey', 'switzerland', 'ukraine',
    'chile', 'peru', 'belarus', 'ireland', 'kazakhstan', 'france', 'germany', 'italy', 'england', 'netherlands'];
exports.steps = {
    outcomes: {
        goals: 0.05,
        corners: 0.05,
        yellow_cards: 0.05,
        fouls: 0.05,
        shots_on_goal: 0.05
    },
    individual_totals: {
        goals: 0.25,
        corners: 0.5,
        yellow_cards: 0.25,
        fouls: 2,
        shots_on_goal: 0.5
    }
};
exports.individual_totals_range = {
    goals: [0, 3],
    corners: [2, 10],
    yellow_cards: [0, 4],
    fouls: [4, 24],
    shots_on_goal: [1, 10]
};
exports.totals_range = {
    goals: [2, 4],
    corners: [8.5, 11],
    yellow_cards: [2, 6],
    fouls: [20, 40],
    shots_on_goal: [7, 12]
};
exports.totals_coefficient_range = {
    goals: [0.5, 2],
    corners: [1, 3],
    yellow_cards: [1, 2],
    fouls: [6, 12],
    shots_on_goal: [1, 3]
};
exports.weight_kefs = {
    individual_totals: {
        goals: [1, 0, 0],
        corners: [1, 0, 0],
        yellow_cards: [1, 0, 0],
        fouls: [1, 0, 0],
        shots_on_goal: [1, 0, 0]
    },
    outcomes: {
        goals: [1, 0],
        corners: [0.5, 0.5],
        yellow_cards: [1, 0],
        fouls: [0.5, 0.5],
        shots_on_goal: [1, 0]
    }
};
exports.safety_coefs = {
    totals: {
        TO: {
            goals: (0, common_functions_1.getTotalSafetyCoefFuncCreator)(2.5, 0.5, 0.75)
        },
        TU: {
            goals: (0, common_functions_1.getTotalSafetyCoefFuncCreator)(2.5, 0.5, 0.75)
        }
    }
};
exports.total_bet_types = ['TO', 'TU'];
//# sourceMappingURL=config.js.map