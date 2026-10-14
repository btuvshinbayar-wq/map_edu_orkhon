# Тохиргооны заавар (map-edu-orkhon)

## 1. Firebase (нэг удаа)
1. Console → Firestore → **Rules** → `firestore.rules`-ийн агуулгыг хуулж **Publish**.
2. Console → Firestore → **Indexes** → `firestore.indexes.json`-д заасан composite index үүсгэх
   (attempts: grade ↑ + totalScore ↓). Эсвэл шилдэгүүдийг нээхэд консол дээр гарах холбоосоор үүсгэнэ.
3. Authentication → Sign-in method → **Email/Password** идэвхтэй, **Anonymous** идэвхгүй.
4. Authentication → Settings → **Authorized domains** → сайтын **яг хаягийг** (Cloudflare dashboard → төслийн нүүр дээрх URL: `...workers.dev` эсвэл `...pages.dev`) нэмэх.
5. Админ: Authentication → Users → өөрийн хэрэглэгч → UID → Firestore `admins/<UID>` баримт (`role: "admin"`).

## 2. Cloudflare → Settings → Variables (Build variables)
Firebase-ийн web config нь `src/lib/firebase.ts`-д анхдагчаар орсон тул **ямар ч хувьсагч заавал шаардлагагүй**.
Өөр Firebase төсөл рүү шилжихэд л `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_APP_ID`-г **Build** хувьсагчаар өгнө (Runtime биш).

Build command: `npm run build`. Deploy command: `npx wrangler deploy` (анхдагч). Тохиргоо нь `wrangler.jsonc`-д:
static файлууд `dist`-ээс, SPA чиглүүлэлт (`not_found_handling: single-page-application`) автомат. `_redirects` файл ХЭРЭГГҮЙ.

## 3. Туршилт
- `npm install && npm test` (давхарга боловсруулалт, cache/багцлалт, асуулт үүсгэгчийн тест)
- `npm run dev` (локал; `.env` файлд VITE_FIREBASE_* бөглөнө. **Файлыг git-д оруулахгүй**)

## 4. Анхаар
- Firebase Auth-ийн бүртгэлийг клиентээс устгах боломжгүй: админ "хэрэглэгч устгах" нь профайлыг л устгана.
  Бүрэн устгахыг Console → Authentication-аас хийнэ.
- Газрын зургийн хэрэглээний статистик (давхарга үзсэн, даалгаврын гүйцэтгэл) одоогоор зөвхөн тухайн төхөөрөмж дээр.

## 5. Сорил үүсгэх (админ)
Админ → Асуулт/Сорил хэсгээс давхаргаа сонгоод, даалгаврын төрөл (контур таах, урт, талбай, хөрш, эвлүүлэх,
холбох, цэг байрлуулах гэх мэт) болон ангиллыг (9-р анги, 12-р анги, Багш, Баг) сонгож үүсгэнэ.
Үүссэн асуултууд Firestore-д хэмжээгээр нь багцлагдаж хадгалагдана; хэрэглэгчид зөвхөн хувилбар өөрчлөгдөхөд татна.
AI/Gemini ашиглахгүй, серверийн функц шаардлагагүй.
