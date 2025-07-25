import http from 'k6/http';
import { check, group, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 250 }, // Ramp up to 250 users over 1 minute
    { duration: '2m', target: 250 }, // Stay at 250 users for 2 minutes
    { duration: '1m', target: 0 }, // Ramp down to 0 users over 1 minute
  ],
};

const url = 'https://sincad-docgen-cer.internalenv.azr/api/cvm-documents/v1/cvm';
const participantOperationalCodes = [120, 420, 999, 3, 9];

export default function () {
  group('Test with participantOperationalCode 120', function () {
    testApi(120);
  });

  group('Test with participantOperationalCode 420', function () {
    testApi(420);
  });

  group('Test with participantOperationalCode 999', function () {
    testApi(999);
  });

  group('Test with participantOperationalCode 3', function () {
    testApi(3);
  });

  group('Test with participantOperationalCode 9', function () {
    testApi(9);
  });
}

function testApi(participantOperationalCode) {
  const payload = JSON.stringify({
    participantOperationalCode: participantOperationalCode,
    investorDocumentNumber: "",
    investorName: "Teste Name",
    registrationCountryCode: 72,
    motherName: "Nome campos",
    sexCode: "F",
    birthDate: "1996-12-17",
    emailName: "teste@hotmail.com",
    address: {
      publicPlaceName: "Teste",
      addressComplementDescription: "string",
      publicPlaceNumber: "string",
      stateName: "Sao paulo",
      cityName: "Caracas",
      neighborhoodName: "Centro",
      countryCode: 102,
      federativeUnitCode: 35,
      dneLocationCode: "string",
      zipCode: ""
    }
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'charset': 'utf-8',
      'Accept': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Il82Nm5jNzRMVEh0WWg2MXAzSHZGY1R1MkJva19SUzI1NiIsInBpLmF0bSI6IjFoMnEifQ.eyJzY29wZSI6IiIsImNsaWVudF9pZCI6Ijg5NF81NkU1Q0M4Rl9DTElFTlQiLCJpc3MiOiJodHRwczovL2F1dGg0YjMtcGYuY2VydC5uZXRiMy5jb20uYnIiLCJhdWQiOiJleHRlcm5hbF9wcml2YXRlX2FwaSIsImp0aSI6Ik1PMk5XZ2lObDN4YVdaajdnZXFycjEiLCJyb2xlcHJlZml4IjpbIkFQSUdXIl0sInN1YiI6Ijk5OSIsImRvY3VtZW50IjoiNDMxODc5NjcxMDgiLCJyb2xlcyI6WyJBUElHV19TSU5DQUQtU09MSUNET0NUT0NWTV9CVk1GIl0sIm5hbWUiOiJHaW92YW5uaSIsImRvY3VtZW50dHlwZSI6IkNQRiIsImNuIjoidXNlcl90ZXN0MDEyMSIsInVzZXJpZCI6InVzZXJfdGVzdDAxMjEiLCJsYXN0bmFtZSI6IkNvZWxobyBDaGlhZ3VldHRpIiwiZXhwIjoxNzQxNzA0MTUwfQ.IaiqBJgyBkIDW-g8Ke2LzwnOKtDTO5Y0Aknaa00MG2aWL1zauM_hxqBrjtTqlQzIEhtYe6vthPkjxdByN5k6Q7ezjGnQvcconYy4GCmkNvqK9FIx9u0DX2jYZpVxlZ8MIgqjoQbLxXCOZYX_xp03b40Sf1jTTKDU-zdbfix9AnyAXwbtBs-RfWKsJH8e9am_qB9Nl0UHxSg1-awzTRNOyoB402YU0KI60Sb3IgUmDbWSCtI8jxoepE7QjK3fq0FsoSL2kF7Lf14rqTQPTuohhvQjjtSdbJlucwbkIFdMvV-CilhrlnpMDdYIhduZWc-GHxlDJEVZmjwV0h5HjEd2iQ'
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'is status 201': (r) => r.status === 201,
  });

  if (res.status !== 201) {
    console.error(`Error: Status ${res.status} - ${res.body}`);
  }

  sleep(1);
}