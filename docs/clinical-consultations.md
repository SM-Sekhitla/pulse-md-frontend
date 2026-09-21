# Clinical consultations

Doctors (the existing owner role) can start/resume consultations from the patient Clinical notes tab, calendar appointment details and dashboard schedule. The full-page workspace is `/appointments/:id/consultation`.

Starting marks the appointment In progress and creates an idempotent tenant/appointment consultation record. The elapsed timer uses the saved server start timestamp and continues across refreshes. It measures elapsed wall-clock consultation time, not active tab time.

The workspace supports History, Examination, Assessment and Plan text, plus a transcript review area. Save notes persists these fields; save status and unsaved changes are visible. Revision conflicts preserve the local text and require review instead of overwriting another session's changes. Completion saves notes, records the finish time and marks the appointment Completed. Completed notes are read-only in this implementation.

Voice input uses browser SpeechRecognition where available, after an explicit permission acknowledgement and user action. Browser implementations may use a remote speech service. There is no automatic diagnosis, summarisation or external AI integration. Browser speech service failure does not prevent independent audio capture. Interim recognition is shown separately; final transcript text can be reviewed/edited and inserted into a chosen section. Inserting clears the review area to prevent accidental duplicate insertion. Save is disabled while dictating. Microphone recognition is aborted on unmount. Unsupported browsers retain typing/pasting.

Appointment lists do not include clinical text. Consultation endpoints enforce tenant and doctor access. The API uses a separate `consultations` collection; notes and transcript changes are not placed in operational event text.

Tests: backend `src/venv/bin/python tests/test_consultation.py`. Browser verification uses synthetic appointments and simulated recognition events, not real patient audio. Production speech accuracy and browser/provider availability require validation in the intended clinical environment.

Audio recording uses MediaRecorder separately from live dictation, with microphone permission, recording consent, playback, an explicit Save recording action and a download fallback. Each clip is capped at 15 minutes / approximately 9 MB. Unsaved clips block consultation completion and trigger navigation warnings. Recordings are stored in the private `patient_documents` MongoDB collection, linked by tenant, patient and appointment; only the existing doctor/owner role can upload or retrieve recordings. Text still requires Save notes. Neither recording nor typing automatically creates clinical conclusions.

The patient Documents tab accepts PDF, PNG and JPEG files up to 10 MB, validates content signatures server-side, and saves binary data with private metadata in `patient_documents`. Downloads require authenticated same-practice patient access and are returned as attachments with no-store headers. There are no public file URLs. Uploaded documents and voice recordings can be retrieved after reload. Configure database encryption, backups and a clinical retention policy with the deployment operator; application-managed audio encryption and automated retention are not implemented.

Attachment tests: `src/venv/bin/python tests/test_patient_assets.py`. Browser checks also exercise real MediaRecorder with a synthetic microphone, audio-save API mocks, document upload/reload, and prescription patient preselection. These do not validate a real speech service or production database deployment.

Future enhancements: approved transcription provider integration, offline recovery, configurable encrypted audio retention, signed amendments to completed notes, configurable clinical roles, and server-side multi-document transactions for appointment/session status changes.
