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
const classes_1 = require("./classes");
const common_functions_1 = require("./common_functions");
const investigation_1 = require("./investigation");
const db = 'austria_bundesliga_2021_2022';
const init_champ = () => __awaiter(void 0, void 0, void 0, function* () {
    const champ = yield classes_1.Championhip.CreateAsync(db);
    console.log(champ.countResults(champ.completed_games, 'goals', -.5, common_functions_1.get_game_outcome, 'away'));
    // const games = champ.get_games_filtered_by_callback(g => Boolean(g))
    // const game = games[games.length - 1]
    // console.log(game['game_id'], champ.create_prediction(game, 'corners'))
});
(0, investigation_1.totals_investigation)('goals');
// totalBetSuccessInvestigation('goals')
//# sourceMappingURL=index.js.map