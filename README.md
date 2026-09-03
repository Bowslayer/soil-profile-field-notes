# Soil Profile Field Notes

This GitHub repository is the authoritative master copy of the Soil Profile Field Notes field app.

## Current workflow
- Open the GitHub Pages Soil Profile Field Notes app on the phone.
- Complete the soil profile in the field.
- Use **Export / Email Report** to submit the completed report.
- The app sends the report through the configured Google Apps Script email service.
- The completed report is attached to the email as a `.json` file.
- If Outlook places the message in Junk and blocks the JSON attachment, move the message to the Inbox; the attachment can then become accessible.

## Important maintenance rule
When updating or retrieving the Soil Profile Field Notes app, use this GitHub repository as the authoritative current source. Keep the working app, email sender, service worker, and email configuration synchronized here.

## How to ask ChatGPT for it
Say: **“Open my Soil Profile Field Notes app.”**

For the newest version specifically, say: **“Open the current Soil Profile Field Notes app from GitHub.”**

ChatGPT should retrieve the current master from this repository rather than an older downloaded or Library copy.
