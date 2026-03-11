const fs = require('fs');
let code = fs.readFileSync('src/components/ui/button.jsx', 'utf8');
code = code.replace(
  'transition-all disabled:pointer-events-none',
  'transition-all cursor-pointer disabled:pointer-events-none'
);
fs.writeFileSync('src/components/ui/button.jsx', code);

let code2 = fs.readFileSync('src/app/layout.js', 'utf8');
code2 = code2.replace(
  'className={`${geistSans.variable} ${geistMono.variable} antialiased`}',
  'className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white to-slate-50`}'
);
fs.writeFileSync('src/app/layout.js', code2);
