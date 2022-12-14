import { NextApiRequestCookies } from 'next/dist/server/api-utils';
import { getAuthToken } from 'xBuilder/helpers/AuthToken/AuthToken';
import config from 'xBuilder/registry';

import { removeTrailingSlash } from '../Url/Url';

const methods = ['get', 'post', 'put', 'patch', 'del'];

const defaultHeaders: { [key: string]: { [key: string]: any } } = {
  get: {},
  post: {
    'Content-Type': 'application/json',
  },
  put: {},
  patch: {},
  del: {},
  common: {
    Accept: 'application/json',
  },
};

function formatUrl(path: string) {
  const { settings } = config;

  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const adjustedPath = path[0] !== '/' ? `/${path}` : path;

  return removeTrailingSlash(`${settings.internalApiPath}${adjustedPath}`);
}

export default class Api {
  [key: string]: (
    path: string,
    options?: {
      cache?: any;
      data?: any | undefined;
      headers?: {} | undefined;
    },
  ) => Promise<[any, any]>;
  constructor(nextCookies?: NextApiRequestCookies) {
    methods.forEach((method) => {
      this[method] = async (path, { data, headers = {}, ...rest } = {}) => {
        const authToken = getAuthToken(nextCookies);
        return fetch(formatUrl(path), {
          method: method.toUpperCase(),
          headers: {
            Accept: 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            ...defaultHeaders['common'],
            ...defaultHeaders[method],
            ...headers,
          },
          ...(data ? { body: JSON.stringify(data) } : {}),
          ...(rest || {}),
        }).then(async (response) => {
          const data = await response.json();
          if (response.ok) {
            return [data, null];
          }
          return [null, data];
        });
      };
    });
  }
}
