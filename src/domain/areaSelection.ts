// The departments ticked when creating an account, and which one is the
// default ("área principal").
export type AreaSelection = {
  areaIds: number[]
  defaultAreaId: number | null // null only while nothing is ticked
}

export const noAreas: AreaSelection = { areaIds: [], defaultAreaId: null }

// Ticks or unticks a department. The first department ticked becomes the
// default; if the default is unticked, the first remaining one takes its place.
export function toggleArea(selection: AreaSelection, areaId: number): AreaSelection {
  if (selection.areaIds.includes(areaId)) {
    const areaIds = selection.areaIds.filter((id) => id !== areaId)
    const defaultAreaId =
      selection.defaultAreaId === areaId ? (areaIds[0] ?? null) : selection.defaultAreaId
    return { areaIds, defaultAreaId }
  }
  return {
    areaIds: [...selection.areaIds, areaId],
    defaultAreaId: selection.defaultAreaId ?? areaId,
  }
}

// Makes a ticked department the default; anything else is ignored.
export function chooseDefault(selection: AreaSelection, areaId: number): AreaSelection {
  return selection.areaIds.includes(areaId) ? { ...selection, defaultAreaId: areaId } : selection
}

// A new main department after the old one was archived (#115): the account keeps its departments
// still in use, plus the one chosen, which becomes the default. Archived ones are dropped: they can
// no longer be used for entries.
export function withNewDefault(
  areaIds: number[],
  activeAreaIds: number[],
  chosen: number,
): { areaIds: number[]; defaultAreaId: number } {
  const kept = areaIds.filter((id) => activeAreaIds.includes(id) && id !== chosen)
  return { areaIds: [chosen, ...kept], defaultAreaId: chosen }
}
