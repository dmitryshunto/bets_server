import { matchBaseUrl, userAgent } from "../config";
import { sleep } from "../functions/common";
import { MatchData, StatisticData } from "../types/parsedMatch";
import puppy from 'puppeteer'
import { BetType, BetItem } from "../types/bets";

export const getMatchData = async (match_url: string): Promise<MatchData> => {
    const browser = await puppy.launch({ headless: true })
    try {
        const match_page = await browser.newPage();
        await match_page.setUserAgent(userAgent);
        await match_page.goto(matchBaseUrl + match_url + '/#/match-summary/match-statistics/0')

        const match_status_selector = 'span[class = "fixedHeaderDuel__detailStatus"]'

        const match_status_elem = await match_page.$(match_status_selector)
        if (!match_status_elem) {
            throw new Error(`Cannot find Match Status Element`)
        }

        const isFinished = !!(await match_page.evaluate((match_status_selector) => {
            if (document.querySelector(match_status_selector) && document.querySelector(match_status_selector).innerHTML.toLowerCase() === 'finished') {
                return true
            } else return false
        }, match_status_selector))

        const trust_btn_selector = '#onetrust-accept-btn-handler'

        const trust_btn = await match_page.$(trust_btn_selector)
        if (trust_btn) {
            await trust_btn.click()
            await match_page.waitForSelector(trust_btn_selector, { visible: false })
        }

        const match_statistic_selector = 'a[href = "#/match-summary/match-statistics"]'

        const isStatistic = await match_page.$(match_statistic_selector)

        if (isFinished && !isStatistic) {
            console.log(`Cannot find Statistic Element. MatchUrl ${match_url}`)
        }

        let statisticData = await match_page.evaluate((isStat, isMatchFinished) => {

            type TeamDataType = {
                team_name: string,
                goals: string,
                corners: string,
                yellow_cards: string,
                fouls: string,
                shots_on_goal: string
            }

            class TeamData implements TeamDataType {
                team_name: string
                goals: string
                corners: string
                yellow_cards: string
                fouls: string
                shots_on_goal: string
                constructor(statistic: TeamDataType) {
                    this.team_name = statistic.team_name,
                        this.goals = statistic.goals,
                        this.corners = statistic.corners,
                        this.yellow_cards = statistic.yellow_cards,
                        this.fouls = statistic.fouls,
                        this.shots_on_goal = statistic.shots_on_goal
                }
            }

            const result = {}

            const statistic_items = document.querySelectorAll(`div[class = "stat__category"]`)
            const home_away_items = ['home', 'away']

            const statistic_item_name_selector = `div[class = "stat__categoryName"]`
            const team_names_nodes = document.querySelectorAll(`a[class = "participant__participantName participant__overflow "]`)
            const team_goals_nodes = document.querySelector('.detailScore__wrapper').querySelectorAll('span:not(.detailScore__divider)')
            for (const home_away_item of home_away_items) {
                const team_index = home_away_item == 'home' ? 0 : 1
                let corners = null
                let shots_on_goal = null
                let fouls = null
                let yellow_cards = null
                if (isStat && isMatchFinished) {
                    for (let j = 0; j < statistic_items.length; j++) {
                        if (statistic_items[j].querySelector(statistic_item_name_selector)) {
                            let statistic_nodes = statistic_items[j].querySelectorAll('div')
                            let team_statistic_nodes = [statistic_nodes[0], statistic_nodes[2]]

                            const statistic_item_name = statistic_items[j].querySelector(statistic_item_name_selector).innerHTML
                            const statistic_item_value = team_statistic_nodes[team_index].innerText.trim()

                            if (statistic_item_name == 'Corner Kicks') {
                                corners = statistic_item_value
                            }
                            if (statistic_item_name == 'Shots on Goal') {
                                shots_on_goal = statistic_item_value
                            }
                            if (statistic_item_name == 'Fouls') {
                                fouls = statistic_item_value
                            }
                            if (statistic_item_name == 'Yellow Cards') {
                                yellow_cards = statistic_item_value
                            }
                            if (corners !== null && shots_on_goal !== null && yellow_cards === null) yellow_cards = 0

                        }
                    }
                }
                let team_name = null
                let goals = null

                if (team_names_nodes[team_index]) {
                    team_name = team_names_nodes[team_index].innerHTML.trim()
                }
                if (isMatchFinished) {
                    if (team_goals_nodes[team_index]) {
                        goals = team_goals_nodes[team_index].innerHTML.trim()
                    }
                }

                const team_data = new TeamData({
                    team_name, goals,
                    corners, yellow_cards, shots_on_goal, fouls
                })

                result[home_away_item] = team_data
            }
            return result as StatisticData
        }, isStatistic, isFinished)

        let resultBets = [] as BetItem[]
        let totalBets = [] as BetItem[]

        const odds_tab_elem = await match_page.$('a[href = "#/odds-comparison"]')

        if (odds_tab_elem) {
            const odds_page = await browser.newPage();
            await odds_page.goto(matchBaseUrl + match_url + `/#/odds-comparison/1x2-odds/full-time`)

            resultBets = await odds_page.evaluate(() => {
                class Bet implements BetItem {
                    odd: number | null
                    value: number | null
                    bet_type: BetType
                    constructor(bet_type: BetType, value: number | null, odd: number) {
                        this.bet_type = bet_type
                        this.value = value
                        this.odd = odd ? odd : null
                    }
                }

                let resultBets = [] as BetItem[]
                let w1 = null as number | null
                let x = null as number | null
                let w2 = null as number | null
                let x1 = null as number | null
                let x2 = null as number | null
                let h1_0 = null as number | null
                let h2_0 = null as number | null
                const result_bet_items = document.querySelectorAll('div.ui-table__row')
                for (const result_bet_item of result_bet_items) {
                    const selector = 'a[target = "_blank"]'
                    const items = result_bet_item.querySelectorAll(selector)
                    let [book_node, ...odds_nodes] = items
                    odds_nodes = odds_nodes.splice(-3) // забираем последние три элемента массива (это и будут коэффициенты)
                    // @ts-ignore
                    if (book_node.title == '1xBet') {
                        if (odds_nodes && odds_nodes.length >= 2) {
                            // @ts-ignore
                            w1 = +odds_nodes[0]?.innerText
                            // @ts-ignore
                            x = +odds_nodes[1]?.innerText
                            // @ts-ignore
                            w2 = +odds_nodes[2]?.innerText
                        }
                        // @ts-ignore
                    } else if (book_node.title == 'bet365') {
                        if (odds_nodes && odds_nodes.length >= 2) {
                            // @ts-ignore
                            w1 = +odds_nodes[0]?.innerText
                            // @ts-ignore
                            x = +odds_nodes[1]?.innerText
                            // @ts-ignore
                            w2 = +odds_nodes[2]?.innerText
                        }
                    }
                    if (w1 && x && w2) {
                        x1 = 1 / (1 / w1 + 1 / x)
                        x2 = 1 / (1 / w2 + 1 / x)
                        h1_0 = 0.98 * (w1 + w2) / w2
                        h2_0 = 0.98 * (w1 + w2) / w1
                    }
                }
                resultBets.push(new Bet('home', -0.5, w1))
                resultBets.push(new Bet('x', null, x))
                resultBets.push(new Bet('away', -0.5, w2))
                resultBets.push(new Bet('home', 0.5, x1))
                resultBets.push(new Bet('away', 0.5, x2))
                resultBets.push(new Bet('home', 0, h1_0))
                resultBets.push(new Bet('away', 0, h2_0))
                return resultBets
            })

            const total_tab_elem = await odds_page.$('a[href = "#/odds-comparison/over-under"]')

            if (total_tab_elem) {
                await total_tab_elem.click()
                await sleep(2)
                totalBets = await odds_page.evaluate(() => {
                    class Bet implements BetItem {
                        odd: number | null
                        value: number | null
                        bet_type: BetType;
                        constructor(bet_type: BetType, value: number | null, odd: number) {
                            this.bet_type = bet_type
                            this.value = value
                            this.odd = odd ? odd : null
                        }
                    }
                    const totalBets = [] as BetItem[]
                    for (let total = 2; total < 4.5; total = total + 0.5) {
                        let over = null
                        let under = null
                        const total_bets_items = document.querySelectorAll('div.ui-table__row')
                        if (total_bets_items && total_bets_items.length) {
                            for (let total_bets_item of total_bets_items) {
                                try {
                                    let book_name
                                    if (total_bets_item.querySelector('div').querySelector('a')) {
                                        book_name = total_bets_item.querySelector('div').querySelector('a').title
                                    }
                                    if (book_name === '1xBet') {
                                        let bookmaker_total_node = total_bets_item.querySelector('span.oddsCell__noOddsCell')
                                        let bookmaker_total
                                        // @ts-ignore
                                        if (bookmaker_total_node) bookmaker_total = +bookmaker_total_node.innerText
                                        const odds_selector = 'a.oddsCell__odd  '
                                        if (bookmaker_total === total) {
                                            // @ts-ignore
                                            if (total_bets_item.querySelectorAll(odds_selector)[0] && total_bets_item.querySelectorAll(odds_selector)[0].innerText !== '-') {
                                                // @ts-ignore
                                                over = total_bets_item.querySelectorAll(odds_selector)[0].innerText
                                            }
                                            // @ts-ignore
                                            if (total_bets_item.querySelectorAll(odds_selector)[1] && total_bets_item.querySelectorAll(odds_selector)[1].innerText !== '-') {
                                                // @ts-ignore
                                                under = total_bets_item.querySelectorAll(odds_selector)[1].innerText
                                            }
                                        }
                                    }
                                } catch (e) {
                                    continue
                                }
                            }
                        }
                        totalBets.push(new Bet('to', total, over))
                        totalBets.push(new Bet('tu', total, under))
                    }
                    return totalBets
                })
            }
            await odds_page.close()
        }
        const betData = {
            goals: [...resultBets, ...totalBets]
        }
        if (isFinished) {
            if (!resultBets) console.log(`Cannot find result bets. Match URL: ${match_url}`)
            if (!totalBets) console.log(`Cannot find total bets. Match URL: ${match_url}`)
        }
        const date = await match_page.evaluate(() => {
            return document.querySelector('div.duelParticipant__startTime').querySelector('div').innerHTML
        })
        await match_page.close()
        await browser.close()
        return { betData, isFinished, date, statisticData }
    } catch (e) {
        await browser.close()
        console.error(e, match_url)
    }
}