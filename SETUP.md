# Тохиргооны заавар (map-edu-orkhon)

## 1. Firebase (нэг удаа)
1. Console → Firestore → **Rules** → `firestore.rules`-ийн агуулгыг хуулж **Publish**.
2. Console → Firestore → **Indexes** → `firestore.indexes.json`-д заасан composite index үүсгэх
   (attempts: grade ↑ + totalScore ↓). Эсвэл шилдэгүүдийг нээхэд консол дээр гарах холбоосоор үүсгэнэ.
3. Authentication → Sign-in method → **Email/Password** идэвхтэй, **Anonymous** идэвхгүй.
4. Authentication → Settings → **Authorized domains** → `map-edu-orkhon.pages.dev` нэмэх.
5. Админ: Authentication → Users → өөрийн хэрэглэгч → UID → Firestore `admins/<UID>` баримт (`role: "admin"`).

## 2. Cloudflare Pages → Settings → Variables and Secrets
| Нэр | Төрөл | Утга |
|---|---|---|
| VITE_FIREBASE_API_KEY | Text | (Firebase config-ийн apiKey) |
| VITE_FIREBASE_AUTH_DOMAIN | Text | map-edu-orkhon.firebaseapp.com |
| VITE_FIREBASE_PROJECT_ID | Text | map-edu-orkhon |
| VITE_FIREBASE_APP_ID | Text | (Firebase config-ийн appId) |
| FIREBASE_PROJECT_ID | Text | map-edu-orkhon |
| GEMINI_API_KEY | **Secret** | (Gemini түлхүүр, зөвхөн админ ашиглана) |
| GEMINI_MODEL | Text (заавал биш) | ашиглах Gemini загвар |
| NODE_VERSION | Text | 22 |

Build command: `npm run build`, output: `dist`. Variables өөрчилсний дараа дахин deploy хийнэ.

## 3. Туршилт
- `npm install && npm test` (боловсруулалт, cache, токен шалгалтын тест)
- `npm run dev` (локал; `.env` файлд VITE_FIREBASE_* бөглөнө. **Файлыг git-д оруулахгүй**)

## 4. Анхаар
- Firebase Auth-ийн бүртгэлийг клиентээс устгах боломжгүй: админ "хэрэглэгч устгах" нь профайлыг л устгана.
  Бүрэн устгахыг Console → Authentication-аас хийнэ.
- Газрын зургийн хэрэглээний статистик (давхарга үзсэн, даалгаврын гүйцэтгэл) одоогоор зөвхөн тухайн төхөөрөмж дээр.
