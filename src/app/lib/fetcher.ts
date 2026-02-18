type SheetData<T> = {
  sheetData: Record<string, T[]>;
  tabsConfig: TabsConfig[]
}

export type TabsConfig = {name: string; duration: number; id: string; planned_distributions: number};

type BeneficiaryItem = {
  name: string;
  activity: string;
  duration: number;
  plannedDistributions: number
  date: any;
  taxNumber: any;
}

export const sheetFetcher = async <T = any>(...args: Parameters<typeof fetch>) => {
  const res = await fetch(...args);

  if (!res.ok) {
    throw new Error(`An error occurred: ${res.statusText}`);
  }

  const jsonRes = await res.json() as SheetData<{}>;
  const projects = jsonRes.tabsConfig;
  const beneficiaries = projects.reduce((acc, el) => {
    const beneficiariesByProject = jsonRes.sheetData?.[el.name]?.filter((el: any) => !!el.length).map((item: any) => ({
      name: `${item?.at(1)} ${item?.at(2)} ${item?.at(3)}`,
      activity: el.name,
      duration: el.duration,
      date: item?.at(0),
      taxNumber: item?.at(5),
      plannedDistributions: el.planned_distributions,
    })) || [];
    acc.push(...beneficiariesByProject);
    return acc;
  }, [] as BeneficiaryItem[])
  return {projects, beneficiaries};
};


export default sheetFetcher;
