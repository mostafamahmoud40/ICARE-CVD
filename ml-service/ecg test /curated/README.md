# ECG حقيقية مع تشخيص معروف (PTB-XL)

مجلد `curated/` فيه **6 أزواج WFDB متطابقة** من [PTB-XL v1.0.3](https://physionet.org/content/ptb-xl/1.0.3/) — كل `.hea` + `.dat` من نفس التسجيل، مع **تشخيص موثّق** من قاعدة بيانات PTB-XL (تصنيف أطباء + SCP-ECG).

**قاعدة الرفع:** ارفع دائماً الملفين بنفس الاسم، مثلاً `00001_lr.hea` + `00001_lr.dat` (~596 B + 24 KB).

التفاصيل الكاملة في `manifest.json` (تشخيص PTB-XL + نتائج الـ pipeline عندنا).

---

## الحالات الجاهزة

| الملفات | التشخيص المعروف (PTB-XL) | التقرير الأصلي | HR (pipeline) | ملاحظات pipeline |
|---------|--------------------------|----------------|---------------|------------------|
| `00001_lr.*` | **NORM** — ECG طبيعي | sinusrhythmus, periphere niederspannung | 64 bpm | إيقاع منتظم، لا STEMI |
| `00008_lr.*` | **MI** — احتشاء سفلي (IMI) | inferiorer infarkt | 74 bpm | STEMI suspected في Anterior/Anterolateral |
| `00022_lr.*` | **STTC** — تغيرات ST/T غير محددة | non-diagnostic T abnormalities | 80 bpm | — |
| `00030_lr.*` | **HYP** — تضخم بطين أيسر (LVH) | linkshypertrophie | 64 bpm | Sokolow-Lyon LVH = true |
| `00032_lr.*` | **CD** — انسداد فرع خلفي أيسر (LPFB) | linksposteriorer hemiblock | 99 bpm | QRS واسع محتمل |
| `05469_lr.*` | **MI** — احتشاء (حالة اختبار fold-10) | — | 60 bpm | حالة MI إضافية |

كل الحالات: **0 تحذيرات** — الإشارة سليمة والملفات متطابقة.

---

## للتجربة في الواجهة

1. افتح **ECG Diagnosis — LLM + RAG**
2. اختر زوجاً من الجدول، مثلاً:
   - `ecg test /curated/00001_lr.hea`
   - `ecg test /curated/00001_lr.dat`
3. شغّل التحليل — المفروض تشوف ECG طبيعي و HR ≈ 64 bpm

**للتحقق من MI:** جرّب `00008_lr` أو `05469_lr` — PTB-XL يصنّفهم MI.

**للتحقق من LVH:** جرّب `00030_lr`.

---

## مصدر الحقيقة (Ground truth)

- `ptbxl_superclass` و `ptbxl_scp_codes` في `manifest.json` = تصنيف PTB-XL الرسمي
- `pipeline.*` = ما يخرجه NeuroKit2 + خدمتنا (قد يختلف عن تشخيص الطبيب — خاصة MI/ST)

المسار الكامل:
```
/home/mstdev/Downloads/icare-cvd/ml-service/ecg test /curated/
```
