# Forms

Keep the form's schema next to its UI and Server Action. Use Zod with React Hook
Form and its Zod resolver for client feedback. Parse the input again in the
Server Action. Return structured field errors and a separate delivery error.
Await the configured destination with a timeout and report success after a 2xx.

For local prototypes, an explicit dummy mode can return success to exercise the
UI. Use Next.js `after()` for diagnostic logging and log field names only.
Require a real destination before enabling submission in production.

Client-handled forms need `method="post"` so native submission before hydration
keeps personal data out of the URL. This protects the URL. Providing a working
no-JavaScript submission requires a server-side form handler.

Keep validation and no-JavaScript URL checks enabled. Gate tests that deliver to
a destination behind `E2E_ALLOW_SUBMIT=1`, and point the test server at a dummy
receiver that accepts synthetic values. A browser route intercept cannot
observe the Server Action's outbound fetch. Check delivery at the receiver.
