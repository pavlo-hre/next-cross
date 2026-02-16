type SheetData<T> = Record<string, T[]>;

type BeneficiaryItem = {
  name: string;
  activity: string;
  date: any;
  taxNumber: any;
}

export const sheetFetcher = async <T = any>(...args: Parameters<typeof fetch>) => {
  const res = await fetch(...args);

  if (!res.ok) {
    throw new Error(`An error occurred: ${res.statusText}`);
  }

  const jsonRes = await res.json() as SheetData<string[]>;
  const projects = Object.keys(jsonRes);
  const beneficiaries = projects.reduce((acc, el) => {
    const beneficiariesByProject = jsonRes?.[el]?.filter((el: any) => !!el.length).map((item: any) => ({
      name: `${item?.at(1)} ${item?.at(2)} ${item?.at(3)}`,
      activity: el,
      date: item?.at(0),
      taxNumber: item?.at(5),
    })) || [];
    acc.push(...beneficiariesByProject);
    return acc;
  }, [] as BeneficiaryItem[])
  return {projects, beneficiaries};
};


export default sheetFetcher;
