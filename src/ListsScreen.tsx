import { useState } from 'react'
import { AreaList } from './AreaList'
import { CommonDescriptionList, VagueDescriptionList } from './DescriptionLists'
import { PriceList } from './PriceList'

// The operator's "Listas" (#33): prices and anillado sizes, departments, and both description lists.
// Each section loads and saves on its own.
export function ListsScreen() {
  // +1 when the departments change: the common descriptions show department names.
  const [areasVersion, setAreasVersion] = useState(0)

  return (
    <>
      <PriceList />
      <AreaList onChanged={() => setAreasVersion((n) => n + 1)} />
      <CommonDescriptionList version={areasVersion} />
      <VagueDescriptionList />
    </>
  )
}
