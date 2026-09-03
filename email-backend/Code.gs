const RECIPIENT = 'jcbowstring@hotmail.com';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const fileName = String(payload.fileName || 'Soil-Profile-Field-Notes.json');
    const subject = String(payload.subject || 'Soil Profile Field Notes');
    const body = String(payload.body || 'Attached is the exported Soil Profile Field Notes report.');
    const jsonText = String(payload.json || '{}');

    if (jsonText.length > 5 * 1024 * 1024) {
      throw new Error('Report is too large to email.');
    }

    const attachment = Utilities.newBlob(jsonText, 'application/json', fileName);
    GmailApp.sendEmail(RECIPIENT, subject, body, {
      attachments: [attachment],
      name: 'Soil Profile Field Notes'
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err && err.message || err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'Soil Profile Field Notes email sender' }))
    .setMimeType(ContentService.MimeType.JSON);
}
