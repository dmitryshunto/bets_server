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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.write_data = exports.create_xlsx = void 0;
const xlsx_1 = __importDefault(require("xlsx"));
const classes_1 = require("./classes");
const csv_writer_1 = require("csv-writer");
const createPathForExcelFiles = (bet_kind, bookTitle, investigation_type, home_away_item) => {
    const base_path = `E:/Bets investigations/${bet_kind}/${investigation_type}/`;
    if (!home_away_item)
        return `${base_path}${bookTitle}.xlsx`;
    return `${base_path}/${home_away_item}/${bookTitle}.xlsx`;
};
const create_xlsx = (bet_kind, bookTitle, data, investigation_type, home_away_item) => {
    const book = xlsx_1.default.utils.book_new();
    book.Props = {
        "Title": bookTitle
    };
    for (let sheetNumber = 0; sheetNumber < data.length; sheetNumber++) {
        if (data[sheetNumber]) {
            // let header = ['Кэф от', 'Кэф до', '+', '=', '-', 'Матчей']
            let header = ['Тотал', 'Баланс', 'Матчей', 'win rate'];
            const sheetName = `${sheetNumber}`;
            book.SheetNames.push(sheetName);
            book.Sheets[sheetName] = xlsx_1.default.utils.aoa_to_sheet([header, ...data[sheetNumber]]);
        }
    }
    const path = createPathForExcelFiles(bet_kind, bookTitle, investigation_type, home_away_item);
    xlsx_1.default.writeFile(book, path);
};
exports.create_xlsx = create_xlsx;
const write_data = (db_names) => __awaiter(void 0, void 0, void 0, function* () {
    for (let db_name of db_names) {
        const championship = yield classes_1.Championhip.CreateAsync(db_name);
        const games = championship.completed_games;
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path: `./dumps/${db_name}.csv`,
            header: [
                { id: 'game_id', title: 'game_id' },
                { id: 'home_team_id', title: 'home_team_id' },
                { id: 'away_team_id', title: 'away_team_id' },
                { id: 'home_team_goals', title: 'home_team_goals' },
                { id: 'away_team_goals', title: 'away_team_goals' },
                { id: 'home_team_yellow_cards', title: 'home_team_yellow_cards' },
                { id: 'away_team_yellow_cards', title: 'away_team_yellow_cards' },
                { id: 'home_team_corners', title: 'home_team_corners' },
                { id: 'away_team_corners', title: 'away_team_corners' },
                { id: 'home_team_shots_on_goal', title: 'home_team_shots_on_goal' },
                { id: 'away_team_shots_on_goal', title: 'away_team_shots_on_goal' },
                { id: 'home_team_fouls', title: 'home_team_fouls' },
                { id: 'away_team_fouls', title: 'away_team_fouls' },
                { id: 'book_goals_w1', title: 'book_goals_w1' },
                { id: 'book_goals_x', title: 'book_goals_x' },
                { id: 'book_goals_w2', title: 'book_goals_w2' },
                { id: 'book_goals_x1', title: 'book_goals_x1' },
                { id: 'book_goals_x2', title: 'book_goals_x2' },
                { id: 'book_goals_h1_0', title: 'book_goals_h1_0' },
                { id: 'book_goals_h2_0', title: 'book_goals_h2_0' },
                { id: 'book_goals_over_two', title: 'book_goals_over_two' },
                { id: 'book_goals_under_two', title: 'book_goals_under_two' },
                { id: 'book_goals_over_two_and_five', title: 'book_goals_over_two_and_five' },
                { id: 'book_goals_under_two_and_five', title: 'book_goals_under_two_and_five' },
                { id: 'book_goals_over_three', title: 'book_goals_over_three' },
                { id: 'book_goals_under_three', title: 'book_goals_under_three' },
                { id: 'book_goals_over_three_and_five', title: 'book_goals_over_three_and_five' },
                { id: 'book_goals_under_three_and_five', title: 'book_goals_under_three_and_five' },
                { id: 'book_goals_over_four', title: 'book_goals_over_four' },
                { id: 'book_goals_under_four', title: 'book_goals_under_four' },
                { id: 'book_goals_under_three', title: 'book_goals_under_three' },
            ]
        });
        yield csvWriter.writeRecords(games);
    }
});
exports.write_data = write_data;
//# sourceMappingURL=fs_functions.js.map