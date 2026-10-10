# Free currency converter

This is the React + Express currency converter built alongside the existing openFrameworks project. The React client is in `client/`; the Express API is in `server/`.

## Run the starter

1. In `server/`, run `npm install`, then `npm run dev`.
2. In `client/`, run `npm run dev` and open the local URL printed by Vite.
3. The API endpoint is `GET /api/rates/USD` (replace `USD` with a three-letter currency code).

The client converts between the currencies returned by the API, supports swapping currencies, quick selection of common destinations, and copying the result. The API caches a response for up to 24 hours. The page includes the provider attribution link as required. Rates are indicative and should not be treated as financial advice.

## Assessment and attribution notes

The brief limits online/AI material to 25% of the submission and requires acknowledgement in the code comments and development document. AI assistance across the project is disclosed in the code and in Ratewise_Development_Document.docx. Review the draft, complete its bracketed fields using your own experience, and verify that your final submission follows the brief. Keep a record of further sources and cite them in code comments and in the document.

API source: ExchangeRate-API, “Open Access Endpoint”, https://freecurrencyapi.com/ (accessed 01 october 2026). The service requires attribution on pages displaying its rates.

Scaffold source: Vite, “Getting Started”, https://vite.dev/guide/ (accessed 01 october 2026). The React client was created from the Vite React template.

AI assistance disclosure: GitHub Copilot was used to scaffold the React/Vite project, draft the Express rates endpoint, and help implement and style the converter interface. Example prompts included: “Create a small Express endpoint that validates an ISO currency code, fetches and caches daily rates, and returns a clear JSON error when the upstream request fails” and “Build an accessible responsive React currency converter that uses the local Express rates endpoint, lets users swap currencies and copy the result, and shows loading and error states.” Review and understand the generated code, and accurately describe your own contributions in the assessment document.
