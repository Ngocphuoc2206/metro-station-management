/* eslint-disable */
const axios = require('axios');

const baseUrl = 'http://15.134.61.110:8080/api/v1';

async function tryLogin(email, password) {
  try {
    const res = await axios.post(`${baseUrl}/auth/login`, { email, password });
    console.log(`SUCCESS login with ${email}:${password}`);
    console.log(JSON.stringify(res.data, null, 2));
    return res.data.results.token;
  } catch (err) {
    console.log(`FAILED login with ${email}:${password} - ${err.response?.status} ${JSON.stringify(err.response?.data)}`);
    return null;
  }
}

async function main() {
  const passwords = ['123456', '12345678', 'password', 'admin123', 'admin', 'Admin@123'];
  for (const pwd of passwords) {
    const token = await tryLogin('admin@test.vn', pwd);
    if (token) {
      console.log('Token found:', token);
      break;
    }
  }
}

main();
