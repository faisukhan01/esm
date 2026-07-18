import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Download ESM Mobile App — Electronic School Management',
  description: 'Download the ESM mobile app for Android. Manage your school, institute, or branch from anywhere.',
};

const APK_DOWNLOAD_URL = 'https://github.com/faisukhan01/esm/releases/latest/download/app-release.apk';
const QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(APK_DOWNLOAD_URL)}`;

const features = [
  { icon: '📊', title: 'Real-time Dashboards', desc: 'Revenue, attendance, and performance analytics at a glance' },
  { icon: '👥', title: 'Manage Users', desc: 'Add teachers, students, and staff directly from your phone' },
  { icon: '💰', title: 'Fee Management', desc: 'Generate invoices, track payments, and mark fees as paid' },
  { icon: '📢', title: 'Announcements', desc: 'Send targeted messages to branches, teachers, or students' },
  { icon: '📅', title: 'Calendar & Events', desc: 'View exam schedules, holidays, and school events' },
  { icon: '📈', title: 'Reports & Analytics', desc: 'Financial reports, royalty tracking, and branch performance' },
];

const portals = [
  { name: 'Institute Admin', color: '#0B1F3A', desc: 'Manage branches, royalty, and institute-wide reports' },
  { name: 'Branch Manager', color: '#1E3A5F', desc: 'Manage teachers, students, fees, and attendance' },
  { name: 'Teacher', color: '#16A34A', desc: 'Mark attendance, post results, and manage classes' },
  { name: 'Student', color: '#D4A437', desc: 'View attendance, results, invoices, and courses' },
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FB]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] grid place-items-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm5 15.5l-5 2.5-5-2.5v-3.5l5 2.5 5-2.5v3.5z"/></svg>
            </div>
            <div>
              <div className="font-bold text-lg text-[#0B1F3A]">ESM</div>
              <div className="text-xs text-gray-500 -mt-1">Electronic School Management</div>
            </div>
          </div>
          <a href="/" className="text-sm font-medium text-[#0B1F3A] hover:underline">← Back to ESM</a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-700">v1.0.0 — Now Available</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0B1F3A] tracking-tight mb-4">
          ESM in your pocket
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Manage your school, institute, or branch from anywhere. The complete school management platform — now on Android.
        </p>

        {/* App icon + download */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
          <div className="relative w-32 h-32 rounded-3xl overflow-hidden shadow-xl">
            <Image src="/app-icon.png" alt="ESM App Icon" fill className="object-cover" priority />
          </div>

          <div className="flex flex-col items-center sm:items-start gap-3">
            <a
              href={APK_DOWNLOAD_URL}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0B1F3A] text-white rounded-xl font-semibold hover:bg-[#1E3A5F] transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341c-.613 1.484-.383 3.19-.41 4.823-.027 1.674-1.386 2.585-2.81 2.475-1.396-.108-2.32-1.097-2.31-2.453.012-1.613-.183-3.287.403-4.82.496-1.299 1.679-2.103 2.566-2.106.883-.003 2.073.8 2.561 2.081m-4.323-6.61c1.326 1.25 1.472 3.639.025 4.827-1.3-1.078-1.374-3.625-.025-4.827m6.532 5.483c1.613 1.424 1.737 3.997.46 5.523-.682-1.58-.266-3.354-.46-5.523M8.25 21.639c-1.424.11-2.783-.801-2.81-2.475-.027-1.633.203-3.339-.41-4.823-.488-1.281-1.678-2.084-2.561-2.081-.887.003-2.07.807-2.566 2.106-.586 1.533-.391 3.207-.403 4.82-.01 1.356-.914 2.345-2.31 2.453m5.86-13.908c1.349 1.202 1.275 3.749-.025 4.827-1.447-1.188-1.301-3.577.025-4.827M4.27 14.214c-.194 2.169.222 3.943-.46 5.523-1.277-1.526-1.153-4.099.46-5.523M12 2L1 8l3 1.5L12 5l8 4.5L23 8 12 2z"/></svg>
              Download for Android
            </a>
            <p className="text-xs text-gray-500">~27 MB · Android 5.0+ · Free</p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <img src={QR_CODE_URL} alt="QR Code" width={120} height={120} />
            </div>
            <p className="text-xs text-gray-500 font-medium">Scan to download</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-[#0B1F3A] text-center mb-8">Everything you need, on the go</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-[#0B1F3A] mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portals */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-[#0B1F3A] text-center mb-8">Four role-based portals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {portals.map((p, i) => (
            <div key={i} className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl shrink-0" style={{ backgroundColor: p.color }} />
              <div>
                <h3 className="font-semibold text-[#0B1F3A]">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Install instructions */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="p-8 bg-[#0B1F3A] rounded-3xl text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">How to install</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-white/15 grid place-items-center mx-auto mb-3 font-bold">1</div>
              <h3 className="font-semibold mb-1">Download the APK</h3>
              <p className="text-sm text-white/70">Tap the download button or scan the QR code above</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-white/15 grid place-items-center mx-auto mb-3 font-bold">2</div>
              <h3 className="font-semibold mb-1">Allow install</h3>
              <p className="text-sm text-white/70">Open the file — Android may ask to allow installs from unknown sources</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-white/15 grid place-items-center mx-auto mb-3 font-bold">3</div>
              <h3 className="font-semibold mb-1">Sign in</h3>
              <p className="text-sm text-white/70">Open ESM, select your role, and sign in with your credentials</p>
            </div>
          </div>
        </div>
      </section>

      {/* iOS section */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="p-8 bg-white rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-8 h-8 text-[#0B1F3A]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            <h2 className="text-xl font-bold text-[#0B1F3A]">iPhone / iPad</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            iOS builds require a Mac and an Apple account. You can build the iOS app for free using Codemagic's cloud Mac runners (500 free minutes/month).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-sm text-[#0B1F3A] mb-1">Free (Personal Testing)</h3>
              <p className="text-xs text-gray-500">Use a free Apple ID. App works for 7 days, then rebuild. Max 3 apps. No push notifications.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-sm text-[#0B1F3A] mb-1">$99/year (App Store)</h3>
              <p className="text-xs text-gray-500">Apple Developer Program. App never expires. Distribute via TestFlight + App Store.</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-700">
              <strong>Build instructions:</strong> The codemagic.yaml file is already in the repo. Sign up at codemagic.io → connect your GitHub repo → start a build. The .ipa will be emailed to you.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-gray-500">
            ESM · Electronic School Management · by Cyber Advance Solutions (Pvt.) Ltd.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            For iOS support, contact your administrator. Android is a trademark of Google LLC.
          </p>
        </div>
      </footer>
    </div>
  );
}
