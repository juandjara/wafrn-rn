export default function pluralize(count: number, singular: string, plural?: string) {
  if (!plural) {
    plural = `${singular}s`
  }
  return count === 1 ? singular : plural
}
