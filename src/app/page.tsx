'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
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
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/LoginForm';


enum ProjectsEnum {
  Norway = 'NORWAY',
  ECHO = 'ECHO',
  EA = 'EA',
  BHA = 'BHA'
}

export default function Home() {
  const {isLoggedIn, isLoading} = useAuth();

  const [selectedProjects, setSelectedProjects] = React.useState([ProjectsEnum.ECHO, ProjectsEnum.Norway, ProjectsEnum.EA, ProjectsEnum.BHA]);
  const [value, setValue] = useState<string>('');
  const [fetching, setFetching] = useState<boolean>(false);
  const [loadedAt, setLoadedAt] = useState<string>('-');
  const [columnAData, setColumnAData] = useState<number[]>([]);
  const [responseData, setResponseData] = useState<{
    name: string;
    date: string;
    type: string;
    taxNumber: string,
    project: ProjectsEnum
  }[]>([]);
  const ref = useRef<any>(null);
  const loadedAtRef = useRef<number>(0);
  const [startDate, setStartDate] = React.useState<CalendarDate | null>(today(getLocalTimeZone()).subtract({months: 3}));

  const fetchData = (shouldSetLoading = true) => {
    if ((Date.now() - loadedAtRef.current) < 1000 * 60 * 30) {
      return;
    }
    setFetching(shouldSetLoading);
    const mainUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const tableId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_TABLE_ID;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;
    let loadedRecords: any[] = [];
    const norwayKindPromise = axios.get(`${mainUrl}/${tableId}/values/norway-kind!A2:G?key=${apiKey}`).then((res) => {
      const res1 = res.data.values.filter((el: any) => !!el.length).map((item: any) => ({
        name: `${item?.at(1)} ${item?.at(2)} ${item?.at(3)}`,
        type: 'NORWAY набори',
        date: item?.at(0),
        taxNumber: item?.at(5),
        project: ProjectsEnum.Norway,
      })) || [];
      loadedRecords.push(...res1);
    });
    const EACashPromise = axios.get(`${mainUrl}/${tableId}/values/ea-cash!A2:G?key=${apiKey}`).then((res) => {
      const res2 = res.data.values.filter((el: any) => !!el.length).map((item: any) => ({
        name: `${item?.at(1)} ${item?.at(2)} ${item?.at(3)}`,
        type: 'EA ваучер',
        date: item?.at(0),
        taxNumber: item?.at(5),
        project: ProjectsEnum.EA,
      })) || [];
      loadedRecords.push(...res2);
    });
    const EAPromise = axios.get(`${mainUrl}/${tableId}/values/ea-kind!A2:G?key=${apiKey}`).then((res) => {
      const res3 = res.data.values.filter((el: any) => !!el.length).map((item: any) => ({
        name: `${item?.at(1)} ${item?.at(2)} ${item?.at(3)}`,
        type: 'EA набори',
        date: item?.at(0),
        taxNumber: item?.at(5),
        project: ProjectsEnum.EA,
      })) || [];
      loadedRecords.push(...res3);
    });
    const BHAPromise = axios.get(`${mainUrl}/${tableId}/values/bha-kind!A2:G?key=${apiKey}`).then((res) => {
      const res4 = res.data.values.filter((el: any) => !!el.length).map((item: any) => ({
        name: `${item?.at(1)} ${item?.at(2)} ${item?.at(3)}`,
        type: 'BHA набори',
        date: item?.at(0),
        taxNumber: item?.at(5),
        project: ProjectsEnum.BHA,
      })) || [];
      loadedRecords.push(...res4);
    });

    const ECHOPromise = axios.get(`${mainUrl}/${tableId}/values/echo!A2:G?key=${apiKey}`).then((res) => {
      const res5 = res.data.values.filter((el: any) => !!el.length).map((item: any) => ({
        name: `${item?.at(1)} ${item?.at(2)} ${item?.at(3)}`,
        type: 'ECHO набори',
        date: item?.at(0),
        taxNumber: item?.at(5),
        project: ProjectsEnum.ECHO,
      })) || [];
      loadedRecords.push(...res5);
    });

    axios.get(`${mainUrl}/${tableId}/values/updates!B1?key=${apiKey}`).then((res) => {
      setLoadedAt(res?.data?.values?.at(0)?.at(0))
    });
    const showToast = () => {
      addToast({
        title: 'Помилка імпорту Google Sheets',
        description: 'Будь ласка перезавантажте сторінку',
        color: 'danger',
        timeout: 1000 * 120,
      });
    }
    Promise.allSettled([norwayKindPromise, EACashPromise, EAPromise, BHAPromise, ECHOPromise]).then(() => {
      setFetching(false);
      setResponseData(loadedRecords);
      if (loadedRecords.length < 500) {
        showToast();
      }
      loadedAtRef.current = Date.now();
    }).catch(() => {
      setFetching(false);
      setResponseData([]);
      showToast();
      alert()
    });
  }

  function dateToCalendarDate(date: Date) {
    return new CalendarDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
  }

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    fetchData();
    const handleFocus = () => {
      fetchData(false)
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [isLoggedIn]);

  const list = useMemo(() => {
    const filteredByProjectAndDate = responseData.filter((el) => selectedProjects.includes(el.project) && (!el.date || !startDate || dateToCalendarDate(parse(el.date, 'dd.MM.yyyy', new Date())).compare(startDate) >= 0));

    if (value.trim() && value.length > 2) {
      return filteredByProjectAndDate.filter((el) => (el?.taxNumber?.startsWith('0') ? parseInt(el.taxNumber)?.toString() : el.taxNumber)?.startsWith(value?.startsWith('0') ? parseInt(value)?.toString() : value) || el?.name?.toLowerCase()?.startsWith(value.toLowerCase()))
    } else if (columnAData.length > 0) {
      return filteredByProjectAndDate.filter((el) => columnAData.includes(parseInt(el.taxNumber)));
    } else {
      return [];
    }
  }, [value, responseData, columnAData, startDate, selectedProjects])

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
      Проект: r.project || '',
      Активність: r.type || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows, {header: ['Дата', 'Бенефіціар', 'ІПН', 'Проект', 'Активність']});
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');

    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `wash_check_${ts}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  if (!isLoggedIn) {
    return <LoginForm/>
  }


  return fetching || isLoading ? (<div className="w-full h-[100vh] flex justify-center items-center">
    <Image src={loader} alt={'loading'} className="my-5"/>
  </div>) : (
    <div className="min-h-screen flex items-center  flex-col bg-gray-100 pt-[40px]">
      <div className="text-sm">
        Завантажено бенефіціарів: {responseData.length}
      </div>
      <div className="text-sm">
        Бази оновлено: {loadedAt}
      </div>
      <div className="text-center mb-4 px-10 text-xl max-w-[500px] pt-8">
        Перевірка реєстрації в базах WASH
      </div>
      <div className="flex flex-col gap-5 max-w-[500px] w-[95%] mb-5 items-center">
        <CheckboxGroup value={selectedProjects}
                       onValueChange={(values) => {
                         if (values.length === 0) return;
                         setSelectedProjects(values as ProjectsEnum[]);
                       }}
                       orientation="horizontal">
          <Checkbox value={ProjectsEnum.ECHO}>ECHO</Checkbox>
          <Checkbox value={ProjectsEnum.Norway}>NORWAY</Checkbox>
          <Checkbox value={ProjectsEnum.EA}>EA</Checkbox>
          <Checkbox value={ProjectsEnum.BHA}>BHA</Checkbox>
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
              <div>{el.type}</div>
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
