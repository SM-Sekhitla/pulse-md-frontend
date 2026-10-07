# GP signature templates

GPs (the existing owner role) open Settings → Signature, click the preview, draw in the large modal, and save. Mouse, pen and touch input are supported, with Undo, Clear and removal. Replacing or removing a template affects future documents only.

The backend `/api/v1/signature-template` GET/PUT/DELETE endpoints scope access to the authenticated GP email and tenant. Templates are stored separately in `doctor_signatures`, not public booking profiles. The server accepts bounded PNG data, normalizes it with Pillow, and rejects blank images.

Prescription and sick-note creation snapshot the issuing account's saved signature. It is not accepted from the create payload. Receptionists do not borrow a GP's template. Existing documents without a snapshot retain a blank signature line. Both document detail and browser print/PDF output render the stored image. There is no retroactive signature application.

The existing cryptographic document verification payload includes the signature image only when present, preserving verification for older documents while binding new snapshots to their document. This image template is separate from the existing cryptographic signature mechanism.

Deploy both frontend and backend. Regression tests: backend `src/venv/bin/python tests/test_signature_template.py`. Browser checks with mocked APIs cover drawing, saving, reload, mobile modal layout and both print views. Live database submission was not performed.
