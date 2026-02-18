import supabaseClient from '@/app/lib/supabaseClient';
import { TabsConfig } from '@/app/lib/fetcher';

export const getTabsConfig = async (): Promise<TabsConfig[]> => {
  const { data, error } = await supabaseClient
  .from("tabs_config")
  .select("*");

  if (error) {
    console.error("Error fetching tab config:", error);
  }

  return data || [];
};
