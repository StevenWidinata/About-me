// Indonesian translations. English lives in index.html; this maps English → Indonesian.
// Keys are either plain text (matched against text nodes / aria-label / alt)
// or the exact inner HTML of an element that contains markup.
'use strict';

const ID_META = {
  title: 'Steven Widinata | Curious Mind, Endless Possibilities',
  description: 'Steven Widinata, mahasiswa Teknologi Informasi di BINUS University. Perjalanan, proyek, prestasi, dan langkah saya berikutnya.',
};

const ID = {
  // header & UI
  'Skip to content': 'Langsung ke konten',
  'Steven Widinata, back to top': 'Steven Widinata, kembali ke atas',
  'Main': 'Utama',
  'About': 'Tentang',
  'Journey': 'Perjalanan',
  'Projects': 'Proyek',
  'Contact': 'Kontak',
  'Toggle dark and light mode': 'Ganti mode gelap dan terang',
  'Open menu': 'Buka menu',
  'Close menu': 'Tutup menu',
  'Copied to clipboard': 'Disalin ke clipboard',
  'You found the meteor shower! Make a wish.': 'Kamu menemukan hujan meteor! Buat permohonan.',

  // intro
  'Welcome': 'Selamat datang',
  'Steven Widinata · Portfolio': 'Steven Widinata · Portofolio',
  'Skip intro': 'Lewati intro',
  'Start my journey': 'Mulai perjalanan saya',
  'Move your cursor through the stars': 'Gerakkan kursor di antara bintang',
  'Touch the stars': 'Sentuh bintang-bintangnya',
  'Replay intro': 'Putar ulang intro',

  // hero
  "Hi, I'm": 'Halo, saya',
  'I lead, mentor and build. I turn curiosity into projects, communities and new skills, one star at a time.':
    'Saya memimpin, membimbing, dan membangun. Saya mengubah rasa ingin tahu menjadi proyek, komunitas, dan keterampilan baru, satu bintang demi satu bintang.',
  'See my work': 'Lihat karya saya',
  'Download CV': 'Unduh CV',
  'Psst, try dragging the stars.': 'Psst, coba tarik bintang-bintangnya.',
  'Steven looking out at the sea': 'Steven memandang ke arah laut',

  // about
  'Who I am': 'Tentang saya',
  'A curious mind that <em>likes to lead</em>': 'Pikiran penasaran yang <em>suka memimpin</em>',
  [`I'm <strong>Steven Widinata</strong>, a <strong>Master of Information Technology (MIT)</strong> student at <strong>BINUS University</strong>. I keep asking "how does this work?" and then I go and build it.`]:
    'Saya <strong>Steven Widinata</strong>, mahasiswa <strong>Master of Information Technology (MIT)</strong> di <strong>BINUS University</strong>. Saya selalu bertanya "bagaimana cara kerjanya?", lalu mencoba membangunnya sendiri.',
  'At school I organised tournaments and led a volleyball committee. At university I learn competitive programming with <strong>Jollybee</strong>, build web apps with React and Node in <strong>Ureeka</strong>, guide new students as a <strong>Freshman Leader &amp; Partner</strong>, and mentor them academically at <strong>SASC</strong>.':
    'Di sekolah saya menyelenggarakan turnamen dan memimpin panitia voli. Di kampus saya belajar competitive programming di <strong>Jollybee</strong>, membangun aplikasi web dengan React dan Node di <strong>Ureeka</strong>, membimbing mahasiswa baru sebagai <strong>Freshman Leader &amp; Partner</strong>, dan menjadi mentor akademik di <strong>SASC</strong>.',
  "To me, every new skill is a star. Connect enough of them and you start to see the shape of what's possible.":
    'Bagi saya, setiap keterampilan baru adalah sebuah bintang. Hubungkan cukup banyak, dan bentuk dari semua kemungkinan mulai terlihat.',
  'Profile overview': 'Ringkasan profil',
  'Profile': 'Profil',
  'Study': 'Studi',
  'Campus': 'Kampus',
  'Based in': 'Domisili',
  'Languages': 'Bahasa',
  'BINUS University · 2026 – now': 'BINUS University · 2026 – sekarang',
  'Indonesian · English': 'Indonesia · Inggris',
  'Open to opportunities': 'Terbuka untuk peluang',
  'Strengths': 'Kekuatan',
  'Leadership': 'Kepemimpinan',
  'Problem Solving': 'Pemecahan Masalah',
  'Discipline': 'Disiplin',
  'Responsibility': 'Tanggung Jawab',
  'Never Give Up': 'Pantang Menyerah',
  'Active': 'Aktif',
  'Diligent': 'Rajin',
  'Tech I work with': 'Teknologi yang saya gunakan',
  'Algorithms': 'Algoritma',

  // journey
  'My journey': 'Perjalanan saya',
  'Connecting the <em>stars</em>': 'Menghubungkan <em>bintang-bintang</em>',
  'Each chapter is a star. Scroll down and watch the constellation take shape.': 'Setiap bab adalah sebuah bintang. Gulir ke bawah dan lihat rasi bintangnya terbentuk.',
  'School': 'Sekolah',
  'School years': 'Masa sekolah',
  'Where the curiosity started, and where I first learned to lead.': 'Tempat rasa ingin tahu saya dimulai, dan tempat saya pertama kali belajar memimpin.',
  'Lots of questions, lots of numbers, and my first friends.': 'Banyak pertanyaan, banyak angka, dan teman-teman pertama saya.',
  'Best graduate three years in a row, and a grade 8 math competition semifinalist.': 'Lulusan terbaik tiga tahun berturut-turut, dan semifinalis kompetisi matematika kelas 8.',
  'Ran a table tennis tournament for 9 schools, led the volleyball committee and its budget, and took 2nd place at the BHK Cup.':
    'Menjalankan turnamen tenis meja untuk 9 sekolah, memimpin panitia voli beserta anggarannya, dan meraih juara 2 di BHK Cup.',
  '2026 – now': '2026 – sekarang',
  'Sharpened my logic and problem solving through competitive programming, and built strong foundations in programming and algorithms.':
    'Mengasah logika dan pemecahan masalah melalui competitive programming, serta menguasai dasar pemrograman dan algoritma.',
  'May 2026 – now': 'Mei 2026 – sekarang',
  'Designing and building web apps with React and Node, and working in teams on case studies and structured software research projects.':
    'Merancang dan mengembangkan aplikasi web dengan React dan Node, serta bekerja dalam tim untuk menyelesaikan studi kasus dan proyek riset perangkat lunak yang terstruktur.',
  "Delivering campus orientation, managing group dynamics and keeping every activity on time. I handle technical issues, absences and new students' adjustment quickly and calmly.":
    'Menyampaikan materi orientasi kampus, mengelola dinamika kelompok, dan memastikan seluruh kegiatan berjalan tepat waktu. Saya menangani kendala teknis, ketidakhadiran, hingga adaptasi mahasiswa baru dengan cepat dan tenang.',
  'Aug – Dec 2026': 'Agu – Des 2026',
  'Scholarship Mentor · SASC': 'Mentor Beasiswa · SASC',
  'Academic and personal mentor for new students for a full semester. I prepare learning material and practice questions, and host weekly interactive discussions.':
    'Mentor akademik dan personal bagi mahasiswa baru selama satu semester. Saya menyusun materi pembelajaran dan latihan soal, serta mengadakan sesi diskusi interaktif setiap minggu.',
  '<strong>Team project:</strong> the Ureeka learning platform. I built the login page, module pages, routing and the Ask AI module.':
    '<strong>Proyek tim:</strong> platform belajar Ureeka. Saya membuat halaman login, halaman modul, routing, dan modul Ask AI.',
  'Teamwork': 'Kerja tim',
  'Team builds': 'Proyek tim',
  'Projects I worked on with friends outside class.': 'Proyek yang saya kerjakan bersama teman di luar kelas.',
  '<strong>TrustPed</strong>: an ML tool that checks online stores for fraud. I built the React frontend and connected it to the FastAPI backend.':
    '<strong>TrustPed</strong>: alat ML yang memeriksa toko online dari risiko penipuan. Saya membuat frontend React dan menghubungkannya ke backend FastAPI.',
  '<strong>Reelo</strong>: an Android app that counts the reels you watch. I planned the app and its features with Oneill.':
    '<strong>Reelo</strong>: aplikasi Android yang menghitung reels yang kamu tonton. Saya merencanakan aplikasi dan fiturnya bersama Oneill.',
  'To be continued →': 'Bersambung →',

  // projects
  "Things I've built": 'Yang sudah saya buat',
  'Pick a <em>door.</em>': 'Pilih sebuah <em>pintu.</em>',
  'Each one opens onto something I built. Three are open now. The last one stays locked while my next project is being built.':
    'Setiap pintu membuka sesuatu yang saya buat. Tiga sudah terbuka. Pintu terakhir masih terkunci karena proyek berikutnya sedang saya buat.',
  'open': 'terbuka',
  'coming soon': 'segera hadir',
  'Open the door to Mewing Academy': 'Buka pintu ke Mewing Academy',
  'Open the door to ZeroSignal': 'Buka pintu ke ZeroSignal',
  'Coming soon. This door is locked.': 'Segera hadir. Pintu ini masih terkunci.',
  'Coming soon': 'Segera hadir',
  'Being built': 'Sedang dibuat',
  'This door is still locked. A new project is being built behind it.': 'Pintu ini masih terkunci. Proyek baru sedang dibuat di baliknya.',
  'AI · Education': 'AI · Edukasi',
  'Games · Full-stack': 'Game · Full-stack',
  'Open the door to Glitch Type': 'Buka pintu ke Glitch Type',
  'Games · Typing': 'Game · Mengetik',

  'More work': 'Karya lainnya',
  'Turns your notes and PDFs into AI quizzes that explain every answer.': 'Mengubah catatan dan PDF menjadi kuis AI yang menjelaskan setiap jawaban.',
  'One launchpad for AI tools: write a prompt once, send it to any AI.': 'Satu peluncur untuk alat AI: tulis prompt sekali, kirim ke AI mana pun.',
  'A phone-friendly list of 60+ daily web games, with tier lists.': 'Daftar 60+ game web harian yang nyaman di HP, lengkap dengan tier list.',
  'Bookkeeping for a small shop: stock, sales, debts and monthly reports.': 'Pembukuan untuk toko kecil: stok, penjualan, hutang, dan laporan bulanan.',
  'Code ↗': 'Kode ↗',

  // project room
  'Back to the hall': 'Kembali ke lorong',
  'Live project': 'Proyek live',
  'Built with': 'Dibuat dengan',
  'Visit the live site': 'Kunjungi situsnya',
  'View the code': 'Lihat kodenya',
  'Home page of': 'Halaman utama',
  'An accessible, AI-powered learning playground for kids. Students answer with their hands: on-device camera AI reads their gestures, so learning stays inclusive for every ability.':
    'Tempat belajar berbasis AI yang ramah untuk anak-anak. Siswa menjawab dengan tangan: AI kamera di perangkat membaca gerakan mereka, sehingga belajar tetap inklusif untuk semua kemampuan.',
  'Students answer questions with hand gestures': 'Siswa menjawab pertanyaan dengan gerakan tangan',
  'The gesture AI runs on the device with MediaPipe': 'AI gerakannya berjalan langsung di perangkat dengan MediaPipe',
  'Built so kids of every ability can take part': 'Dibuat agar anak dengan kemampuan apa pun bisa ikut belajar',
  'A collection of quick arcade games for killing boredom, with real leaderboards. Every score is checked by the server, so nobody can cheat their way to the top.':
    'Kumpulan game arcade singkat untuk mengusir bosan, lengkap dengan papan peringkat sungguhan. Setiap skor diperiksa server, jadi tidak ada yang bisa curang untuk jadi nomor satu.',
  'Nine games, from a full-physics slingshot game to Chess and Snake': 'Sembilan game, dari game ketapel dengan fisika penuh sampai Catur dan Ular',
  'Play Chess and Sonar online against a friend': 'Main Catur dan Sonar online melawan teman',
  'The server replays every move, so the leaderboard stays fair': 'Server memutar ulang setiap langkah, jadi papan peringkat tetap adil',
  'Play straight away, and sign up only to save scores': 'Langsung main, dan daftar hanya jika ingin menyimpan skor',
  'A neon typing trainer that plays like an arcade. Shoot down word asteroids from a black hole or repair a corrupted transmission before it breaks. No login: everything runs in the browser.':
    'Latihan mengetik bertema neon yang dimainkan seperti game arcade. Tembak jatuh asteroid kata dari lubang hitam, atau perbaiki transmisi yang rusak sebelum hancur. Tanpa login: semuanya berjalan di browser.',
  'Pick a mode by grabbing a crate with a claw machine': 'Pilih mode dengan mengambil peti memakai mesin capit',
  'A daily challenge, plus stats with a weak-key heatmap': 'Tantangan harian, plus statistik dengan peta tombol yang masih lemah',
  'Words in English and Bahasa Indonesia': 'Kata-kata dalam bahasa Inggris dan Bahasa Indonesia',

  // at a glance
  'At a glance': 'Sekilas',
  'Best graduate in a row': 'Lulusan terbaik berturut-turut',
  'Schools at the tournament I ran': 'Sekolah di turnamen yang saya kelola',
  'Live projects online': 'Proyek yang sudah online',
  'Campus roles at BINUS': 'Peran di kampus BINUS',

  // possibilities
  'Endless possibilities': 'Kemungkinan tanpa batas',
  "Where I'm <em>heading next</em>": 'Ke mana saya <em>melangkah</em>',
  "The constellation isn't finished. These are the stars I'm reaching for now.": 'Rasi bintang ini belum selesai. Inilah bintang-bintang yang sedang saya kejar.',
  'AI that helps people': 'AI yang membantu sesama',
  'Go deeper into AI and machine learning, and build tools like Mewing Academy that make technology more accessible and inclusive.':
    'Mendalami AI dan machine learning, lalu membangun alat seperti Mewing Academy yang membuat teknologi lebih mudah diakses dan inklusif.',
  'Ship real full-stack products': 'Merilis produk full-stack sungguhan',
  'Grow from React and Node into well-tested, deployed apps that real users rely on every day.':
    'Berkembang dari React dan Node menjadi aplikasi yang teruji, sudah online, dan diandalkan pengguna setiap hari.',
  'Compete & hack': 'Berkompetisi & hackathon',
  'Take my competitive programming from Jollybee into programming contests and hackathons, and learn fast under pressure.':
    'Membawa kemampuan competitive programming dari Jollybee ke lomba pemrograman dan hackathon, serta belajar cepat di bawah tekanan.',
  'Lead a tech community': 'Memimpin komunitas teknologi',
  'Keep mentoring and leading, and one day build a community where new students can learn tech together.':
    'Terus membimbing dan memimpin, lalu suatu hari membangun komunitas tempat mahasiswa baru bisa belajar teknologi bersama.',

  // contact & footer
  'Get in touch': 'Hubungi saya',
  "Let's connect<br>the <em>next star.</em>": 'Mari hubungkan<br><em>bintang berikutnya.</em>',
  'Want to collaborate, chat about tech, or just say hi? My inbox and DMs are always open.':
    'Mau berkolaborasi, ngobrol soal teknologi, atau sekadar menyapa? Inbox dan DM saya selalu terbuka.',
  'Say hello': 'Sapa saya',
  '· click to copy': '· klik untuk salin',
  'Hand-crafted with HTML, CSS & JavaScript': 'Dibuat dengan HTML, CSS & JavaScript',
  'Back to top ↑': 'Kembali ke atas ↑',
};
