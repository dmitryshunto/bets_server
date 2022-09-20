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
exports.get_databases_names = exports.get_all_games = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const bluebird_1 = __importDefault(require("bluebird"));
const config_1 = require("./config");
const common_functions_1 = require("./common_functions");
const get_all_games = (database) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield promise_1.default.createConnection({
        host: config_1.host, port: config_1.port, user: config_1.user, password: config_1.password, database, Promise: bluebird_1.default
    });
    const [result] = yield connection.execute(`SELECT * FROM games`);
    yield connection.end();
    return result;
});
exports.get_all_games = get_all_games;
const get_databases_names = (country_names) => __awaiter(void 0, void 0, void 0, function* () {
    const connection = yield promise_1.default.createConnection({
        host: config_1.host, port: config_1.port, user: config_1.user, password: config_1.password, Promise: bluebird_1.default
    });
    let [databases] = yield connection.execute('SHOW DATABASES');
    databases = databases.map(database => {
        return database['Database'];
    });
    yield connection.end();
    if (!databases || !databases.length)
        return null;
    databases = databases.filter(item => {
        if (item)
            return item;
    });
    const test_databases_1 = [];
    const test_databases_2 = [];
    const training_databases = [];
    let actual_databases = [];
    const all = [];
    for (let country_name of country_names) {
        const country_databases_list = [];
        for (let database of databases) {
            if (database.includes(country_name))
                country_databases_list.push(database);
        }
        for (let i = 0; i < country_databases_list.length; i++) {
            if (i === 1 || i === 4)
                test_databases_1.push(country_databases_list[i]);
            else if (i === 2 || i === 5)
                test_databases_2.push(country_databases_list[i]);
            else if (i === 3)
                training_databases.push(country_databases_list[i]);
            all.push(country_databases_list[i]);
        }
        const actual_country_databases = (0, common_functions_1.get_actual_databases_names)(country_databases_list);
        actual_databases = [...actual_databases, ...actual_country_databases];
        actual_databases.sort();
    }
    return { test_databases_1, test_databases_2, training_databases, actual_databases, all };
});
exports.get_databases_names = get_databases_names;
//# sourceMappingURL=mysql.js.map