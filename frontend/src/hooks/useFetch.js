import { useEffect, useState } from "react";
import { BASE_URL } from "../config";

export default function useFetch(relUri, options) {
    const [data, setData] = useState(null)
    const [isPending, setIsPending] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        setData(null)
        setIsPending(true)
        setError(null)
        options.headers = { ...options.headers, 'authorization': 'BEARER ' + localStorage.getItem('token') }
        fetch(BASE_URL + relUri, options)
            .then(resp => {
                if (!resp.ok) throw Error('fetch failed')
                return resp.json()
            })
            .then(d => {
                setIsPending(false)
                setData(d)
                setError(null)
            })
            .catch(err => {
                setIsPending(false)
                setError(err.message)
                alert('something went wrong')
            })
    }, [relUri, options])

    return [data, setData, isPending, error]
}