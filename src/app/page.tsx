"use client"
import {useEffect, useMemo, useState} from "react";
import axios from "axios";
import Image from "next/image";
import done from "../assets/tick-green-icon.svg";
import loader from "../assets/tube-spinner.svg";

export default function Home() {
    const [value, setValue] = useState<string>("");
    const [fetching, setFetching] = useState<boolean>(false);
    const [loadedAt, setLoadedAt] = useState<string>("-");
    const [responseData, setResponseData] = useState<{ name: string; date: string; type: string; taxNumber: string }[]>([]);


    const fetchData = () => {
        setFetching(true);
        const mainUrl = "https://sheets.googleapis.com/v4/spreadsheets";
        const tableId = "1MD26xAwUc5VKlcjTUA0zEtC2OjKifsQ1uDiu7PB18vw";
        let loadedRecords: any[] = [];
        const promise1 = axios.get(`${mainUrl}/${tableId}/values/norway-kind!A2:G?key=AIzaSyCU8tCOqT2YIhxyw_v5_juaK4tiYuZdkXM`).then((res) => {
            const res1 = res.data.values.filter((el: any) => !!el.length).map((item: any) => ({
                name: `${item?.at(1)} ${item?.at(2)} ${item?.at(3)}`,
                type: "NORWAY набори",
                date: item?.at(0),
                taxNumber: item?.at(5)
            })) || [];
            loadedRecords.push(...res1);
        });
        const promise2 = axios.get(`${mainUrl}/${tableId}/values/norway-cash!A2:G?key=AIzaSyCU8tCOqT2YIhxyw_v5_juaK4tiYuZdkXM`).then((res) => {
            const res2 = res.data.values.filter((el: any) => !!el.length).map((item: any) => ({
                name: `${item?.at(1)} ${item?.at(2)} ${item?.at(3)}`,
                type: "NORWAY ваучер",
                date: item?.at(0),
                taxNumber: item?.at(4)
            })) || [];
            loadedRecords.push(...res2);
        });
        const promise3 = axios.get(`${mainUrl}/${tableId}/values/ea-kind!A2:G?key=AIzaSyCU8tCOqT2YIhxyw_v5_juaK4tiYuZdkXM`).then((res) => {
            const res3 = res.data.values.filter((el: any) => !!el.length).map((item: any) => ({
                name: `${item?.at(1)} ${item?.at(2)} ${item?.at(3)}`,
                type: "EA набори",
                date: item?.at(0),
                taxNumber: item?.at(5)
            })) || [];
            loadedRecords.push(...res3);
        });
        const promise4 = axios.get(`${mainUrl}/${tableId}/values/bha-kind!A2:G?key=AIzaSyCU8tCOqT2YIhxyw_v5_juaK4tiYuZdkXM`).then((res) => {
            const res4 = res.data.values.filter((el: any) => !!el.length).map((item: any) => ({
                name: `${item?.at(1)} ${item?.at(2)} ${item?.at(3)}`,
                type: "BHA набори",
                date: item?.at(0),
                taxNumber: item?.at(5)
            })) || [];
            loadedRecords.push(...res4);
        });
        axios.get(`${mainUrl}/${tableId}/values/updates!B1?key=AIzaSyCU8tCOqT2YIhxyw_v5_juaK4tiYuZdkXM`).then((res) => {
            setLoadedAt(res?.data?.values?.at(0)?.at(0))
        });
        Promise.allSettled([promise1, promise2, promise3, promise4]).then(() => {
            setFetching(false);
            setResponseData(loadedRecords);
            if (loadedRecords.length < 2400) {
                alert("Помилка імпорту Google Sheets. Будь ласка перезавантажте сторінку")
            }
        }).catch(() => {
            setFetching(false);
            setResponseData([]);
            alert("Помилка імпорту Google Sheets. Будь ласка перезавантажте сторінку")
        });
    }

    useEffect(fetchData, [])

    const list = useMemo(() => {
        if (value.trim() && value.length > 2) {
            return responseData.filter((el) => el?.taxNumber?.startsWith(value) || el?.name?.toLowerCase()?.startsWith(value.toLowerCase()))
        } else {
           return [];
        }
    }, [value, responseData])

    const onClear = () => {
        setValue("");
    };


    return fetching ? (<div className="w-full h-[100vh] flex justify-center items-center">
        <Image src={loader} alt={"loading"} className="my-5"/>
    </div>) : (
        <div className="min-h-screen flex items-center  flex-col bg-gray-100">
            <div className="text-sm">
                Завантажено бенефіціарів: {responseData.length}
            </div>
            <div className="text-sm">
               {loadedAt}
            </div>
            <div className="text-center mb-4 px-10 text-xl max-w-[500px] pt-8">
                Перевірка реєстрації в базах Norway, EA, BHA
            </div>
            <div className="relative max-w-[500px] w-[95%]">
                <input value={value} onChange={(e) => setValue(e.target.value.trim())} type="text"
                       placeholder="Прізвище або ІПН"
                       className="w-full text-2xl p-1 border-2 rounded-m border-gray-300 mb-1 pr-4"/>
                {!!value.trim() && <span onClick={onClear}
                                         className="h-fit absolute right-1 top-[3px] bottom-0 py-1.5 px-3 bg-red-300">X</span>}
            </div>

            {value ? <div className="w-full max-w-[500px]">
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
            </div> : ""}
            {value && value.length > 2 && list?.length === 0 &&
                <div className="flex flex-col justify-center items-center text-xl">
                    <Image width={50} src={done} alt={"Ok"} className="my-5"/>
                    Бенефіціара не знайдено
                </div>}
        </div>
    );
}
