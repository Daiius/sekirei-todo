
import { GetApiTypes, PostBodyTypes } from '@/types/api';

const typedFetch = <Url extends keyof GetApiTypes | keyof PostBodyTypes>(
  url: keyof GetApiTypes | keyof PostBodyTypes,
  body?: PostBodyTypes[Url],
) => {
}; 

