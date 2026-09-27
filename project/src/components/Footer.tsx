import { Download, Twitter, Github, Linkedin, Mail } from 'lucide-react';

type FooterProps = {
  onNavigate: (page: string, params?: Record<string, string>) => void;
};

export function Footer({ onNavigate }: FooterProps) {
  const links: Record<string, { label: string; page: string; params?: Record<string, string> }[]> = {
    Shop: [
      { label: 'All Products', page: 'catalog' },
      { label: 'Bestsellers', page: 'catalog', params: { filter: 'bestseller' } },
      { label: 'New Arrivals', page: 'catalog', params: { filter: 'new' } },
      { label: 'Featured', page: 'catalog', params: { filter: 'featured' } },
    ],
    Company: [
      { label: 'About Us', page: 'about' },
      { label: 'Blog', page: 'blog' },
      { label: 'Careers', page: 'careers' },
      { label: 'Contact', page: 'contact' },
    ],
    Support: [
      { label: 'Help Center', page: 'help' },
      { label: 'Terms of Service', page: 'terms' },
      { label: 'Privacy Policy', page: 'privacy' },
      { label: 'Refund Policy', page: 'refund' },
    ],
  };

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
                <Download size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                Smart<span className="text-blue-600">Nova</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Your premier destination for premium digital products. Templates, UI kits, courses, graphics, and more — all in one place.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">{section}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => onNavigate(item.page, item.params)}
                      className="text-sm text-slate-500 transition hover:text-blue-600"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} SmartNova. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Secure payments</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Instant download</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Lifetime updates</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
