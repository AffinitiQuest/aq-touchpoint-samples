import { Config, HttpResponse, HttpResponseBadRequest, HttpResponseUnauthorized } from '@foal/core';
import axios from 'axios';

export class Auth {

    async getAccessToken() : Promise<string | HttpResponse> {
        // Azure tenant settings
        const tenantId = Config.get('auth.tenantId');
        const clientId = Config.get('auth.clientId');
        const clientSecret= Config.get('auth.clientSecret');

        const options = {
            url: `${Config.get('demoTouchpoints.api')}/api/authenticate`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: {tenantId: tenantId, clientId: clientId, clientSecret: clientSecret}
        };
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {data, status, headers} = await axios.request(options);
            if( status != 200 ) {
                return new HttpResponseUnauthorized();
            }
            return data.accessToken;
        }
        catch( e ) {
            return new HttpResponseBadRequest(e);
        }
    }
}
