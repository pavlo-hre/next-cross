"use client"
import {useEffect, useRef, useState} from "react";
import axios from "axios";
import {useDebouncedCallback} from 'use-debounce';
import Image from "next/image";
import done from "../assets/tick-green-icon.svg";
import loader from "../assets/tube-spinner.svg"

export default function Home() {
    const [value, setValue] = useState<string>("");
    const ref = useRef<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fetching, setFetching] = useState<boolean>(false);
    const [norwayDataKind, setNorwayDataKind] = useState<any[]>([]);
    const [eaDataKind, setEaDataKind] = useState<any[]>([]);
    const [norwayDataCash, setNorwayDataCash] = useState<any[]>([]);
    const [res, setRes] = useState<{ name: string; date: string; type: string; taxNumber: string }[]>([])

    const onEnterPres = (e: any) => {
        if (e.code === "Enter") {
            onCheck();
        }
    }


    const fetchData = () => {
        setFetching(true);
        const mainUrl = "https://sheets.googleapis.com/v4/spreadsheets";
        const tableId = "1MD26xAwUc5VKlcjTUA0zEtC2OjKifsQ1uDiu7PB18vw";
        const promise1 = axios.get(`${mainUrl}/${tableId}/values/norway-kind!A2:G?key=AIzaSyCU8tCOqT2YIhxyw_v5_juaK4tiYuZdkXM`).then((res) => {
            setNorwayDataKind(res.data.values);
        });
        const promise2 = axios.get(`${mainUrl}/${tableId}/values/norway-cash!A2:G?key=AIzaSyCU8tCOqT2YIhxyw_v5_juaK4tiYuZdkXM`).then((res) => {
            setNorwayDataCash(res.data.values.filter((el: any) => !!el.length));
        });
        const promise3 = axios.get(`${mainUrl}/${tableId}/values/ea-kind!A2:G?key=AIzaSyCU8tCOqT2YIhxyw_v5_juaK4tiYuZdkXM`).then((res) => {
            setEaDataKind(res.data.values.filter((el: any) => !!el.length));
        });
        Promise.allSettled([promise1, promise2, promise3]).then(() => {
            setFetching(false);
        });
    }

    useEffect(fetchData, [])


    const onCheck = useDebouncedCallback(() => {
        if (value.trim() && value.length > 2) {
            const filteredEaKind = eaDataKind.filter((el: any[]) => !!el[5] && el[5]?.startsWith(value) || !!el[1] && el[1]?.toLowerCase()?.startsWith(value.toLowerCase()));
            const filteredNorwayKind = norwayDataKind.filter((el: any[]) => !!el[5] && el[5]?.startsWith(value) || !!el[1] && el[1]?.toLowerCase()?.startsWith(value.toLowerCase()));
            const filteredNorwayCash = norwayDataCash.filter((el: any[]) => !!el[4] && el[4]?.startsWith(value) || !!el[1] && el[1]?.toLowerCase()?.startsWith(value.toLowerCase()));
            setRes([...filteredNorwayKind.map((el) => ({
                name: `${el?.at(1)} ${el?.at(2)} ${el?.at(3)}`,
                type: "NORWAY набори",
                date: el?.at(0),
                taxNumber: el?.at(5)
            })), ...filteredEaKind.map((el) => ({
                name: `${el?.at(1)} ${el?.at(2)} ${el?.at(3)}`,
                type: "EA набори",
                date: el?.at(0),
                taxNumber: el?.at(5)
            })), ...filteredNorwayCash.map((el) => ({
                name: `${el?.at(1)} ${el?.at(2)} ${el?.at(3)}`,
                type: "NORWAY ваучер",
                date: el?.at(0),
                taxNumber: el?.at(4)
            }))]);
            setLoading(false);

        } else {
            setRes([]);
            setLoading(false);
        }
    }, 500);

    const onClear = () => {
        setValue("");
        ref.current?.focus();
    }

    useEffect(() => {
        setLoading(true);
        onCheck();
    }, [value]);

    return fetching ? (<div className="w-full h-[100vh] flex justify-center items-center">
        <Image src={loader} alt={"loading"} className="my-5"/>
    </div>) : (
        <div className="min-h-screen flex items-center pt-8 flex-col bg-gray-100">
            <div className="text-center mb-4 px-10 text-xl max-w-[500px]">
                Перевірка реєстрації в базах Norway, EA, BHA
            </div>
            <div className="relative max-w-[500px] w-[95%]">
                <input value={value} onChange={(e) => setValue(e.target.value.trim())} type="text"
                       placeholder="Прізвище або ІПН"
                       className="w-full text-2xl p-1 border-2 rounded-m border-gray-300 mb-1 pr-4"
                       onKeyDown={onEnterPres}/>
                {!!value.trim() && <span onClick={onClear}
                                         className="h-fit absolute right-1 top-[3px] bottom-0 py-1.5 px-3 bg-red-300">X</span>}
            </div>

            {value ? <div className="w-full max-w-[500px]">
                {
                    res.map((el, index: number) => (
                        <div className="mb-2 border-b-2 border-gray-300 p-5" key={`${index}_${el.taxNumber}`}>
                            <div>{el.type}</div>
                            <div>Дата отримання: {el?.date}</div>
                            <div>{el.name}</div>
                            <div>{el.taxNumber}</div>
                        </div>
                    ))
                }
            </div> : ""}
            {value && value.length > 2 && res.length === 0 && !loading &&
                <div className="flex flex-col justify-center items-center text-xl">
                    <Image width={50} src={done} alt={"Ok"} className="my-5"/>
                    Бенефіціара не знайдено
                </div>}
        </div>
    );
}
