import { http } from '@/api/http';

export interface Holiday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  global: boolean;
}

export async function getPublicHolidays(year: number, countryCode = 'BY') {
  const { data } = await http.get<Holiday[]>('/calendar/holidays', {
    params: { year, countryCode },
  });
  return data;
}
