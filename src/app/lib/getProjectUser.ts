import supabaseClient from '@/app/lib/supabaseClient';
import { UserProjectEnum } from '@/providers/ProjectProvider';

export const getProjectUser = async (email: string) => {
  const { data, error } = await supabaseClient
  .from('project_users')
  .select('*')
  .eq('email', email);

  if (error) {
    console.error("Error fetching project users:", error);
  }

  return data as unknown as Promise<{email: string; project: UserProjectEnum}[]>;
}
