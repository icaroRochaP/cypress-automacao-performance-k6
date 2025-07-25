import http from 'k6/http';
import { check, sleep } from 'k6';
import { getAccessToken } from './auth.js';

export const options = {
  vus: 1,
  duration: '1s'
};

export default function () {
  const url = 'https://data-quality-neoway-dev.internalenv.azr/api/holders-data-updates/v1/registration-data';

  const documentChangeArray = [];
  for (let i = 0; i < 501; i++) {
    documentChangeArray.push({
      documentTypeCode: 1,
      documentCodeNumber: `string_${i}`, 
      changeData: {
        nameOrCorporateNameIndicator: true,
        birthDateOrFoundationDateIndicator: true,
        economicActivityPJIndicator: true,
        constitutionFormPJIndicator: true,
      },
    });
  }

  const payload = JSON.stringify({
    data: {
      participantOperationalCode: 1073741824,
      ownAccountNumber: 'string',
      documentChange: documentChangeArray,
    },
  });

  const accessToken = getAccessToken();

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'CAU_PARTIC': '999',
      'CAU_APPROLE': 'ICADX_USR-INTERNO-CONTAS_BVMF',
      'SM_USER': 'Rayssa',
      'CAU_NAME': 'Ribemboim',
      'CAU_SN': 'Nunes',
      'Authorization': `Bearer ${accessToken}`,
    },
  };

  const res = http.post(url, payload, params);

  console.log(`Status Code: ${res.status}`);
  console.log('Response body: ', res.body);

  
  const responseBody = JSON.parse(res.body);

  
  const hasExpectedError = responseBody.errors && responseBody.errors.some(error => 
    error.code === "422" && error.title === "Unprocessable Entity" && error.detail === "Limite maximo por lote é 500"
  );

  check(res, {
    'is status 422': (r) => r.status === 422,
    'has expected error': () => hasExpectedError,
  });

 
  if (!hasExpectedError) {
    fail('Did not receive the expected error message');
  }
}