# DOCX diagrams/tables और 2-second tab-switch enforcement

1. Supabase SQL Editor में `supabase/migrations/002_integrity_visibility.sql` एक बार चलाएँ। पहले database backup लें।
2. Updated project को Vercel पर redeploy करें। Existing environment variables सुरक्षित रखें; `.env` files ZIP में नहीं हैं।
3. Import Questions में corrected DOCX upload करें, फिर `Validate & Preview` से हर सवाल जाँचें। विशेषकर image-only choices और multiple-correct responses।
4. Import as Replace पर पुराने questions delete हो सकते हैं; active attempts वाले exam में replace न करें।
5. Word के सामान्य inline diagrams HTML के माध्यम से डेटा-URI images के रूप में question में संरक्षित होते हैं, और tables readable text rows में बदलते हैं। Floating shapes/EMF/WMF/OLE/complex graphs का 100% retention दावा नहीं है; preview के बाद manual QA आवश्यक है।
6. Visibility hidden होने पर server timestamp record करता है; visible होने पर elapsed >2 seconds की पुष्टि होने पर attempt auto-submitted होता है। Client पर भी >2 seconds detection है। एक अन्य physical mobile device से lookup, OS-level split screen या browser event tampering reliably detect नहीं होते। Mobile OS browser background requests delay कर सकता है; server visibility event missing होने पर enforced auto-submit की guarantee नहीं है।
7. `integrity_violation` और `hidden_at` columns DB में जोड़े जाते हैं; result status auto_submitted होता है।
8. Images embedded as base64 in DB can increase database/storage/bandwidth significantly. Recommended next production upgrade: private Supabase Storage object per figure, signed URLs, transactional attachment saving, option-level image fields, multi-answer schema and grading logic.
