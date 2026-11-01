import type { SupportedLanguage } from "../../config/constants";
import copy from "../../i18n/interface.json";
import { calendarDayDifference, type DateOnly } from "../cycle/dateOnly";
/** Stable across theme/locale changes; no randomness or network. */
export function dailyReminders(date: DateOnly, language: SupportedLanguage) {
  const c = copy[language];
  const day = calendarDayDifference("2020-01-01", date);
  const attention = [
    { id: "listen", text: c.listen },
    { id: "wellbeing", text: c.wellbeing },
    { id: "ask", text: c.ask },
  ];
  const thanks = {
    id: "gratitude",
    text: day % 2 === 0 ? c.gratitude : c.thanks,
  };
  const lines = [attention[day % 3]!, attention[(day + 1) % 3]!, thanks];
  return lines.slice(day % 3).concat(lines.slice(0, day % 3));
}
