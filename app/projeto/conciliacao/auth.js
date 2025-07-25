import http from 'k6/http';

export function getAccessToken(){
    const url = 'https://auth4b3-pf.cert.netb3.com.br/as/token.oauth2';
    const payload = {
        client_id: '894_56E5CC8F_CLIENT',
        grant_type: 'password',
        username: 's-999_sincadnova_1',
        password: '0U2qROi3gM3Z',
        client_secret: 'zT8XYAxR9SbW5Eg7SwUpooidU7Ocqly6kiGgPIr3Czv7vv2I5o0erqRc2TTgvmqb',
    };

    const params = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    const response = http.post(url, payload, params);

    if (response.status === 200) {
        const body = JSON.parse(response.body);
        return body.access_token;
    } else {
        console.error('Falha ao obter o token de acesso', response.status, response.body);
        return null;
    }
}