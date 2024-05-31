import { Config, HttpResponse, HttpResponseUnauthorized } from '@foal/core';
import axios from 'axios';
import { createHttpResponseObject } from '../utils/httpresponse.util';

export class Auth {

    async getAccessToken(touchpointId: string) : Promise<string | HttpResponse> {
        // Azure tenant settings
        const tenantId = Config.getOrThrow('aq.api.auth.tenantId');
        const apiKey = Config.getOrThrow('aq.api.auth.apiKey');
        const authorizationHeaderValue = `Basic ${Buffer.from(`${tenantId}:${apiKey}`, 'utf8').toString('base64')}`;
    
        const options = {
            url: `${Config.get('aq.api.url')}/api/touchpoint/${touchpointId}/access-token`,
            method: 'GET',
            headers: {
                'Authorization': authorizationHeaderValue
            }
        };
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {data, status, headers} = await axios.request(options);
            if( status != 200 ) {
                return new HttpResponseUnauthorized();
            }
            return data;
        }
        catch( error:any ) {
            return createHttpResponseObject(error.response.status, error.response.data);
        }
    }
}
