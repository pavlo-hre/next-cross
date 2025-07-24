"use client"
import {useEffect, useState} from "react";
import axios from "axios";
import {useDebouncedCallback} from 'use-debounce';

export default function Home() {
    const [value, setValue] = useState<string>("");
    const [norwayData, setNorwayData] = useState<any[]>([])
    const [norwayDataCash, setNorwayDataCash] = useState<any[]>([])
    const [res, setRes] = useState<{name: string; date: string; type: string; taxNumber: string}[]>([])

    const onEnterPres = (e: any) => {
        if (e.code === "Enter") {
            onCheck();
        }
    }

    useEffect(() => {
        const mainUrl = "https://sheets.googleapis.com/v4/spreadsheets";
        const tableId = "1MD26xAwUc5VKlcjTUA0zEtC2OjKifsQ1uDiu7PB18vw";
        axios.get(`${mainUrl}/${tableId}/values/norway-kind!A2:G?key=AIzaSyCU8tCOqT2YIhxyw_v5_juaK4tiYuZdkXM`).then((res) => {
            setNorwayData(res.data.values)
        });
        axios.get(`${mainUrl}/${tableId}/values/norway-cash!A2:G?key=AIzaSyCU8tCOqT2YIhxyw_v5_juaK4tiYuZdkXM`).then((res) => {
            setNorwayDataCash(res.data.values.filter((el: any) => !!el.length))
        });
    }, [])


    const onCheck = useDebouncedCallback(() => {
        if (value.trim() && value.length > 2) {
            const filteredNorwayKind = norwayData.filter((el: any[]) => !!el[5] && el[5]?.startsWith(value) || !!el[1] && el[1]?.toLowerCase()?.startsWith(value.toLowerCase()));
            const filteredNorwayCash = norwayDataCash.filter((el: any[]) => !!el[4] && el[4]?.startsWith(value) || !!el[1] && el[1]?.toLowerCase()?.startsWith(value.toLowerCase()));
            setRes([...filteredNorwayKind.map((el) => ({
                name: `${el?.at(1)} ${el?.at(2)} ${el?.at(3)}`,
                type: "NORWAY набори",
                date: el?.at(0),
                taxNumber: el?.at(5)
            })), ...filteredNorwayCash.map((el) => ({
                name: `${el?.at(1)} ${el?.at(2)} ${el?.at(3)}`,
                type: "NORWAY ваучер",
                date: el?.at(0),
                taxNumber: el?.at(4)
            }))]);

        } else {
            setRes([])
        }
    }, 500)

    useEffect(() => {
        onCheck();
    }, [value]);

    console.log(res)

    return (
        <div className="min-h-screen flex items-center pt-8 flex-col bg-gray-100">
            <h1 className={"text-2xl mb-4"}>WASH cross checking</h1>
            <input value={value} onChange={(e) => setValue(e.target.value.trim())} type="text"
                   placeholder="Введіть Прізвище або ІПН"
                   className="w-[300px] p-1 border-2 rounded-m border-gray-300 mb-2.5 " onKeyDown={onEnterPres}/>


            {value ? <div className="py-8 w-full">
                {
                    res.map((el, index: number) => (
                        <div className="mb-2 border-b-2 border-gray-300 p-5">
                            <div>{el.type}</div>
                            <div>Дата отримання: {el?.date}</div>
                            <div>{el.name}</div>
                            <div>{el.taxNumber}</div>
                        </div>
                    ))
                }
            </div> : ""}
        </div>
    );
}
