export const CATEGORY_ORDER = [
  { key: 'social_requirement', label: 'Social requirement' },
  { key: 'volunteer_work_requirement', label: 'Volunteer/work requirement' },
  { key: 'fundraising_requirement', label: 'Fundraising requirement' },
  { key: 'work_this_week', label: 'Work this week' },
  { key: 'signed_up_for_work', label: 'Signed up for work' },
  { key: 'signed_up_for_volunteering', label: 'Signed up for volunteering' },
  { key: 'attendance', label: 'Attendance' },
] as const;

export type CategoryKey = typeof CATEGORY_ORDER[number]['key'];

const KEY_MAPPING: Record<string, CategoryKey> = {
  social: 'social_requirement',
  volunteer: 'volunteer_work_requirement',
  fundraising: 'fundraising_requirement',
  attendance: 'attendance',
  work_week: 'work_this_week',
  work_signup: 'signed_up_for_work',
  volunteer_signup: 'signed_up_for_volunteering',
  points: 'attendance',
  admin: 'attendance',
};

export function normalizeCategoryKey(key: string): CategoryKey {
  return (KEY_MAPPING[key] || 'attendance') as CategoryKey;
}
