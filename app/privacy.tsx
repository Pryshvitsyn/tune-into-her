import { useTranslation } from "react-i18next";

import { InfoPage } from "../src/components/InfoPage";
export default function PrivacyScreen() { const { t } = useTranslation(); return <InfoPage title={t("accessV2.privacyTitle")} body={t("accessV2.privacyBody")} />; }
