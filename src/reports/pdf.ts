import type { TDocumentDefinitions } from 'pdfmake/interfaces'

// pdfmake and its fonts are about 1 MB: they are imported here, when a report is generated,
// so Vite puts them in a separate file that the shared device never downloads.

// pdfmake's files are old-style (CommonJS) modules: the bundler hands them over as `default`.
function moduleValue<T>(module: T): T {
  return (module as { default?: T }).default ?? module
}

// Builds the PDF in the browser and downloads it under this name.
export async function downloadPdf(doc: TDocumentDefinitions, fileName: string): Promise<void> {
  const [pdfModule, fontsModule] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ])
  const pdfMake = moduleValue(pdfModule)
  // Roboto, built into pdfmake, has the Spanish accents and ñ.
  pdfMake.addVirtualFileSystem(fontsModule.default)
  await pdfMake.createPdf(doc).download(fileName)
}
