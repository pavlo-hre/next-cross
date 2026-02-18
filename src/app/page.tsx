'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import done from '../assets/tick-green-icon.svg';
import loader from '../assets/tube-spinner.svg';
import * as XLSX from 'xlsx';
import { BsFiletypeXlsx } from 'react-icons/bs';
import { Checkbox, CheckboxGroup } from '@heroui/checkbox';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { addToast } from '@heroui/toast';
import { parse } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';
import LoginForm from '@/components/LoginForm';
import useSWR from 'swr';
import sheetFetcher from '@/app/lib/fetcher';
import { InfoTooltip } from '@/components/Tooltip';
import { useProject } from '@/providers/ProjectProvider';
import { Radio, RadioGroup } from '@heroui/radio';

enum SearchByEnum {
  TAX = 'ІПН',
  NAME = 'Прізвище',
}


export default function Home() {
  const {isLoggedIn, isLoading: loginLoading} = useAuth();
  const {selectedProject} = useProject();
  const {data, isLoading} = useSWR('/api/sheet', sheetFetcher, {
    revalidateOnFocus: true,
    onErrorRetry: (err, key, config, revalidate, {retryCount}) => {
      // Retry max 3 times
      if (retryCount >= 3) return;
      // Retry after 2s
      setTimeout(() => revalidate({retryCount: retryCount + 1}), 2000);
    },
  });
  const projects = data?.projects || [];
  const beneficiaries = data?.beneficiaries || [];

  const [searchBy, setSearchBy] = useState<SearchByEnum>(SearchByEnum.TAX);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [value, setValue] = useState<string>('');
  const [columnAData, setColumnAData] = useState<number[]>([]);
  const [startDate] = React.useState<CalendarDate>(today(getLocalTimeZone()).subtract({months: 3}));
  const ref = useRef<any>(null);

  useEffect(() => {
    if (projects.length) {
      setSelectedActivities(projects.map((p) => p.name));
    }
  }, [projects.length]);


  useEffect(() => {
    if (isLoggedIn && !isLoading && beneficiaries.length < 500) {
      addToast({
        title: 'Помилка імпорту Google Sheets',
        description: 'Будь ласка перезавантажте сторінку',
        color: 'danger',
        timeout: 1000 * 120,
      });

    }

  }, [beneficiaries.length, isLoading, isLoggedIn]);

  function addDuplicateIndex<T extends { activity: string; taxNumber: string }>(
    data: T[]
  ): (T & { distribution: number })[] {
    const counts = new Map<string, number>();
    const result = new Array(data.length) as (T & { distribution: number })[];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const key = `${item.activity}|${item.taxNumber}`;

      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);

      result[i] = {
        ...item,
        distribution: count,
      };
    }

    return result;
  }


  const dateToCalendarDate = (date: Date) => {
    return new CalendarDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
  }

  const list = useMemo(() => {
    const filteredByProjectAndDate = addDuplicateIndex(beneficiaries.filter((el) => selectedActivities.includes(el.activity) && ((!el.date || el.activity.split(' ')[0].toUpperCase() === selectedProject || dateToCalendarDate(parse(el.date, 'dd.MM.yyyy', new Date())).compare(startDate) >= 0))));

    if (value.trim() && value.length > 2) {
      switch (searchBy) {
        case SearchByEnum.TAX:
          return filteredByProjectAndDate.filter((el) => (parseInt(el.taxNumber)?.toString())?.startsWith(parseInt(value)?.toString()));
        case SearchByEnum.NAME:
          return filteredByProjectAndDate.filter((el) => el.name.toLowerCase().trim().startsWith(value.toLowerCase().trim()));
        default:
          return [];
      }
    } else if (columnAData.length > 0) {
      return filteredByProjectAndDate.filter((el) => columnAData.includes(parseInt(el.taxNumber)));
    } else {
      return [];
    }
  }, [value, beneficiaries, columnAData, startDate, selectedActivities, selectedProject, searchBy]);


  const onClear = () => {
    setValue('');
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt: ProgressEvent<FileReader>) => {
      const binaryStr = evt.target?.result;
      if (typeof binaryStr !== 'string') return;

      const workbook = XLSX.read(binaryStr, {type: 'binary'});
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

      const columnA: string[] = [];

      for (let row = range.s.r; row <= range.e.r; row++) {
        const cellAddress = {c: 0, r: row}; // Column A is index 0
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        const cell = worksheet[cellRef];
        if (cell && cell.v != null) {
          columnA.push(String(cell.v));
        }
      }

      setColumnAData(columnA?.map((e) => parseInt(e))?.filter((item) => !isNaN(item)));
    };

    reader.readAsBinaryString(file);
  };

  const exportToXlsx = () => {
    if (!list || list.length === 0) return;

    const rows = list.map((r) => ({
      Дата: r.date || '',
      Бенефіціар: r.name || '',
      ІПН: r.taxNumber || '',
      Активність: r.activity || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows, {header: ['Дата', 'Бенефіціар', 'ІПН', 'Активність']});
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');

    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `wash_check_${ts}.xlsx`;

    XLSX.writeFile(wb, filename);
  };


  const getInputPlaceholder = (option: SearchByEnum) => {
    switch (option) {
      case SearchByEnum.NAME:
        return "Введіть прізвище"
      case SearchByEnum.TAX:
        return "Введіть ІПН"
      default:
        return "Введіть ІПН"
    }
  }

  if (!isLoggedIn) {
    return <LoginForm/>
  }


  return isLoading || loginLoading ? (<div className="w-full h-[100vh] flex justify-center items-center">
    <Image src={loader} alt={'loading'} className="my-5"/>
  </div>) : (
    <div className="min-h-screen flex items-center  flex-col bg-gray-100 pt-[60px]">
      <div className="text-sm">
        Завантажено бенефіціарів: {beneficiaries.length}
      </div>
      <div className="text-center mb-4 px-10 text-xl max-w-[500px] pt-4">
        Перевірка реєстрації в базах WASH
      </div>
      <div className="flex flex-col gap-5 max-w-[600px] w-[95%] items-center mb-8">
        <CheckboxGroup value={selectedActivities}
                       onValueChange={(values) => {
                         if (values.length === 0) return;
                         setSelectedActivities(values);
                       }}
                       orientation="horizontal">
          {
            projects.map((item) => (<Checkbox key={item.id} value={item.name}>
              <span className={'text-xs'}>
                 {item.name.toUpperCase()}
              </span>
            </Checkbox>))
          }
        </CheckboxGroup>
      </div>
      <div className="max-w-[500px] w-[95%]">
        <RadioGroup className="mb-2" label="Пошук бенефіціара" value={searchBy} onValueChange={(value) => {
          setSearchBy(value as SearchByEnum);
          setValue("");
        }}
                    orientation="horizontal">
          {Object.values(SearchByEnum).map((opt) => <Radio value={opt} key={opt}>{opt}</Radio>)}
        </RadioGroup>
        <div className="relative">
          <input id="beneficiary" value={value} onChange={(e) => setValue(e.target.value.trim())} type={searchBy === SearchByEnum.TAX ? "number" : "text"}
                 placeholder={getInputPlaceholder(searchBy)}
                 onWheel={(e: any) => e.target?.blur()}
                 className="w-full text-2xl p-1 border-2 rounded-m border-gray-300 mb-1 pr-4"/>
          {!!value.trim() && <span onClick={onClear}
                                   className="h-fit absolute right-1 top-[3px] bottom-0 py-1.5 px-3 bg-red-300">X</span>}
        </div>
      </div>
      <div className="hidden sm:block">
        <div className="text-sm text-center pt-4 mb-2 flex items-center gap-2">
          <div>
            Для масової перевірки завантажте файл .XLSX <br/>
            який містить всі ІПН бенефіціарів в колонці А
          </div>
          <InfoTooltip content="Якщо бенефіціар не має ІПН, перевірте його окремо за прізвищем"/>
        </div>
        <div className="flex gap-5 items-center">
          <input id="file-upload" ref={ref} type="file" accept=".xlsx, .xls" onChange={handleFileUpload}
                 className="border-b-2 text-center  px-3"/>
          <label htmlFor="file-upload"> <BsFiletypeXlsx size={30}/></label>
          {!!columnAData?.length && <button onClick={() => {
            setColumnAData([]);
            if (ref?.current) {
              ref.current.value = '';
            }
          }}>
            X
          </button>}
        </div>
      </div>

      {list?.length ? <div className="w-full max-w-[500px] pb-5 flex flex-col">
        {
          list?.map((el, index: number) => (
            <div className="mb-2 border-b-2 border-gray-300 p-5" key={`${index}_${el.taxNumber}`}>
              <div className="font-bold">{el.activity.toUpperCase()}</div>
              <div className="text-medium font-bold text-gray-700 flex">
                <div>Дата отримання: {el?.date} {`(${el?.duration} міс.`}</div>
                <InfoTooltip
                  content="Вказано базовий період на який розрахована допомога. Враховуйте планову кількість видач для кожної активності"/> )
                {el.plannedDistributions > 1 && <div>&nbsp;видача {el.distribution > el.plannedDistributions ? el.plannedDistributions : el.distribution}/{el.plannedDistributions}</div>}
              </div>
              <div>{el.name}</div>
              <div>{el.taxNumber}</div>
              <div>
              </div>
            </div>
          ))
        }
        <button
          onClick={exportToXlsx}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 mx-auto my-5"
        >
          Скачати результат в форматі XLSX
        </button>
      </div> : ''}
      {((value && value.length > 2 && list?.length === 0) || (list?.length === 0 && columnAData?.length > 0)) &&
        <div className="flex flex-col justify-center items-center text-xl">
          <Image width={50} src={done} alt={'Ok'} className="my-5"/>
          Бенефіціара не знайдено
        </div>}
    </div>
  );
}
