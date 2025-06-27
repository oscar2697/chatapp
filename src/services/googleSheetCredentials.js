import path from 'path';
import { google } from 'googleapis';
import config from '../config/env.js';

const sheets = google.sheets('v4')

async function addRowToSheet(auth, spreadsheetId, values, sheetName) {
    const request = {
        spreadsheetId,
        range: sheetName,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
            values: [values],
        },
        auth,
    }

    try {
        const response = (await sheets.spreadsheets.values.append(request).data)
        return response
    } catch (error) {
        console.error(error)
    }
}

const appendToSheet = async (data, sheetName = 'Citas') => {
    try {
        const credentials = config.GOOGLE_CREDENTIALS

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        })

        const authClient = await auth.getClient()
        const spreadsheetId = '1zMiR8f3kt9_wTlnp58tRTMR0aKEQA0Sm-lzFpwH8wec'

        await addRowToSheet(authClient, spreadsheetId, data, sheetName)
        return 'Datos correctamente agregados'
    } catch (error) {
        console.error(error)
    }
}

export default appendToSheet