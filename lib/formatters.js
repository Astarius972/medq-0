export function isPast(deadline) { return new Date() > new Date(deadline); }

export function fmtDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}-р сарын ${d.getDate()}`;
}

export function fmtDateTime(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}-р сарын ${d.getDate()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function relTime(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "Дөнгөж сая";
  if (m < 60) return `${m} мин өмнө`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} цаг өмнө`;
  return `${Math.floor(h / 24)} өдрийн өмнө`;
}

export function timeLeft(deadline) {
  const diff = new Date(deadline) - new Date();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} өдөр үлдсэн`;
  if (h > 0) return `${h} цаг үлдсэн`;
  return "1 цагаас бага";
}
