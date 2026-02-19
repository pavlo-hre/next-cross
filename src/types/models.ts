import { UserProjectEnum } from "@/providers/ProjectProvider";

// Extended User type that includes additional fields not in the database
export type User =  {
  email: string;
  can_change_project: boolean;
  project: UserProjectEnum
};
