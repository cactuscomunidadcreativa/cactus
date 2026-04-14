import { NextRequest, NextResponse } from 'next/server'

const contacts: Record<string, string> = {
  'malu-privat': `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Malu Privat\r\nTEL;TYPE=CELL:+51 987 780 358\r\nEMAIL:malu@privat.pe\r\nURL:https://www.privat.pe\r\nURL:https://www.instagram.com/privatoficial/\r\nADR;TYPE=HOME:;;;;;;Peru\r\nNOTE:IG: @privatoficial\r\nEND:VCARD`,
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')

  if (!slug || !contacts[slug]) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  return new NextResponse(contacts[slug], {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.vcf"`,
    },
  })
}
