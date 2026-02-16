'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import done from '../assets/tick-green-icon.svg';
import loader from '../assets/tube-spinner.svg';
import * as XLSX from 'xlsx';
import { BsFiletypeXlsx } from 'react-icons/bs';
import { DatePicker } from '@heroui/date-picker';
import { Checkbox, CheckboxGroup } from '@heroui/checkbox';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { I18nProvider } from '@react-aria/i18n';
import { addToast } from '@heroui/toast';
import { parse } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';
import LoginForm from '@/components/LoginForm';
import useSWR from 'swr';
import sheetFetcher from '@/app/lib/fetcher';


export default function Home() {
  const {isLoggedIn, isLoading: loginLoading} = useAuth();
  const {data, isLoading} = useSWR('/api/sheet', sheetFetcher, {
    revalidateOnFocus: true,
    onErrorRetry: (err, key, config, revalidate, { retryCount }) => {
      // Retry max 3 times
      if (retryCount >= 3) return;
      // Retry after 2s
      setTimeout(() => revalidate({ retryCount: retryCount + 1 }), 2000);
    },
  });
  const projects = data?.projects || [];
  const beneficiaries = data?.beneficiaries || [];

  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [value, setValue] = useState<string>('');
  const [columnAData, setColumnAData] = useState<number[]>([]);
  const [startDate, setStartDate] = React.useState<CalendarDate | null>(today(getLocalTimeZone()).subtract({months: 3}));
  const ref = useRef<any>(null);

  useEffect(() => {
    if (projects.length) {
      setSelectedActivities(projects);
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


  const dateToCalendarDate = (date: Date) => {
    return new CalendarDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
  }

  const list = useMemo(() => {
    const filteredByProjectAndDate = beneficiaries.filter((el) => selectedActivities.includes(el.activity) && (!el.date || !startDate || dateToCalendarDate(parse(el.date, 'dd.MM.yyyy', new Date())).compare(startDate) >= 0));

    if (value.trim() && value.length > 2) {
      return filteredByProjectAndDate.filter((el) => (el?.taxNumber?.startsWith('0') ? parseInt(el.taxNumber)?.toString() : el.taxNumber)?.startsWith(value?.startsWith('0') ? parseInt(value)?.toString() : value) || el?.name?.toLowerCase()?.startsWith(value.toLowerCase()))
    } else if (columnAData.length > 0) {
      return filteredByProjectAndDate.filter((el) => columnAData.includes(parseInt(el.taxNumber)));
    } else {
      return [];
    }
  }, [value, beneficiaries, columnAData, startDate, selectedActivities])

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

  if (!isLoggedIn) {
    return <LoginForm/>
  }


  return isLoading || loginLoading ? (<div className="w-full h-[100vh] flex justify-center items-center">
    <Image src={loader} alt={'loading'} className="my-5"/>
  </div>) : (
    <div className="min-h-screen flex items-center  flex-col bg-gray-100 pt-[40px]">
      <div className="text-sm">
        Завантажено бенефіціарів: {beneficiaries.length}
      </div>
      <div className="text-center mb-4 px-10 text-xl max-w-[500px] pt-8">
        Перевірка реєстрації в базах WASH
      </div>
      <div className="flex flex-col gap-5 max-w-[600px] w-[95%] items-center mb-5">
        <CheckboxGroup value={selectedActivities}
                       onValueChange={(values) => {
                         if (values.length === 0) return;
                         setSelectedActivities(values);
                       }}
                       orientation="horizontal">
          {
            projects.map((item) => (<Checkbox key={item} value={item}>
              <span className={"text-xs"}>
                 {item.toUpperCase()}
              </span>
            </Checkbox>))
          }
        </CheckboxGroup>
        <I18nProvider locale="uk-UA">
          <DatePicker className="max-w-[180px]" label="Остання видача" value={startDate}
                      onChange={(date) => setStartDate(date)}/>
        </I18nProvider>
      </div>
      <div className="relative max-w-[500px] w-[95%]">
        <input value={value} onChange={(e) => setValue(e.target.value.trim())} type="text"
               placeholder="Прізвище або ІПН"
               className="w-full text-2xl p-1 border-2 rounded-m border-gray-300 mb-1 pr-4"/>
        {!!value.trim() && <span onClick={onClear}
                                 className="h-fit absolute right-1 top-[3px] bottom-0 py-1.5 px-3 bg-red-300">X</span>}
      </div>
      <div className="hidden sm:block">
        <div className="text-sm text-center pt-4 mb-2">
          Для масової перевірки завантажте файл .XLSX <br/>який містить всі ІПН бенефіціарів в колонці А
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
              <div>{el.activity.toUpperCase()}</div>
              <div>Дата отримання: {el?.date}</div>
              <div>{el.name}</div>
              <div>{el.taxNumber}</div>
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
