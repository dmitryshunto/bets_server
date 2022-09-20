const translation_of_numbers = {
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '.': 'and'
}

export const translate_number = (number: number) => {
    const symbols = String(number).split('')
    let result = ''
    for (const symbol of symbols) {
        result += `_${translation_of_numbers[symbol]}`
    }
    return result
}