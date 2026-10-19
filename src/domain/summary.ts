// Short Spanish description of what an entry contains, for the confirmation
// message, e.g. "50 copias · 3 anillados".
export function describeContents(copias: number, anilladoQuantities: number[]): string {
  const anillados = anilladoQuantities.reduce((sum, q) => sum + q, 0)
  const parts: string[] = []
  if (copias > 0) parts.push(`${copias} ${copias === 1 ? 'copia' : 'copias'}`)
  if (anillados > 0) parts.push(`${anillados} ${anillados === 1 ? 'anillado' : 'anillados'}`)
  return parts.length > 0 ? parts.join(' · ') : 'sin copias ni anillados'
}
