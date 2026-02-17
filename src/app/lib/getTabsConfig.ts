import supabaseClient from '@/app/lib/supabaseClient';

export const getTabsConfig = async (): Promise<{name: string; duration: number}[]> => {
  const { data, error } = await supabaseClient
  .from("tabs_config")
  .select("*");

  if (error) {
    console.error("Error fetching tab config:", error);
  }

  return data || [];
};
