# Registration address autocomplete

Registration uses Geoapify Address Autocomplete when `VITE_GEOAPIFY_API_KEY` is configured. Create a project at https://myprojects.geoapify.com/ and restrict the browser API key to your local and deployed frontend origins. Add the key to the frontend environment, then restart Vite or rebuild the image. This browser key is intentionally compiled into the app; do not use a server secret.

Docker supports `--build-arg VITE_GEOAPIFY_API_KEY=...`. Docker Compose passes the same environment variable. For a prebuilt Render image, configure the key in the image build workflow's build arguments; adding it only to Render runtime variables cannot change the compiled frontend. No provider account or key was created by this change.

Without a key the existing Photon API remains available as a fallback. Photon is a public demo service with no guaranteed response time. Configured Geoapify errors do not silently switch providers. Both paths allow manual entry on timeout, error or no matches. Address coverage and response time depend on the provider; no street number is invented or treated as verified.

The field searches after a 200ms debounce and three characters, cancels previous requests, times out after six seconds, and uses a bounded in-memory query cache. Street results include locality detail, exclude non-South-African matches, and autofill the address plus province where identified. Users can refine with town/province and use arrow keys, Enter and Escape. Search runs only while the address field is open. Address suggestions do not depend on the old fixed suburb list or wait for a second structured query.

Optional `bhf` is submitted with onboarding and persisted on the tenant. It stays a string to preserve leading zeroes; empty UI values are sent as null. The backend accepts up to 30 characters. No new BHF validation rule or mandatory requirement is imposed.

Provider documentation: https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/
