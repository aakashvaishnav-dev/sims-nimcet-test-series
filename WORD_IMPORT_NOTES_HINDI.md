# SIMS Raipur – Word question import update

## क्या ठीक किया गया
- `src/lib/import/parse.ts`: DOCX के Q1., Q2., (1)–(4), Answer: (3), Expected answer: (3) और Explanation formats अब पहचाने जाते हैं। DOCX के title, exam-year headings और गैर-question text को प्रश्न नहीं माना जाता।
- `src/components/ImportQuestions.tsx`: Validate & Preview करना जरूरी है; skipped questions warnings में दिखेंगे; Replace से पहले confirmation होगा।
- `src/app/result/[attemptId]/page.tsx`: अब result review में सभी चार options, selected answer, correct answer और explanation दिखते हैं।

## इस Cell Signaling Test file का परिणाम
39 questions मिले। **37** single-answer text MCQs सीधे import किए जा सकते हैं।
- Q34: Correct answer `A, B and D` (multiple-correct); मौजूदा DB और runner में सिर्फ एक correct option है, इसलिए गलत result से बचाने हेतु skip.
- Q38: चार graph-based choices DOCX में images हैं; मौजूदा text-only question schema/parser में उन्हें सुरक्षित रखने की व्यवस्था नहीं है, इसलिए skip.

इन दोनों को proper रूप से import करने के लिए अलग से question image upload/storage और multiple-answer question type, student-response तथा grading support की जरूरत है। दूसरे 37 के answer/explanations सुरक्षित हैं। अलग `Cell_Signaling_Import_37_Questions.csv` भी उपलब्ध है।

## Website update
Source को GitHub/Vercel पर deploy करें, original `.env.local` अपनी सुरक्षित environment में रखें (ZIP में नहीं है)। यह ZIP deployment नहीं है; आपकी live website तब तक नहीं बदलेगी जब तक नया build deploy न हो।
