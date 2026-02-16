import supabaseClient from '@/app/lib/supabaseClient';

export const getTabNames = async () => {
  console.log("getTabNames");
  const { data, error } = await supabaseClient
  .from("sheet_tabs")
  .select("name");

  if (error) {
    console.error("Error fetching tab names:", error);
  }

  return data?.map((el) => el.name) || [];
};
