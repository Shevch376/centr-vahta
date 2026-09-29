const SHEET_ID = '1Ohl2BJPEwj1YKwGOakKVNhEmEIutP-IzPmYDmf0e9CI';
const SHEET_NAME = 'Лист1';

function doPost(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ success: false, message: 'Лист не найден' });
  }

  ensureHeaders(sheet);
  const data = parsePayload(e);

  const headers = getHeaders(sheet);
  const row = new Array(headers.length).fill('');

  setCell(row, headers, ['дата отклика (+ время мск)', 'дата отклика', 'дата'], data.submittedAt || formatMoscowDate(new Date()));
  setCell(row, headers, ['телефон соискателя', 'телефон'], asText(data.phone));
  setCell(row, headers, ['фио соискателя', 'фио', 'имя'], data.name || '');
  setCell(row, headers, ['название вакансии', 'вакансия'], data.vacancy || '');
  setCell(row, headers, ['город вакансии', 'город проживания', 'город'], data.city || '');
  setCell(row, headers, ['возраст'], data.age || '');
  setCell(row, headers, ['источник перехода', 'источник'], data.trafficSource || '');

  // Статус и оператор намеренно не заполняются сайтом: эти поля ведутся вручную.
  sheet.appendRow(row);

  return jsonResponse({ success: true });
}

function ensureHeaders(sheet) {
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

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (value) {
    return String(value).trim().toLowerCase();
  });
}

function setCell(row, headers, names, value) {
  for (let i = 0; i < names.length; i += 1) {
    const index = headers.indexOf(names[i]);
    if (index !== -1) {
      row[index] = value;
      return;
    }
  }
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
