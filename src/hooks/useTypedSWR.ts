/**
 * APIの内部処理とuseSWRの型を自動で揃えてみたい
 *
 * 参考：https://zenn.dev/takepepe/articles/nextjs-typesafe-api-routes
 */


import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { GetApiTypes } from '@/types/api';

const useTypedSWR = <Url extends keyof GetApiTypes>(
  url: keyof GetApiTypes,
  params: SWRConfiguration,
): SWRResponse<GetApiTypes[Url]> => 
  useSWR<GetApiTypes[typeof url]>(
    url as string,
    (url: string) => fetch(url).then(response => response.json()),
    params,
  );

export default useTypedSWR;

