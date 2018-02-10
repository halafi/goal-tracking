import moment from 'moment'

export const getElapsedDaysTillNow = (fromMillis: number) => moment().diff(moment(fromMillis), 'd')
export const getElapsedDaysBetween = (fromMillis: number, toMillis: number) =>
  moment(toMillis).diff(moment(fromMillis), 'd')
