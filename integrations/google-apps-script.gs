const SHEET_ID = '1Ohl2BJPEwj1YKwGOakKVNhEmEIutP-IzPmYDmf0e9CI';
const SHEET_NAME = 'Лист1';

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ success: false, message: 'Лист не найден' });
  }

  ensureTrafficSourceColumn(sheet);
  const data = parsePayload(e);

  sheet.appendRow([
    data.submittedAt || formatMoscowDate(new Date()),
    asText(data.phone),
    data.name || '',
    data.vacancy || '',
    data.city || '',
    data.age || '',
    data.trafficSource || '',
    '',
    ''
  ]);

  return jsonResponse({ success: true });
}

function ensureTrafficSourceColumn(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  const headers = headerRange.getValues()[0].map(function (value) {
    return String(value).trim().toLowerCase();
  });

  if (headers.indexOf('источник перехода') !== -1) {
    return;
  }

  const statusIndex = headers.indexOf('статус');
  if (statusIndex !== -1) {
    sheet.insertColumnBefore(statusIndex + 1);
    sheet.getRange(1, statusIndex + 1).setValue('Источник перехода');
    return;
  }

  sheet.getRange(1, sheet.getLastColumn() + 1).setValue('Источник перехода');
}

function parsePayload(e) {
  const contents = e && e.postData ? e.postData.contents : '{}';
  try {
    return JSON.parse(contents || '{}');
  } catch (error) {
    return {};
  }
}

function formatMoscowDate(date) {
  return Utilities.formatDate(date, 'Europe/Moscow', 'dd.MM.yyyy HH:mm:ss');
}

function asText(value) {
  return value ? "'" + String(value) : '';
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
