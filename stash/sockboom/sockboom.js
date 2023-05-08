/**
* @file Sockboom Tile for stash, show sockboom info & checkin
* @author r.4ntix <r.4ntix@gmail.com>
* @copyright Copyright (c) 2023 r.4ntix
* @license MIT License
* @github https://github.com/r4ntix/pouch
*/

/* eslint-disable no-console */
/* eslint-disable no-undef */
const sockboomApi = 'https://api.sockboom.click/client';
const sockboomToken = $persistentStore.read('sockboom_token');
const userLevel = ['Normal', 'VIP', 'Staff'];
const sizes = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];

function bitsToSize(bits) {
  if (bits === 0) return '0b';
  const i = Math.floor(Math.log(bits) / Math.log(1024));
  return `${(bits / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}

function nowTime() {
  const now = new Date();
  return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
}

function getTrafficInfo() {
  const url = `${sockboomApi}/traffic?token=${sockboomToken}`;
  return new Promise((resolve, reject) => {
    $httpClient.get(url, (error, response, data) => {
      if (error) {
        reject(error);
        return;
      }

      // parse data
      const respData = JSON.parse(data);
      if (respData.success !== 1) {
        reject(data);
        return;
      }

      // gen content
      const { money, days } = respData.data;
      const userType = userLevel[respData.data.class];
      const usedToday = bitsToSize(respData.data.used_today);
      const usedTotal = bitsToSize(respData.data.used_total);
      const unused = bitsToSize(respData.data.unused);

      resolve(`User: ${userType} | ${money} ¥\nUsage: ${usedToday} | ${usedTotal}\nCredit: ${unused} | ${days} days`);
    });
  }).catch((error) => console.log(error));
}

function checkin() {
  const url = `${sockboomApi}/checkin?token=${sockboomToken}`;
  return new Promise((resolve, reject) => {
    $httpClient.get(url, (error, response, data) => {
      if (error) {
        reject(error);
        return;
      }

      // parse data
      const respData = JSON.parse(data);
      if (respData.success === -1) {
        reject(data);
        return;
      }

      const checkInTime = nowTime();

      // already checked in
      if (respData.success === 0) {
        resolve(`Last check in: ${checkInTime} | ${$persistentStore.read('sockboom_checkin_traffic')}`);
        return;
      }

      // gen content
      const traffic = bitsToSize(respData.traffic);
      const content = `Last check in: ${checkInTime} | ${traffic}`;

      $persistentStore.write(traffic, 'sockboom_checkin_traffic');
      resolve(content);
    });
  }).catch((error) => console.log(error));
}

Promise.all([getTrafficInfo(), checkin()]).then((content) => $done({
  content: content.join('\n').trim(),
}));
