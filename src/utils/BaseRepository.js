import { parameterize } from './request.js'

export class BaseRepository {
  constructor(endpoint) {
    this.endpoint = endpoint
  }
  async query ({
    method = 'GET',
    nestedEndpoint = '',
    urlParameters = {},
    data = undefined,
    headers = {}
  }) {
    const url = parameterize(`${this.endpoint}${nestedEndpoint}`, urlParameters);
    return await fetch(url, {
      method, headers,
      body: data,
    })
  }
  async get (id = '') {
    return await this.query({
        method: 'GET',
        nestedEndpoint: `/${id}`
    })
  }
  async post (requestBody) {
    return await this.query({
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        data: JSON.stringify(requestBody),
    })
  }
  async put (id = '', requestBody) {
    return await this.query({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        nestedEndpoint: `/${id}`,
        data: JSON.stringify(requestBody),
    })
  }
  async delete (id = '') {
    return await this.query({
        method: 'DELETE',
        nestedEndpoint: `/${id}`
    })
  }
  async list () {
    return await this.query({});
  }
}
