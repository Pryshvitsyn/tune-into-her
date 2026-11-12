/** A date-only value is parsed locally at noon, not as UTC midnight. */
export function introDateLabel(dateOnly: string, language: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!match) return dateOnly;
  const [,y,m,d]=match;
  const value=new Date(Number(y),Number(m)-1,Number(d),12);
  const locale=language==='mbf' || language==='ms-baba'?'ms':language;
  try {return new Intl.DateTimeFormat(locale,{day:'numeric',month:'long'}).format(value);}
  catch {return new Intl.DateTimeFormat('en',{day:'numeric',month:'long'}).format(value);}
}
