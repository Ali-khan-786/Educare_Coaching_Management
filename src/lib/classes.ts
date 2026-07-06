export const CLASSES = [
  { key: "nursery_kg", label: "Nursery / KG" },
  { key: "class_1", label: "Class 1" },
  { key: "class_2", label: "Class 2" },
  { key: "class_3", label: "Class 3" },
  { key: "class_4", label: "Class 4" },
  { key: "class_5", label: "Class 5" },
  { key: "class_6", label: "Class 6" },
  { key: "class_7", label: "Class 7" },
  { key: "class_8", label: "Class 8" },
  { key: "class_9", label: "Class 9" },
  { key: "class_10", label: "Class 10" },
  { key: "alumni", label: "Alumni" },
] as const;

export const FEE_CLASSES = CLASSES.filter((c) => c.key !== "alumni");

export const classLabel = (key: string) => CLASSES.find((c) => c.key === key)?.label ?? key;

export const nextClass = (current: string): string => {
  const order: string[] = CLASSES.map((c) => c.key);
  const idx = order.indexOf(current);
  if (idx === -1) return current;
  if (current === "class_10") return "alumni";
  if (current === "alumni") return "alumni";
  return order[idx + 1];
};

export const ageFromDob = (dob?: string | null): number | null => {
  if (!dob) return null;
  const b = new Date(dob);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
};

export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const formatMonth = (m: string) => {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};
