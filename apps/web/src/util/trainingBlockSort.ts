export function byStartDateDesc(a: { startDate: Date | string }, b: { startDate: Date | string }): number {
  return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
}
