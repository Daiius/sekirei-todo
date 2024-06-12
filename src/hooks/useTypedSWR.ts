/**
 * APIの内部処理とuseSWRの型を自動で揃えてみたい
 *
 * 参考：https://zenn.dev/takepepe/articles/nextjs-typesafe-api-routes
 */


import useSWR from 'swr';

const useTypedSWR = <TypeDict>(url: keyof TypeDict) => 
  useSWR<TypeDict[typeof url]>(
    url as string,
    (url: string) => fetch(url).then(response => response.json())
  );

export default useTypedSWR;

